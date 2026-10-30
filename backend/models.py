"""All database tables."""
from datetime import datetime
from sqlalchemy import (Column, Integer, String, Text, Boolean, DateTime,
                        ForeignKey, JSON, UniqueConstraint)
from sqlalchemy.orm import relationship
from database import Base


def now():
    return datetime.utcnow()


class User(Base):
    """role: user | shelter | moderator | vet | store"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    org_name = Column(String(120), default="")                 # shelters
    clinic_id = Column(Integer, ForeignKey("vet_clinics.id"), nullable=True)  # vets
    created_at = Column(DateTime, default=now)


class Pet(Base):
    """status: Pending Review | Approved | Rejected | Adopted"""
    __tablename__ = "pets"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(80), nullable=False)
    animal_type = Column(String(30), default="Dog")
    breed = Column(String(120), default="")
    is_indie = Column(Boolean, default=False)
    age = Column(String(40), nullable=False)
    age_months = Column(Integer, nullable=True)
    sex = Column(String(20), default="Unknown")
    location = Column(String(120), nullable=False)
    vaccination_status = Column(String(40), default="Unknown")
    temperament = Column(String(80), nullable=False)
    care_requirements = Column(Text, default="")
    health_details = Column(Text, default="")
    bio = Column(Text, default="")
    rehoming_reason = Column(Text, default="")
    photos = Column(JSON, default=list)
    status = Column(String(20), default="Pending Review")
    is_demo = Column(Boolean, default=False)
    adopted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=now)

    owner = relationship("User", foreign_keys=[owner_id])


class AdoptionRequest(Base):
    """status: Pending | Approved | Declined"""
    __tablename__ = "adoption_requests"
    id = Column(Integer, primary_key=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, default="")
    status = Column(String(20), default="Pending")
    response_note = Column(Text, default="")
    created_at = Column(DateTime, default=now)

    pet = relationship("Pet")
    requester = relationship("User")


class Message(Base):
    """Chat between the adopter and the pet's owner, attached to a request."""
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    request_id = Column(Integer, ForeignKey("adoption_requests.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=now)

    sender = relationship("User")


class Visit(Base):
    """status: Requested | Accepted | Rejected"""
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    visit_date = Column(String(10), nullable=False)      # YYYY-MM-DD
    time_slot = Column(String(20), nullable=False)
    note = Column(Text, default="")
    status = Column(String(20), default="Requested")
    response_note = Column(Text, default="")
    created_at = Column(DateTime, default=now)

    pet = relationship("Pet")
    requester = relationship("User")


class VetClinic(Base):
    __tablename__ = "vet_clinics"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    location = Column(String(120), nullable=False)
    services = Column(JSON, default=list)
    hours = Column(String(120), default="")
    phone = Column(String(40), default="")
    image_url = Column(String(500), default="")


class VetAppointment(Base):
    """status: Requested | Confirmed | Declined"""
    __tablename__ = "vet_appointments"
    id = Column(Integer, primary_key=True)
    clinic_id = Column(Integer, ForeignKey("vet_clinics.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_name = Column(String(80), nullable=False)
    preferred_date = Column(String(10), nullable=False)
    preferred_time = Column(String(20), default="")
    reason = Column(Text, default="")
    status = Column(String(20), default="Requested")
    response_note = Column(Text, default="")
    created_at = Column(DateTime, default=now)

    clinic = relationship("VetClinic")
    user = relationship("User")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    category = Column(String(30), nullable=False)
    description = Column(Text, default="")
    price = Column(Integer, nullable=False)
    in_stock = Column(Boolean, default=True)
    image_url = Column(String(500), default="")


class SavedProduct(Base):
    __tablename__ = "saved_products"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    product = relationship("Product")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)

    product = relationship("Product")


class Order(Base):
    """status: Placed | Confirmed | Shipped | Delivered | Cancelled"""
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(80), nullable=False)
    pincode = Column(String(10), nullable=False)
    payment_method = Column(String(10), nullable=False)    # upi | card | cod
    payment_status = Column(String(40), nullable=False)
    payment_detail = Column(String(60), default="")        # UPI id or card last 4 only
    subtotal = Column(Integer, nullable=False)
    delivery_fee = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    status = Column(String(20), default="Placed")
    created_at = Column(DateTime, default=now)

    user = relationship("User")
    items = relationship("OrderItem", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(120), nullable=False)
    price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    image_url = Column(String(500), default="")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, default="")
    link = Column(String(200), default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
