"""Turn database rows into JSON-friendly dicts for the frontend."""
from notify import display_name, owner_kind


def iso(dt):
    return dt.isoformat() if dt else None


def user_out(u):
    return {"id": u.id, "username": u.username, "email": u.email, "role": u.role,
            "org_name": u.org_name or "", "clinic_id": u.clinic_id,
            "display_name": display_name(u)}


def pet_out(p):
    return {
        "id": p.id, "name": p.name, "animal_type": p.animal_type, "breed": p.breed,
        "is_indie": p.is_indie, "age": p.age, "age_months": p.age_months, "sex": p.sex,
        "location": p.location, "vaccination_status": p.vaccination_status,
        "temperament": p.temperament, "care_requirements": p.care_requirements,
        "health_details": p.health_details, "bio": p.bio, "rehoming_reason": p.rehoming_reason,
        "photos": p.photos or [], "status": p.status, "is_demo": p.is_demo,
        "owner_id": p.owner_id, "owner_name": display_name(p.owner),
        "owner_kind": owner_kind(p.owner), "created_at": iso(p.created_at),
    }


def clinic_out(c):
    return {"id": c.id, "name": c.name, "location": c.location, "services": c.services or [],
            "hours": c.hours, "phone": c.phone, "image_url": c.image_url}


def product_out(p, saved=False):
    return {"id": p.id, "name": p.name, "category": p.category, "description": p.description,
            "price": p.price, "in_stock": p.in_stock, "image_url": p.image_url, "saved": saved}


def request_out(r):
    photos = r.pet.photos or []
    return {
        "id": r.id, "pet_id": r.pet_id, "pet_name": r.pet.name,
        "pet_photo": photos[0] if photos else None,
        "requester_id": r.requester_id, "requester_name": display_name(r.requester),
        "owner_id": r.pet.owner_id, "owner_name": display_name(r.pet.owner),
        "owner_kind": owner_kind(r.pet.owner), "message": r.message, "status": r.status,
        "response_note": r.response_note, "created_at": iso(r.created_at),
    }


def message_out(m):
    return {"id": m.id, "sender_id": m.sender_id, "sender_name": display_name(m.sender),
            "body": m.body, "created_at": iso(m.created_at)}


def visit_out(v):
    photos = v.pet.photos or []
    return {
        "id": v.id, "pet_id": v.pet_id, "pet_name": v.pet.name,
        "pet_photo": photos[0] if photos else None, "location": v.pet.location,
        "requester_id": v.requester_id, "requester_name": display_name(v.requester),
        "owner_name": display_name(v.pet.owner), "owner_kind": owner_kind(v.pet.owner),
        "visit_date": v.visit_date, "time_slot": v.time_slot, "note": v.note,
        "status": v.status, "response_note": v.response_note,
    }


def appt_out(a):
    return {
        "id": a.id, "clinic_id": a.clinic_id, "clinic_name": a.clinic.name,
        "clinic_location": a.clinic.location, "user_id": a.user_id,
        "user_name": display_name(a.user), "pet_name": a.pet_name,
        "preferred_date": a.preferred_date, "preferred_time": a.preferred_time,
        "reason": a.reason, "status": a.status, "response_note": a.response_note,
    }


def order_out(o):
    return {
        "id": o.id, "username": display_name(o.user), "full_name": o.full_name,
        "phone": o.phone, "address": o.address, "city": o.city, "pincode": o.pincode,
        "payment_method": o.payment_method, "payment_status": o.payment_status,
        "payment_detail": o.payment_detail, "subtotal": o.subtotal,
        "delivery_fee": o.delivery_fee, "total": o.total, "status": o.status,
        "created_at": iso(o.created_at),
        "items": [{"name": i.name, "price": i.price, "quantity": i.quantity,
                   "image_url": i.image_url} for i in o.items],
    }


def notif_out(n):
    return {"id": n.id, "title": n.title, "body": n.body, "link": n.link,
            "is_read": n.is_read, "created_at": iso(n.created_at)}
