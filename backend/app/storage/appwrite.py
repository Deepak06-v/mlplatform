import io
import logging
import uuid

from appwrite.client import Client
from appwrite.exception import AppwriteException
from appwrite.input_file import InputFile
from appwrite.services.storage import Storage

from app.config import Config
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)


class AppwriteStorageProvider(StorageProvider):
    def generate_key(self, filename: str) -> str:
        return uuid.uuid4().hex[:24]

    def __init__(self):
        self.client = Client()
        self.client.set_endpoint(Config.APPWRITE_ENDPOINT)
        self.client.set_project(Config.APPWRITE_PROJECT_ID)
        self.client.set_key(Config.APPWRITE_API_KEY)

        self.bucket_id = Config.APPWRITE_BUCKET_ID
        self.storage = Storage(self.client)

    def upload(self, file, object_key: str) -> int:
        total = 0
        chunks = []
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
            chunks.append(chunk)
        file.file.seek(0)

        body = b"".join(chunks)
        filename = getattr(file, "filename", object_key) or object_key
        mime_type = (
            getattr(file, "content_type", None) or "application/octet-stream"
        )

        try:
            self.storage.create_file(
                bucket_id=self.bucket_id,
                file_id=object_key,
                file=InputFile.from_bytes(body, filename=filename, mime_type=mime_type),
            )
            logger.info(
                "Uploaded file to Appwrite: %s (%d bytes)", object_key, total
            )
        except AppwriteException as e:
            logger.error("Appwrite upload failed: %s", e)
            raise

        return total

    def download(self, object_key: str) -> io.BytesIO | None:
        try:
            result = self.storage.get_file_download(
                bucket_id=self.bucket_id,
                file_id=object_key,
            )
            data = result if isinstance(result, bytes) else result
            logger.info(
                "Downloaded file from Appwrite: %s (%d bytes)",
                object_key,
                len(data),
            )
            return io.BytesIO(data)
        except AppwriteException as e:
            if "not found" in str(e).lower() or "404" in str(e):
                logger.warning("File not found in Appwrite: %s", object_key)
                return None
            logger.error("Appwrite download failed: %s", e)
            raise

    def delete(self, object_key: str) -> bool:
        try:
            self.storage.delete_file(
                bucket_id=self.bucket_id,
                file_id=object_key,
            )
            logger.info("Deleted file from Appwrite: %s", object_key)
            return True
        except AppwriteException as e:
            if "not found" in str(e).lower() or "404" in str(e):
                logger.warning("File not found for deletion: %s", object_key)
                return False
            logger.error("Appwrite delete failed: %s", e)
            return False

    def exists(self, object_key: str) -> bool:
        try:
            self.storage.get_file(
                bucket_id=self.bucket_id,
                file_id=object_key,
            )
            return True
        except AppwriteException:
            return False

    def size(self, object_key: str) -> int:
        try:
            info = self.storage.get_file(
                bucket_id=self.bucket_id,
                file_id=object_key,
            )
            d = info.model_dump(by_alias=True)
            return d.get("sizeOriginal", 0)
        except AppwriteException:
            return 0

    def list_objects(self) -> list[dict]:
        results = []
        try:
            response = self.storage.list_files(bucket_id=self.bucket_id, queries=["limit(100)"])
            dump = response.model_dump(by_alias=True)
            files = dump.get("files", [])
            for f in files:
                results.append(
                    {
                        "key": f.get("$id", ""),
                        "size_bytes": f.get("sizeOriginal", 0),
                        "last_modified": f.get("$createdAt", ""),
                        "name": f.get("name", ""),
                        "mime_type": f.get("mimeType", ""),
                    }
                )
            return results
        except AppwriteException as e:
            logger.error("Appwrite list objects failed: %s", e)
            return []
