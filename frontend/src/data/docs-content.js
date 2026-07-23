export const MODELS = [
  {
    id: "logistic-regression",
    name: "Logistic Regression",
    type: "Classification",
    description: "A linear model for binary classification that estimates class probabilities using a logistic function.",
    useCases: "Baseline binary classification, spam detection, fraud detection, medical diagnosis",
    advantages: "Fast to train, interpretable coefficients, outputs well-calibrated probabilities, works well with small datasets",
    limitations: "Assumes linear decision boundary, sensitive to outliers, requires feature scaling, limited expressiveness",
    datasetSize: "Small to medium (100–10,000 samples)",
  },
  {
    id: "decision-tree",
    name: "Decision Tree",
    type: "Classification",
    description: "A non-linear model that splits data into branches based on feature thresholds, forming a tree structure.",
    useCases: "Interpretable classification, customer segmentation, credit scoring, medical diagnosis",
    advantages: "Highly interpretable, no feature scaling needed, handles non-linear relationships, captures feature interactions",
    limitations: "Prone to overfitting, unstable (small data changes → different tree), biased toward features with more levels",
    datasetSize: "Small to medium (100–50,000 samples)",
  },
  {
    id: "random-forest",
    name: "Random Forest",
    type: "Classification",
    description: "An ensemble of decision trees trained on random subsets of data and features, aggregated by majority vote.",
    useCases: "High-accuracy classification, feature selection, missing value imputation, anomaly detection",
    advantages: "High accuracy, robust to overfitting, handles high-dimensional data, provides feature importance",
    limitations: "Less interpretable than single trees, slower prediction, large model size, memory intensive",
    datasetSize: "Medium to large (1,000–100,000+ samples)",
  },
  {
    id: "linear-regression",
    name: "Linear Regression",
    type: "Regression",
    description: "Models the relationship between features and a continuous target as a linear combination of inputs.",
    useCases: "Price prediction, sales forecasting, trend analysis, risk assessment",
    advantages: "Fast training, interpretable coefficients, simple implementation, works well with linear relationships",
    limitations: "Assumes linearity, sensitive to outliers, requires feature scaling, cannot model non-linear patterns",
    datasetSize: "Small to medium (100–10,000 samples)",
  },
  {
    id: "tree-regressor",
    name: "Decision Tree Regressor",
    type: "Regression",
    description: "A regression tree that partitions data into regions and predicts the mean target value in each region.",
    useCases: "Non-linear regression, interpretable predictions, value estimation, resource allocation",
    advantages: "Captures non-linear patterns, no feature scaling needed, interpretable rules, handles mixed data types",
    limitations: "Prone to overfitting, discontinuous predictions, unstable, biased toward features with many splits",
    datasetSize: "Small to medium (100–50,000 samples)",
  },
  {
    id: "forest-regressor",
    name: "Random Forest Regressor",
    type: "Regression",
    description: "An ensemble of regression trees that averages predictions across many trees for robust performance.",
    useCases: "High-accuracy regression, demand forecasting, energy consumption prediction, pricing models",
    advantages: "High accuracy with minimal tuning, robust to outliers, provides feature importance, handles non-linearity",
    limitations: "Slower prediction, less interpretable, large memory footprint, may overfit on noisy data",
    datasetSize: "Medium to large (1,000–100,000+ samples)",
  },
];

