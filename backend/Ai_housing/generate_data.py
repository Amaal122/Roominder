"""Generate sample data for Roominder matching flows.

Run with: python -m backend.Ai_housing.generate_data
"""

from pathlib import Path
import random
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))


from backend.db import SessionLocal
from backend.backend_propertyowner.models import Property
from backend.backend_user.models import User


TUNISIAN_CITIES = [
    "Tunis",
    "Ariana",
    "Ben Arous",
    "La Marsa",
    "Carthage",
    "Manouba",
    "Sfax",
    "Sousse",
]

PROPERTY_TITLES = [
    "Modern downtown apartment",
    "Cozy studio near campus",
    "Bright apartment with sea view",
    "House with garden",
    "Renovated apartment in a quiet area",
    "Fully furnished studio",
    "Large 3-bedroom apartment",
    "New apartment with parking",
    "Villa with pool",
    "Affordable apartment in a good area",
    "Modern duplex with terrace",
    "Studio near metro",
    "Spacious family apartment",
    "Shared room in the city center",
    "Apartment with balcony and city view",
]

STATUSES = ["available", "available", "available", "occupied"]
SLEEP_SCHEDULES = ["early bird", "flexible", "night owl"]
CLEANLINESS_LEVELS = ["very clean", "clean", "moderate", "relaxed"]
SOCIAL_LEVELS = ["very social", "social", "moderate", "quiet"]
WORK_STYLES = ["remote", "hybrid", "office"]
LOOKING_FOR_OPTIONS = ["roommate", "house", "both"]
GENDERS = ["female", "male", "non-binary"]
OCCUPATIONS = [
    "Student",
    "Developer",
    "Designer",
    "Teacher",
    "Consultant",
    "Engineer",
    "Freelancer",
]
GUEST_LEVELS = ["never", "rarely", "sometimes", "often"]


def _get_user_ids(db) -> list[int]:
    return [user_id for (user_id,) in db.query(User.id).all()]


def _get_owner_ids(db) -> list[int]:
    owner_ids = [
        user_id
        for (user_id,) in db.query(User.id)
        .filter(User.role == "owner")
        .all()
    ]
    if owner_ids:
        return owner_ids

    fallback_ids = _get_user_ids(db)
    if fallback_ids:
        print("Warning: no users with role='owner'; falling back to all users.")
    return fallback_ids


def generate_properties(db, count: int = 50):
    """Generate sample properties."""
    print(f"Generating {count} properties...")

    owner_ids = _get_owner_ids(db) or list(range(1, 6))
    properties = []

    for _ in range(count):
        city = random.choice(TUNISIAN_CITIES)
        rooms = random.randint(1, 4)

        base_price = {
            "Tunis": 600,
            "La Marsa": 700,
            "Carthage": 750,
            "Ariana": 500,
            "Ben Arous": 450,
            "Manouba": 400,
            "Sfax": 350,
            "Sousse": 400,
        }.get(city, 500)

        price = base_price + (rooms - 1) * 150 + random.randint(-100, 200)
        price = max(150, price)

        prop = Property(
            owner_id=random.choice(owner_ids),
            title=random.choice(PROPERTY_TITLES),
            address=(
                f"{random.randint(1, 100)} Rue "
                f"{random.choice(['Habib Bourguiba', 'de la Liberte', 'Ibn Khaldoun', 'du Lac', 'de Carthage'])}"
            ),
            city=city,
            price=float(price),
            rooms=rooms,
            description=f"Nice {rooms}-room property in {city}. Ideal for shared housing.",
            status=random.choice(STATUSES),
            image_url=None,
        )
        properties.append(prop)
        db.add(prop)

    db.commit()
    print(f"Created {len(properties)} properties.")
    return properties


def generate_seeker_profiles(db, count: int = 100):
    """Generate sample seeker profiles for users that do not have one yet."""
    try:
        from backend.backend_user.auth import SeekerProfile
    except ImportError as exc:
        print(f"\nWarning: could not import SeekerProfile, skipping ({exc})")
        return []

    existing_user_ids = set(_get_user_ids(db))
    if not existing_user_ids:
        print("\nWarning: no users found, skipping seeker profile generation.")
        return []

    used_user_ids = {
        user_id
        for (user_id,) in db.query(SeekerProfile.user_id)
        .filter(SeekerProfile.user_id.isnot(None))
        .all()
    }
    available_user_ids = list(existing_user_ids - used_user_ids)

    if not available_user_ids:
        print("\nWarning: every user already has a seeker profile, skipping.")
        return []

    random.shuffle(available_user_ids)
    selected_user_ids = available_user_ids[:count]
    print(f"\nGenerating {len(selected_user_ids)} seeker profiles...")

    profiles = []
    for user_id in selected_user_ids:
        city = random.choice(TUNISIAN_CITIES)

        profile = SeekerProfile(
            user_id=user_id,
            looking_for=random.choice(LOOKING_FOR_OPTIONS),
            location=city,
            radius=random.choice([1, 3, 5, 10, 15]),
            age=random.randint(18, 40),
            gender=random.choice(GENDERS),
            occupation=random.choice(OCCUPATIONS),
            image_url=None,
            sleep_schedule=random.choice(SLEEP_SCHEDULES),
            cleanliness=random.choice(CLEANLINESS_LEVELS),
            social_life=random.choice(SOCIAL_LEVELS),
            guests=random.choice(GUEST_LEVELS),
            work_style=random.choice(WORK_STYLES),
        )
        profiles.append(profile)
        db.add(profile)

    db.commit()
    print(f"Created {len(profiles)} seeker profiles.")
    return profiles


def main():
    print("Generating Roominder test data\n")
    print("=" * 50)

    db = SessionLocal()
    try:
        generate_properties(db, count=150)
        generate_seeker_profiles(db, count=100)

        print("\n" + "=" * 50)
        print("Sample data generated successfully.")
        print("You can now test matching at:")
        print("http://localhost:8000/docs#/AI%20Matching/get_property_matches_ai_match_properties_post")
    except Exception as exc:
        print(f"Error: {exc}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
