import os
import uuid

from app.config import Config


class StorageProvider:
    def save(self, file, filename: str) -> tuple[str, str, int]:
        raise NotImplementedError

    def delete(self, file_path: str) -> bool:
        raise NotImplementedError

    def exists(self, file_path: str) -> bool:
        raise NotImplementedError

    def size(self, file_path: str) -> int:
        raise NotImplementedError

    def list_files(self) -> list[dict]:
        raise NotImplementedError

    def total_size(self) -> int:
        raise NotImplementedError


class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: str = None):
        self.upload_dir = upload_dir or Config.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def save(self, file, filename: str) -> tuple[str, str, int]:
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

        file_id = str(uuid.uuid4())
        file_path = os.path.join(self.upload_dir, f"{file_id}_{filename}")

        with open(file_path, "wb") as f:
            while True:
                chunk = file.file.read(65536)
                if not chunk:
                    break
                f.write(chunk)

        file.file.seek(0)
        return file_id, file_path, total

    def delete(self, file_path: str) -> bool:
        try:
            os.remove(file_path)
            return True
        except FileNotFoundError:
            return False
        except Exception:
            return False

    def exists(self, file_path: str) -> bool:
        return os.path.isfile(file_path)

    def size(self, file_path: str) -> int:
        try:
            return os.path.getsize(file_path)
        except FileNotFoundError:
            return 0

    def list_files(self) -> list[dict]:
        results = []
        try:
            if os.path.isdir(self.upload_dir):
                with os.scandir(self.upload_dir) as entries:
                    for entry in entries:
                        if entry.is_file():
                            results.append({
                                "name": entry.name,
                                "path": entry.path,
                                "size_bytes": entry.stat().st_size,
                                "modified_at": entry.stat().st_mtime,
                            })
        except Exception:
            pass
        return results

    def total_size(self) -> int:
        return sum(f["size_bytes"] for f in self.list_files())


storage_provider = LocalStorageProvider()
