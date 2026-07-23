import os


class Config:
    # Server
    SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
    SERVER_MODE = os.getenv("SERVER_MODE", "development")  # development | production

    # MongoDB
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "automl_db")

    # CORS
    CORS_ALLOWED_ORIGINS = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
    )

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

    # Upload limits
    MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "500"))

    # Request limits
    REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "300"))

    # Cache settings
    DATASET_CACHE_SIZE = int(os.getenv("DATASET_CACHE_SIZE", "3"))
    DATASET_CACHE_TTL_SECONDS = int(os.getenv("DATASET_CACHE_TTL_SECONDS", "3600"))
    DATASET_CACHE_MAX_MEMORY_MB = int(os.getenv("DATASET_CACHE_MAX_MEMORY_MB", "1024"))

    # EDA thresholds
    MAX_NUMERICAL_COLS_CORRELATION = int(os.getenv("MAX_NUMERICAL_COLS_CORRELATION", "50"))
    MAX_NUMERICAL_COLS_HISTOGRAM = int(os.getenv("MAX_NUMERICAL_COLS_HISTOGRAM", "20"))
    MAX_DATASET_ROWS_SMOTE = int(os.getenv("MAX_DATASET_ROWS_SMOTE", "50000"))
    MAX_CATEGORICAL_CARDINALITY = int(os.getenv("MAX_CATEGORICAL_CARDINALITY", "100"))

    # Cross-validation
    MAX_CV_FOLDS = int(os.getenv("MAX_CV_FOLDS", "5"))

    # Cleanup settings
    UPLOAD_RETENTION_DAYS = int(os.getenv("UPLOAD_RETENTION_DAYS", "90"))
    MAX_STORAGE_GB = int(os.getenv("MAX_STORAGE_GB", "10"))
    CLEANUP_ENABLED = os.getenv("CLEANUP_ENABLED", "false").lower() == "true"
    CLEANUP_DRY_RUN = os.getenv("CLEANUP_DRY_RUN", "true").lower() == "true"

    # Paths
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

    @staticmethod
    def is_production():
        return Config.SERVER_MODE == "production"

    @staticmethod
    def cors_origins_list():
        raw = Config.CORS_ALLOWED_ORIGINS
        return [o.strip() for o in raw.split(",") if o.strip()]

    @staticmethod
    def max_upload_bytes():
        return Config.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @staticmethod
    def dataset_cache_max_memory_bytes():
        return Config.DATASET_CACHE_MAX_MEMORY_MB * 1024 * 1024

    @staticmethod
    def max_storage_bytes():
        return Config.MAX_STORAGE_GB * 1024 * 1024 * 1024
