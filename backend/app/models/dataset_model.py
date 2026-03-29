def create_dataset_document(file_id, filename, file_path, rows, columns, column_names):
    return {
        "dataset_id": file_id,
        "filename": filename,
        "file_path": file_path,
        "rows": rows,
        "columns": columns,
        "column_names": column_names
    }