"""FastAPI router for AI roommate matching."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..backend_user.auth import get_current_user
from ..backend_user.models import User


def _load_get_roommate_matches():
    """Load the matcher lazily to avoid crashing app startup.

    The repo currently does not define `get_roommate_matches` in a stable module,
    so importing it at module import-time would prevent Uvicorn from starting.
    """
    try:
        from .Maatcher import get_roommate_matches  # type: ignore
        return get_roommate_matches
    except Exception:
        # Keep the API running even if the AI matcher isn't available.
        return None

router = APIRouter(prefix="/ai/roommates", tags=["AI Roommate Matching"])


class MatchProfile(BaseModel):
    id:        int
    name:      str
    age:       int
    role:      str
    location:  str
    match:     float
    about:     str
    lifestyle: list[str]
    reasons:   list[str]
    image:     Optional[str] = None


@router.get("/", response_model=list[MatchProfile])
def get_matches(
    top_n: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_roommate_matches = _load_get_roommate_matches()
    if get_roommate_matches is None:
        raise HTTPException(
            status_code=503,
            detail="Roommate matching is not configured (missing get_roommate_matches)",
        )

    try:
        return get_roommate_matches(
            current_user_id=current_user.id,
            db=db,
            top_n=top_n,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Matching error: {e}")
        raise HTTPException(status_code=500, detail="Matching service unavailable")