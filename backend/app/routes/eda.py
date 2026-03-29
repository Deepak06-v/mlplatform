from fastapi import APIRouter
from pydantic import BaseModel
from app.utils.db import dataset_collection
from app.services.eda_service import compute_overview
from app.services.eda_service import compute_missing_by_column
from app.services.eda_service import compute_numerical_analysis,clean_json
from app.services.eda_service import compute_categorical_analysis
from app.services.eda_service import get_column_types

router = APIRouter()

class EDARequest(BaseModel):
    dataset_id: str


@router.post("/analyze")
def analyze_data(request: EDARequest):

    # 🔥 Fetch dataset from DB
    dataset = dataset_collection.find_one({
        "dataset_id": request.dataset_id
    })

    if not dataset:
        return {"error": "Dataset not found"}

    # 🔥 Compute overview
    overview = compute_overview(dataset["file_path"])
    missing_data = compute_missing_by_column(dataset["file_path"])
    numerical = compute_numerical_analysis(dataset["file_path"])
    categorical = compute_categorical_analysis(dataset["file_path"])
    column_types = get_column_types(dataset["file_path"])
    response = {
    "overview": overview,
    "missing": missing_data,
    "numerical": numerical,
    "categorical": categorical,
    "column_types": column_types  # 🔥 NEW
    }

    return clean_json(response)