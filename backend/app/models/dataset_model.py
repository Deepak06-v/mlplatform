def create_dataset_document(dataset_id, filename, storage_key, file_size_mb, rows, columns, column_names):
    return {
        "dataset_id": dataset_id,
        "filename": filename,
        "storage_key": storage_key,
        "file_size_mb": file_size_mb,
        "rows": rows,
        "columns": columns,
        "column_names": column_names,
        "created_at": None,
        "last_accessed": None,
        "usage_count": 0,
        "status": "active",
    }
