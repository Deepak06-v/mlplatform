from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.utils.dataset_helpers import (
    load_dataset_df,
    validate_target_column_in_dataset
)
from app.utils.eda_helpers import (
    get_eda as get_cached_eda,
    save_eda as save_cached_eda
)
from app.utils.feature_importance_helpers import (
    get_feature_importance as get_cached_fi,
    save_feature_importance as save_cached_fi
)
from app.utils.validators import (
    validate_dataset_id,
    validate_target_column,
    validate_algorithm,
    validate_params
)
from app.utils.response import APIResponse
from app.utils.workspace_helpers import verify_dataset_ownership
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
from app.services.eda_service import compare_models

router = APIRouter()


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
    preprocess_config: dict = Field(default_factory=dict, description="Preprocessing configuration")

class CompareModelsRequest(BaseModel):
    dataset_id: str = Field(..., description="Dataset identifier")
    target_column: str = Field(..., description="Target column name")
    problem_type: str = Field(..., description="classification or regression")
    preprocess_config: dict = Field(default_factory=dict)


@router.post("/analyze", tags=["Exploratory Data Analysis"])
def analyze_data(request: EDARequest, current_user: dict = Depends(get_current_user)):
    try:
        verify_dataset_ownership(request.dataset_id, current_user["_id"])
        validate_dataset_id(request.dataset_id)

        cached = get_cached_eda(request.dataset_id)
        if cached:
            return APIResponse.success(cached["data"], from_cache=True)

        df = load_dataset_df(request.dataset_id)

        response = {
            "overview": compute_overview(df),
            "missing": compute_missing_by_column(df),
            "numerical": compute_numerical_analysis(df),
            "categorical": compute_categorical_analysis(df),
            "column_types": get_column_types(df),
            "correlation": compute_correlation_matrix(df)
        }

        cleaned = clean_json(response)
        save_cached_eda(request.dataset_id, cleaned)

        return APIResponse.success(cleaned)

    except Exception as e:
        APIResponse.server_error(f"Analysis failed: {str(e)}", exception=e)


@router.post("/feature-importance", tags=["Feature Analysis"])
def feature_importance(request: FeatureImportanceRequest, current_user: dict = Depends(get_current_user)):
    try:
        verify_dataset_ownership(request.dataset_id, current_user["_id"])
        validate_dataset_id(request.dataset_id)
        validate_target_column(request.target_column)

        df = load_dataset_df(request.dataset_id)
        validate_target_column_in_dataset(df, request.target_column)

        y_unique = df[request.target_column].nunique() or 0
        if y_unique <= 10:
            problem_type = "classification"
            model_used = "RandomForestClassifier"
        else:
            problem_type = "regression"
            model_used = "RandomForestRegressor"

        cached = get_cached_fi(request.dataset_id, request.target_column, problem_type, model_used)
        if cached:
            return APIResponse.success(cached["importance"], from_cache=True)

        result = compute_feature_importance(df, request.target_column)

        if "error" in result:
            APIResponse.validation_error(result["error"])

        save_cached_fi(request.dataset_id, request.target_column, problem_type, model_used, result["importance"])

        return APIResponse.success(clean_json(result["importance"]))

    except Exception as e:
        APIResponse.server_error(f"Feature importance computation failed: {str(e)}", exception=e)


@router.post("/train-model", tags=["Model Training"])
def train_model_api(request: TrainRequest, current_user: dict = Depends(get_current_user)):
    try:
        verify_dataset_ownership(request.dataset_id, current_user["_id"])
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
            request.params,
            request.preprocess_config
        )

        if "error" in result:
            APIResponse.validation_error(result["error"])

        return APIResponse.success(clean_json(result))

    except Exception as e:
        APIResponse.server_error(f"Model training failed: {str(e)}", exception=e)


@router.post("/compare-models", tags=["Model Comparison"])
def compare_models_api(request: CompareModelsRequest, current_user: dict = Depends(get_current_user)):
    try:
        verify_dataset_ownership(request.dataset_id, current_user["_id"])
        validate_dataset_id(request.dataset_id)
        validate_target_column(request.target_column)

        df = load_dataset_df(request.dataset_id)
        validate_target_column_in_dataset(df, request.target_column)

        result = compare_models(
            df,
            request.target_column,
            request.problem_type,
            request.preprocess_config
        )

        return APIResponse.success(clean_json(result))

    except Exception as e:
        APIResponse.server_error(
            f"Model comparison failed: {str(e)}",
            exception=e
        )
