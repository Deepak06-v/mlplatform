from datetime import datetime, timezone

from app.auth.schemas import SignupRequest
from app.auth.security import create_access_token, hash_password, verify_password
from app.utils.db import users_collection
from app.workspace.service import create_workspace as _create_workspace


def create_user(request: SignupRequest) -> dict:
    now = datetime.now(timezone.utc)
    user_doc = {
        "username": request.username,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "created_at": now,
        "updated_at": now,
        "last_login": None,
        "is_active": True,
        "subscription_plan": "free",
        "active_workspace_id": None,
    }
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    workspace = _create_workspace(user_id)
    users_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {"active_workspace_id": workspace["workspace_id"]}},
    )
    user_doc["_id"] = user_id
    user_doc["active_workspace_id"] = workspace["workspace_id"]
    return user_doc


def authenticate_user(email: str, password: str) -> dict | None:
    user = users_collection.find_one({"email": email.lower().strip()})
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def record_login(user_id) -> None:
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"last_login": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}},
    )


def login_user(email: str, password: str) -> dict | None:
    user = authenticate_user(email, password)
    if not user:
        return None
    record_login(user["_id"])
    token = create_access_token({"sub": str(user["_id"])})
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return {"access_token": token, "token_type": "bearer", "user": user}


def get_user_by_id(user_id: str) -> dict | None:
    from bson import ObjectId
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
    if not user:
        return None
    user["_id"] = str(user["_id"])
    return user


def is_email_taken(email: str) -> bool:
    return users_collection.find_one({"email": email.lower().strip()}) is not None


def is_username_taken(username: str) -> bool:
    return users_collection.find_one({"username": username}) is not None
