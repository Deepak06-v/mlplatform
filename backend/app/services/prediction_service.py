import pickle
import joblib
import numpy as np
import os
from app.schemas.input_schema import InputData
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

model = joblib.load(open(os.path.join(BASE_DIR, "models/model.pkl"), "rb"))

def predict_output(data: InputData):
    # .model_dump() converts the Pydantic v2 object into a standard Python dictionary
    # Wrapping it in [ ] ensures pandas creates one row with keys as column names
    input_df = pd.DataFrame([data.model_dump()])
    
    # Optional: Debugging step to ensure columns match your training data
    # print(f"Columns received: {input_df.columns.tolist()}")

    prediction = model.predict(input_df)

    return float(prediction[0])