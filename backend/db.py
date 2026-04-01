"""Database session and base declarations."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _is_sqlite(url: str) -> bool:
	return url.startswith("sqlite:")


database_url = settings.sqlalchemy_database_url

engine = create_engine(
	database_url,
	pool_pre_ping=True,
	pool_recycle=300,
	pool_use_lifo=True,
	connect_args={"check_same_thread": False} if _is_sqlite(database_url) else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
	"""Provide a session per request."""

	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()
