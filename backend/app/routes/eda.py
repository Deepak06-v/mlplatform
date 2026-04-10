from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.utils.dataset_helpers import (
    load_dataset_df,
    validate_target_column_in_dataset
)
from app.utils.validators import (
    validate_dataset_id,
    validate_target_column,
    validate_algorithm,
    validate_params
)
from app.utils.response import APIResponse
from app.services.eda_service import (
    compute_overview,
    compute_missing_by_column,
    compute_numerical_analysis,
    compute_categorical_analysis,
    get_column_types,
    compute_correlation_matrix,
    clean_json,
    compute_feature_importance,
    train_model
)

router = APIRouter()


# ===============================
# REQUEST MODELS
# ===============================

class EDARequest(BaseModel):
    dataset_id: str = Field(..., description="Dataset identifier")


class FeatureImportanceRequest(BaseModel):
    dataset_id: str = Field(..., description="Dataset identifier")
    target_column: str = Field(..., description="Target column name")


class TrainRequest(BaseModel):
    dataset_id: str = Field(..., description="Dataset identifier")
    target_column: str = Field(..., description="Target column name")
    algorithm: str = Field(..., description="ML algorithm to use")
    params: dict = Field(default_factory=dict, description="Model hyperparameters")


# ===============================
# ENDPOINTS
# ===============================

@router.post("/analyze", tags=["Exploratory Data Analysis"])
def analyze_data(request: EDARequest):
    """
    Comprehensive dataset analysis including statistics, distributions, and correlations.
    """
    try:
        validate_dataset_id(request.dataset_id)
        df = load_dataset_df(request.dataset_id)
        
        response = {
            "overview": compute_overview(df),
            "missing": compute_missing_by_column(df),
            "numerical": compute_numerical_analysis(df),
            "categorical": compute_categorical_analysis(df),
            "column_types": get_column_types(df),
            "correlation": compute_correlation_matrix(df)
        }
        
        return APIResponse.success(clean_json(response))
    
    except Exception as e:
        APIResponse.server_error(f"Analysis failed: {str(e)}", exception=e)


@router.post("/feature-importance", tags=["Feature Analysis"])
def feature_importance(request: FeatureImportanceRequest):
    """
    Compute feature importance using Random Forest.
    """
    try:
        validate_dataset_id(request.dataset_id)
        validate_target_column(request.target_column)
        
        df = load_dataset_df(request.dataset_id)
        validate_target_column_in_dataset(df, request.target_column)
        
        result = compute_feature_importance(df, request.target_column)
        
        if "error" in result:
            APIResponse.validation_error(result["error"])
        
        return APIResponse.success(clean_json(result))
    
    except Exception as e:
        APIResponse.server_error(f"Feature importance computation failed: {str(e)}", exception=e)


@router.post("/train-model", tags=["Model Training"])
def train_model_api(request: TrainRequest):
    """
    Train machine learning model with specified algorithm.
    """
    try:
        validate_dataset_id(request.dataset_id)
        validate_target_column(request.target_column)
        validate_algorithm(request.algorithm)
        validate_params(request.params)
        
        df = load_dataset_df(request.dataset_id)
        validate_target_column_in_dataset(df, request.target_column)
        
        result = train_model(
            df,
            request.target_column,
            request.algorithm,
            request.params
        )
        
        if "error" in result:
            APIResponse.validation_error(result["error"])
        
        return APIResponse.success(clean_json(result))
    
    except Exception as e:
        APIResponse.server_error(f"Model training failed: {str(e)}", exception=e)