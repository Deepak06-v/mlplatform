from app.storage.provider import storage_provider


def validate_file_size(file) -> int:
    total = 0
    chunk_size = 8192
    from app.config import Config
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
    return total


def save_uploaded_file(file):
    file_id, file_path, _ = storage_provider.save(file, file.filename)
    return file_id, file_path
