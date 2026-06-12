import mongoengine
from pymongo import MongoClient
from .config import settings


def connect_db():
    try:
        mongoengine.connect(
            db=settings.MONGO_DB,
            host=settings.MONGO_URI,
            alias="default",
            serverSelectionTimeoutMS=5000
        )
        client = mongoengine.get_connection("default")
        client.admin.command('ping')
        print("SUCCESSFULLY CONNECTED TO MONGO")
    except Exception as e:
        print(f"FAILED TO CONNECT TO MONGO: {e}")


def disconnect_db():
    mongoengine.disconnect(alias="default")