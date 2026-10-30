from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user, require_roles
from database import get_db
from notify import notify, notify_role, display_name
from serializers import clinic_out, appt_out
from utils import today_iso

router = APIRouter(prefix="/api/vets", tags=["vets"])


@router.get("")
def list_clinics(db: Session = Depends(get_db)):
    return [clinic_out(c) for c in db.query(models.VetClinic).order_by(models.VetClinic.id).all()]


@router.get("/appointments/mine")
def my_appointments(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(models.VetAppointment).filter(models.VetAppointment.user_id == user.id)
            .order_by(models.VetAppointment.id.desc()).all())
    return [appt_out(a) for a in rows]


@router.get("/appointments/incoming")
def incoming(user: models.User = Depends(require_roles("vet")), db: Session = Depends(get_db)):
    rows = (db.query(models.VetAppointment).filter(models.VetAppointment.clinic_id == user.clinic_id)
            .order_by(models.VetAppointment.id.desc()).all())
    return [appt_out(a) for a in rows]


@router.post("/appointments", status_code=201)
def request_appointment(data: schemas.AppointmentIn,
                        user: models.User = Depends(require_roles("user", "shelter")),
                        db: Session = Depends(get_db)):
    clinic = db.get(models.VetClinic, data.clinic_id)
    if not clinic:
        raise HTTPException(404, "Clinic not found")
    if data.preferred_date < today_iso():
        raise HTTPException(400, "Choose today or a future date")
    appt = models.VetAppointment(clinic_id=clinic.id, user_id=user.id, pet_name=data.pet_name.strip(),
                                 preferred_date=data.preferred_date, preferred_time=data.preferred_time,
                                 reason=data.reason.strip())
    db.add(appt)
    db.flush()
    notify_role(db, "vet", "New appointment request",
                "%s requested %s for %s on %s %s." % (display_name(user), "an appointment",
                                                       appt.pet_name, appt.preferred_date, appt.preferred_time),
                "/dashboard/vet-appointments", clinic_id=clinic.id)
    db.commit()
    db.refresh(appt)
    return appt_out(appt)


@router.post("/appointments/{appt_id}/decision")
def decide(appt_id: int, data: schemas.AppointmentDecisionIn,
           user: models.User = Depends(require_roles("vet")), db: Session = Depends(get_db)):
    appt = db.get(models.VetAppointment, appt_id)
    if not appt or appt.clinic_id != user.clinic_id:
        raise HTTPException(404, "Appointment not found")
    if appt.status != "Requested":
        raise HTTPException(400, "This request has already been answered")
    confirmed = data.action == "confirm"
    appt.status = "Confirmed" if confirmed else "Declined"
    appt.response_note = data.note.strip()
    notify(db, appt.user_id, "Appointment %s" % appt.status.lower(),
           "%s %s the appointment for %s on %s.%s" % (
               appt.clinic.name, "confirmed" if confirmed else "could not confirm",
               appt.pet_name, appt.preferred_date,
               (" Note: " + appt.response_note) if appt.response_note else ""),
           "/dashboard/appointments")
    db.commit()
    return appt_out(appt)
