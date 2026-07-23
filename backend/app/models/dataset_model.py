def create_dataset_document(file_id, filename, file_path, file_size_mb, rows, columns, column_names):
    return {
        "dataset_id": file_id,
        "filename": filename,
        "file_path": file_path,
        "file_size_mb": file_size_mb,
        "rows": rows,
        "columns": columns,
        "column_names": column_names,
        "created_at": None,
        "last_accessed": None,
        "usage_count": 0,
        "status": "active",
    }
