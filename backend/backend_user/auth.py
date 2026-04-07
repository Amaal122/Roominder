"""Authentication and user management endpoints."""

from datetime import datetime, timedelta
from typing import List, Optional

import bcrypt
import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, relationship

from ..backend_propertyowner.models import Property
from ..backend_propertyowner.schemas import PropertyOut
from ..config import settings
from ..db import Base, get_db
from .export_excel import export_seeker_profile_to_excel
from .models import User





class UserCreate(BaseModel):
	email: EmailStr
	password: str
	full_name: Optional[str] = None
	role:str


class UserLogin(BaseModel):
	email: EmailStr
	password: str
	role: Optional[str] = None
	totp_token: Optional[str] = None


class UserRead(BaseModel):
	id: int
	email: EmailStr
	full_name: Optional[str] = None
	role: Optional[str] = None
	is_active: bool
	created_at: datetime
	two_factor_enabled: bool = False

	model_config = {
		"from_attributes": True,
	}


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"
	role: Optional[str] = None


class LoginResponse(BaseModel):
	access_token: Optional[str] = None
	token_type: str = "bearer"
	role: Optional[str] = None
	requires_2fa: bool = False


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
	try:
		payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
		user_id_raw = payload.get("sub")
		user_id = int(user_id_raw) if user_id_raw is not None else None
		if user_id is None:
			raise HTTPException(status_code=401, detail="Invalid token")
	except JWTError:
		raise HTTPException(status_code=401, detail="Invalid token")

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=404, detail="User not found")
	return user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
auth_router = APIRouter(prefix="/auth", tags=["auth"])


# ADD THESE

def _ensure_password_len(password: str) -> None:
	# bcrypt only supports up to 72 bytes; reject longer inputs to avoid ValueError
	if len(password.encode("utf-8")) > 72:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Password too long; must be 72 bytes or fewer",
		)


def verify_password(plain_password: str, hashed_password: str) -> bool:
	_ensure_password_len(plain_password)
	return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
	_ensure_password_len(password)
	salt = bcrypt.gensalt()
	return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
	to_encode = data.copy()
	expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
	to_encode.update({"exp": expire})
	return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
	return db.query(User).filter(User.email == email).first()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
		user_id: str = payload.get("sub")
		if user_id is None:
			raise credentials_exception
	except JWTError:
		raise credentials_exception

	user = db.query(User).filter(User.id == int(user_id)).first()
	if user is None:
		raise credentials_exception
	return user


def get_current_user_optional(
	token: Optional[str] = Depends(oauth2_scheme_optional),
	db: Session = Depends(get_db),
) -> Optional[User]:
	"""Return User when a valid token is supplied; otherwise None without raising."""
	if not token:
		return None
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
		user_id: str = payload.get("sub")
		if user_id is None:
			raise credentials_exception
	except JWTError:
		raise credentials_exception

	user = db.query(User).filter(User.id == int(user_id)).first()
	if user is None:
		raise credentials_exception
	return user


async def get_current_user_ws(token: str, db: Session) -> User:
	"""Get current user for WebSocket auth."""
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
		user_id: str = payload.get("sub")
		if user_id is None:
			raise credentials_exception
	except JWTError:
		raise credentials_exception

	user = db.query(User).filter(User.id == int(user_id)).first()
	if user is None:
		raise credentials_exception
	return user


@auth_router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
	existing = get_user_by_email(db, payload.email)
	if existing:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

	# Enforce bcrypt length constraints early
	_ensure_password_len(payload.password)

	user = User(
		email=payload.email,
		hashed_password=get_password_hash(payload.password),
		full_name=payload.full_name,
		role=payload.role
	)
	db.add(user)
	try:
		db.commit()
	except IntegrityError:
		db.rollback()
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
	db.refresh(user)

	# Issue token after registration
	claims = {"sub": str(user.id)}
	if user.role:
		claims["role"] = user.role
	token = create_access_token(claims)
	return {"access_token": token, "token_type": "bearer", "role": user.role}


