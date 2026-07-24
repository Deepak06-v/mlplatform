import pandas as pd
import io
from datetime import datetime, timezone
from app.utils.db import db, dataset_collection
from app.services.eda_service import detect_column_types
from app.storage.provider import storage_provider
from app.workspace.service import set_workspace_dataset


def process_and_store_dataset(storage_key, filename, user_id=None, workspace_id=None):
    data = storage_provider.download(storage_key)
    if data is None:
        raise FileNotFoundError(f"Dataset not found in storage: {storage_key}")

    df = pd.read_csv(data)

    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].astype(str).replace("nan", None)

    numerical_cols, categorical_cols, high_cardinality_cols = detect_column_types(df)

    column_types = []
    for col in df.columns:
        if col in numerical_cols:
            col_type = "numerical"
        elif col in high_cardinality_cols:
            col_type = "high_cardinality"
        else:
            col_type = "categorical"

        column_types.append({
            "column": str(col),
            "type": col_type
        })

    now = datetime.now(timezone.utc)
    file_size = storage_provider.size(storage_key)

    dataset_id = storage_key.split("_", 1)[0]

    document = {
        "dataset_id": dataset_id,
        "filename": filename,
        "storage_key": storage_key,
        "file_size": file_size,
        "file_size_mb": round(file_size / (1024 * 1024), 2),
        "content_type": "text/csv",
        "column_types": column_types,
        "columns": list(df.columns),
        "rows": len(df),
        "created_at": now,
        "last_accessed": now,
        "usage_count": 1,
        "status": "active",
    }

    if user_id:
        document["user_id"] = user_id
    if workspace_id:
        document["workspace_id"] = workspace_id

    db.datasets.insert_one(document)

    if workspace_id:
        set_workspace_dataset(workspace_id, dataset_id)

    return {
        "dataset_id": dataset_id,
        "rows": len(df),
        "columns": len(df.columns),
        "columns_list": list(df.columns),
        "column_types": column_types,
    }
