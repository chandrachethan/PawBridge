import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user, require_roles
from database import get_db
from notify import notify, notify_role, display_name
from routes.cart import delivery_for
from serializers import order_out

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", status_code=201)
def checkout(data: schemas.CheckoutIn, user: models.User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    """Simulated checkout. No real payment is taken and card numbers are NOT stored."""
    rows = db.query(models.CartItem).filter_by(user_id=user.id).all()
    if not rows:
        raise HTTPException(400, "Your cart is empty")
    for r in rows:
        if not r.product.in_stock:
            raise HTTPException(400, "%s is out of stock. Remove it from your cart." % r.product.name)

    detail, status = "", "Pay on delivery"
    if data.payment_method == "upi":
        if not re.fullmatch(r"[\w.\-]{2,}@[\w]{2,}", data.upi_id.strip()):
            raise HTTPException(400, "Enter a valid UPI ID such as name@bank")
        detail, status = data.upi_id.strip(), "Paid"
    elif data.payment_method == "card":
        digits = re.sub(r"\D", "", data.card_number)
        if not 13 <= len(digits) <= 19:
            raise HTTPException(400, "Enter a valid card number")
        detail, status = "Card ending " + digits[-4:], "Paid"

    subtotal = sum(r.product.price * r.quantity for r in rows)
    fee = delivery_for(subtotal)
    order = models.Order(user_id=user.id, full_name=data.full_name.strip(), phone=data.phone,
                         address=data.address.strip(), city=data.city.strip(), pincode=data.pincode,
                         payment_method=data.payment_method, payment_status=status,
                         payment_detail=detail, subtotal=subtotal, delivery_fee=fee,
                         total=subtotal + fee, status="Placed")
    for r in rows:
        order.items.append(models.OrderItem(product_id=r.product_id, name=r.product.name,
                                            price=r.product.price, quantity=r.quantity,
                                            image_url=r.product.image_url))
        db.delete(r)
    db.add(order)
    db.flush()
    notify_role(db, "store", "New order #%d" % order.id,
                "%s ordered %d item(s), total Rs %d (%s)." % (
                    display_name(user), sum(i.quantity for i in order.items), order.total, status),
                "/dashboard/store-orders")
    notify(db, user.id, "Order #%d placed" % order.id,
           "Total Rs %d. The store will confirm it shortly." % order.total, "/dashboard/orders")
    db.commit()
    db.refresh(order)
    return order_out(order)


@router.get("/mine")
def my_orders(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Order).filter_by(user_id=user.id).order_by(models.Order.id.desc()).all()
    return [order_out(o) for o in rows]


@router.get("/incoming")
def store_orders(_: models.User = Depends(require_roles("store")), db: Session = Depends(get_db)):
    return [order_out(o) for o in db.query(models.Order).order_by(models.Order.id.desc()).all()]


@router.post("/{order_id}/status")
def update_status(order_id: int, data: schemas.OrderStatusIn,
                  _: models.User = Depends(require_roles("store")), db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status in ("Delivered", "Cancelled"):
        raise HTTPException(400, "This order is already closed")
    order.status = data.status
    if data.status == "Delivered" and order.payment_method == "cod":
        order.payment_status = "Paid (cash received)"
    notify(db, order.user_id, "Order #%d: %s" % (order.id, data.status),
           "The store updated your order status to %s." % data.status, "/dashboard/orders")
    db.commit()
    return order_out(order)