export const API_ENDPOINTS = [
  { method: "GET", route: "/", description: "Root health check", request: "None", response: '{ "status": "healthy", "version": "1.0.0", "mode": "..." }' },
  { method: "GET", route: "/health", description: "Full health status", request: "None", response: '{ "status": "ok", "services": { "backend": "healthy", "mongodb": "healthy" }, "uptime_seconds": 123 }' },
  { method: "GET", route: "/health/memory", description: "Memory usage stats", request: "None", response: '{ "process_memory_mb": 145.2, "cache_memory_mb": 32.1 }' },
  { method: "GET", route: "/health/storage", description: "Storage and document counts", request: "None", response: '{ "total_files": 5, "total_size_mb": 12.3, "datasets": 3 }' },
  { method: "GET", route: "/health/cache", description: "Cache stats", request: "None", response: '{ "dataset_cache": { "entries": 2 }, "ai_cache": { "entries": 0 } }' },
  { method: "GET", route: "/metrics", description: "Platform metrics", request: "None", response: '{ "datasets_uploaded": 3, "experiments_created": 12 }' },
  { method: "GET", route: "/datasets", description: "List all datasets", request: "None", response: '[{ "dataset_id": "...", "filename": "data.csv", "rows": 1000 }]' },
  { method: "POST", route: "/dataset/upload", description: "Upload a CSV dataset", request: "multipart/form-data file", response: '{ "dataset_id": "...", "rows": 1000, "columns": 15 }' },
  { method: "GET", route: "/dataset/{dataset_id}", description: "Get dataset details", request: "None", response: '{ "dataset_id": "...", "filename": "...", "preview": [...] }' },
  { method: "POST", route: "/eda/analyze", description: "Run EDA", request: '{ "dataset_id": "..." }', response: '{ "overview": {...}, "missing_values": {...} }' },
  { method: "POST", route: "/eda/feature-importance", description: "Compute feature importance", request: '{ "dataset_id": "...", "target_column": "..." }', response: '{ "importance": [{ "feature": "...", "importance": 0.45 }] }' },
  { method: "POST", route: "/eda/train-model", description: "Train a model", request: '{ "dataset_id": "...", "target_column": "...", "algorithm": "rf", "params": {} }', response: '{ "metrics": { "accuracy": 0.92 }, "model_id": "..." }' },
  { method: "POST", route: "/eda/compare-models", description: "Compare multiple models", request: '{ "dataset_id": "...", "target_column": "...", "problem_type": "classification" }', response: '{ "leaderboard": [...], "recommendation": "..." }' },
  { method: "POST", route: "/ai/recommendations", description: "Get AI recommendations", request: '{ "dataset_id": "...", "page": "overview", "context": {} }', response: '{ "recommendations": [...], "cached": false }' },
  { method: "GET", route: "/session/{dataset_id}", description: "Get session data", request: "None", response: '{ "target_column": "price", "problem_type": "regression" }' },
  { method: "PUT", route: "/session/{dataset_id}", description: "Upsert session", request: '{ "target_column": "price" }', response: '{ "target_column": "price" }' },
  { method: "PATCH", route: "/session/{dataset_id}", description: "Patch session fields", request: '{ "target_column": "price" }', response: '{ "target_column": "price" }' },
  { method: "DELETE", route: "/session/{dataset_id}", description: "Delete session", request: "None", response: '{ "deleted": true }' },
  { method: "POST", route: "/settings/reset", description: "Reset settings to defaults", request: "None", response: '{ "reset": true }' },
  { method: "POST", route: "/cache/clear/dataset", description: "Clear dataset cache", request: "None", response: '{ "cleared": true, "entries_removed": 3 }' },
  { method: "POST", route: "/cache/clear/ai", description: "Clear AI cache", request: "None", response: '{ "cleared": true, "entries_removed": 0 }' },
  { method: "POST", route: "/cleanup/report", description: "Scan for orphaned files", request: "None", response: '{ "orphaned_count": 2, "missing_count": 0 }' },
  { method: "POST", route: "/cleanup/execute", description: "Delete orphaned files", request: "None (dry_run param available)", response: '{ "deleted_count": 2, "reclaimed_mb": 5.3 }' },
];

export const FAQS = [
  { question: "Why can\u2019t I upload my dataset?", answer: "Ensure the file is a valid CSV (.csv) under the maximum upload size (default 500 MB). Check that the file is not corrupted and contains at least one row of data." },
  { question: "Why is AI unavailable?", answer: "AI recommendations require a configured AI provider (Gemini, OpenAI, or Claude). Go to Settings \u2192 AI Settings to configure a provider and enable AI mode." },
  { question: "Why can\u2019t I train a model?", answer: "Training requires a dataset with a selected target column. Ensure you have completed EDA and selected a target column on the Data Insights page before training." },
  { question: "Why is preprocessing required?", answer: "Raw data often contains missing values, categorical text, and unscaled features that can degrade model performance. Preprocessing cleans and transforms data to improve accuracy and stability." },
  { question: "How is feature importance calculated?", answer: "Feature importance is computed using tree-based models (Random Forest). The platform ranks features by how much they reduce impurity (Gini or MSE) across all decision tree splits." },
  { question: "What file formats are supported?", answer: "Currently only CSV (.csv) files are supported. JSON support is planned for a future release." },
  { question: "How many CV folds should I use?", answer: "5 folds is the default and works well for most datasets. Use 10 folds for smaller datasets to reduce variance, or 3 folds for very large datasets to improve speed." },
  { question: "What happens when I clear the cache?", answer: "Clearing the cache removes in-memory stored datasets and AI responses. Data will be reloaded from MongoDB on the next request, which may be slightly slower." },
];

