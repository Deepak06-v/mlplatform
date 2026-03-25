from fastapi import APIRouter
from app.schemas.input_schema import InputData
from app.services.prediction_service import predict_output

router = APIRouter()

@router.get("/")
def home():
    return {"message": "API running"}

@router.post("/predict")
def predict(data: InputData):
    result = predict_output(data)
    return {"prediction": result}