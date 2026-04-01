# Script to fix blob image URLs in the properties table
# Usage: Run with your FastAPI backend's venv activated
# python backend/scripts/fix_blob_image_urls.py

import os
import re
from sqlalchemy import create_engine, MetaData, Table, select, update

from backend.config import settings

# Update this to your actual database URL
db_url = os.environ.get("ROOMINDER_DATABASE_URL") or settings.sqlalchemy_database_url
engine = create_engine(db_url, pool_pre_ping=True)
metadata = MetaData()
metadata.reflect(bind=engine)

properties = Table("properties", metadata, autoload_with=engine)

BLOB_PATTERN = re.compile(r"^(blob:|file:|data:)")

with engine.begin() as conn:
    sel = select(properties.c.id, properties.c.image_url)
    results = conn.execute(sel).fetchall()
    for row in results:
        if row.image_url and BLOB_PATTERN.match(row.image_url):
            print(f"Property {row.id} has blob image_url: {row.image_url}")
            # Set to null or a default image, or prompt for manual fix
            upd = update(properties).where(properties.c.id == row.id).values(image_url=None)
            conn.execute(upd)
            print(f"Property {row.id} image_url set to NULL (please re-upload)")

print("Done. All blob/file/data image URLs have been nulled. Please re-upload images via the app.")
