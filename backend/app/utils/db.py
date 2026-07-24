from pymongo import MongoClient
from app.config import Config

client = MongoClient(Config.MONGODB_URI)

db = client[Config.MONGODB_DB_NAME]

dataset_collection = db["datasets"]
dataset_sessions_collection = db["dataset_sessions"]
experiments_collection = db["experiments"]
comparisons_collection = db["comparisons"]
activities_collection = db["activities"]
ai_recommendations_collection = db["ai_recommendations"]
eda_results_collection = db["eda_results"]
feature_importance_collection = db["feature_importance"]
settings_collection = db["user_settings"]
users_collection = db["users"]
workspaces_collection = db["workspaces"]
