export const SUPPORT_FAQS = [
  {
    category: "Upload",
    items: [
      { question: "What file formats are supported?", answer: "Currently CSV (.csv) files are supported. JSON support is planned for a future release." },
      { question: "What is the maximum file size?", answer: "The default maximum upload size is 500 MB. This can be configured via the MAX_UPLOAD_SIZE_MB environment variable." },
      { question: "Why did my upload fail?", answer: "Common causes: file exceeds size limit, file is not a valid CSV, file is corrupted, or the upload directory is full. Check the file and try again." },
      { question: "Can I upload multiple files?", answer: "Currently the platform supports uploading one dataset at a time. Each upload creates a new dataset entry." },
    ],
  },
  {
    category: "Preprocessing",
    items: [
      { question: "Why is preprocessing required?", answer: "Raw data often contains missing values, categorical text, unscaled features, and outliers that degrade model performance. Preprocessing cleans and transforms the data for optimal results." },
      { question: "What encoding methods are available?", answer: "The platform supports One-Hot Encoding, Label Encoding, and Target Encoding for converting categorical variables to numeric format." },
      { question: "Should I scale my features?", answer: "Yes, if using algorithms sensitive to feature scales (Logistic Regression, Linear Regression, Neural Networks). Tree-based models (Random Forest, Decision Tree) do not require scaling." },
      { question: "How do I handle missing values?", answer: "Options: drop rows with missing values, fill with mean/median/mode, forward/backward fill, or use a custom value per column." },
    ],
  },
  {
    category: "Training",
    items: [
      { question: "Which algorithm should I choose?", answer: "Start with Random Forest for classification or Random Forest Regressor for regression. These provide strong baseline performance with minimal tuning." },
      { question: "How many CV folds should I use?", answer: "5 folds is recommended for most datasets. Use 10 for small datasets, 3 for very large datasets to balance speed and accuracy." },
      { question: "What is cross-validation?", answer: "Cross-validation splits data into K folds, trains on K-1 folds and validates on the remaining fold, repeating K times. This gives a reliable performance estimate." },
      { question: "Why is my model overfitting?", answer: "Overfitting occurs when the model learns noise in the training data. Reduce model complexity (max_depth, n_estimators), increase training data, or use cross-validation." },
    ],
  },
  {
    category: "AI",
    items: [
      { question: "How do I enable AI recommendations?", answer: "Go to Settings > AI Settings and enable AI mode. You must also configure an AI provider API key (Gemini, OpenAI, or Claude) in the .env file." },
      { question: "Why is AI unavailable?", answer: "AI requires a configured provider and enabled AI mode. Check Settings > AI Settings and verify the provider API key is set on the server." },
      { question: "Are AI recommendations cached?", answer: "Yes, AI responses are cached in memory for 1 hour (configurable). You can clear the cache from Settings > Cache Settings." },
      { question: "Can I use AI without an API key?", answer: "Yes, static recommendations are available without any API key. These provide rule-based suggestions based on dataset characteristics." },
    ],
  },
  {
    category: "Comparison",
    items: [
      { question: "How do I compare models?", answer: "Train at least two models in the ML Playground, then navigate to Model Comparison. The leaderboard automatically ranks models by performance." },
      { question: "What metrics are used for comparison?", answer: "Classification: accuracy, precision, recall, F1 score, ROC-AUC. Regression: R² score, RMSE, MAE." },
      { question: "Can I export comparison results?", answer: "Yes, the comparison page provides export options to save results as JSON." },
    ],
  },
  {
    category: "Deployment",
    items: [
      { question: "What are the system requirements?", answer: "Python 3.10+, Node.js 18+, MongoDB 7+, 4 GB RAM minimum, 10 GB storage for platform + datasets." },
      { question: "How do I configure environment variables?", answer: "Create a .env file in the backend directory. See the Deployment Guide in Documentation for all available variables." },
      { question: "Is Docker supported?", answer: "Yes, the platform can be deployed using Docker. See the Deployment Guide in Documentation for Docker instructions." },
    ],
  },
  {
    category: "Settings",
    items: [
      { question: "How do I reset my settings?", answer: "Navigate to Settings and click the Reset button in the header. This restores all settings to their defaults." },
      { question: "Are my settings saved?", answer: "Yes, settings are persisted to both localStorage (immediate) and MongoDB (server-side). Settings survive page refreshes and browser restarts." },
      { question: "Can I import/export settings?", answer: "Yes, use the Import/Export buttons in the Settings page header to transfer settings between installations." },
    ],
  },
];

