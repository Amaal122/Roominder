"""Entry point for the Roominder FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db import Base, engine
from .backend_user import auth


# Create tables on startup; checkfirst avoids errors on reload if tables already exist.
Base.metadata.create_all(bind=engine, checkfirst=True)

app = FastAPI(title="Roominder API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:8080",  # Expo web dev server
		"http://localhost:8081",  # Metro bundler / Expo web
		"http://10.0.2.2:8001",  # Android emulator
		"http://localhost:19006",  # Expo go
		"http://localhost:3000",   # fallback dev port
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth.router)


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