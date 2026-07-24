import io
import uuid
from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    def upload(self, file, object_key: str) -> int:
        ...

    @abstractmethod
    def download(self, object_key: str) -> io.BytesIO | None:
        ...

    @abstractmethod
    def delete(self, object_key: str) -> bool:
        ...

    @abstractmethod
    def exists(self, object_key: str) -> bool:
        ...

    @abstractmethod
    def size(self, object_key: str) -> int:
        ...

    @abstractmethod
    def list_objects(self) -> list[dict]:
        ...

    def generate_key(self, filename: str) -> str:
        return f"{uuid.uuid4()}_{filename}"
