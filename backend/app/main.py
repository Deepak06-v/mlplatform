from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="ML Platform")

app.include_router(router)