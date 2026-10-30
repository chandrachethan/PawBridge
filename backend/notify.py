"""Helpers that create in-app notifications for another account."""
import models


def display_name(user) -> str:
    if user.role == "shelter" and user.org_name:
        return user.org_name
    return user.username


def owner_kind(user) -> str:
    return "Shelter" if user.role == "shelter" else "Individual owner"


def notify(db, user_id: int, title: str, body: str = "", link: str = "") -> None:
    db.add(models.Notification(user_id=user_id, title=title, body=body, link=link))


def notify_role(db, role: str, title: str, body: str = "", link: str = "", clinic_id=None) -> None:
    query = db.query(models.User).filter(models.User.role == role)
    if clinic_id is not None:
        query = query.filter(models.User.clinic_id == clinic_id)
    for u in query.all():
        notify(db, u.id, title, body, link)
