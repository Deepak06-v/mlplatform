import logging
import os
import time

from dotenv import load_dotenv

# Must call load_dotenv() before any app imports so Config sees .env values
load_dotenv()
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Config
from app.auth import router as auth_router
from app.workspace import router as workspace_router
from app.routes import dataset, eda, ai, session, experiment, comparison, activity, monitoring, settings
from app.utils.db import client as mongo_client
from app.utils.db import dataset_collection
from app.utils.response import APIResponse
from app.utils.structured_log import log_event
from fastapi import Depends
from app.auth.dependencies import get_current_user
from app.workspace.service import get_user_workspace


SENSITIVE_KEYS = {"api_key", "api-key", "apikey", "secret", "password", "token", "key"}


class SecretsFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        for key in SENSITIVE_KEYS:
            idx = msg.lower().find(key)
            if idx != -1:
                record.msg = _redact_value(msg, key)
                record.args = ()
                break
        return True


def _redact_value(msg: str, key: str) -> str:
    import re
    pattern = re.compile(rf'({re.escape(key)}\s*[:=]?\s*["\']?)[^"\'\s,}}]+', re.IGNORECASE)
    return pattern.sub(r'\1***REDACTED***', msg)


logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
for handler in logging.root.handlers:
    handler.addFilter(SecretsFilter())

logger = logging.getLogger(__name__)


app = FastAPI(
    title="AutoML Backend API",
    description="Machine Learning Platform API",
    version="1.0.0",
)


cors_origins = Config.cors_origins_list()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Exception handler — never expose stack traces in production
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    detail = "Internal server error" if Config.is_production() else str(exc)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "detail": detail, "error_type": "server_error"},
    )


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 1)
    log_event(
        logger,
        "http_request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=elapsed,
    )
    return response


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    logger.info("Starting AutoML Backend — mode=%s", Config.SERVER_MODE)

    required_vars = []
    if Config.is_production():
        required_vars.append("MONGODB_URI")

    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        msg = f"Missing required environment variables: {', '.join(missing)}"
        logger.critical(msg)
        raise RuntimeError(msg)

    try:
        dataset_collection.count_documents({})
        logger.info("MongoDB connection verified — db=%s", Config.MONGODB_DB_NAME)
    except Exception as e:
        msg = f"MongoDB connection failed: {e}"
        logger.critical(msg)
        raise RuntimeError(msg)

    from app.services.cache_service import dataset_cache
    dataset_cache.clear()
    logger.info("Dataset cache initialized — max_entries=%d ttl=%ds", dataset_cache.max_size, dataset_cache.ttl)

    from app.services.ai_service import _in_memory_cache
    _in_memory_cache.clear()
    logger.info("AI cache initialized — max_entries=%d ttl=%ds", _in_memory_cache.max_size, _in_memory_cache.ttl)

    from app.storage.provider import storage_provider
    logger.info("Storage provider: %s", type(storage_provider).__name__)
    if hasattr(storage_provider, "upload_dir"):
        os.makedirs(storage_provider.upload_dir, exist_ok=True)
        logger.info("Upload directory verified — path=%s", storage_provider.upload_dir)

    logger.info("Startup complete — %s mode", Config.SERVER_MODE)


# ---------------------------------------------------------------------------
# Shutdown
# ---------------------------------------------------------------------------

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down AutoML Backend")

    try:
        mongo_client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.warning("Error closing MongoDB: %s", e)

    from app.services.cache_service import dataset_cache
    dataset_cache.clear()
    logger.info("Dataset cache cleared")

    from app.services.ai_service import _in_memory_cache
    _in_memory_cache.clear()
    logger.info("AI cache cleared")

    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(workspace_router.router, prefix="/workspace", tags=["Workspace"])
app.include_router(dataset.router, prefix="/dataset", tags=["Dataset Management"])
app.include_router(eda.router, prefix="/eda", tags=["EDA & ML"])
app.include_router(ai.router, prefix="/ai", tags=["AI Recommendations"])
app.include_router(session.router, prefix="/session", tags=["Dataset Sessions"])
app.include_router(experiment.router, prefix="/experiments", tags=["Experiments"])
app.include_router(comparison.router, prefix="/comparisons", tags=["Comparisons"])
app.include_router(activity.router, prefix="/activities", tags=["Activities"])
app.include_router(monitoring.router, prefix="", tags=["Monitoring"])
app.include_router(settings.router, prefix="", tags=["Settings"])


# ---------------------------------------------------------------------------
# Root health
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    from app.services.monitoring_service import SERVER_START_TIME, uptime_seconds
    import os, subprocess
    git_hash = ""
    try:
        git_hash = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=os.path.dirname(__file__), stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        git_hash = "unknown"
    return {
        "status": "healthy",
        "message": "AutoML Backend Running",
        "version": "1.0.0",
        "build": git_hash,
        "mode": Config.SERVER_MODE,
        "started_at": SERVER_START_TIME,
        "uptime_seconds": uptime_seconds(),
    }


@app.get("/datasets", tags=["Dataset Management"])
def list_datasets(current_user: dict = Depends(get_current_user)):
    try:
        workspace = get_user_workspace(current_user["_id"])
        if not workspace:
            return APIResponse.success([], "No workspace found")
        datasets = list(dataset_collection.find(
            {"workspace_id": workspace["workspace_id"]},
            {"_id": 0}
        ))
        return APIResponse.success(datasets, "Datasets retrieved")
    except Exception as e:
        APIResponse.server_error(f"Failed to list datasets: {str(e)}")
