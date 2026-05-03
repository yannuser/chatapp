from fastapi import FastAPI
from core.database import connect_db, disconnect_db
from backend.routers import *


app = FastAPI()

@app.on_event("startup")
def startapp():
    connect_db()

@app.on_event("shutdown")
def shutdown():
    disconnect_db()

# app.include_router()