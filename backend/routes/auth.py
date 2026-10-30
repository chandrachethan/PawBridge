from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models, schemas
from auth import hash_password, verify_password, create_token, get_current_user
from database import get_db
from serializers import user_out

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    username = data.username.strip()
    email = data.email.lower()
    if data.account_type == "shelter" and not data.org_name.strip():
        raise HTTPException(400, "Enter your shelter or organisation name")
    taken = db.query(models.User).filter(or_(
        func.lower(models.User.username) == username.lower(),
        models.User.email == email)).first()
    if taken:
        raise HTTPException(400, "That username or email is already registered")
    user = models.User(username=username, email=email, password_hash=hash_password(data.password),
                       role=data.account_type,
                       org_name=data.org_name.strip() if data.account_type == "shelter" else "")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user.id), "user": user_out(user)}


@router.post("/login")
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    ident = data.username.strip().lower()
    user = db.query(models.User).filter(or_(
        func.lower(models.User.username) == ident, models.User.email == ident)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Incorrect username or password")
    return {"access_token": create_token(user.id), "user": user_out(user)}


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return user_out(user)
