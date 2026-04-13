# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from sentence_transformers import SentenceTransformer
import numpy as np
import json
import sys
from pathlib import Path

# ─────────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────────
model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
print("Model loaded ✅")

# ─────────────────────────────────────────────
# TEXT BUILDER
# Sleep and cleanliness are excluded —
# they are handled explicitly in matcher.py Layer 2
# ─────────────────────────────────────────────
def build_profile_text(profile: dict) -> str:
    text = f"""
    Social life: {profile.get('social_life', '')}
    Guests: {profile.get('guests', '')}
    Work style: {profile.get('work_style', '')}
    Interests: {profile.get('interests', '')}
    Values: {profile.get('values', '')}
    Occupation: {profile.get('occupation', '')}
    """
    return text.strip()

# ─────────────────────────────────────────────
# VECTORIZERS
# ─────────────────────────────────────────────
def vectorize_profile(profile: dict) -> list:
    text   = build_profile_text(profile)
    vector = model.encode(text)
    return vector.tolist()

def build_structured_vector(profile: dict) -> list:
    return [
        profile.get("personality_openness",          3.0) / 5.0,
        profile.get("personality_conscientiousness", 3.0) / 5.0,
        profile.get("personality_extraversion",      3.0) / 5.0,
        profile.get("personality_agreeableness",     3.0) / 5.0,
        profile.get("personality_neuroticism",       3.0) / 5.0,
        profile.get("age", 25)                            / 100.0,
    ]

def build_final_vector(profile: dict) -> list:
    nlp_vector        = np.array(profile["text_vector"])
    structured_vector = np.array(build_structured_vector(profile))
    nlp_weighted        = nlp_vector        * 0.7
    structured_weighted = structured_vector * 0.3
    return np.concatenate([nlp_weighted, structured_weighted]).tolist()


# ─────────────────────────────────────────────
# BIG FIVE CALCULATOR
# Derives personality scores from lifestyle fields
# because seeker_profiles table has no Big Five columns
# ─────────────────────────────────────────────
def _to_cat(sentence: str, field: str) -> str:
    if not sentence:
        return "normal"
    s = sentence.lower()

    if field == "sleep":
        if any(w in s for w in ["9pm","10pm","5am","6am","early","strict routine","early bird"]):
            return "early"
        if any(w in s for w in ["2am","3am","1am","night owl","late night","never sleep before"]):
            return "late"
        return "normal"

    if field == "clean":
        if any(w in s for w in ["every day","spotless","immediately","top priority","very particular","very clean","every single day"]):
            return "high"
        if any(w in s for w in ["occasionally","bothering","few weeks","relaxed","motivation","when it","once a month"]):
            return "low"
        return "medium"

    if field == "social":
        if any(w in s for w in ["introverted","silence","alone","drain","quiet evenings","deeply intro","need silence"]):
            return "introvert"
        if any(w in s for w in ["outgoing","thrive","constantly","extremely social","love having people","very social"]):
            return "extrovert"
        return "ambivert"

    if field == "guests":
        if any(w in s for w in ["never","zero","do not invite","not at all","no guests"]):
            return "never"
        if any(w in s for w in ["every weekend","frequently","regularly","almost every","almost daily"]):
            return "often"
        if any(w in s for w in ["rarely","once a month","few weeks","occasionally have one","maybe once"]):
            return "rarely"
        return "sometimes"

    if field == "work":
        if any(w in s for w in ["remote","home all day","from home every","fully remote","work from home"]):
            return "remote"
        if any(w in s for w in ["7am","8am","on-site","office every","barely home","on site"]):
            return "on-site"
        return "hybrid"

    return "normal"


