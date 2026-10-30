from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user, require_roles
from database import get_db
from notify import notify, display_name, owner_kind
from serializers import request_out, message_out

router = APIRouter(prefix="/api/adoptions", tags=["adoptions"])


@router.post("", status_code=201)
def create_request(data: schemas.AdoptionIn,
                   user: models.User = Depends(require_roles("user", "shelter")),
                   db: Session = Depends(get_db)):
    pet = db.get(models.Pet, data.pet_id)
    if not pet or pet.status != "Approved":
        raise HTTPException(404, "This pet is not available for adoption")
    if pet.owner_id == user.id:
        raise HTTPException(400, "You cannot request to adopt your own listing")
    dup = db.query(models.AdoptionRequest).filter_by(
        pet_id=pet.id, requester_id=user.id, status="Pending").first()
    if dup:
        raise HTTPException(400, "You already have a pending request for this pet")
    req = models.AdoptionRequest(pet_id=pet.id, requester_id=user.id, message=data.message.strip())
    db.add(req)
    db.flush()
    # The request goes to whoever owns the listing: a shelter or an individual user.
    who = "your shelter" if pet.owner.role == "shelter" else "you"
    notify(db, pet.owner_id, "New adoption request for %s" % pet.name,
           "%s sent %s an adoption request for %s." % (display_name(user), who, pet.name),
           "/dashboard/incoming")
    db.commit()
    db.refresh(req)
    return request_out(req)


@router.get("/incoming")
def incoming(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(models.AdoptionRequest).join(models.Pet)
            .filter(models.Pet.owner_id == user.id)
            .order_by(models.AdoptionRequest.id.desc()).all())
    return [request_out(r) for r in rows]


@router.get("/mine")
def mine(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(models.AdoptionRequest).filter(models.AdoptionRequest.requester_id == user.id)
            .order_by(models.AdoptionRequest.id.desc()).all())
    return [request_out(r) for r in rows]


@router.post("/{request_id}/decision")
def decide(request_id: int, data: schemas.DecisionIn,
           user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.get(models.AdoptionRequest, request_id)
    if not req or req.pet.owner_id != user.id:
        raise HTTPException(404, "Request not found")
    if req.status != "Pending":
        raise HTTPException(400, "This request has already been decided")
    pet, note = req.pet, data.note.strip()
    if data.action == "approve":
        if pet.status != "Approved":
            raise HTTPException(400, "This listing is no longer available")
        req.status, req.response_note = "Approved", note
        pet.status, pet.adopted_by_id = "Adopted", req.requester_id
        notify(db, req.requester_id, "Adoption approved: %s" % pet.name,
               "%s approved your request. Use the chat to arrange the handover.%s"
               % (display_name(user), (" Note: " + note) if note else ""), "/dashboard/requests")
        others = db.query(models.AdoptionRequest).filter(
            models.AdoptionRequest.pet_id == pet.id, models.AdoptionRequest.id != req.id,
            models.AdoptionRequest.status == "Pending").all()
        for o in others:
            o.status, o.response_note = "Declined", "This pet was adopted by another applicant."
            notify(db, o.requester_id, "Adoption request closed: %s" % pet.name,
                   "%s has been adopted by another applicant." % pet.name, "/dashboard/requests")
    else:
        req.status, req.response_note = "Declined", note
        notify(db, req.requester_id, "Adoption declined: %s" % pet.name,
               "%s declined your request.%s" % (display_name(user), (" Reason: " + note) if note else ""),
               "/dashboard/requests")
    db.commit()
    return request_out(req)


def _participant_request(request_id, user, db):
    req = db.get(models.AdoptionRequest, request_id)
    if not req or user.id not in (req.requester_id, req.pet.owner_id):
        raise HTTPException(404, "Request not found")
    return req


@router.get("/{request_id}/messages")
def get_messages(request_id: int, user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    req = _participant_request(request_id, user, db)
    rows = db.query(models.Message).filter_by(request_id=req.id).order_by(models.Message.id).all()
    return {"request": request_out(req), "messages": [message_out(m) for m in rows]}


@router.post("/{request_id}/messages", status_code=201)
def send_message(request_id: int, data: schemas.MessageIn,
                 user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = _participant_request(request_id, user, db)
    msg = models.Message(request_id=req.id, sender_id=user.id, body=data.body.strip())
    db.add(msg)
    other = req.pet.owner_id if user.id == req.requester_id else req.requester_id
    link = "/dashboard/incoming" if other == req.pet.owner_id else "/dashboard/requests"
    notify(db, other, "New message about %s" % req.pet.name,
           "%s: %s" % (display_name(user), data.body.strip()[:120]), link)
    db.commit()
    db.refresh(msg)
    return message_out(msg)
