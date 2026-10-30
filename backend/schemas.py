"""Request bodies (what the frontend sends)."""
import re
from typing import List, Optional
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    account_type: Literal["user", "shelter"] = "user"
    org_name: str = ""


class LoginIn(BaseModel):
    username: str
    password: str


class PetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    animal_type: str = "Dog"
    breed: str = ""
    age: str = Field(min_length=1, max_length=40)
    sex: str = "Unknown"
    location: str = Field(min_length=1, max_length=120)
    vaccination_status: str = "Unknown"
    temperament: str = Field(min_length=1, max_length=80)
    care_requirements: str = Field(min_length=1)
    health_details: str = Field(min_length=1)
    bio: str = Field(min_length=1)
    rehoming_reason: str = Field(min_length=1)
    photos: List[str] = Field(default_factory=list)
    consent: bool


class ModerateIn(BaseModel):
    action: Literal["approve", "reject"]


class AdoptionIn(BaseModel):
    pet_id: int
    message: str = ""


class DecisionIn(BaseModel):
    action: Literal["approve", "decline"]
    note: str = ""


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class VisitIn(BaseModel):
    pet_id: int
    visit_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time_slot: str
    note: str = ""


class VisitDecisionIn(BaseModel):
    action: Literal["accept", "reject"]
    note: str = ""


class AppointmentIn(BaseModel):
    clinic_id: int
    pet_name: str = Field(min_length=1, max_length=80)
    preferred_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    preferred_time: str = ""
    reason: str = ""


class AppointmentDecisionIn(BaseModel):
    action: Literal["confirm", "decline"]
    note: str = ""


class CartAddIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=10)


class CartSetIn(BaseModel):
    quantity: int = Field(ge=0, le=10)


class CheckoutIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str
    address: str = Field(min_length=5)
    city: str = Field(min_length=2)
    pincode: str
    payment_method: Literal["upi", "card", "cod"]
    upi_id: str = ""
    card_number: str = ""

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10:
            raise ValueError("Enter a valid 10-digit phone number")
        return digits

    @field_validator("pincode")
    @classmethod
    def _pin(cls, v):
        if not re.fullmatch(r"\d{6}", v.strip()):
            raise ValueError("Pincode must be 6 digits")
        return v.strip()


class OrderStatusIn(BaseModel):
    status: Literal["Confirmed", "Shipped", "Delivered", "Cancelled"]
