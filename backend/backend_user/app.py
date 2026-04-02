"""Entry point for the Roominder FastAPI application."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles

from ..db import Base, engine
from .auth import router as auth_router, seeker_router
from .dashbord import router as dashboard_router
from .notifications import router as notifications_router
from .users import router as users_router

from ..backend_propertyowner.routes.applications import router as applications_router
from ..backend_propertyowner.routes.messages import router as messages_router
from ..backend_propertyowner.routes.properties import router as properties_router
from ..backend_propertyowner.routes.visits import router as visits_router
from ..config import settings


# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Roominder API")

# Serve static files for property images
static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:8081",   # Expo web dev server
		"http://127.0.0.1:8081",   # Expo web dev server (IP)
		"http://localhost:19006",  # Expo go
		"http://127.0.0.1:19006",  # Expo go (IP)
		"http://localhost:3000",   # fallback dev port
		"http://127.0.0.1:3000",   # fallback dev port (IP)
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# ── Enregistrement des routes ──────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(seeker_router)
app.include_router(dashboard_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(properties_router)
app.include_router(applications_router)
app.include_router(messages_router)
app.include_router(visits_router)

# ──────────────────────────────────────────────────────────────────────────────


@app.on_event("startup")
def _create_tables_on_startup() -> None:
	"""Create tables when the app starts, not during import."""
	Base.metadata.create_all(bind=engine, checkfirst=True)
	# Quick, in-place migrations for dev: align DB column types with current models.
	with engine.connect() as conn:
		conn.execute(text(
			"""
			ALTER TABLE IF EXISTS seeker_profiles
			ALTER COLUMN sleep_schedule TYPE VARCHAR USING sleep_schedule::VARCHAR,
			ALTER COLUMN cleanliness TYPE VARCHAR USING cleanliness::VARCHAR,
			ALTER COLUMN social_life TYPE VARCHAR USING social_life::VARCHAR,
			ALTER COLUMN guests TYPE VARCHAR USING guests::VARCHAR,
			ALTER COLUMN work_style TYPE VARCHAR USING work_style::VARCHAR,
			ALTER COLUMN looking_for TYPE VARCHAR USING looking_for::VARCHAR;
			"""
		))
		conn.commit()


@app.get("/health")
def health_check():
	try:
		with engine.connect() as conn:
			conn.execute(text("SELECT 1"))
		db_status = "ok"
	except Exception:
		db_status = "unreachable"

	return {
		"status": "ok",
		"database": db_status
	}


@app.get("/test-db")
def test_db():
	with engine.connect() as conn:
		result = conn.execute(text("SELECT current_database();")).scalar()
	return {"database": result, "database_url": settings.database_url}


@app.get("/tables")
def list_tables():
	with engine.connect() as conn:
		rows = conn.execute(text(
			"""
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema='public'
			ORDER BY table_name
			"""
		)).fetchall()
	return {"tables": [row[0] for row in rows]}
