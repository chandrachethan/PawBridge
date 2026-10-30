"""Fills an empty database with demo accounts, pets, clinics and products.
Images are LOCAL files in frontend/images (see frontend/images/README.txt)."""
import os
from sqlalchemy.orm import Session

import models
from auth import hash_password
from database import Base, engine, SessionLocal
from utils import parse_age_months, is_indie

DOG = ["/images/dog%d.jpg" % i for i in range(1, 8)]   # one photo per dog (7 dogs)
CAT = ["/images/cat%d.jpg" % i for i in range(1, 4)]
CLINIC_IMG = ["/images/clinic%d.jpg" % i for i in range(1, 4)]
PRODUCT_FILE = {   # one picture file per product
    "Soft Bristle Grooming Brush": "/images/brush.jpg", "Calm Coat Pet Shampoo": "/images/shampoo.jpg",
    "Everyday Padded Collar": "/images/collar1.jpg", "Classic Training Collar": "/images/collar2.jpg",
    "Comfy Grip Leash (1.5 m)": "/images/leash.jpg", "Stainless Steel Food Bowl": "/images/bowl1.jpg",
    "Slow-Feeder Bowl": "/images/bowl2.jpg", "Plush Comfort Toy": "/images/toy1.jpg",
    "Durable Fetch Ring": "/images/toy2.jpg", "Rope Tug Toy": "/images/toy3.jpg",
}
PRODUCT_IMG = {"Grooming": "/images/grooming.jpg", "Collars": "/images/collars.jpg",
               "Leashes": "/images/leashes.jpg", "Bowls": "/images/bowls.jpg", "Toys": "/images/toys.jpg"}

