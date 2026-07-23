import pandas as pd
from datetime import datetime
from app.utils.db import db
from app.services.eda_service import detect_column_types
from app.storage.provider import storage_provider


def process_and_store_dataset(file_id, file_path, filename):
    """Process uploaded CSV and store metadata with column type detection."""
    df = pd.read_csv(file_path)

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

    now = datetime.utcnow()

    document = {
        "dataset_id": file_id,
        "filename": filename,
        "file_path": file_path,
        "file_size_mb": round(storage_provider.size(file_path) / (1024 * 1024), 2),
        "column_types": column_types,
        "columns": list(df.columns),
        "rows": len(df),
        "created_at": now,
        "last_accessed": now,
        "usage_count": 1,
        "status": "active",
    }
    db.datasets.insert_one(document)

    return {
        "dataset_id": file_id,
        "rows": len(df),
        "columns": len(df.columns),
        "columns_list": list(df.columns),
        "column_types": column_types,
    }
