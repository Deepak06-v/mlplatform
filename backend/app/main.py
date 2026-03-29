from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import dataset, eda

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(dataset.router, prefix="/dataset")
app.include_router(eda.router, prefix="/eda")


@app.get("/")
def root():
    return {"message": "AutoML Backend Running"}