# owner, name, type, breed, age, sex, location, vaccination, temperament, care, health, bio, reason, status
PETS = [
    ("happytails", "Kaapi", "Dog", "Indie (Indian street dog)", "3 Years", "Female", "Mysuru Karnataka", "Fully vaccinated", "Gentle",
     "Daily walks, a shaded rest spot and gentle introductions to new people.",
     "Fully vaccinated and dewormed. Sterilised. No known conditions.",
     "Kaapi was found near a coffee stall and has been calm and affectionate ever since. She loves a quiet evening walk and leaning against your leg.",
     "Her rescuer is relocating and cannot take her along.", "Approved"),
    ("happytails", "Laddu", "Dog", "Indie (Indian street dog)", "6 Months", "Male", "Mumbai Maharashtra", "Partially vaccinated", "Playful",
     "Needs puppy training, regular play and a securely fenced or leashed outdoor routine.",
     "First two vaccinations done; booster due. Dewormed. Otherwise healthy.",
     "Round, bouncy and endlessly curious, Laddu turns every walk into an adventure. He is learning to sit and loves chasing leaves.",
     "Rescued as a puppy; the foster home is full.", "Approved"),
    ("happytails", "Moti", "Dog", "Indie", "5 Years", "Male", "Delhi", "Fully vaccinated", "Laid-back",
     "Moderate walks, a soft bed and a calm household.",
     "Fully vaccinated. Mild stiffness in cold weather, easily managed.",
     "Moti is the king of the sunny spot. He is happiest with a slow stroll and a family that enjoys a relaxed pace.",
     "Shelter intake: previous owner could no longer care for him.", "Approved"),
    ("happytails", "Rani", "Dog", "Indie", "1 Year", "Female", "Hyderabad Telangana", "Fully vaccinated", "Energetic",
     "Plenty of exercise, puzzle toys and consistent training.",
     "Fully vaccinated and sterilised. Very healthy.",
     "Rani is quick, clever and loves to learn. She needs an active family who will channel all that energy into games and long walks.",
     "Shelter intake: family moved to a flat that does not allow pets.", "Approved"),
    ("ravi", "Bruno", "Dog", "Indie", "4 Years", "Male", "Chennai Tamil Nadu", "Fully vaccinated", "Bouncy",
     "Daily exercise, space to run and portion-controlled meals.",
     "Fully vaccinated. Slightly overweight; vet-approved diet plan available.",
     "Bruno greets everyone like a long-lost friend. He is a fetch fanatic with a heart of gold.",
     "Owner is moving abroad.", "Approved"),
    ("ravi", "Simba", "Dog", "Indie", "2 Years", "Male", "Pune Maharashtra", "Fully vaccinated", "Cheerful",
     "Secure garden or leash walks (he follows his nose), scent games and company.",
     "Fully vaccinated and microchipped. No known conditions.",
     "Simba is a sunny, sniff-everything companion who tells stories with his tail.",
     "Family has a new baby and less time for his exercise needs.", "Approved"),
    ("meera", "Coco", "Cat", "Persian", "3 Years", "Female", "Bengaluru Karnataka", "Fully vaccinated", "Serene",
     "Daily brushing, indoor living and gentle handling.",
     "Fully vaccinated. Needs regular eye cleaning, a normal Persian trait.",
     "Coco is elegant, quiet and adores a lap. She will reward your daily brushing with soft purrs.",
     "Owner developed an allergy to long-haired coats.", "Approved"),
    ("happytails", "Mishti", "Cat", "Indie Desi Kitten", "4 Months", "Female", "Kolkata West Bengal", "Partially vaccinated", "Playful",
     "Kitten food, litter training support and lots of play.",
     "First vaccine given; second due. Dewormed.",
     "Mishti pounces on shoelaces, naps in laundry baskets and purrs the moment she is picked up.",
     "Found as a stray kitten; the shelter is looking for her forever home.", "Approved"),
    ("meera", "Pepper", "Cat", "Indie Indian Street Cat", "2 Years", "Male", "Jaipur Rajasthan", "Fully vaccinated", "Independent",
     "Space to explore, a window perch and patience while he warms up.",
     "Fully vaccinated and neutered. Healthy.",
     "Pepper does things on his own terms, but once he trusts you he follows you from room to room.",
     "His feeder is moving to a smaller place.", "Approved"),
    ("ravi", "Chotu", "Dog", "Indie (Indian street dog)", "8 Months", "Male", "Lucknow Uttar Pradesh", "Partially vaccinated", "Curious",
     "Training, regular walks and a securely closed gate.",
     "Two vaccinations done. Dewormed. Healthy.",
     "Chotu was adopted off the street by a student and is now looking for a family with more time.",
     "Owner's hostel does not allow pets.", "Pending Review"),
]

CLINICS = [
    ("Sunbeam Veterinary Clinic", "Koramangala Bengaluru", ["General consultation", "Vaccination", "Dental cleaning", "Grooming"],
     "Mon-Sat 9:00 AM - 8:00 PM", "+91 90000 00001"),
    ("Paws & Claws Animal Hospital", "Andheri West Mumbai", ["General consultation", "Surgery", "Diagnostics & lab", "Emergency care"],
     "Mon-Sun 8:00 AM - 10:00 PM", "+91 90000 00002"),
    ("Green Meadow Veterinary Care", "Indiranagar Bengaluru", ["General consultation", "Vaccination", "Grooming", "Nutrition counselling"],
     "Tue-Sun 10:00 AM - 7:00 PM", "+91 90000 00003"),
]

PRODUCTS = [
    ("Soft Bristle Grooming Brush", "Grooming", "Gentle bristles that lift loose fur and soothe sensitive skin.", 349, True),
    ("Calm Coat Pet Shampoo", "Grooming", "Mild, tear-free shampoo for a soft, fresh-smelling coat.", 299, True),
    ("Everyday Padded Collar", "Collars", "Soft padded collar with a quick-release buckle for daily wear.", 249, True),
    ("Classic Training Collar", "Collars", "Durable adjustable collar suited to basic training.", 199, True),
    ("Comfy Grip Leash (1.5 m)", "Leashes", "Cushioned handle and sturdy clip for comfortable walks.", 399, True),
    ("Stainless Steel Food Bowl", "Bowls", "Rust-resistant, easy to clean and non-slip.", 279, True),
    ("Slow-Feeder Bowl", "Bowls", "Ridged design that slows down fast eaters.", 459, True),
    ("Plush Comfort Toy", "Toys", "Soft cuddle toy for gentle play and naps.", 229, True),
    ("Durable Fetch Ring", "Toys", "Floating rubber ring built for fetch and chewing.", 199, True),
    ("Rope Tug Toy", "Toys", "Braided cotton rope for tug games and dental massage.", 179, False),
]


