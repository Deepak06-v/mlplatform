import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import dataset, eda

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
    """Detailed health check."""
    return {
        "status": "ok",
        "service": "automl-backend",
        "version": "1.0.0"
    }