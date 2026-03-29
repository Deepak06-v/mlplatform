from fastapi import APIRouter, UploadFile, File
from app.utils.file_handler import save_uploaded_file
from app.services.dataset_service import process_and_store_dataset
from bson import ObjectId
from fastapi import HTTPException
from app.utils.db import db  # make sure this is your Mongo connection


router = APIRouter()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):

    # Basic validation
    if not file.filename.endswith(".csv"):
        return {"error": "Only CSV files are supported"}

    # Save file
    file_id, file_path = save_uploaded_file(file)

    # Process + store metadata
    result = process_and_store_dataset(
        file_id=file_id,
        file_path=file_path,
        filename=file.filename
    )

    return result

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    dataset = await db.datasets.find_one({"dataset_id": dataset_id})

    if not dataset:
        return {"error": "Dataset not found"}

    return {
        "data": dataset["data"],
        "columns": dataset["columns"],
        "rows": dataset["rows"],
        "filename": dataset["filename"],
    }