export const TROUBLESHOOTING_GUIDES = [
  {
    id: "cannot-upload",
    title: "Cannot Upload Dataset",
    icon: "UploadCloud",
    symptoms: "File upload fails with an error message or progress bar hangs.",
    causes: [
      "File exceeds the maximum upload size (default 500 MB)",
      "File format is not CSV",
      "File is corrupted or empty",
      "MongoDB connection is down",
      "Upload directory is full or has incorrect permissions",
    ],
    solutions: [
      "Check file size and reduce if necessary (sample your data)",
      "Verify the file extension is .csv",
      "Open the CSV in a text editor to verify headers and data exist",
      "Check Settings > Monitoring for MongoDB health status",
      "Contact your administrator if the issue persists",
    ],
  },
  {
    id: "cannot-train",
    title: "Cannot Train Model",
    icon: "FlaskConical",
    symptoms: "Training returns an error or the train button is disabled.",
    causes: [
      "No dataset has been uploaded",
      "No target column has been selected",
      "Selected algorithm is incompatible with the problem type",
      "Dataset contains only one class or constant values",
      "Not enough samples for the selected cross-validation folds",
    ],
    solutions: [
      "Upload a dataset first (Upload page)",
      "Select a target column in Data Insights",
      "Choose a classification algorithm for categorical targets, regression for numeric",
      "Ensure the target column has at least 2 distinct values",
      "Reduce the number of CV folds or add more data",
    ],
  },
  {
    id: "mongodb-disconnected",
    title: "MongoDB Disconnected",
    icon: "Database",
    symptoms: "Monitoring shows MongoDB as disconnected. Datasets fail to load or save.",
    causes: [
      "MongoDB service is not running",
      "MONGODB_URI environment variable is incorrect",
      "Network firewall blocking the MongoDB port (default 27017)",
      "Authentication credentials are invalid",
      "MongoDB has reached its storage limit",
    ],
    solutions: [
      "Start MongoDB: sudo systemctl start mongod (Linux) or brew services start mongodb-community (macOS)",
      "Verify MONGODB_URI in backend/.env file",
      "Check that port 27017 is accessible from the server",
      "Reset MongoDB credentials if authentication fails",
      "Free up disk space or increase MongoDB storage allocation",
    ],
  },
  {
    id: "ai-unavailable",
    title: "AI Service Unavailable",
    icon: "Zap",
    symptoms: "AI recommendations show as unavailable, or return timeout errors.",
    causes: [
      "AI provider API key is not configured in environment variables",
      "AI mode is disabled in Settings",
      "AI provider service is down or rate-limited",
      "Network connectivity issues to the AI provider",
      "Dataset is too large for the AI provider's context window",
    ],
    solutions: [
      "Set the appropriate API key in backend/.env (GEMINI_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY)",
      "Enable AI mode in Settings > AI Settings",
      "Check the AI provider's status page for outages",
      "Switch to a different AI provider or use static recommendations",
      "Reduce the dataset size or use static mode for very large datasets",
    ],
  },
  {
    id: "session-missing",
    title: "Session Data Missing",
    icon: "RefreshCw",
    symptoms: "Workflow state resets unexpectedly, target column or preprocessing config is lost.",
    causes: [
      "Browser cookies/localStorage were cleared",
      "Session was cleared from Settings > Session Management",
      "Backend was restarted (in-memory session lost)",
      "Dataset was deleted or expired",
      "Cross-origin session sharing issue",
    ],
    solutions: [
      "Session data is now persisted to MongoDB — refresh the page to restore",
      "Check Settings > Session Management to verify the current session",
      "Re-upload the dataset if it was deleted",
      "Clear browser cache and reload the application",
      "Contact support if the issue persists across restarts",
    ],
  },
  {
    id: "cache-problems",
    title: "Cache Issues",
    icon: "Database",
    symptoms: "Seeing stale data, or cache clear buttons do not resolve issues.",
    causes: [
      "Frontend in-memory cache has stale entries",
      "Backend dataset cache not evicting old entries",
      "AI response cache returning outdated recommendations",
      "Browser caching stale API responses",
    ],
    solutions: [
      "Use the Clear buttons in Settings > Cache Settings to flush both dataset and AI caches",
      "Perform a hard browser refresh (Ctrl+Shift+R) to clear browser cache",
      "Restart the backend server to reset all in-memory caches",
      "Wait for cache TTL to expire (default 1 hour for AI, configurable for datasets)",
    ],
  },
];

export const CONTACT_INFO = {
  github: "https://github.com/Deepak06-v/mlplatform",
  documentation: "/documentation",
  developer: "Precision Engine Team",
  email: "deepakwali2006@gmail.com",
  linkedin: "https://linkedin.com/company/precisionengine",
  portfolio: "https://precisionengine.dev",
};

export const SEVERITY_OPTIONS = ["Critical", "High", "Medium", "Low"];
export const CATEGORY_OPTIONS = ["Bug", "Feature Request", "Documentation", "Performance", "Security", "Other"];
export const BUG_CATEGORIES = ["Upload", "Preprocessing", "Training", "AI", "Comparison", "Dashboard", "Settings", "Documentation", "Other"];
export const FEATURE_PRIORITIES = ["Critical", "High", "Medium", "Low"];
export const FEATURE_CATEGORIES = ["UI/UX", "Backend", "AI", "Performance", "Documentation", "Integration", "Other"];
