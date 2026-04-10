from fastapi import APIRouter, UploadFile, File
from app.utils.file_handler import save_uploaded_file
from app.utils.validators import validate_csv_filename
from app.utils.response import APIResponse
from app.services.dataset_service import process_and_store_dataset


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