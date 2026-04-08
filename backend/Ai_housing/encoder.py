"""Encode user and property data into numeric vectors."""

from math import sqrt

Vector = list[float]


CITY_MAP = {
    "tunis": 1.0,
    "ariana": 0.9,
    "ben arous": 0.85,
    "la marsa": 0.85,
    "carthage": 0.8,
    "manouba": 0.75,
    "sfax": 0.4,
    "sousse": 0.4,
    "bizerte": 0.35,
}

SLEEP_MAP = {
    "early bird": 0.0,
    "flexible": 0.5,
    "night owl": 1.0,
}

CLEANLINESS_MAP = {
    "very clean": 1.0,
    "clean": 0.75,
    "moderate": 0.5,
    "relaxed": 0.25,
    "messy": 0.0,
}

SOCIAL_MAP = {
    "very social": 1.0,
    "social": 0.75,
    "moderate": 0.5,
    "quiet": 0.25,
    "very quiet": 0.0,
}

WORK_MAP = {
    "remote": 1.0,
    "hybrid": 0.5,
    "office": 0.0,
}


def encode_user_profile(profile: dict) -> Vector:
    """Transform a user profile into a numeric vector."""
    budget_norm = min(profile.get("budget", 500) / 3000, 1.0)

    city = profile.get("city", "tunis").lower().strip()
    city_norm = CITY_MAP.get(city, 0.5)

    rooms_norm = min(profile.get("rooms_needed", 1) / 5, 1.0)

    sleep = SLEEP_MAP.get(profile.get("sleep_schedule", "flexible").lower(), 0.5)
    clean = CLEANLINESS_MAP.get(profile.get("cleanliness", "moderate").lower(), 0.5)
    social = SOCIAL_MAP.get(profile.get("social_life", "moderate").lower(), 0.5)
    work = WORK_MAP.get(profile.get("work_style", "hybrid").lower(), 0.5)

    return [
        budget_norm,
        city_norm,
        rooms_norm,
        sleep,
        clean,
        social,
        work,
    ]


def encode_property(property_obj) -> Vector:
    """Transform a property model into a numeric vector."""
    price_norm = min(float(property_obj.price) / 3000, 1.0)

    city = (property_obj.city or "tunis").lower().strip()
    city_norm = CITY_MAP.get(city, 0.5)

    rooms_norm = min(int(property_obj.rooms or 1) / 5, 1.0)

    sleep = 0.5
    clean = 0.75
    social = 0.5
    work = 0.5

    return [
        price_norm,
        city_norm,
        rooms_norm,
        sleep,
        clean,
        social,
        work,
    ]


def cosine_similarity(vec_a: Vector, vec_b: Vector) -> float:
    """Return cosine similarity between two numeric vectors."""
    norm_a = sqrt(sum(value * value for value in vec_a))
    norm_b = sqrt(sum(value * value for value in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    dot_product = sum(value_a * value_b for value_a, value_b in zip(vec_a, vec_b))
    return float(dot_product / (norm_a * norm_b))
