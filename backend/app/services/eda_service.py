import pandas as pd
import numpy as np
import math
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from app.services.cache_service import dataset_cache
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, r2_score, mean_squared_error
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
# ===============================
# 🔥 LOAD DATASET (CACHED)
# ===============================
def load_dataset(file_path):
    cached_df = dataset_cache.get(file_path)
    if cached_df is not None:
        return cached_df

    df = pd.read_csv(file_path)
    dataset_cache.set(file_path, df)
    return df


# ===============================
# 📊 OVERVIEW
# ===============================
def compute_overview(df):
    rows, cols = df.shape
    total_cells = rows * cols
    missing = df.isnull().sum().sum()
    missing_percentage = (missing / total_cells) * 100

    return {
        "rows": int(rows),
        "columns": int(cols),
        "missing_percentage": float(round(missing_percentage, 2)),
        "duplicates": int(df.duplicated().sum())
    }


# ===============================
# 🔍 COLUMN TYPES (IMPROVED)
# ===============================
def detect_column_types(df):
    total_rows = len(df)

    numerical_cols = []
    categorical_cols = []
    high_cardinality_cols = []

    for col in df.columns:
        unique_count = df[col].nunique()
        unique_ratio = unique_count / total_rows
        dtype = df[col].dtype

        # Numerical
        if dtype in ["int64", "float64", "int32", "float32"] and unique_count > 20:
            numerical_cols.append(col)
            continue

        # High Cardinality (IDs / useless categorical)
        if unique_ratio > 0.5:
            high_cardinality_cols.append(col)
            continue

        # Normal categorical (including object types)
        categorical_cols.append(col)

    return numerical_cols, categorical_cols, high_cardinality_cols


# ===============================
# ❌ MISSING VALUES
# ===============================
def compute_missing_by_column(df):
    missing_counts = df.isnull().sum()
    total_rows = len(df)

    result = []

    for col in df.columns:
        missing = missing_counts[col]
        percent = (missing / total_rows) * 100

        # Include the datatype for better understanding
        col_dtype = str(df[col].dtype)
        
        result.append({
            "column": str(col),
            "missing_count": int(missing),
            "missing_percentage": float(round(percent, 2)),
            "dtype": col_dtype
        })

    return sorted(result, key=lambda x: x["missing_percentage"], reverse=True)


# ===============================
# 🔢 NUMERICAL ANALYSIS
# ===============================
def safe_value(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    return val


def compute_numerical_analysis(df):
    numerical_cols, _, _ = detect_column_types(df)

    result = []

    for col in numerical_cols:
        series = df[col].dropna()

        if len(series) == 0:
            continue

        counts, bins = np.histogram(series, bins=20)

        result.append({
            "column": str(col),
            "mean": safe_value(round(series.mean(), 2)),
            "median": safe_value(round(series.median(), 2)),
            "std": safe_value(round(series.std(), 2)),
            "min": safe_value(round(series.min(), 2)),
            "max": safe_value(round(series.max(), 2)),
            "skew": safe_value(round(series.skew(), 2)),
            "histogram": {
                "bins": [safe_value(float(x)) for x in bins],
                "counts": [int(x) for x in counts]
            }
        })

    return result


# ===============================
# 🧾 CATEGORICAL ANALYSIS
# ===============================
def compute_categorical_analysis(df):
    _, categorical_cols, _ = detect_column_types(df)

    result = []

    for col in categorical_cols:
        # Handle NaN values in object columns
        col_data = df[col].copy()
        if col_data.dtype == "object":
            col_data = col_data.fillna("Missing").astype(str)
        
        value_counts = col_data.value_counts()
        total = len(df)

        categories = [
            {
                "value": str(val),
                "count": int(count),
                "percentage": float(round((count / total) * 100, 2))
            }
            for val, count in value_counts.items()
        ]

        result.append({
            "column": str(col),
            "unique_count": int(df[col].nunique()),
            "top_categories": categories[:10]
        })

    return result


# ===============================
# 🏷 COLUMN TYPES API
# ===============================
def get_column_types(df):
    numerical_cols, categorical_cols, high_cardinality_cols = detect_column_types(df)

    result = []

    for col in df.columns:
        if col in numerical_cols:
            col_type = "numerical"
        elif col in high_cardinality_cols:
            col_type = "high_cardinality"
        else:
            col_type = "categorical"

        result.append({
            "column": str(col),
            "type": col_type
        })

    return result


# ===============================
# 📈 CORRELATION MATRIX
# ===============================
def compute_correlation_matrix(df, method="pearson"):
    numerical_cols, _, _ = detect_column_types(df)
    numeric_df = df[numerical_cols]

    if numeric_df.shape[1] < 2:
        return {"columns": [], "matrix": []}

    corr = numeric_df.corr(method=method).fillna(0)

    return {
        "columns": list(corr.columns),
        "matrix": corr.round(3).values.tolist(),
        "method": method
    }


# ===============================
# 🤖 FEATURE IMPORTANCE
# ===============================
def compute_feature_importance(df, target_column):
    """
    Compute feature importance using Random Forest.
    
    Args:
        df: DataFrame to analyze
        target_column: Target column for prediction
        
    Returns:
        List of features sorted by importance
    """
    try:
        X, y, encoders = preprocess_data(df, target_column, exclude_high_cardinality=True)
    except ValueError as e:
        return {"error": str(e)}
    
    # Choose model based on target cardinality (classification or regression)
    if len(set(y)) <= 10:
        model = RandomForestClassifier(n_estimators=100, random_state=42)
    else:
        model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    model.fit(X, y)
    importances = model.feature_importances_
    
    result = [
        {
            "feature": X.columns[i],
            "importance": float(round(importances[i], 4))
        }
        for i in range(len(X.columns))
    ]
    
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result


# ===============================
# 🧹 CLEAN JSON
# ===============================
def clean_json(obj):
    if isinstance(obj, dict):
        return {str(k): clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(i) for i in obj]
    elif hasattr(obj, "item"):
        return obj.item()
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj


# ===============================
# 🔧 PREPROCESSING HELPER
# ===============================
def preprocess_data(df, target_column, exclude_high_cardinality=True):
    """
    Preprocess data for modeling (shared between feature importance and training).
    
    Args:
        df: DataFrame to process
        target_column: Target column name
        exclude_high_cardinality: Whether to exclude high cardinality columns
        
    Returns:
        Tuple of (X, y, encoders) where:
        - X: Preprocessed feature matrix (numeric)
        - y: Preprocessed target variable (numeric)
        - encoders: Dict of fitted LabelEncoders for categorical features
    """
    df = df.copy()
    df = df.dropna(subset=[target_column])
    
    if len(df) < 2:
        raise ValueError("Dataset too small after removing null targets")
    
    numerical_cols, categorical_cols, high_cardinality_cols = detect_column_types(df)
    
    # Select feature columns
    exclude_cols = high_cardinality_cols if exclude_high_cardinality else []
    feature_cols = [
        col for col in df.columns
        if col != target_column and col not in exclude_cols
    ]
    
    if not feature_cols:
        raise ValueError("No valid features available after filtering")
    
    X = df[feature_cols].copy()
    y = df[target_column].copy()
    
    # Fill missing values BEFORE encoding
    for col in X.columns:
        if X[col].dtype == "object":
            X[col] = X[col].fillna("Missing").astype(str)
        elif pd.api.types.is_numeric_dtype(X[col]):
            X[col] = X[col].fillna(X[col].median())
    
    # Encode categorical features (convert to numeric)
    encoders = {}
    for col in categorical_cols:
        if col in X.columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            encoders[col] = le
    
    # Encode target if needed
    target_encoder = None
    if not pd.api.types.is_numeric_dtype(y):
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y.astype(str))
        encoders['__target__'] = target_encoder
    
    # Remove constant columns
    X = X.loc[:, X.nunique() > 1]
    if X.shape[1] == 0:
        raise ValueError("No usable features after preprocessing")
    
    # Ensure all columns are numeric
    X = X.astype(float)
    
    return X, y, encoders

