import mongoengine
from config import settings

def connect_db():
    mongoengine.connect(
        db=settings.MONGO_DB,
        host=settings.MONGO_URI
    )

def disconnect_db():
    mongoengine.disconnect()