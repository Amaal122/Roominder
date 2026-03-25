"""Authentication and user management endpoints."""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from pydantic import BaseModel, EmailStr
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..config import settings
from ..db import Base, engine, get_db
import bcrypt



class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String, nullable=True)
    role            = Column(String, nullable=True)  # add this
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)


class UserCreate(BaseModel):
	email: EmailStr
	password: str
	full_name: Optional[str] = None
	role:str


class UserLogin(BaseModel):
	email: EmailStr
	password: str
	role: Optional[str] = None


class UserRead(BaseModel):
	id: int
	email: EmailStr
	full_name: Optional[str] = None
	is_active: bool
	created_at: datetime

	model_config = {
		"from_attributes": True,
	}


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"
	role: Optional[str] = None



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
router = APIRouter(prefix="/auth", tags=["auth"])


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


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
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
	return user


@router.post("/login", response_model=Token)
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

	claims = {"sub": str(user.id)}
	if user.role:
		claims["role"] = user.role
	
	token = create_access_token(claims)
	return {"access_token": token, "token_type": "bearer", "role": user.role}


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
	return current_user