from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user, get_optional_user, require_roles
from database import get_db
from notify import notify, notify_role, display_name
from serializers import pet_out
from utils import parse_age_months, is_indie

router = APIRouter(prefix="/api/pets", tags=["pets"])
PUBLIC = ("Approved", "Adopted")


@router.get("")
def list_pets(q: str = "", animal_type: str = "", location: str = "", temperament: str = "",
              age_group: str = "", db: Session = Depends(get_db)):
    """Public catalogue: approved listings only (adopted pets are hidden)."""
    query = db.query(models.Pet).filter(models.Pet.status == "Approved")
    if q:
        like = "%" + q.strip() + "%"
        query = query.filter(or_(models.Pet.name.ilike(like), models.Pet.bio.ilike(like),
                                 models.Pet.breed.ilike(like), models.Pet.temperament.ilike(like),
                                 models.Pet.location.ilike(like)))
    if animal_type == "Indie":
        query = query.filter(models.Pet.is_indie.is_(True))
    elif animal_type:
        query = query.filter(models.Pet.animal_type == animal_type)
    if location:
        query = query.filter(models.Pet.location == location)
    if temperament:
        query = query.filter(models.Pet.temperament == temperament)
    if age_group == "under1":
        query = query.filter(models.Pet.age_months < 12)
    elif age_group == "1to3":
        query = query.filter(models.Pet.age_months >= 12, models.Pet.age_months <= 36)
    elif age_group == "over3":
        query = query.filter(models.Pet.age_months > 36)
    return [pet_out(p) for p in query.order_by(models.Pet.id).all()]


@router.get("/mine")
def my_pets(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Pet).filter(models.Pet.owner_id == user.id).order_by(models.Pet.id.desc()).all()
    return [pet_out(p) for p in rows]


@router.get("/moderation/pending")
def pending(_: models.User = Depends(require_roles("moderator")), db: Session = Depends(get_db)):
    rows = db.query(models.Pet).filter(models.Pet.status == "Pending Review").order_by(models.Pet.id).all()
    return [pet_out(p) for p in rows]


@router.get("/{pet_id}")
def pet_detail(pet_id: int, user=Depends(get_optional_user), db: Session = Depends(get_db)):
    pet = db.get(models.Pet, pet_id)
    if not pet:
        raise HTTPException(404, "Pet not found")
    if pet.status not in PUBLIC:
        if not (user and (user.id == pet.owner_id or user.role == "moderator")):
            raise HTTPException(404, "Pet not found")
    return pet_out(pet)


@router.post("", status_code=201)
def create_pet(data: schemas.PetCreate, user: models.User = Depends(require_roles("user", "shelter")),
               db: Session = Depends(get_db)):
    if not data.consent:
        raise HTTPException(400, "Please confirm you are authorised to rehome this pet")
    pet = models.Pet(
        owner_id=user.id, name=data.name.strip(), animal_type=data.animal_type,
        breed=data.breed.strip(), is_indie=is_indie(data.breed), age=data.age.strip(),
        age_months=parse_age_months(data.age), sex=data.sex, location=data.location.strip(),
        vaccination_status=data.vaccination_status, temperament=data.temperament.strip(),
        care_requirements=data.care_requirements, health_details=data.health_details,
        bio=data.bio, rehoming_reason=data.rehoming_reason, photos=data.photos[:4],
        status="Pending Review", is_demo=False)
    db.add(pet)
    db.flush()
    notify_role(db, "moderator", "New listing awaiting review",
                "%s listed %s for rehoming." % (display_name(user), pet.name), "/moderation")
    db.commit()
    db.refresh(pet)
    return pet_out(pet)


@router.post("/{pet_id}/moderate")
def moderate(pet_id: int, data: schemas.ModerateIn,
             _: models.User = Depends(require_roles("moderator")), db: Session = Depends(get_db)):
    pet = db.get(models.Pet, pet_id)
    if not pet:
        raise HTTPException(404, "Pet not found")
    approved = data.action == "approve"
    pet.status = "Approved" if approved else "Rejected"
    notify(db, pet.owner_id,
           "Your listing for %s was %s" % (pet.name, "approved" if approved else "rejected"),
           "It is now visible in the public catalogue." if approved else
           "A moderator did not approve this listing. You can submit a new one with more details.",
           "/dashboard/listings")
    db.commit()
    return pet_out(pet)
