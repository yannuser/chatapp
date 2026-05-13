from fastapi import FastAPI
from core.database import connect_db, disconnect_db
from routers import user, conversation, direct_message, group, group_message


app = FastAPI()


@app.on_event("startup")
def startapp():
    connect_db()


@app.on_event("shutdown")
def shutdown():
    disconnect_db()


app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(conversation.router, prefix="/conversations", tags=["conversations"])
app.include_router(direct_message.router, prefix="/direct-messages", tags=["direct_messages"])
app.include_router(group.router, prefix="/groups", tags=["groups"])
app.include_router(group_message.router, prefix="/group-messages", tags=["group_messages"])