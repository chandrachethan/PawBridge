from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user
from config import FREE_DELIVERY_ABOVE, DELIVERY_FEE
from database import get_db

router = APIRouter(prefix="/api/cart", tags=["cart"])
MAX_QTY = 10


def delivery_for(subtotal: int) -> int:
    return 0 if subtotal == 0 or subtotal >= FREE_DELIVERY_ABOVE else DELIVERY_FEE


def cart_payload(user: models.User, db: Session) -> dict:
    rows = db.query(models.CartItem).filter_by(user_id=user.id).order_by(models.CartItem.id).all()
    items = [{"product_id": r.product_id, "name": r.product.name, "price": r.product.price,
              "image_url": r.product.image_url, "in_stock": r.product.in_stock,
              "quantity": r.quantity, "line_total": r.product.price * r.quantity} for r in rows]
    subtotal = sum(i["line_total"] for i in items)
    fee = delivery_for(subtotal)
    return {"items": items, "count": sum(i["quantity"] for i in items), "subtotal": subtotal,
            "delivery_fee": fee, "total": subtotal + fee,
            "free_delivery_above": FREE_DELIVERY_ABOVE}


@router.get("")
def get_cart(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return cart_payload(user, db)


@router.post("", status_code=201)
def add_to_cart(data: schemas.CartAddIn, user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    product = db.get(models.Product, data.product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    if not product.in_stock:
        raise HTTPException(400, "This product is out of stock")
    row = db.query(models.CartItem).filter_by(user_id=user.id, product_id=product.id).first()
    if row:
        row.quantity = min(MAX_QTY, row.quantity + data.quantity)
    else:
        db.add(models.CartItem(user_id=user.id, product_id=product.id, quantity=data.quantity))
    db.commit()
    return cart_payload(user, db)


@router.put("/{product_id}")
def set_quantity(product_id: int, data: schemas.CartSetIn, user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    row = db.query(models.CartItem).filter_by(user_id=user.id, product_id=product_id).first()
    if row:
        if data.quantity == 0:
            db.delete(row)
        else:
            row.quantity = data.quantity
        db.commit()
    return cart_payload(user, db)


@router.delete("/{product_id}")
def remove(product_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(models.CartItem).filter_by(user_id=user.id, product_id=product_id).first()
    if row:
        db.delete(row)
        db.commit()
    return cart_payload(user, db)
