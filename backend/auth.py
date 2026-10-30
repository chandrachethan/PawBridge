"""Password hashing, JWT tokens and role checks."""
import hashlib
import hmac
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

import models
from config import SECRET_KEY, TOKEN_MINUTES
from database import get_db

ALGORITHM = "HS256"
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return salt.hex() + "$" + digest.hex()


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, hash_hex = stored.split("$")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
    except ValueError:
        return False
    return hmac.compare_digest(digest.hex(), hash_hex)


def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(minutes=TOKEN_MINUTES)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _user_from(creds: Optional[HTTPAuthorizationCredentials], db: Session):
    if not creds:
        return None
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return db.get(models.User, int(payload.get("sub")))
    except (JWTError, TypeError, ValueError):
        return None


def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
                     db: Session = Depends(get_db)) -> models.User:
    user = _user_from(creds, db)
    if not user:
        raise HTTPException(401, "Please sign in to continue")
    return user


def get_optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
                      db: Session = Depends(get_db)):
    return _user_from(creds, db)


def require_roles(*roles):
    def dependency(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in roles:
            raise HTTPException(403, "Your account type cannot do this")
        return user
    return dependency
