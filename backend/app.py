"""Compatibility wrapper for the FastAPI app."""

# Delegate to the actual FastAPI app defined in backend_user.app
from .backend_user.app import app
