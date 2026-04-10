import pandas as pd
from app.utils.db import db
from app.services.eda_service import detect_column_types


def process_and_store_dataset(file_id, file_path, filename):
    """Process uploaded CSV and store metadata with column type detection."""
    df = pd.read_csv(file_path)

    # Convert object columns to string to ensure proper handling
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].astype(str).replace("nan", None)

    # Detect column types
    numerical_cols, categorical_cols, high_cardinality_cols = detect_column_types(df)

    # Format column types for frontend
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

    # Store dataset metadata in database
    document = {
        "dataset_id": file_id,
        "filename": filename,
        "file_path": file_path,
        "columns": list(df.columns),
        "rows": len(df),
    }
    db.datasets.insert_one(document)

    return {
        "dataset_id": file_id,
        "rows": len(df),
        "columns": len(df.columns),
        "columns_list": list(df.columns),
        "column_types": column_types,
    }