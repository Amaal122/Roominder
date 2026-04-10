"""Hybrid property matching based on weighted scoring and cosine similarity."""

from sqlalchemy.orm import Session

from backend.backend_propertyowner.models import Property
from backend.backend_user.models import User

from .encoder import Vector, cosine_similarity, encode_property, encode_user_profile


WEIGHTS = {
    "budget": 0.35,
    "location": 0.30,
    "rooms": 0.20,
    "lifestyle": 0.15,
}


def _score_budget(property_price: float, user_budget: float) -> float:
    if property_price > user_budget:
        diff = (property_price - user_budget) / user_budget
        return max(0.0, 1.0 - diff * 1.5)

    diff = (user_budget - property_price) / user_budget
    return max(0.6, 1.0 - diff * 0.3)


def _score_location(property_city: str, user_city: str) -> float:
    nearby_cities = {
        "tunis": ["ariana", "ben arous", "la marsa", "carthage", "manouba"],
        "ariana": ["tunis", "la marsa"],
        "sfax": [],
        "sousse": [],
    }

    property_name = property_city.lower().strip()
    user_name = user_city.lower().strip()

    if property_name == user_name:
        return 1.0
    if property_name in nearby_cities.get(user_name, []):
        return 0.65
    return 0.2


def _score_rooms(property_rooms: int, needed: int) -> float:
    diff = abs(property_rooms - needed)
    if diff == 0:
        return 1.0
    if diff == 1:
        return 0.7
    if diff == 2:
        return 0.4
    return 0.1


def _score_lifestyle(prop_vec: Vector, user_vec: Vector) -> float:
    return cosine_similarity(prop_vec[3:], user_vec[3:])


def _hybrid_score(
    prop,
    user_profile: dict,
    user_vec: Vector,
    prop_vec: Vector,
) -> dict:
    s_budget = _score_budget(prop.price, user_profile["budget"])
    s_location = _score_location(prop.city, user_profile["city"])
    s_rooms = _score_rooms(prop.rooms, user_profile.get("rooms_needed", 1))
    s_lifestyle = _score_lifestyle(prop_vec, user_vec)

    weighted = (
        s_budget * WEIGHTS["budget"]
        + s_location * WEIGHTS["location"]
        + s_rooms * WEIGHTS["rooms"]
        + s_lifestyle * WEIGHTS["lifestyle"]
    )

    cosine = cosine_similarity(user_vec, prop_vec)
    final = (weighted * 0.60) + (cosine * 0.40)

    explanation = []

    if s_budget >= 0.8:
        explanation.append(f"Price ({prop.price} DT) is within budget")
    elif s_budget >= 0.5:
        explanation.append("Price is slightly above budget")
    else:
        explanation.append(f"Price ({prop.price} DT) exceeds budget")

    if s_location == 1.0:
        explanation.append(f"Located in {prop.city}, your preferred city")
    elif s_location >= 0.6:
        explanation.append(f"Located in {prop.city}, close to {user_profile['city']}")
    else:
        explanation.append(f"Located in {prop.city}, far from {user_profile['city']}")

    if s_rooms >= 0.9:
        explanation.append(f"{prop.rooms} room(s), ideal for your group")
    elif s_rooms >= 0.6:
        explanation.append(f"{prop.rooms} room(s), acceptable fit")
    else:
        explanation.append(f"{prop.rooms} room(s), not a good fit")

    return {
        "score": round(final * 100, 1),
        "weighted": round(weighted * 100, 1),
        "cosine": round(cosine * 100, 1),
        "score_details": {
            "budget": round(s_budget * 100, 1),
            "location": round(s_location * 100, 1),
            "rooms": round(s_rooms * 100, 1),
            "lifestyle": round(s_lifestyle * 100, 1),
        },
        "explanation": explanation,
    }


def match_properties(
    db: Session,
    user_profile: dict,
    top_n: int = 5,
) -> list:
    user_vec = encode_user_profile(user_profile)

    properties = db.query(Property).filter(Property.status == "available").all()
    if not properties:
        return []

    owner_ids = {prop.owner_id for prop in properties}
    owner_name_rows = (
        db.query(User.id, User.full_name, User.email)
        .filter(User.id.in_(owner_ids))
        .all()
    )
    owner_names = {
        user_id: full_name or email
        for user_id, full_name, email in owner_name_rows
    }

    results = []
    for prop in properties:
        prop_vec = encode_property(prop)
        scores = _hybrid_score(prop, user_profile, user_vec, prop_vec)

        results.append(
            {
                "id": prop.id,
                "property_id": prop.id,
                "owner_id": prop.owner_id,
                "owner_name": owner_names.get(prop.owner_id),
                "title": prop.title,
                "address": prop.address,
                "city": prop.city,
                "price": prop.price,
                "rooms": prop.rooms,
                "bathrooms": prop.bathrooms,
                "space": prop.space,
                "description": prop.description,
                "image_url": prop.image_url,
                "status": prop.status,
                **scores,
            }
        )

    results.sort(key=lambda item: item["score"], reverse=True)
    return results[:top_n]
