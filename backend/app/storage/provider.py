import io
import logging
import os

from app.config import Config
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)


class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: str = None):
        self.upload_dir = upload_dir or Config.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload(self, file, object_key: str) -> int:
        total = 0
        chunk_size = 8192
        while True:
            chunk = file.file.read(chunk_size)
            if not chunk:
                break
            total += len(chunk)
            if total > Config.max_upload_bytes():
                raise ValueError(
                    f"File exceeds maximum size of {Config.MAX_UPLOAD_SIZE_MB} MB"
                )
        file.file.seek(0)

        file_path = os.path.join(self.upload_dir, object_key)
        with open(file_path, "wb") as f:
            while True:
                chunk = file.file.read(65536)
                if not chunk:
                    break
                f.write(chunk)
        file.file.seek(0)
        return total

    def download(self, object_key: str) -> io.BytesIO | None:
        file_path = os.path.join(self.upload_dir, object_key)
        try:
            with open(file_path, "rb") as f:
                return io.BytesIO(f.read())
        except FileNotFoundError:
            return None

    def delete(self, object_key: str) -> bool:
        file_path = os.path.join(self.upload_dir, object_key)
        try:
            os.remove(file_path)
            return True
        except FileNotFoundError:
            return False
        except Exception:
            return False

    def exists(self, object_key: str) -> bool:
        return os.path.isfile(os.path.join(self.upload_dir, object_key))

    def size(self, object_key: str) -> int:
        try:
            return os.path.getsize(os.path.join(self.upload_dir, object_key))
        except FileNotFoundError:
            return 0

    def list_objects(self) -> list[dict]:
        results = []
        try:
            with os.scandir(self.upload_dir) as entries:
                for entry in entries:
                    if entry.is_file():
                        results.append({
                            "key": entry.name,
                            "size_bytes": entry.stat().st_size,
                            "last_modified": entry.stat().st_mtime,
                        })
        except Exception:
            pass
        return results

    def get_url(self, object_key: str) -> str:
        return os.path.join(self.upload_dir, object_key)


def create_storage_provider() -> StorageProvider:
    provider_name = Config.STORAGE_PROVIDER
    if provider_name == "appwrite":
        from app.storage.appwrite import AppwriteStorageProvider
        logger.info("Using Appwrite cloud storage provider")
        return AppwriteStorageProvider()
    logger.info("Using local storage provider (uploads/)")
    return LocalStorageProvider()


storage_provider = create_storage_provider()
