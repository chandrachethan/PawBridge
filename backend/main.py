"""PawBridge API + website.  Run from this folder:  uvicorn main:app --reload
Then open http://localhost:8000"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

import models  # noqa: F401  (registers the tables)
from config import FRONTEND_DIR, UPLOAD_DIR
from database import Base, engine, SessionLocal
from routes import auth, pets, adoptions, visits, vets, products, cart, orders, notifications, admin, uploads
from seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="PawBridge", lifespan=lifespan)

for module in (auth, pets, adoptions, visits, vets, products, cart, orders, notifications, admin, uploads):
    app.include_router(module.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Uploaded pet photos are stored on the persistent volume in production.
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# The website itself (index.html, css/ and images/) is served from "/".
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
