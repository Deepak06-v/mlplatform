from app.storage.provider import storage_provider


def save_uploaded_file(file):
    object_key = storage_provider.generate_key(file.filename)
    storage_provider.upload(file, object_key)
    return object_key
