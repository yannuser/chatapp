import mongoengine
from .config import settings


def connect_db():
    mongoengine.connect(
        db=settings.MONGO_DB,
        host=settings.MONGO_URI,
        alias="default"
    )
    print("CONNECTED TO MONGO")
    print(settings.MONGO_URI)
    print(settings.MONGO_DB)


def disconnect_db():
    mongoengine.disconnect()