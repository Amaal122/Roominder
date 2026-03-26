"""Entry point for the Roominder FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db import Base, engine
from .backend_user.auth import auth_router, seeker_router


# Create tables on startup; checkfirst avoids errors on reload if tables already exist.
Base.metadata.create_all(bind=engine, checkfirst=True)

# Quick, in-place migrations for dev: align DB column types with current models.
with engine.connect() as conn:
	conn.execute(text(
		"""
		ALTER TABLE seeker_profiles
		ALTER COLUMN sleep_schedule TYPE VARCHAR USING sleep_schedule::VARCHAR,
		ALTER COLUMN cleanliness TYPE VARCHAR USING cleanliness::VARCHAR,
		ALTER COLUMN social_life TYPE VARCHAR USING social_life::VARCHAR,
		ALTER COLUMN guests TYPE VARCHAR USING guests::VARCHAR,
		ALTER COLUMN work_style TYPE VARCHAR USING work_style::VARCHAR,
		ALTER COLUMN looking_for TYPE VARCHAR USING looking_for::VARCHAR;
		"""
	))
	conn.commit()

app = FastAPI(title="Roominder API")

# DEV: permit all origins to unblock Expo/web fetches; tighten in prod.
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_origin_regex=".*",
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Auth routes
app.include_router(auth_router)
# Seeker profile routes
app.include_router(seeker_router)


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
	# Simple DB connectivity check returning current database name
	with engine.connect() as conn:
		result = conn.execute(text("SELECT current_database();")).scalar()
	return {"database": result}


@app.get("/tables")
def list_tables():
	# List public tables using the SQLAlchemy engine
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