def _demo_password(env_name: str, local_default: str) -> str:
    """Use private credentials for seeded demo users on a public deployment."""
    value = os.getenv(env_name)
    if os.getenv("APP_ENV", "development").lower() == "production":
        if not value or len(value) < 12:
            raise RuntimeError(f"Set {env_name} to a private password of at least 12 characters.")
        return value
    return value or local_default


def seed(db: Session) -> None:
    if db.query(models.User).first():
        return

    for i, (n, loc, services, hours, phone) in enumerate(CLINICS):
        db.add(models.VetClinic(name=n, location=loc, services=services, hours=hours, phone=phone,
                                image_url=CLINIC_IMG[i]))
    db.flush()

    def user(username, role, password, org="", clinic=None):
        u = models.User(username=username, email=username + "@pawbridge.test",
                        password_hash=hash_password(password), role=role, org_name=org, clinic_id=clinic)
        db.add(u)
        return u

    users = {
        "moderator": user("moderator", "moderator", _demo_password("PAWBRIDGE_PASSWORD_MODERATOR", "moderator123")),
        "demo": user("demo", "user", _demo_password("PAWBRIDGE_PASSWORD_DEMO", "demo12345")),
        "ravi": user("ravi", "user", _demo_password("PAWBRIDGE_PASSWORD_RAVI", "ravi12345")),
        "meera": user("meera", "user", _demo_password("PAWBRIDGE_PASSWORD_MEERA", "meera12345")),
        "happytails": user("happytails", "shelter", _demo_password("PAWBRIDGE_PASSWORD_HAPPYTAILS", "shelter12345"), org="Happy Tails Shelter"),
        "sunbeam": user("sunbeam", "vet", _demo_password("PAWBRIDGE_PASSWORD_SUNBEAM", "vet12345"), clinic=1),
        "pawsclaws": user("pawsclaws", "vet", _demo_password("PAWBRIDGE_PASSWORD_PAWSCLAWS", "vet12345"), clinic=2),
        "greenmeadow": user("greenmeadow", "vet", _demo_password("PAWBRIDGE_PASSWORD_GREENMEADOW", "vet12345"), clinic=3),
        "store": user("store", "store", _demo_password("PAWBRIDGE_PASSWORD_STORE", "store12345")),
    }
    db.flush()

    dog_i = cat_i = 0
    for owner, name, kind, breed, age, sex, loc, vacc, temper, care, health, bio, reason, status in PETS:
        if kind == "Cat":
            photos = [CAT[cat_i % len(CAT)]]
            cat_i += 1
        else:
            photos = [DOG[dog_i % len(DOG)]]
            dog_i += 1
        db.add(models.Pet(owner_id=users[owner].id, name=name, animal_type=kind, breed=breed,
                          is_indie=is_indie(breed), age=age, age_months=parse_age_months(age), sex=sex,
                          location=loc, vaccination_status=vacc, temperament=temper,
                          care_requirements=care, health_details=health, bio=bio,
                          rehoming_reason=reason, photos=photos, status=status, is_demo=False))

    for name, cat, desc, price, stock in PRODUCTS:
        db.add(models.Product(name=name, category=cat, description=desc, price=price,
                              in_stock=stock, image_url=PRODUCT_FILE[name]))
    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed(session)
    print("Seed complete.")
