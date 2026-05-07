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
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.preprocessing import FunctionTransformer
import numpy as np

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

from sklearn.preprocessing import FunctionTransformer
import numpy as np

def build_preprocessing_pipeline(
    df,
    target_column,
    algorithm,
    num_impute="median",
    cat_impute="most_frequent",
    scaling="standard",
    preprocess_config=None
):
    """
    Build preprocessing pipeline using ColumnTransformer (with feature transformation).
    """

    df = df.copy()

    # -------------------------
    # Remove rows with null target
    # -------------------------
    df = df.dropna(subset=[target_column])

    if len(df) < 2:
        raise ValueError("Dataset too small after removing null targets")

    # -------------------------
    # Read config safely
    # -------------------------
    if preprocess_config is None:
        preprocess_config = {}

    num_transform = preprocess_config.get("num_transform", "none")

    # -------------------------
    # Detect column types
    # -------------------------
    numerical_cols, categorical_cols, high_cardinality_cols = detect_column_types(df)

    # -------------------------
    # Remove high-cardinality + target
    # -------------------------
    feature_cols = [
        col for col in df.columns
        if col != target_column and col not in high_cardinality_cols
    ]

    if not feature_cols:
        raise ValueError("No valid features available after filtering")

    X = df[feature_cols].copy()
    y = df[target_column].copy()

    # -------------------------
    # Ensure column lists match X
    # -------------------------
    numerical_cols = [col for col in numerical_cols if col in X.columns]
    categorical_cols = [col for col in categorical_cols if col in X.columns]

    # -------------------------
    # Encode target if needed
    # -------------------------
    if not pd.api.types.is_numeric_dtype(y):
        y = LabelEncoder().fit_transform(y.astype(str))

    # -------------------------
    # Numerical Pipeline
    # -------------------------
    use_scaling = preprocess_config.get("scaling", "standard") == "standard"

    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy=num_impute)),
        ("transform", FunctionTransformer(np.log1p) if num_transform == "log" else "passthrough"),
        ("scaler", StandardScaler() if (use_scaling and scaling == "standard") else "passthrough")
    ])

    # -------------------------
    # Categorical Pipeline
    # -------------------------
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy=cat_impute)),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ])

    # -------------------------
    # Combine pipelines
    # -------------------------
    preprocessor = ColumnTransformer([
        ("num", num_pipeline, numerical_cols),
        ("cat", cat_pipeline, categorical_cols)
    ])

    return X, y, preprocessor

def train_model(df, target_column, algorithm, params, preprocess_config=None):
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

    if preprocess_config is None:
        preprocess_config = {}

    num_impute = preprocess_config.get("num_impute", "median")
    cat_impute = preprocess_config.get("cat_impute", "most_frequent")
    scaling = preprocess_config.get("scaling", "standard")
    imbalance = preprocess_config.get("imbalance", "none")
    target_transform = preprocess_config.get("target_transform", "none")

    try:
        X, y, preprocessor = build_preprocessing_pipeline(
        df,
        target_column,
        algorithm,
        num_impute,
        cat_impute,
        scaling,
        preprocess_config
    )
    except Exception as e:
        return {"error": str(e)}
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    import numpy as np

    if target_transform == "log":
        y_train = np.log1p(y_train)
        y_test = np.log1p(y_test)
    
    # Model selection based on algorithm
    try:
        model = _create_model(algorithm, params)
    except ValueError as e:
        return {"error": str(e)}
    
    if imbalance == "smote" and algorithm in ["linear", "tree_reg", "rf_reg"]:
        imbalance = "none"

    if imbalance == "smote":
        pipeline = ImbPipeline([
            ("preprocessor", preprocessor),
            ("smote", SMOTE()),
            ("model", model)
            ])
    else:
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("model", model)
            ])

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    if target_transform == "log":
        preds = np.expm1(preds)
        y_test = np.expm1(y_test)
    
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
        mse = mean_squared_error(y_test, preds)
        rmse = np.sqrt(mse)
        metrics = {
            "r2": round(float(r2_score(y_test, preds)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_test, preds))), 4)
        }
    
    return {"metrics": metrics}


def _create_model(algorithm, params):
    """
    Factory function to create model instance.
    """

    models_map = {
        # -------------------------
        # Classification
        # -------------------------
        "logistic": lambda p: LogisticRegression(
            max_iter=1000,
            class_weight=p.get("class_weight", None)
        ),

        "tree": lambda p: DecisionTreeClassifier(
            max_depth=p.get("max_depth", 5),
            class_weight=p.get("class_weight", None)
        ),

        "rf": lambda p: RandomForestClassifier(
            n_estimators=p.get("n_estimators", 100),
            max_depth=p.get("max_depth", None),
            class_weight=p.get("class_weight", None),
            random_state=42
        ),

        # -------------------------
        # Regression (no class_weight)
        # -------------------------
        "linear": lambda p: LinearRegression(),

        "tree_reg": lambda p: DecisionTreeRegressor(
            max_depth=p.get("max_depth", 5)
        ),

        "rf_reg": lambda p: RandomForestRegressor(
            n_estimators=p.get("n_estimators", 100),
            max_depth=p.get("max_depth", None),
            random_state=42
        )
    }

    if algorithm not in models_map:
        raise ValueError(f"Invalid algorithm: {algorithm}")

    return models_map[algorithm](params)

