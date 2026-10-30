from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db
from serializers import notif_out

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(models.Notification).filter_by(user_id=user.id)
            .order_by(models.Notification.id.desc()).limit(100).all())
    return [notif_out(n) for n in rows]


@router.get("/unread-count")
def unread(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"count": db.query(models.Notification).filter_by(user_id=user.id, is_read=False).count()}


@router.post("/read-all")
def read_all(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.commit()
    return {"ok": True}


@router.post("/{notif_id}/read")
def read_one(notif_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(models.Notification, notif_id)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.commit()
    return {"ok": True}