export const TROUBLESHOOTING = [
  {
    title: "Upload Failed",
    symptoms: "File upload returns an error message or hangs indefinitely.",
    causes: ["File exceeds the maximum upload size", "File is not a valid CSV", "File is corrupted or empty", "MongoDB connection is down", "Upload directory is full or missing"],
    solutions: ["Check that your file is under 500 MB", "Ensure the file extension is .csv", "Open the file in a text editor to verify it has headers and data", "Verify MongoDB is running (check Settings \u2192 Monitoring)", "Contact your administrator if the upload directory is full"],
  },
  {
    title: "MongoDB Unavailable",
    symptoms: "Monitoring page shows MongoDB as disconnected, datasets fail to load.",
    causes: ["MongoDB service is not running", "Connection URI is misconfigured", "Network firewall blocking the connection", "Authentication credentials are incorrect"],
    solutions: ["Start MongoDB: sudo systemctl start mongod", "Verify MONGODB_URI in your .env file", "Check network connectivity to the MongoDB host", "Reset credentials and update the .env file"],
  },
  {
    title: "AI Timeout",
    symptoms: "AI recommendations take too long or return a timeout error.",
    causes: ["AI provider API is slow or down", "Network latency to AI provider", "Dataset is very large causing long processing", "API rate limits exceeded"],
    solutions: ["Check the AI provider status page", "Switch to a different AI provider in Settings", "Reduce dataset size or try static recommendations", "Wait for rate limits to reset and try again"],
  },
  {
    title: "Model Training Failed",
    symptoms: "Training returns an error or completes with no results.",
    causes: ["Target column contains too many missing values", "Selected algorithm is incompatible with the problem type", "Dataset is too small for the selected algorithm", "Feature matrix contains non-numeric values after preprocessing"],
    solutions: ["Ensure the target column has at least 2 non-null values", "Select a classification algorithm for categorical targets, regression for numeric", "Use at least 50 samples for training", "Run preprocessing to encode categorical features and scale numeric ones"],
  },
  {
    title: "Comparison Unavailable",
    symptoms: "Model comparison page shows no data or an error.",
    causes: ["No experiments have been run yet", "The current dataset has no trained models", "The comparison endpoint is down", "Dataset session was cleared"],
    solutions: ["Train at least two models before comparing", "Go to ML Playground and train models with different algorithms", "Check Settings \u2192 Monitoring for backend health", "Re-upload the dataset and train models again"],
  },
  {
    title: "Health Endpoint Unavailable",
    symptoms: "Backend root or health endpoint returns connection refused.",
    causes: ["Backend server is not running", "Port is already in use", "Server crashed due to an unhandled exception", "Firewall is blocking the port"],
    solutions: ["Start the backend: uvicorn app.main:app", "Kill the process using the port: lsof -ti:8000 | xargs kill", "Check server logs for errors", "Allow port 8000 in your firewall settings"],
  },
];

