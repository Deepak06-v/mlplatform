from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.auth.dependencies import get_current_user
from app.utils.file_handler import save_uploaded_file
from app.utils.validators import validate_csv_filename
from app.utils.response import APIResponse
from app.services.dataset_service import process_and_store_dataset
from app.services.eda_service import detect_column_types
from app.utils.db import dataset_collection
from app.workspace.service import get_user_workspace
from app.storage.provider import storage_provider
import pandas as pd
import io

router = APIRouter()


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        workspace = get_user_workspace(current_user["_id"])
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No workspace found",
            )

        if workspace.get("dataset_id"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This workspace already has a dataset. Start a new experiment to upload a different dataset.",
            )

        validate_csv_filename(file.filename)

        storage_key = save_uploaded_file(file)
        result = process_and_store_dataset(
            storage_key=storage_key,
            filename=file.filename,
            user_id=current_user["_id"],
            workspace_id=workspace["workspace_id"],
        )

        return APIResponse.success(result, "Dataset uploaded successfully")

    except HTTPException:
        raise
    except Exception as e:
        APIResponse.server_error(f"Failed to upload dataset: {str(e)}", exception=e)


@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        workspace = get_user_workspace(current_user["_id"])
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")

        doc = dataset_collection.find_one(
            {
                "dataset_id": dataset_id,
                "workspace_id": workspace["workspace_id"],
            },
            {"_id": 0},
        )
        if not doc:
            APIResponse.not_found("Dataset")

        preview = []
        column_types = doc.get("column_types", [])
        storage_key = doc.get("storage_key", "")

        try:
            if storage_key:
                data = storage_provider.download(storage_key)
                if data:
                    df = pd.read_csv(data, nrows=10)
                    df = df.fillna("")
                    for col in df.columns:
                        if df[col].dtype == "object":
                            df[col] = df[col].astype(str)
                    preview = df.to_dict(orient="records")

            if not column_types:
                if storage_key:
                    data = storage_provider.download(storage_key)
                    if data:
                        full = pd.read_csv(data)
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

    except HTTPException:
        raise
    except Exception as e:
        APIResponse.server_error(f"Failed to retrieve dataset: {str(e)}", exception=e)
