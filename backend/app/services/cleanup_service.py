import logging
import time

from app.config import Config
from app.storage.provider import storage_provider
from app.utils.db import dataset_collection

logger = logging.getLogger(__name__)


class UploadCleanupService:
    def scan(self):
        files_on_disk = {f["name"]: f for f in storage_provider.list_files()}
        db_datasets = list(dataset_collection.find({}, {"_id": 0, "dataset_id": 1, "file_path": 1, "filename": 1}))

        orphaned = []
        missing = []
        total_reclaimable = 0

        db_file_paths = {d["file_path"] for d in db_datasets}

        for f in files_on_disk.values():
            if f["path"] not in db_file_paths:
                orphaned.append(f)
                total_reclaimable += f["size_bytes"]

        for d in db_datasets:
            if not storage_provider.exists(d["file_path"]):
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
            if storage_provider.delete(f["path"]):
                deleted.append(f["name"])
                logger.info("Deleted orphaned file: %s", f["name"])
            else:
                failed.append(f["name"])
                logger.warning("Failed to delete orphaned file: %s", f["name"])
        return {
            "deleted_count": len(deleted),
            "deleted_files": deleted,
            "failed_count": len(failed),
            "failed_files": failed,
            "reclaimed_bytes": report["total_reclaimable_bytes"],
            "reclaimed_mb": report["total_reclaimable_mb"],
        }


cleanup_service = UploadCleanupService()