export const DOC_SECTIONS = [
  {
    id: "welcome",
    title: "Welcome",
    icon: "BookOpen",
    description: "Introduction to Precision Engine",
    content: [
      {
        type: "heading", level: 2, text: "What is Precision Engine?",
      },
      {
        type: "paragraph", text: "Precision Engine is a full-stack machine learning platform that enables you to upload datasets, explore them through interactive visualizations, preprocess data, train models, compare results, and receive AI-powered recommendations — all from a single, intuitive web interface.",
      },
      {
        type: "paragraph", text: "Built on modern technologies — React frontend, FastAPI backend, MongoDB storage — the platform is designed for both beginners exploring machine learning and experienced practitioners seeking rapid experimentation.",
      },
      {
        type: "heading", level: 3, text: "Supported Workflows",
      },
      {
        type: "list", ordered: false, items: [
          "End-to-end ML pipeline from raw data to trained model",
          "Classification and regression tasks",
          "Automated exploratory data analysis",
          "Model comparison and leaderboard ranking",
          "AI-assisted recommendations for algorithms and preprocessing",
        ],
      },
      {
        type: "heading", level: 3, text: "Key Features",
      },
      {
        type: "cardGrid", columns: 2, cards: [
          { title: "Interactive EDA", description: "Comprehensive visualizations including correlation matrices, distribution plots, and feature importance charts.", icon: "BarChart2" },
          { title: "Multi-Algorithm Training", description: "Train Logistic Regression, Decision Trees, Random Forests, and more with configurable hyperparameters.", icon: "FlaskConical" },
          { title: "AI Recommendations", description: "Get intelligent suggestions for preprocessing steps, algorithms, and hyperparameters.", icon: "Zap" },
          { title: "Session Persistence", description: "Your work is automatically saved. Leave and return to find everything exactly as you left it.", icon: "RefreshCw" },
          { title: "Model Comparison", description: "Compare multiple experiments side by side with detailed metrics and leaderboard ranking.", icon: "GitCompare" },
          { title: "Preprocessing Pipeline", description: "Handle missing values, encode categories, scale features, and build custom preprocessing pipelines.", icon: "Wand2" },
        ],
      },
      {
        type: "heading", level: 3, text: "Who It Is For",
      },
      {
        type: "paragraph", text: "Data scientists, ML engineers, students, and researchers who need a rapid experimentation environment without writing boilerplate code. The platform handles infrastructure concerns so you can focus on model quality.",
      },
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "Compass",
    description: "Complete platform workflow",
    content: [
      {
        type: "heading", level: 2, text: "Platform Workflow",
      },
      {
        type: "paragraph", text: "The platform follows a logical left-to-right pipeline. Each step builds on the previous one, taking your dataset from raw CSV to a trained, evaluated model.",
      },
      {
        type: "steps", items: [
          { title: "Upload Dataset", description: "Upload a CSV file. The platform validates the format, detects column types, and shows a preview.", page: "/upload" },
          { title: "Data Insights", description: "Explore your data through visualizations — distributions, correlations, missing values, and more.", page: "/insights" },
          { title: "Preprocessing", description: "Clean and transform your data: handle missing values, encode categories, scale features.", page: "/preprocess" },
          { title: "ML Playground", description: "Train models with different algorithms and hyperparameters. Run cross-validation and evaluate metrics.", page: "/playground" },
          { title: "Model Comparison", description: "Compare trained models side by side. View the leaderboard and select the best performer.", page: "/comparison" },
          { title: "Dashboard", description: "Review all experiments, recent activity, platform metrics, and AI recommendations.", page: "/dashboard" },
        ],
      },
      {
        type: "tip", text: "You don\u2019t have to follow the workflow linearly. Jump to any page at any time \u2014 the platform preserves your session and data across all views.",
      },
    ],
  },
  {
    id: "upload-module",
    title: "Upload Module",
    icon: "UploadCloud",
    description: "Uploading and validating datasets",
    content: [
      {
        type: "heading", level: 2, text: "Upload Module",
      },
      {
        type: "paragraph", text: "The Upload page is the entry point for all work on the platform. It handles file validation, column detection, and dataset preview.",
      },
      {
        type: "heading", level: 3, text: "Supported File Formats",
      },
      {
        type: "table", headers: ["Format", "Extension", "Status"], rows: [
          ["Comma-Separated Values", ".csv", "Supported"],
          ["JSON", ".json", "Planned"],
          ["Excel", ".xlsx", "Planned"],
          ["Parquet", ".parquet", "Planned"],
        ],
      },
      {
        type: "heading", level: 3, text: "Upload Limits",
      },
      {
        type: "table", headers: ["Limit", "Value"], rows: [
          ["Maximum File Size", "500 MB (configurable)"],
          ["Minimum Rows", "1"],
          ["Maximum Columns", "No hard limit"],
          ["Encoding", "UTF-8 recommended"],
        ],
      },
      {
        type: "heading", level: 3, text: "Dataset Validation",
      },
      {
        type: "paragraph", text: "Upon upload, the platform automatically validates the file:",
      },
      {
        type: "list", ordered: false, items: [
          "File extension is checked against supported types",
          "File size is validated against the configured maximum",
          "CSV is parsed to verify it has headers and data rows",
          "Column data types are detected (numerical, categorical, high-cardinality)",
          "Preview rows are extracted for immediate viewing",
        ],
      },
      {
        type: "heading", level: 3, text: "Target Column & Recommendation Mode",
      },
      {
        type: "paragraph", text: "After uploading, select the column you want to predict (the target) and choose between static and AI-powered recommendations. Static recommendations provide rule-based suggestions; AI recommendations use external providers for intelligent guidance.",
      },
    ],
  },
  {
    id: "data-insights",
    title: "Data Insights",
    icon: "BarChart2",
    description: "Exploratory data analysis",
    content: [
      {
        type: "heading", level: 2, text: "Data Insights",
      },
      {
        type: "paragraph", text: "The Data Insights page provides comprehensive visualizations to help you understand your dataset before training. Each visualization reveals different aspects of your data.",
      },
      {
        type: "cardGrid", columns: 2, cards: [
          { title: "Overview", description: "High-level statistics: row count, column count, data types, memory usage, and basic summary statistics." },
          { title: "Missing Values", description: "Visual matrix and bar chart showing missing value locations and counts per column. Helps identify columns needing imputation or removal." },
          { title: "Numerical Analysis", description: "Histograms, box plots, and distribution curves for each numerical column. Reveals skewness, outliers, and range." },
          { title: "Categorical Analysis", description: "Bar charts showing value frequencies for categorical columns. Identifies imbalanced categories and rare levels." },
          { title: "Correlation Matrix", description: "Heatmap of pairwise correlations between numerical features. Helps detect multicollinearity and feature relationships." },
          { title: "Feature Importance", description: "Bar chart of feature importance scores computed via a quick Random Forest model. Guides feature selection." },
          { title: "Relationship Analysis", description: "Scatter plots and pair plots showing relationships between selected features and the target variable." },
          { title: "Dataset Summary", description: "A downloadable report containing all EDA findings in a structured format for external use." },
        ],
      },
    ],
  },
  {
    id: "preprocessing",
    title: "Preprocessing",
    icon: "Wand2",
    description: "Data cleaning and transformation",
    content: [
      {
        type: "heading", level: 2, text: "Preprocessing",
      },
      {
        type: "paragraph", text: "The Preprocessing page lets you clean and transform your data before training. A well-preprocessed dataset significantly improves model performance.",
      },
      {
        type: "heading", level: 3, text: "Available Operations",
      },
      {
        type: "cardGrid", columns: 2, cards: [
          { title: "Missing Value Handling", description: "Options: drop rows with missing values, fill with mean/median/mode, or use forward/backward fill. Each column can have its own strategy." },
          { title: "Encoding", description: "Convert categorical text columns to numbers. Supports One-Hot Encoding, Label Encoding, and Target Encoding." },
          { title: "Scaling", description: "Standardize numerical features. Options: StandardScaler (z-score), MinMaxScaler (0\u20131 range), RobustScaler (median-based)." },
          { title: "Feature Transformation", description: "Apply mathematical transformations: log, square root, Box-Cox, or Yeo-Johnson to normalize skewed distributions." },
          { title: "Feature Selection", description: "Remove low-importance features based on variance threshold, correlation threshold, or importance scores from a quick model." },
          { title: "Imbalanced Data Handling", description: "Techniques for imbalanced classification: SMOTE oversampling, random undersampling, or class weight adjustment." },
        ],
      },
      {
        type: "heading", level: 3, text: "Pipeline Preview",
      },
      {
        type: "paragraph", text: "As you configure preprocessing steps, the platform builds a live pipeline preview showing the transformation order. You can reorder, enable, or disable steps before committing. The pipeline configuration is saved to your session.",
      },
    ],
  },
  {
    id: "ml-playground",
    title: "ML Playground",
    icon: "FlaskConical",
    description: "Model training and evaluation",
    content: [
      {
        type: "heading", level: 2, text: "ML Playground",
      },
      {
        type: "paragraph", text: "The ML Playground is where you train machine learning models. Select algorithms, configure hyperparameters, run cross-validation, and evaluate performance.",
      },
      {
        type: "heading", level: 3, text: "Supported Algorithms",
      },
      {
        type: "list", ordered: false, items: [
          "Classification: Logistic Regression, Decision Tree, Random Forest",
          "Regression: Linear Regression, Decision Tree Regressor, Random Forest Regressor",
        ],
      },
      {
        type: "heading", level: 3, text: "Training Workflow",
      },
      {
        type: "list", ordered: true, items: [
          "Select an algorithm from the available list",
          "Configure hyperparameters (max depth, number of estimators, etc.)",
          "Choose cross-validation folds (2\u201310)",
          "Run training with or without preprocessing",
          "View evaluation metrics and training time",
          "Save the experiment for later comparison",
        ],
      },
      {
        type: "heading", level: 3, text: "Metrics",
      },
      {
        type: "table", headers: ["Metric", "Classification", "Regression"], rows: [
          ["Accuracy", "Yes", "No"],
          ["Precision", "Yes", "No"],
          ["Recall", "Yes", "No"],
          ["F1 Score", "Yes", "No"],
          ["ROC-AUC", "Yes", "No"],
          ["R\u00b2 Score", "No", "Yes"],
          ["RMSE", "No", "Yes"],
          ["MAE", "No", "Yes"],
        ],
      },
    ],
  },
  {
    id: "model-comparison",
    title: "Model Comparison",
    icon: "GitCompare",
    description: "Comparing experiment results",
    content: [
      {
        type: "heading", level: 2, text: "Model Comparison",
      },
      {
        type: "paragraph", text: "The Model Comparison page lets you evaluate multiple experiments side by side to select the best performing model for your data.",
      },
      {
        type: "heading", level: 3, text: "Features",
      },
      {
        type: "list", ordered: false, items: [
          "Side-by-side metric comparison across all trained models",
          "Automated leaderboard ranking by primary metric",
          "Visual charts comparing accuracy, precision, recall, and F1",
          "Recommendation of the best model based on performance",
          "Export comparison results for reporting",
        ],
      },
      {
        type: "heading", level: 3, text: "How to Select the Best Model",
      },
      {
        type: "paragraph", text: "Consider the primary metric relevant to your problem. For balanced classification, F1 score is often the best choice. For imbalanced datasets, precision or recall may be more appropriate. For regression, use RMSE or R\u00b2 depending on whether absolute error magnitude matters.",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "LayoutDashboard",
    description: "Platform overview and activity",
    content: [
      {
        type: "heading", level: 2, text: "Dashboard",
      },
      {
        type: "paragraph", text: "The Dashboard provides a centralized view of all your work on the platform. It displays experiment summaries, recent activity, platform metrics, and AI recommendations.",
      },
      {
        type: "heading", level: 3, text: "Sections",
      },
      {
        type: "list", ordered: false, items: [
          "Experiment Summary: Overview of all trained models with their key metrics",
          "Recent Activity: Chronological log of actions performed on the platform",
          "Platform Metrics: Dataset counts, experiment counts, cache statistics",
          "AI Recommendations: Smart suggestions based on your current dataset and experiments",
          "Quick Actions: Shortcuts to common tasks like upload, train, or compare",
        ],
      },
    ],
  },
  {
    id: "ai-recommendations",
    title: "AI Recommendations",
    icon: "Zap",
    description: "AI-powered suggestions",
    content: [
      {
        type: "heading", level: 2, text: "AI Recommendation System",
      },
      {
        type: "paragraph", text: "The AI Recommendation System provides intelligent suggestions throughout the platform. It can recommend preprocessing steps, algorithms, hyperparameters, and next actions.",
      },
      {
        type: "heading", level: 3, text: "Modes",
      },
      {
        type: "cardGrid", columns: 2, cards: [
          { title: "Static Mode", description: "Rule-based recommendations generated from dataset characteristics. Always available, no external API needed." },
          { title: "AI Mode", description: "Powered by external AI providers (Gemini, OpenAI, Claude). Provides context-aware, natural language recommendations." },
        ],
      },
      {
        type: "heading", level: 3, text: "Caching",
      },
      {
        type: "paragraph", text: "AI responses are cached in memory to reduce latency and API costs. Cache entries expire after 1 hour (configurable). You can clear the AI cache from Settings > Cache Settings.",
      },
      {
        type: "heading", level: 3, text: "Supported Providers",
      },
      {
        type: "table", headers: ["Provider", "Status", "Configuration"], rows: [
          ["Gemini", "Supported", "GEMINI_API_KEY environment variable"],
          ["OpenAI", "Supported", "OPENAI_API_KEY environment variable"],
          ["Claude", "Supported", "CLAUDE_API_KEY environment variable"],
        ],
      },
      {
        type: "heading", level: 3, text: "Explainability",
      },
      {
        type: "paragraph", text: "Each recommendation includes an explanation of why it was made, providing transparency into the decision process. AI recommendations include the reasoning from the provider; static recommendations include the rule that triggered them.",
      },
    ],
  },
  {
    id: "supported-models",
    title: "Supported Models",
    icon: "Grid",
    description: "Available ML algorithms",
    content: [
      {
        type: "heading", level: 2, text: "Supported Models",
      },
      {
        type: "paragraph", text: "The platform supports six machine learning models covering classification and regression tasks. Each model includes configurable hyperparameters.",
      },
      {
        type: "modelCards",
      },
    ],
  },
  {
    id: "ml-concepts",
    title: "ML Concepts",
    icon: "Book",
    description: "Machine learning fundamentals",
    content: [
      {
        type: "heading", level: 2, text: "Machine Learning Concepts",
      },
      {
        type: "paragraph", text: "Understanding these fundamental concepts will help you make better decisions when training and evaluating models.",
      },
      {
        type: "accordion", items: [
          {
            title: "Classification",
            content: "A supervised learning task where the goal is to predict a discrete class label. Examples: spam detection (spam/not spam), disease diagnosis (positive/negative). Classification models output probabilities for each class, and the predicted class is the one with the highest probability.",
          },
          {
            title: "Regression",
            content: "A supervised learning task where the goal is to predict a continuous numeric value. Examples: house price prediction, temperature forecasting. Regression models minimize the difference between predicted and actual values using loss functions like MSE or MAE.",
          },
          {
            title: "Cross Validation",
            content: "A technique for evaluating model performance by splitting data into multiple folds, training on some folds and validating on others. K-Fold Cross Validation divides data into K equal parts, trains on K-1 folds, and validates on the remaining fold, repeating K times. This provides a more reliable performance estimate than a single train-test split.",
          },
          {
            title: "Precision",
            content: "Precision = True Positives / (True Positives + False Positives). It answers: Of all the positive predictions the model made, how many were correct? High precision means few false positives. Used when false positives are costly (e.g., spam filtering).",
          },
          {
            title: "Recall",
            content: "Recall = True Positives / (True Positives + False Negatives). It answers: Of all the actual positive cases, how many did the model find? High recall means few false negatives. Used when false negatives are costly (e.g., cancer detection).",
          },
          {
            title: "F1 Score",
            content: "F1 = 2 x (Precision x Recall) / (Precision + Recall). The harmonic mean of precision and recall. It provides a single metric that balances both concerns, especially useful for imbalanced datasets where accuracy can be misleading.",
          },
          {
            title: "ROC-AUC",
            content: "Receiver Operating Characteristic \u2014 Area Under the Curve. Measures the model\u2019s ability to distinguish between classes across all decision thresholds. AUC of 1.0 = perfect classifier, AUC of 0.5 = random guessing. Higher is better.",
          },
          {
            title: "RMSE",
            content: "Root Mean Squared Error = sqrt(mean((y_pred - y_actual)\u00b2)). It measures the average magnitude of prediction errors in the same units as the target variable. More sensitive to large errors than MAE because errors are squared before averaging.",
          },
          {
            title: "MAE",
            content: "Mean Absolute Error = mean(|y_pred - y_actual|). It measures the average absolute difference between predictions and actual values. Less sensitive to outliers than RMSE. Interpretable in the same units as the target.",
          },
          {
            title: "Feature Importance",
            content: "A score indicating how useful each feature is for predicting the target. Tree-based models calculate importance by measuring how much each feature reduces impurity across all splits. Features with higher importance contribute more to predictions.",
          },
          {
            title: "Overfitting",
            content: "When a model learns the training data too well, including noise and random fluctuations, but fails to generalize to new data. Signs: very high training accuracy but poor test accuracy. Solutions: reduce model complexity, increase training data, add regularization, use cross-validation.",
          },
          {
            title: "Underfitting",
            content: "When a model is too simple to capture the underlying patterns in the data. Signs: poor performance on both training and test data. Solutions: increase model complexity, add more features, reduce regularization, train for longer.",
          },
          {
            title: "Bias vs Variance",
            content: "Bias: Error from overly simplistic assumptions (underfitting). Variance: Error from sensitivity to training data fluctuations (overfitting). The bias-variance tradeoff means reducing one typically increases the other. The goal is to find the sweet spot that minimizes total error.",
          },
        ],
      },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: "Code",
    description: "Backend endpoint documentation",
    content: [
      {
        type: "heading", level: 2, text: "API Reference",
      },
      {
        type: "paragraph", text: "All backend endpoints are documented below. The API is served at the base URL configured in your environment (default: http://127.0.0.1:8000).",
      },
      {
        type: "apiTable",
      },
    ],
  },
  {
    id: "faqs",
    title: "FAQs",
    icon: "HelpCircle",
    description: "Frequently asked questions",
    content: [
      {
        type: "heading", level: 2, text: "Frequently Asked Questions",
      },
      {
        type: "paragraph", text: "Answers to common questions about using the Precision Engine platform.",
      },
      {
        type: "faqList",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: "AlertTriangle",
    description: "Common issues and solutions",
    content: [
      {
        type: "heading", level: 2, text: "Troubleshooting",
      },
      {
        type: "paragraph", text: "Guides for resolving common issues you may encounter while using the platform.",
      },
      {
        type: "troubleshootingList",
      },
    ],
  },
  {
    id: "deployment",
    title: "Deployment Guide",
    icon: "Server",
    description: "Production deployment instructions",
    content: [
      {
        type: "heading", level: 2, text: "Deployment Guide",
      },
      {
        type: "paragraph", text: "Instructions for deploying Precision Engine to a production environment.",
      },
      {
        type: "heading", level: 3, text: "Frontend",
      },
      {
        type: "paragraph", text: "The frontend is a Vite+React application. Build and serve with:",
      },
      {
        type: "code", language: "bash", content: "cd frontend\nnpm run build\nnpm run preview  # or serve dist/ with any static server",
      },
      {
        type: "heading", level: 3, text: "Backend",
      },
      {
        type: "paragraph", text: "The backend is a FastAPI application. Run with uvicorn:",
      },
      {
        type: "code", language: "bash", content: "cd backend\npip install -r requirements.txt\nuvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4",
      },
      {
        type: "heading", level: 3, text: "MongoDB",
      },
      {
        type: "paragraph", text: "MongoDB is required for dataset and session storage. Set MONGODB_URI in your .env file. For production, use MongoDB Atlas or a dedicated MongoDB instance.",
      },
      {
        type: "heading", level: 3, text: "Docker",
      },
      {
        type: "code", language: "bash", content: "# Build and run with Docker\n# Build the backend image\ndocker build -t precision-engine-backend -f backend/Dockerfile .\n\n# Run MongoDB\ndocker run -d --name mongodb -p 27017:27017 mongo:7\n\n# Run the backend\ndocker run -d --name backend --link mongodb -p 8000:8000 precision-engine-backend\n\n# Serve the frontend (built separately)\n# or use nginx to serve dist/ and proxy /api to the backend",
      },
      {
        type: "heading", level: 3, text: "Environment Variables",
      },
      {
        type: "table", headers: ["Variable", "Description", "Default"], rows: [
          ["MONGODB_URI", "MongoDB connection string", "mongodb://localhost:27017"],
          ["MONGODB_DB_NAME", "Database name", "automl"],
          ["SERVER_MODE", "production or development", "development"],
          ["SERVER_HOST", "Host to bind", "127.0.0.1"],
          ["SERVER_PORT", "Port to bind", "8000"],
          ["MAX_UPLOAD_SIZE_MB", "Max file upload size", "500"],
          ["DATASET_CACHE_TTL_SECONDS", "Cache TTL", "3600"],
          ["CLEANUP_ENABLED", "Enable cleanup features", "false"],
          ["GEMINI_API_KEY", "Google Gemini API key", ""],
          ["OPENAI_API_KEY", "OpenAI API key", ""],
          ["CLAUDE_API_KEY", "Anthropic Claude API key", ""],
        ],
      },
      {
        type: "heading", level: 3, text: "Health Endpoints",
      },
      {
        type: "paragraph", text: "Monitor the deployment:",
      },
      {
        type: "list", ordered: false, items: [
          "GET / \u2014 Root health check",
          "GET /health \u2014 Full service status",
          "GET /health/memory \u2014 Memory usage",
          "GET /health/storage \u2014 Storage stats",
          "GET /health/cache \u2014 Cache stats",
          "GET /metrics \u2014 Platform metrics",
        ],
      },
      {
        type: "heading", level: 3, text: "Storage & Monitoring",
      },
      {
        type: "paragraph", text: "Uploaded files are stored in the configured upload directory (default: uploads/). Use the Settings page to monitor disk usage, cache status, and MongoDB document counts. Configure cleanup settings to automatically remove orphaned files.",
      },
    ],
  },
  {
    id: "release-notes",
    title: "Release Notes",
    icon: "Package",
    description: "Version history",
    content: [
      {
        type: "heading", level: 2, text: "Release Notes",
      },
      {
        type: "paragraph", text: "Track changes and new features across platform versions.",
      },
      {
        type: "releaseItem", version: "1.0.0", date: "July 2026", changes: [
          "Initial release of Precision Engine",
          "Dataset upload with validation and column type detection",
          "Comprehensive EDA visualizations",
          "Preprocessing pipeline with 6 operation types",
          "ML Playground with 6 algorithms (3 classification, 3 regression)",
          "Model comparison with leaderboard ranking",
          "Dashboard with experiment summary and activity log",
          "AI recommendation system with static and AI modes",
          "Settings page with 11 configuration sections",
          "Session persistence across page reloads",
          "Documentation center with search",
        ],
      },
    ],
  },
];

export const SIDEBAR_SECTIONS = DOC_SECTIONS.map(({ id, title, icon }) => ({ id, title, icon }));
