import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import dataset, eda, ai, session
from app.utils.db import dataset_collection
from app.utils.response import APIResponse

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AutoML Backend API",
    description="Machine Learning Platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes with prefixes
app.include_router(dataset.router, prefix="/dataset", tags=["Dataset Management"])
app.include_router(eda.router, prefix="/eda", tags=["EDA & ML"])
app.include_router(ai.router, prefix="/ai", tags=["AI Recommendations"])
app.include_router(session.router, prefix="/session", tags=["Dataset Sessions"])


# Health check endpoint
@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    logger.info("Health check request received")
    return {
        "status": "healthy",
        "message": "AutoML Backend Running",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health():
    """Detailed health check with service statuses."""
    services = {"backend": "healthy", "mongodb": "unknown", "ai_service": "unknown"}

    try:
        dataset_collection.count_documents({})
        services["mongodb"] = "healthy"
    except Exception:
        services["mongodb"] = "unhealthy"

    try:
        import google.generativeai as genai
        services["ai_service"] = "available" if genai else "unavailable"
    except Exception:
        services["ai_service"] = "unavailable"

    return {
        "status": "ok",
        "service": "automl-backend",
        "version": "1.0.0",
        "services": services
    }

@app.get("/datasets", tags=["Dataset Management"])
def list_datasets():
    """List all uploaded datasets."""
    try:
        datasets = list(dataset_collection.find({}, {"_id": 0}))
        return APIResponse.success(datasets, "Datasets retrieved")
    except Exception as e:
        APIResponse.server_error(f"Failed to list datasets: {str(e)}")