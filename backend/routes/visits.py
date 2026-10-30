from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user, require_roles
from config import VISIT_SLOTS
from database import get_db
from notify import notify, display_name
from serializers import visit_out
from utils import today_iso

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.get("/slots")
def slots():
    return VISIT_SLOTS


@router.post("", status_code=201)
def request_visit(data: schemas.VisitIn, user: models.User = Depends(require_roles("user", "shelter")),
                  db: Session = Depends(get_db)):
    pet = db.get(models.Pet, data.pet_id)
    if not pet or pet.status != "Approved":
        raise HTTPException(404, "This pet is not available for visits")
    if pet.owner_id == user.id:
        raise HTTPException(400, "You cannot book a visit to your own pet")
    if data.time_slot not in VISIT_SLOTS:
        raise HTTPException(400, "Choose one of the listed time slots")
    if data.visit_date < today_iso():
        raise HTTPException(400, "Choose today or a future date")
    dup = db.query(models.Visit).filter_by(pet_id=pet.id, requester_id=user.id, visit_date=data.visit_date,
                                           time_slot=data.time_slot, status="Requested").first()
    if dup:
        raise HTTPException(400, "You already requested this slot")
    visit = models.Visit(pet_id=pet.id, requester_id=user.id, visit_date=data.visit_date,
                         time_slot=data.time_slot, note=data.note.strip())
    db.add(visit)
    db.flush()
    notify(db, pet.owner_id, "Visit request for %s" % pet.name,
           "%s wants to visit on %s at %s. Accept or reject the slot." %
           (display_name(user), data.visit_date, data.time_slot), "/dashboard/visits")
    db.commit()
    db.refresh(visit)
    return visit_out(visit)


@router.get("/mine")
def mine(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Visit).filter(models.Visit.requester_id == user.id).order_by(models.Visit.id.desc()).all()
    return [visit_out(v) for v in rows]


@router.get("/incoming")
def incoming(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(models.Visit).join(models.Pet).filter(models.Pet.owner_id == user.id)
            .order_by(models.Visit.id.desc()).all())
    return [visit_out(v) for v in rows]


@router.post("/{visit_id}/decision")
def decide(visit_id: int, data: schemas.VisitDecisionIn, user: models.User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    visit = db.get(models.Visit, visit_id)
    if not visit or visit.pet.owner_id != user.id:
        raise HTTPException(404, "Visit request not found")
    if visit.status != "Requested":
        raise HTTPException(400, "This visit has already been answered")
    accepted = data.action == "accept"
    visit.status = "Accepted" if accepted else "Rejected"
    visit.response_note = data.note.strip()
    notify(db, visit.requester_id,
           "Visit %s: %s" % ("accepted" if accepted else "rejected", visit.pet.name),
           "%s %s your slot on %s at %s.%s" % (
               display_name(user), "accepted" if accepted else "could not accept",
               visit.visit_date, visit.time_slot,
               (" Note: " + visit.response_note) if visit.response_note else ""),
           "/dashboard/visits")
    db.commit()
    return visit_out(visit)
