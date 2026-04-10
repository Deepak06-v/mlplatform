"""Input validation utilities for API endpoints."""
from fastapi import HTTPException


def validate_dataset_id(dataset_id: str) -> None:
    """Validate dataset_id format."""
    if not dataset_id or not isinstance(dataset_id, str) or len(dataset_id.strip()) == 0:
        raise HTTPException(status_code=400, detail="Invalid dataset_id")


def validate_target_column(target_column: str) -> None:
    """Validate target_column is provided."""
    if not target_column or not isinstance(target_column, str) or len(target_column.strip()) == 0:
        raise HTTPException(status_code=400, detail="Target column is required")


def validate_algorithm(algorithm: str, valid_algorithms: list = None) -> None:
    """Validate algorithm is supported."""
    if not algorithm or not isinstance(algorithm, str):
        raise HTTPException(status_code=400, detail="Algorithm is required")
    
    default_algorithms = ["logistic", "tree", "rf", "linear", "tree_reg", "rf_reg"]
    valid_list = valid_algorithms or default_algorithms
    
    if algorithm not in valid_list:
        raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")


def validate_csv_filename(filename: str) -> None:
    """Validate uploaded file is CSV."""
    if not filename or not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")


def validate_params(params: dict) -> None:
    """Validate model parameters."""
    if not isinstance(params, dict):
        raise HTTPException(status_code=400, detail="Parameters must be a dictionary")
    
    if "max_depth" in params and not isinstance(params["max_depth"], int):
        raise HTTPException(status_code=400, detail="max_depth must be an integer")
    
    if "n_estimators" in params and not isinstance(params["n_estimators"], int):
        raise HTTPException(status_code=400, detail="n_estimators must be an integer")
