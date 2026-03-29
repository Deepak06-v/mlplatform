from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

db = client["automl_db"]

dataset_collection = db["datasets"]