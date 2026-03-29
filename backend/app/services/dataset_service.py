import pandas as pd
from app.utils.db import db


def process_and_store_dataset(file_id, file_path, filename):
    # Load CSV
    df = pd.read_csv(file_path)

    data = df.to_dict(orient="records")

    document = {
        "dataset_id": file_id,
        "filename": filename,
        "data": data,  # 🔥 STORE FULL DATA
        "columns": list(df.columns),
        "rows": len(df),
    }

    # Insert into Mongo
    result = db.datasets.insert_one(document)

    return {
        "dataset_id": file_id,
        "rows": len(df),
        "columns": len(df.columns),
        "columns_list": list(df.columns),
    }