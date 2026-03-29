from fastapi import FastAPI
from app.routes import dataset
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (dev only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(dataset.router, prefix="/dataset")

@app.get("/")
def root():
    return {"message": "AutoML Backend Running"}