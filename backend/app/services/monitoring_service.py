import logging
import time

from app.config import Config
from app.services.cache_service import dataset_cache
from app.services.ai_service import _in_memory_cache, ai_service
from app.storage.provider import storage_provider
from app.utils.db import (
    dataset_collection,
    dataset_sessions_collection,
    experiments_collection,
    comparisons_collection,
    activities_collection,
    ai_recommendations_collection,
    eda_results_collection,
    feature_importance_collection,
)

logger = logging.getLogger(__name__)

SERVER_START_TIME = time.time()


def uptime_seconds():
    return round(time.time() - SERVER_START_TIME, 1)


def _safe_count(collection):
    try:
        return collection.estimated_document_count()
    except Exception:
        try:
            return collection.count_documents({})
        except Exception as e:
            logger.warning("count failed for %s: %s", collection.name, e)
            return -1


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def health_status():
    services = {"backend": "healthy"}

    try:
        dataset_collection.count_documents({})
        services["mongodb"] = "healthy"
    except Exception:
        services["mongodb"] = "unhealthy"

    services["dataset_cache"] = "healthy" if len(dataset_cache.cache) > 0 else "empty"
    services["ai_cache"] = "healthy" if len(_in_memory_cache.cache) > 0 else "empty"
    services["ai_service"] = "available" if ai_service.client else "unavailable"

    return {
        "status": "ok",
        "service": "automl-backend",
        "version": "1.0.0",
        "services": services,
        "started_at": SERVER_START_TIME,
        "uptime_seconds": uptime_seconds(),
        "timestamp": time.time(),
    }


# ---------------------------------------------------------------------------
# Memory
# ---------------------------------------------------------------------------

def memory_status():
    process_mem = 0
    try:
        import psutil
        process_mem = psutil.Process(os.getpid()).memory_info().rss
    except ImportError:
        pass

    cache_mem = sum(e.get("bytes", 0) for e in dataset_cache.cache.values())

    return {
        "process_memory_bytes": process_mem,
        "process_memory_mb": round(process_mem / 1024 / 1024, 2),
        "cache_memory_bytes": cache_mem,
        "cache_memory_mb": round(cache_mem / 1024 / 1024, 2),
        "cached_datasets": len(dataset_cache.cache),
        "cached_ai_entries": len(_in_memory_cache.cache),
    }


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

def _detailed_storage_stats():
    all_objects = storage_provider.list_objects()
    total_files = len(all_objects)
    total_bytes = sum(o.get("size_bytes", 0) for o in all_objects)
    largest = max(all_objects, key=lambda o: o.get("size_bytes", 0)) if all_objects else None

    datasets = list(dataset_collection.find({}, {
        "_id": 0, "dataset_id": 1, "file_size_mb": 1,
        "created_at": 1, "usage_count": 1, "filename": 1,
    }))
    oldest = min(datasets, key=lambda d: d.get("created_at", 0)) if datasets else None
    most_used = max(datasets, key=lambda d: d.get("usage_count", 0)) if datasets else None

    return {
        "total_files": total_files,
        "total_size_bytes": total_bytes,
        "total_size_mb": round(total_bytes / 1024 / 1024, 2),
        "largest_file_mb": round(largest["size_bytes"] / 1024 / 1024, 2) if largest else 0,
        "largest_file_name": largest.get("key") if largest else None,
        "average_file_size_mb": round(
            (total_bytes / total_files) / 1024 / 1024, 2
        ) if total_files > 0 else 0,
        "oldest_dataset": {
            "dataset_id": oldest["dataset_id"],
            "filename": oldest.get("filename"),
            "created_at": oldest.get("created_at"),
        } if oldest else None,
        "most_accessed_dataset": {
            "dataset_id": most_used["dataset_id"],
            "filename": most_used.get("filename"),
            "usage_count": most_used.get("usage_count"),
        } if most_used else None,
    }


def storage_status():
    return {
        **_detailed_storage_stats(),
        "datasets": _safe_count(dataset_collection),
        "eda_documents": _safe_count(eda_results_collection),
        "experiments": _safe_count(experiments_collection),
        "comparisons": _safe_count(comparisons_collection),
        "activities": _safe_count(activities_collection),
        "sessions": _safe_count(dataset_sessions_collection),
        "ai_recommendations": _safe_count(ai_recommendations_collection),
        "feature_importance": _safe_count(feature_importance_collection),
    }


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

def cache_status():
    ai_cache_entries = len(_in_memory_cache.cache)
    ds_cache_entries = len(dataset_cache.cache)
    ds_cache_mem = sum(e.get("bytes", 0) for e in dataset_cache.cache.values())

    return {
        "dataset_cache": {
            "entries": ds_cache_entries,
            "max_entries": dataset_cache.max_size,
            "memory_bytes": ds_cache_mem,
            "memory_mb": round(ds_cache_mem / 1024 / 1024, 2),
            "max_memory_mb": Config.DATASET_CACHE_MAX_MEMORY_MB,
            "ttl_seconds": dataset_cache.ttl,
            "hits": dataset_cache.hits,
            "misses": dataset_cache.misses,
        },
        "ai_cache": {
            "entries": ai_cache_entries,
            "max_entries": _in_memory_cache.max_size,
            "ttl_seconds": _in_memory_cache.ttl,
            "hits": _in_memory_cache.hits,
            "misses": _in_memory_cache.misses,
        },
    }


# ---------------------------------------------------------------------------
# Platform metrics
# ---------------------------------------------------------------------------

def platform_metrics():
    ds_hits = dataset_cache.hits
    ds_misses = dataset_cache.misses
    ai_hits = _in_memory_cache.hits
    ai_misses = _in_memory_cache.misses
    total_hits = ds_hits + ai_hits
    total_attempts = ds_hits + ds_misses + ai_hits + ai_misses
    hit_rate = round(total_hits / total_attempts, 4) if total_attempts > 0 else 0

    counts = _safe_count(experiments_collection)
    avg_time = 0
    if counts > 0:
        try:
            pipeline = [
                {"$match": {"training_time": {"$ne": None, "$type": "number"}}},
                {"$group": {"_id": None, "avg": {"$avg": "$training_time"}}},
            ]
            result = list(experiments_collection.aggregate(pipeline))
            if result:
                avg_time = round(result[0]["avg"], 2)
        except Exception:
            pass

    return {
        "datasets_uploaded": _safe_count(dataset_collection),
        "experiments_created": counts,
        "comparisons": _safe_count(comparisons_collection),
        "ai_requests": _safe_count(ai_recommendations_collection),
        "activities_logged": _safe_count(activities_collection),
        "cache_hits": total_hits,
        "cache_misses": total_attempts - total_hits,
        "cache_hit_rate": hit_rate,
        "average_training_time_seconds": avg_time,
    }
