import logging
import time

from app.storage.provider import storage_provider
from app.utils.db import dataset_collection

logger = logging.getLogger(__name__)


class UploadCleanupService:
    def scan(self):
        objects_in_storage = {o["key"]: o for o in storage_provider.list_objects()}
        db_datasets = list(
            dataset_collection.find(
                {},
                {"_id": 0, "dataset_id": 1, "storage_key": 1, "filename": 1},
            )
        )

        orphaned = []
        missing = []
        total_reclaimable = 0

        db_keys = {d["storage_key"] for d in db_datasets if d.get("storage_key")}

        for key, obj in objects_in_storage.items():
            if key not in db_keys:
                orphaned.append(obj)
                total_reclaimable += obj.get("size_bytes", 0)

        for d in db_datasets:
            key = d.get("storage_key")
            if key and key not in objects_in_storage:
                missing.append(d)

        return {
            "orphaned_files": orphaned,
            "orphaned_count": len(orphaned),
            "missing_datasets": missing,
            "missing_count": len(missing),
            "total_reclaimable_bytes": total_reclaimable,
            "total_reclaimable_mb": round(total_reclaimable / 1024 / 1024, 2),
            "scanned_at": time.time(),
        }

    def delete_orphans(self, report):
        deleted = []
        failed = []
        for f in report["orphaned_files"]:
            if storage_provider.delete(f["key"]):
                deleted.append(f["key"])
                logger.info("Deleted orphaned file: %s", f["key"])
            else:
                failed.append(f["key"])
                logger.warning("Failed to delete orphaned file: %s", f["key"])
        return {
            "deleted_count": len(deleted),
            "deleted_files": deleted,
            "failed_count": len(failed),
            "failed_files": failed,
            "reclaimed_bytes": report["total_reclaimable_bytes"],
            "reclaimed_mb": report["total_reclaimable_mb"],
        }


cleanup_service = UploadCleanupService()
