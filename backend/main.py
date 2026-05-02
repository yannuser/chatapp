from fastapi import FastAPI
from mongoengine import connect
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

connect(
    db="chatapp",
    host=os.getenv("DATABASE_URL")
)