"""Roommate matching endpoints.

Implements lightweight matching for the RoomateMatch screen.

The frontend stores roommate preferences as string IDs:
- sleep_schedule: early | night
- cleanliness: tidy | relaxed
- social_life: party | quiet
- guests: often | rarely
- work_style: home | office
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..db import get_db
from .auth import SeekerProfile, get_current_user
from .models import User


router = APIRouter(prefix="/roommates", tags=["roommates"])


PREFERENCE_LABELS = {
	"sleep_schedule": {"early": "Early Bird", "night": "Night Owl"},
	"cleanliness": {"tidy": "Very Organized", "relaxed": "Relaxed"},
	"social_life": {"party": "Love Parties", "quiet": "Quiet Time"},
	"guests": {"often": "Guests Often", "rarely": "Prefer Private"},
	"work_style": {"home": "Work From Home", "office": "Office/Hybrid"},
}


class RoommateMatchItem(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: str
	name: str
	age: int
	role: str
	location: str
	about: str
	lifestyle: List[str]
	match: int
	image: Optional[str] = None


def _safe_label(category: str, value: Optional[str]) -> Optional[str]:
	if not value:
		return None
	mapping = PREFERENCE_LABELS.get(category)
	if not mapping:
		return value
	return mapping.get(value, value)


def _build_lifestyle(profile: SeekerProfile) -> List[str]:
	labels: List[str] = []
	for key in ("sleep_schedule", "cleanliness", "social_life", "guests", "work_style"):
		label = _safe_label(key, getattr(profile, key, None))
		if label:
			labels.append(label)
	return labels


def _match_score(me: SeekerProfile, other: SeekerProfile) -> int:
	keys = ("sleep_schedule", "cleanliness", "social_life", "guests", "work_style")
	compared = 0
	matched = 0
	for key in keys:
		mine = getattr(me, key, None)
		theirs = getattr(other, key, None)
		if mine is None or theirs is None:
			continue
		compared += 1
		if mine == theirs:
			matched += 1

	if compared == 0:
		return 0

	return int(round((matched / compared) * 100))


@router.get("/matches", response_model=List[RoommateMatchItem])
def get_roommate_matches(
	limit: int = 20,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	"""Return roommate matches for the current user.

	Requires a seeker profile for the current user.
	"""

	my_profile = (
		db.query(SeekerProfile)
		.filter(SeekerProfile.user_id == current_user.id)
		.first()
	)
	if not my_profile:
		raise HTTPException(status_code=400, detail="Seeker profile required")

	# Only show roommate-capable profiles.
	candidates = (
		db.query(SeekerProfile)
		.filter(SeekerProfile.user_id.isnot(None))
		.filter(SeekerProfile.user_id != current_user.id)
		.filter(SeekerProfile.looking_for.in_(["roommate", "both"]))
		.all()
	)

	items: List[RoommateMatchItem] = []
	for profile in candidates:
		user = db.query(User).filter(User.id == profile.user_id).first()
		display_name = (
			(user.full_name if user and user.full_name else None)
			or (user.email if user else None)
			or f"User {profile.user_id}"
		)

		score = _match_score(my_profile, profile)
		occupation = profile.occupation or ""
		location = profile.location or ""
		about = (
			f"{occupation} looking for a friendly shared home.".strip()
			if occupation
			else "Looking for a friendly shared home."
		)

		items.append(
			RoommateMatchItem(
				id=str(profile.user_id),
				name=display_name,
				age=int(profile.age or 0),
				role=occupation or "Roommate",
				location=location,
				about=about,
				lifestyle=_build_lifestyle(profile),
				match=score,
				image=profile.image_url,
			)
		)

	items.sort(key=lambda item: item.match, reverse=True)
	return items[: max(0, min(limit, 100))]