def calculate_big_five(profile: dict) -> dict:
    sleep  = _to_cat(profile.get("sleep_schedule", ""), "sleep")
    clean  = _to_cat(profile.get("cleanliness",    ""), "clean")
    social = _to_cat(profile.get("social_life",    ""), "social")
    guest  = _to_cat(profile.get("guests",         ""), "guests")
    work   = _to_cat(profile.get("work_style",     ""), "work")
    occ    = (profile.get("occupation") or "student").lower().strip()

    extraversion = (
        {"extrovert": 5.0, "ambivert": 3.0, "introvert": 1.5}.get(social, 3.0) * 0.5 +
        {"often": 5.0, "sometimes": 3.5, "rarely": 2.0, "never": 1.0}.get(guest, 3.0) * 0.3 +
        {"late": 4.0, "normal": 3.0, "early": 2.5}.get(sleep, 3.0) * 0.2
    )
    conscientiousness = (
        {"high": 5.0, "medium": 3.0, "low": 1.5}.get(clean, 3.0) * 0.5 +
        {"on-site": 4.5, "hybrid": 3.5, "remote": 2.5}.get(work, 3.0) * 0.3 +
        {"early": 4.5, "normal": 3.0, "late": 2.0}.get(sleep, 3.0) * 0.2
    )
    occ_map = {
        "architect": 5.0, "freelancer": 4.5, "designer": 4.5,
        "engineer": 4.0,  "developer": 4.0,  "student": 4.0,
        "consultant": 3.5, "teacher": 3.5,
        "doctor": 3.5,    "nurse": 3.0,
    }
    openness = (
        occ_map.get(occ, 3.0) * 0.4 +
        {"extrovert": 4.5, "ambivert": 3.5, "introvert": 2.0}.get(social, 3.0) * 0.3 +
        {"remote": 4.5, "hybrid": 3.5, "on-site": 2.5}.get(work, 3.0) * 0.3
    )
    agreeableness = (
        {"often": 5.0, "sometimes": 4.0, "rarely": 2.5, "never": 1.5}.get(guest, 3.0) * 0.4 +
        {"extrovert": 4.5, "ambivert": 3.5, "introvert": 2.0}.get(social, 3.0) * 0.4 +
        {"high": 2.5, "medium": 3.5, "low": 4.5}.get(clean, 3.0) * 0.2
    )
    neuroticism = (
        {"high": 4.5, "medium": 2.5, "low": 1.5}.get(clean, 3.0) * 0.4 +
        {"early": 2.0, "normal": 3.0, "late": 4.0}.get(sleep, 3.0) * 0.3 +
        {"never": 4.0, "rarely": 3.0, "sometimes": 2.5, "often": 2.0}.get(guest, 3.0) * 0.3
    )

    def clamp(v): return round(max(1.0, min(5.0, v)), 1)

    return {
        "personality_openness":          clamp(openness),
        "personality_conscientiousness": clamp(conscientiousness),
        "personality_extraversion":      clamp(extraversion),
        "personality_agreeableness":     clamp(agreeableness),
        "personality_neuroticism":       clamp(neuroticism),
    }


# ─────────────────────────────────────────────
# DB LOADER
# Replaces open("profiles_clean.json")
# Converts SQLAlchemy rows → dicts with Big Five
# ─────────────────────────────────────────────
def load_profiles_from_db() -> list[dict]:
    # Add project root to path so backend imports work
    PROJECT_ROOT = Path(__file__).resolve().parents[2]
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))

    from backend.db import SessionLocal
    from backend.backend_user.auth import SeekerProfile
    from backend.backend_user.models import User

    db = SessionLocal()
    profiles = []

    try:
        rows = (
            db.query(SeekerProfile, User)
            .join(User, User.id == SeekerProfile.user_id)
            .all()
        )

        for seeker, user in rows:
            # Convert SQLAlchemy object → plain dict
            profile = {
                "user_id":        seeker.user_id,
                "full_name":      user.full_name or "Unknown",
                "email":          user.email,
                "age":            seeker.age or 25,
                "gender":         seeker.gender or "",
                "occupation":     seeker.occupation or "",
                "location":       seeker.location or "",
                "looking_for":    seeker.looking_for or "both",
                "sleep_schedule": seeker.sleep_schedule or "",
                "cleanliness":    seeker.cleanliness or "",
                "social_life":    seeker.social_life or "",
                "guests":         seeker.guests or "",
                "work_style":     seeker.work_style or "",
                "interests":      seeker.interests or "",
                "values":         getattr(seeker, "values", "") or "",
                "image_url":      seeker.image_url or None,
            }

            # Calculate Big Five on the fly
            big_five = calculate_big_five(profile)
            profile.update(big_five)

            profiles.append(profile)

        print(f"Loaded {len(profiles)} profiles from Neon DB ✅")
        return profiles

    finally:
        db.close()


# ─────────────────────────────────────────────
# MAIN — loads from Neon DB, saves profiles_vectorized.json
# Same output as before — matcher.py unchanged
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # ── Load from DB instead of JSON ──────────
    profiles = load_profiles_from_db()

    # ── Vectorize — exactly the same as before ─
    print(f"\nVectorizing {len(profiles)} profiles...")
    for i, profile in enumerate(profiles):
        profile["text_vector"]  = vectorize_profile(profile)
        profile["final_vector"] = build_final_vector(profile)
        print(f"  ✅ {i+1}/{len(profiles)} — {profile['full_name']}")

    # ── Save — exactly the same as before ──────
    with open("profiles_vectorized.json", "w", encoding="utf-8") as f:
        json.dump(profiles, f, ensure_ascii=False, indent=2)

    print("\n✅ Saved profiles_vectorized.json")