from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor


def get_model_configs(problem_type):
    if problem_type == "classification":
        return {
            "LogisticRegression": [
                LogisticRegression(max_iter=1000),
                LogisticRegression(C=0.5, max_iter=1000)
            ],
            "RandomForest": [
                RandomForestClassifier(n_estimators=100, random_state=42),
                RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
            ],
            "DecisionTree": [
                DecisionTreeClassifier(max_depth=5),
                DecisionTreeClassifier(max_depth=10)
            ]
        }
    else:
        return {
            "LinearRegression": [
                LinearRegression()
            ],
            "RandomForest": [
                RandomForestRegressor(n_estimators=100, random_state=42),
                RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
            ],
            "DecisionTree": [
                DecisionTreeRegressor(max_depth=5),
                DecisionTreeRegressor(max_depth=10)
            ]
        }


def compare_models(df, target_column, problem_type, preprocess_config=None):
    if preprocess_config is None:
        preprocess_config = {}

    # -------------------------
    # Preprocessing
    # -------------------------
    X, y, preprocessor = build_preprocessing_pipeline(
        df,
        target_column,
        algorithm="rf",
        preprocess_config=preprocess_config
    )

    # -------------------------
    # Get models
    # -------------------------
    model_configs = get_model_configs(problem_type)

    scoring = "f1_weighted" if problem_type == "classification" else "r2"

    results = []

    # -------------------------
    # Model loop (FIXED)
    # -------------------------
    for name, model_list in model_configs.items():
        best_score = -1
        best_std = 0
        best_params = {}

        for model in model_list:
            pipeline = Pipeline([
                ("preprocessor", preprocessor),
                ("model", model)
            ])

            scores = cross_val_score(
                pipeline,
                X,
                y,
                cv=5,
                scoring=scoring
            )

            mean_score = scores.mean()

            if mean_score > best_score:
                best_score = mean_score
                best_std = scores.std()
                best_params = model.get_params()

        results.append({
            "model": name,
            "score": round(float(best_score), 4),
            "std": round(float(best_std), 4),
            "params": best_params
        })

    # -------------------------
    # Sort
    # -------------------------
    results = sorted(results, key=lambda x: x["score"], reverse=True)

    insights = generate_insights(results, problem_type, preprocess_config)

    recommendation = generate_recommendation(results, problem_type)

    return {
        "leaderboard": results,
        "best_model": results[0]["model"],
        "insights": insights,
        "recommendation": recommendation
    }
def generate_insights(results, problem_type, preprocess_config):
    insights = []

    # -------------------------
    # Sort results
    # -------------------------
    results_sorted = sorted(results, key=lambda x: x["score"], reverse=True)

    best = results_sorted[0]
    worst = results_sorted[-1]

    # -------------------------
    # Performance gap insight
    # -------------------------
    gap = best["score"] - worst["score"]

    if gap > 0.1:
        insights.append("Large performance gap detected → model choice is critical")
    elif gap < 0.02:
        insights.append("All models perform similarly → dataset may be simple or small")

    # -------------------------
    # Tree vs Linear insight
    # -------------------------
    tree_models = ["RandomForest", "DecisionTree"]
    linear_models = ["LogisticRegression", "LinearRegression"]

    best_model = best["model"]

    if best_model in tree_models:
        insights.append("Tree-based models performed best → data likely non-linear")
    elif best_model in linear_models:
        insights.append("Linear model performed well → relationships may be simple")

    # -------------------------
    # Stability insight
    # -------------------------
    if best["std"] > 0.05:
        insights.append("Model performance unstable → dataset may be noisy")

    # -------------------------
    # Preprocessing insights
    # -------------------------
    if preprocess_config.get("num_transform") == "log":
        insights.append("Log transformation applied → helpful for skewed features")

    if preprocess_config.get("scaling") == "standard":
        insights.append("Feature scaling enabled → important for linear models")

    if preprocess_config.get("imbalance") == "smote":
        insights.append("SMOTE applied → handling class imbalance")

    return insights

def generate_recommendation(results, problem_type):
    results_sorted = sorted(results, key=lambda x: x["score"], reverse=True)

    best = results_sorted[0]
    second = results_sorted[1] if len(results_sorted) > 1 else None

    best_model = best["model"]
    gap = best["score"] - (second["score"] if second else 0)

    # -------------------------
    # Confidence level
    # -------------------------
    if gap > 0.1:
        confidence = "high"
    elif gap > 0.03:
        confidence = "medium"
    else:
        confidence = "low"

    # -------------------------
    # Reason logic
    # -------------------------
    if best_model in ["RandomForest", "DecisionTree"]:
        reason = "Tree-based models performed best → data likely non-linear"

    elif best_model in ["LogisticRegression", "LinearRegression"]:
        reason = "Linear model performed well → relationships appear simple"

    else:
        reason = "Model achieved best cross-validation performance"

    return {
        "model": best_model,
        "reason": reason,
        "confidence": confidence
    }