@auth_router.post("/login", response_model=LoginResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
	_ensure_password_len(payload.password)
	user = get_user_by_email(db, payload.email)
	if not user or not verify_password(payload.password, user.hashed_password):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

	# If caller passed a role and it doesn't match the stored role, guide them.
	if payload.role and user.role and payload.role != user.role:
		return JSONResponse(
			status_code=status.HTTP_400_BAD_REQUEST,
			content={
				"error": "Incorrect role for this account",
				"correct_role": user.role,
			},
		)

	# 2FA check: if enabled, require a valid TOTP token.
	if getattr(user, "two_factor_enabled", False):
		if not payload.totp_token:
			return {"requires_2fa": True, "role": user.role, "token_type": "bearer"}
		if not getattr(user, "two_factor_secret", None):
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is enabled but no secret is configured")
		totp = pyotp.TOTP(user.two_factor_secret)
		if not totp.verify(payload.totp_token, valid_window=1):
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")

	claims = {"sub": str(user.id)}
	if user.role:
		claims["role"] = user.role

	token = create_access_token(claims)
	return {"access_token": token, "token_type": "bearer", "role": user.role, "requires_2fa": False}


@auth_router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
	return current_user

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

seeker_router = APIRouter(prefix="/seeker", tags=["seeker"])

# ------------------ SQLAlchemy Model ------------------

class SeekerProfile(Base):
    __tablename__ = "seeker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    looking_for = Column(String, nullable=False)  # roommate / house / both

    # If house only
    location = Column(String, nullable=True)
    radius = Column(Integer, nullable=True)

    # Common
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    image_url = Column(String, nullable=True)

    # If roommate only
    sleep_schedule = Column(String, nullable=True)  # early/late stored as text
    cleanliness = Column(String, nullable=True)
    social_life = Column(String, nullable=True)
    guests = Column(String, nullable=True)
    work_style = Column(String, nullable=True)


    interests = Column(String, nullable=True)
    values = Column("values", String, nullable=True, quote=True)

    user = relationship("User", back_populates="seeker_profile")


User.seeker_profile = relationship(
    "SeekerProfile", back_populates="user", uselist=False
)

# ------------------ Pydantic Schemas ------------------

class SeekerProfileCreate(BaseModel):
	looking_for: Optional[str] = None  # roommate, house, both
	user_id: Optional[int] = None  # allow unauthenticated creation for now

	# House fields
	location: Optional[str] = None
	radius: Optional[int] = None

	# Common
	age: Optional[int] = None
	gender: Optional[str] = None
	occupation: Optional[str] = None
	image_url: Optional[str] = None

	# Roommate fields
	sleep_schedule: Optional[str] = None
	cleanliness: Optional[str] = None
	social_life: Optional[str] = None
	guests: Optional[str] = None
	work_style: Optional[str] = None

	# Free-text fields
	interests: Optional[str] = None
	values: Optional[str] = None


class SeekerProfileRead(SeekerProfileCreate):
	id: int
	user_id: Optional[int] = None

	model_config = {
		"from_attributes": True,
	}


# ------------------ ROUTES ------------------

@auth_router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_password_len(payload.new_password)

    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@seeker_router.post("/", response_model=SeekerProfileRead)
def create_seeker_profile(
	profile: SeekerProfileCreate,
	db: Session = Depends(get_db),
):
	# Completely open endpoint for now to unblock frontend; optionally ties to user_id if provided.
	# NOTE: seeker_profiles.user_id is unique, so this endpoint must be idempotent when user_id is present.
	payload = profile.dict(exclude={"user_id"}, exclude_none=True)

	# Only default looking_for on brand new profiles.
	if profile.user_id is not None:
		existing = (
			db.query(SeekerProfile)
			.filter(SeekerProfile.user_id == profile.user_id)
			.first()
		)
		if existing:
			# Update only provided (non-null) fields so we don't accidentally wipe stored values.
			for key, value in payload.items():
				setattr(existing, key, value)
			db.commit()
			db.refresh(existing)
			export_seeker_profile_to_excel(db, existing)
			return existing

	# Create a new profile
	create_payload = dict(payload)
	if not create_payload.get("looking_for"):
		create_payload["looking_for"] = "both"

	new_profile = SeekerProfile(user_id=profile.user_id, **create_payload)
	db.add(new_profile)
	try:
		db.commit()
	except IntegrityError:
		# If the same user submits twice (or race condition), fall back to updating the existing row.
		db.rollback()
		if profile.user_id is None:
			raise
		existing = (
			db.query(SeekerProfile)
			.filter(SeekerProfile.user_id == profile.user_id)
			.first()
		)
		if not existing:
			raise
		for key, value in create_payload.items():
			setattr(existing, key, value)
		db.commit()
		db.refresh(existing)
		export_seeker_profile_to_excel(db, existing)
		return existing

	db.refresh(new_profile)
	export_seeker_profile_to_excel(db, new_profile)
	return new_profile


@seeker_router.get("/me", response_model=SeekerProfileRead)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(SeekerProfile).filter(SeekerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@seeker_router.get("/recommended", response_model=List[PropertyOut])
def get_recommended_properties(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Returns properties filtered by seeker's profile preferences."""
    from backend.backend_user.auth import SeekerProfile as SP

    profile = db.query(SP).filter(SP.user_id == current_user.id).first()

    query = db.query(Property)

    if profile:
        # Filter by city if seeker has a location set
        if profile.location:
            query = query.filter(
                Property.city.ilike(f"%{profile.location}%")
            )

        # Filter by looking_for
        # "house" or "both" → show all available properties
        # "roommate" → still show properties (they need housing too)
        query = query.filter(Property.status == "available")

    properties = query.order_by(Property.created_at.desc()).all()
    return properties
# Keep a default export for backward compatibility if callers still import `router`.
router = auth_router
