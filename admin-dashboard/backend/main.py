import os
import random

import bcrypt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.20.32.1:3000",
        "http://192.168.56.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminSignupRequest(BaseModel):
    full_name: str
    email: str
    password: str

# -------------------------
# DB DEPENDENCY
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def ensure_default_admin() -> None:
    db = SessionLocal()
    try:
        existing_admin = db.query(models.Admin).first()
        if existing_admin:
            return

        admin = models.Admin(
            email=os.getenv("ADMIN_EMAIL", "admin@roominder.com").lower(),
            password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "admin")),
            full_name=os.getenv("ADMIN_NAME", "Roominder Admin"),
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()


ensure_default_admin()


@app.post("/admin/login")
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = (
        db.query(models.Admin)
        .filter(models.Admin.email == payload.email.strip().lower())
        .first()
    )

    if not admin or not admin.is_active or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin email or password")

    return {
        "message": "signed_in",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
            "role": admin.role,
        },
    }


@app.post("/admin/signup")
def admin_signup(payload: AdminSignupRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    full_name = payload.full_name.strip()

    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing_admin = db.query(models.Admin).filter(models.Admin.email == email).first()
    if existing_admin:
        raise HTTPException(status_code=409, detail="Admin email already exists")

    admin = models.Admin(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=full_name,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "signed_up",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
            "role": admin.role,
        },
    }

# -------------------------
# SCORING SYSTEM (REAL)
# -------------------------
def compute_risk(user):
    base = random.uniform(0, 1)

    # real logic example
    if "test" in user.email:
        base += 0.3

    display_name = user.full_name or user.email
    if len(display_name) < 3:
        base += 0.2

    return round(min(base, 1.0), 2)

# -------------------------
# STATS FROM DATABASE
# -------------------------
@app.get("/admin/stats")
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    flagged = (
        db.query(models.UserVerification)
        .filter(models.UserVerification.risk_level.in_(["high", "critical"]))
        .count()
    )

    return [
        {
            "label": "Total Users",
            "value": total_users,
            "meta": "live DB",
            "accent": "mint",
            "icon": "users",
        },
        {
            "label": "Flagged Users",
            "value": flagged,
            "meta": "risk > 0.6",
            "accent": "peach",
            "icon": "alert",
        },
    ]

# -------------------------
# MODERATION QUEUE (REAL DB)
# -------------------------
@app.get("/admin/moderation-queue")
def get_queue(db: Session = Depends(get_db)):
    verifications = db.query(models.UserVerification).all()

    rows = []
    for verification in verifications:
        user = db.get(models.User, verification.user_id)
        rows.append(
            {
                "item": str(verification.id),
                "owner": (user.full_name or user.email) if user else f"User {verification.user_id}",
                "type": "verification",
                "status": verification.verification_status or "pending",
            }
        )

    return rows


@app.get("/admin/activities")
def get_activities(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.created_at.desc()).limit(5).all()

    return [
        {
            "initials": "".join(part[:1] for part in ((user.full_name or user.email).split()[:2])).upper(),
            "title": "New user registered",
            "subtitle": user.full_name or user.email,
            "time": user.created_at.isoformat() if user.created_at else "recently",
        }
        for user in users
    ]

# -------------------------
# APPROVE / REJECT
# -------------------------
@app.post("/admin/moderation/{case_id}")
def update_case(case_id: int, status: str, db: Session = Depends(get_db)):

    case = db.query(models.UserVerification).filter(models.UserVerification.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.verification_status = status
    db.commit()

    return {"message": "updated", "case": case}

# -------------------------
# USER SCORE (REAL DB)
# -------------------------
@app.get("/admin/user/{user_id}/score")
def get_user_score(user_id: int, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    score = compute_risk(user)

    if score > 0.7:
        status = "flagged"
    elif score > 0.4:
        status = "review"
    else:
        status = "safe"

    db.commit()

    return {
        "user_id": user.id,
        "risk_score": score,
        "status": status
    }
