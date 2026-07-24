import logging

from fastapi import APIRouter, Query

from app.config import Config
from app.services.monitoring_service import (
    health_status,
    memory_status,
    storage_status,
    cache_status,
    platform_metrics,
    SERVER_START_TIME,
)
import os
import subprocess
from datetime import datetime

from app.services.cache_service import dataset_cache
from app.services.ai_service import _in_memory_cache
from app.services.cleanup_service import cleanup_service
from app.utils.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Monitoring"])


@router.get("/health")
def health():
    return health_status()


@router.get("/health/memory")
def health_memory():
    return memory_status()


@router.get("/health/storage")
def health_storage():
    return storage_status()


@router.get("/health/cache")
def health_cache():
    return cache_status()


@router.get("/metrics")
def metrics():
    return platform_metrics()


@router.get("/version")
def version_info():
    git_hash = ""
    try:
        git_hash = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=os.path.dirname(os.path.dirname(os.path.dirname(__file__))), stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        git_hash = "unknown"
    return {
        "version": "1.0.0",
        "build": git_hash,
        "server_mode": Config.SERVER_MODE,
        "python_version": os.sys.version.split()[0],
        "started_at": SERVER_START_TIME,
    }


@router.get("/settings/config")
def public_config():
    git_hash = ""
    try:
        git_hash = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=os.path.dirname(os.path.dirname(__file__)), stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        git_hash = "unknown"
    return {
        "server_mode": Config.SERVER_MODE,
        "version": "1.0.0",
        "build": git_hash,
        "max_upload_size_mb": Config.MAX_UPLOAD_SIZE_MB,
        "storage_provider": Config.STORAGE_PROVIDER,
        "supported_file_types": [".csv", ".json"],
        "default_cv_folds": Config.MAX_CV_FOLDS,
        "cache_ttl_seconds": Config.DATASET_CACHE_TTL_SECONDS,
        "cache_max_entries": Config.DATASET_CACHE_SIZE,
        "cache_max_memory_mb": Config.DATASET_CACHE_MAX_MEMORY_MB,
        "upload_retention_days": Config.UPLOAD_RETENTION_DAYS,
        "max_storage_gb": Config.MAX_STORAGE_GB,
        "cleanup_enabled": Config.CLEANUP_ENABLED,
        "server_host": Config.SERVER_HOST,
        "server_port": Config.SERVER_PORT,
    }


@router.post("/cleanup/report")
def cleanup_report():
    if not Config.CLEANUP_ENABLED:
        return APIResponse.success({
            "cleanup_enabled": False,
            "message": "Cleanup is disabled. Set CLEANUP_ENABLED=true to enable.",
            "dry_run": True,
        })
    report = cleanup_service.scan()
    return APIResponse.success({
        "cleanup_enabled": True,
        "dry_run": True,
        **report,
    })


@router.post("/cleanup/execute")
def cleanup_execute(dry_run: bool = Query(True)):
    if not Config.CLEANUP_ENABLED:
        return APIResponse.success({
            "cleanup_enabled": False,
            "message": "Cleanup is disabled. Set CLEANUP_ENABLED=true to enable.",
            "deleted": False,
        })

    report = cleanup_service.scan()

    if dry_run:
        return APIResponse.success({
            "cleanup_enabled": True,
            "dry_run": True,
            **report,
        })

    result = cleanup_service.delete_orphans(report)
    return APIResponse.success({
        "cleanup_enabled": True,
        "dry_run": False,
        **result,
    })


@router.post("/cache/clear/dataset")
def clear_dataset_cache():
    before = len(dataset_cache.cache)
    dataset_cache.clear()
    logger.info("Dataset cache cleared — %d entries removed", before)
    return APIResponse.success({"cleared": True, "entries_removed": before})


@router.post("/cache/clear/ai")
def clear_ai_cache():
    before = len(_in_memory_cache.cache)
    _in_memory_cache.clear()
    logger.info("AI cache cleared — %d entries removed", before)
    return APIResponse.success({"cleared": True, "entries_removed": before})
