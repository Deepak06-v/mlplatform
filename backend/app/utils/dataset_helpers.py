from datetime import datetime

import pandas as pd
from app.utils.db import db
from app.utils.response import APIResponse
from app.services.eda_service import load_dataset


def get_dataset_or_fail(dataset_id: str) -> dict:
    if not dataset_id:
        APIResponse.validation_error("Dataset ID is required")

    dataset = db.datasets.find_one({"dataset_id": dataset_id})

    if not dataset:
        APIResponse.not_found("Dataset")

    return dataset


def load_dataset_df(dataset_id: str) -> pd.DataFrame:
    dataset = get_dataset_or_fail(dataset_id)

    try:
        df = load_dataset(dataset["file_path"])

        db.datasets.update_one(
            {"dataset_id": dataset_id},
            {
                "$set": {"last_accessed": datetime.utcnow()},
                "$inc": {"usage_count": 1},
            }
        )

        return df
    except FileNotFoundError:
        APIResponse.server_error(f"Dataset file not found: {dataset['file_path']}")
    except Exception as e:
        APIResponse.server_error(f"Failed to load dataset: {str(e)}", exception=e)


def validate_column_in_dataset(df: pd.DataFrame, column: str) -> None:
    if column not in df.columns:
        APIResponse.validation_error(f"Column '{column}' not found in dataset")


def validate_target_column_in_dataset(df: pd.DataFrame, target_column: str) -> None:
    validate_column_in_dataset(df, target_column)

    non_null_count = df[target_column].notna().sum()
    if non_null_count < 2:
        APIResponse.validation_error(f"Target column '{target_column}' has insufficient non-null values")
