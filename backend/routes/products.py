from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from auth import get_current_user, get_optional_user
from database import get_db
from serializers import product_out

router = APIRouter(prefix="/api/products", tags=["products"])


def saved_ids(user: Optional[models.User], db: Session) -> set:
    if not user:
        return set()
    return {r[0] for r in db.query(models.SavedProduct.product_id).filter_by(user_id=user.id).all()}


@router.get("")
def list_products(category: str = "", user=Depends(get_optional_user), db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    saved = saved_ids(user, db)
    return [product_out(p, p.id in saved) for p in query.order_by(models.Product.id).all()]


@router.get("/saved")
def saved_products(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.SavedProduct).filter_by(user_id=user.id).order_by(models.SavedProduct.id.desc()).all()
    return [product_out(r.product, True) for r in rows]


@router.get("/{product_id}")
def product_detail(product_id: int, user=Depends(get_optional_user), db: Session = Depends(get_db)):
    p = db.get(models.Product, product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    return product_out(p, p.id in saved_ids(user, db))


@router.post("/{product_id}/save")
def save(product_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(models.Product, product_id):
        raise HTTPException(404, "Product not found")
    if not db.query(models.SavedProduct).filter_by(user_id=user.id, product_id=product_id).first():
        db.add(models.SavedProduct(user_id=user.id, product_id=product_id))
        db.commit()
    return {"saved": True}


@router.delete("/{product_id}/save")
def unsave(product_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(models.SavedProduct).filter_by(user_id=user.id, product_id=product_id).first()
    if row:
        db.delete(row)
        db.commit()
    return {"saved": False}