def train_model(df, target_column, algorithm, params):
    """
    Train ML model with specified algorithm and parameters.
    
    Args:
        df: DataFrame to train on
        target_column: Target column for prediction
        algorithm: Model algorithm (logistic, tree, rf, linear, tree_reg, rf_reg)
        params: Dict of hyperparameters
        
    Returns:
        Dict with metrics for trained model
    """
    try:
        X, y, encoders = preprocess_data(df, target_column, exclude_high_cardinality=True)
    except ValueError as e:
        return {"error": str(e)}
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Model selection based on algorithm
    try:
        model = _create_model(algorithm, params)
    except ValueError as e:
        return {"error": str(e)}
    
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    
    # Determine if classification or regression
    is_classification = len(set(y)) <= 10
    
    # Calculate metrics
    if is_classification:
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, preds)), 4),
            "precision": round(float(precision_score(y_test, preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, preds, zero_division=0)), 4),
            "f1": round(float(f1_score(y_test, preds, zero_division=0)), 4),
        }
    else:
        metrics = {
            "r2": round(float(r2_score(y_test, preds)), 4),
            "rmse": round(float(mean_squared_error(y_test, preds, squared=False)), 4)
        }
    
    return {"metrics": metrics}


def _create_model(algorithm, params):
    """
    Factory function to create model instance.
    
    Args:
        algorithm: Algorithm name
        params: Hyperparameters dict
        
    Returns:
        Sklearn model instance
    """
    models_map = {
        "logistic": lambda p: LogisticRegression(max_iter=1000),
        "tree": lambda p: DecisionTreeClassifier(max_depth=p.get("max_depth", 5)),
        "rf": lambda p: RandomForestClassifier(
            n_estimators=p.get("n_estimators", 100),
            max_depth=p.get("max_depth", None),
            random_state=42
        ),
        "linear": lambda p: LinearRegression(),
        "tree_reg": lambda p: DecisionTreeRegressor(max_depth=p.get("max_depth", 5)),
        "rf_reg": lambda p: RandomForestRegressor(
            n_estimators=p.get("n_estimators", 100),
            max_depth=p.get("max_depth", None),
            random_state=42
        )
    }
    
    if algorithm not in models_map:
        raise ValueError(f"Invalid algorithm: {algorithm}")
    
    return models_map[algorithm](params)