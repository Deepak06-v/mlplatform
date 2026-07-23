from fastapi import APIRouter, UploadFile, File
from app.utils.file_handler import save_uploaded_file
from app.utils.validators import validate_csv_filename
from app.utils.response import APIResponse
from app.services.dataset_service import process_and_store_dataset
from app.services.eda_service import detect_column_types
from app.utils.db import dataset_collection
import pandas as pd


router = APIRouter()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload and process a CSV dataset."""
    try:
        validate_csv_filename(file.filename)
        
        file_id, file_path = save_uploaded_file(file)
        result = process_and_store_dataset(
            file_id=file_id,
            file_path=file_path,
            filename=file.filename
        )
        
        return APIResponse.success(result, "Dataset uploaded successfully")
    
    except Exception as e:
        APIResponse.server_error(f"Failed to upload dataset: {str(e)}", exception=e)


@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    """Return full dataset metadata with preview rows and column types."""
    try:
        doc = dataset_collection.find_one(
            {"dataset_id": dataset_id},
            {"_id": 0}
        )
        if not doc:
            APIResponse.not_found("Dataset")

        preview = []
        column_types = doc.get("column_types", [])
        try:
            df = pd.read_csv(doc["file_path"], nrows=10)
            df = df.fillna("")
            for col in df.columns:
                if df[col].dtype == "object":
                    df[col] = df[col].astype(str)

            preview = df.to_dict(orient="records")

            if not column_types:
                full = pd.read_csv(doc["file_path"])
                numerical, categorical, high_cardinality = detect_column_types(full)
                for col in full.columns:
                    if col in numerical:
                        col_type = "numerical"
                    elif col in high_cardinality:
                        col_type = "high_cardinality"
                    else:
                        col_type = "categorical"
                    column_types.append({"column": str(col), "type": col_type})
        except Exception:
            pass

        return APIResponse.success({
            "dataset_id": doc["dataset_id"],
            "filename": doc.get("filename", ""),
            "file_size_mb": doc.get("file_size_mb", 0),
            "rows": doc.get("rows", 0),
            "columns": doc.get("columns", 0),
            "columns_list": doc.get("columns", []),
            "column_types": column_types,
            "preview": preview,
            "created_at": doc.get("created_at"),
            "last_accessed": doc.get("last_accessed"),
            "usage_count": doc.get("usage_count", 0),
            "status": doc.get("status", "active"),
        }, "Dataset retrieved")

    except Exception as e:
        APIResponse.server_error(f"Failed to retrieve dataset: {str(e)}", exception=e)
