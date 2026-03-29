import pandas as pd
import numpy as np

def compute_overview(file_path):
    # Load dataset
    df = pd.read_csv(file_path)

    # Shape
    rows, cols = df.shape

    # Missing values
    total_cells = rows * cols
    missing = df.isnull().sum().sum()
    missing_percentage = (missing / total_cells) * 100

    # Duplicates
    duplicates = int(df.duplicated().sum())
    rows = int(rows)
    cols = int(cols)
    missing_percentage = float(round(missing_percentage, 2))

    return {
        "rows": rows,
        "columns": cols,
        "missing_percentage": float(round(missing_percentage, 2)),
        "duplicates": int(duplicates)
    }

def detect_column_types(df):
    total_rows = len(df)

    numerical_cols = []
    categorical_cols = []

    for col in df.columns:
        unique_count = df[col].nunique()
        unique_ratio = unique_count / total_rows
        dtype = df[col].dtype

        # 🔥 RULE 1: object → categorical
        if dtype == "object":
            categorical_cols.append(col)
            continue

        # 🔥 RULE 2: binary / very low unique → categorical
        if unique_count <= 5:
            categorical_cols.append(col)
            continue

        # 🔥 RULE 3: low ratio → categorical
        if unique_count <= 20:
            categorical_cols.append(col)
            continue

        # 🔥 RULE 4: high unique numeric → numerical
        if dtype in ["int64", "float64"]:
            numerical_cols.append(col)
            continue

        # fallback
        categorical_cols.append(col)

    return numerical_cols, categorical_cols

def compute_missing_by_column(file_path):
    df = pd.read_csv(file_path)

    missing_counts = df.isnull().sum()
    total_rows = len(df)

    result = []

    for col in df.columns:
        missing = missing_counts[col]
        percent = (missing / total_rows) * 100

        result.append({
            "column": str(col),
            "missing_count": int(missing),  # 🔥 FIX
            "missing_percentage": float(round(percent, 2))  # 🔥 FIX
        })

    result.sort(key=lambda x: x["missing_percentage"], reverse=True)

    return result

import math

def safe_value(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    return val

def compute_numerical_analysis(file_path):
    df = pd.read_csv(file_path)

    numerical_cols, _ = detect_column_types(df)

    result = []

    for col in numerical_cols:
        series = df[col].dropna()

        if len(series) == 0:
            continue

        # stats
        mean = series.mean()
        median = series.median()
        std = series.std()
        min_val = series.min()
        max_val = series.max()
        skew = series.skew()

        # histogram
        counts, bins = np.histogram(series, bins=20)

# 🔥 FORCE conversion to Python types
        bins = [safe_value(float(x)) for x in bins]
        counts = [int(x) for x in counts]

        result.append({
        "column": str(col),
        "mean": safe_value(round(mean, 2)),
        "median": safe_value(round(median, 2)),
        "std": safe_value(round(std, 2)),
        "min": safe_value(round(min_val, 2)),
        "max": safe_value(round(max_val, 2)),
        "skew": safe_value(round(skew, 2)),
        "histogram": {
            "bins": bins,
            "counts": counts
        }
    })

    return result

def clean_json(obj):
    if isinstance(obj, dict):
        return {str(k): clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(i) for i in obj]
    elif hasattr(obj, "item"):  # numpy types
        return obj.item()
    elif isinstance(obj, float):
        import math
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj
    
def compute_categorical_analysis(file_path):
    df = pd.read_csv(file_path)

    _, categorical_cols = detect_column_types(df)

    result = []

    for col in categorical_cols:
        value_counts = df[col].value_counts()

        total = len(df)

        categories = []

        for val, count in value_counts.items():
            categories.append({
                "value": str(val),
                "count": int(count),
                "percentage": float(round((count / total) * 100, 2))
            })

        result.append({
            "column": str(col),
            "unique_count": int(df[col].nunique()),
            "top_categories": categories[:10]  # limit
        })

    return result

def get_column_types(file_path):
    df = pd.read_csv(file_path)

    numerical_cols, categorical_cols = detect_column_types(df)

    result = []

    for col in df.columns:
        if col in numerical_cols:
            col_type = "numerical"
        else:
            col_type = "categorical"

        result.append({
            "column": str(col),
            "type": col_type
        })

    return result