# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
import re
import sys
from pathlib import Path

# ─────────────────────────────────────────────
# LAYER 1 — HARD FILTERS
# ─────────────────────────────────────────────

def passes_hard_filters(profile_a: dict, profile_b: dict) -> tuple[bool, str]:

    loc_a = profile_a.get("location", "").strip().lower()
    loc_b = profile_b.get("location", "").strip().lower()
    if loc_a and loc_b and loc_a != loc_b:
        return False, f"Different locations: {loc_a} vs {loc_b}"

    gender_a = profile_a.get("gender", "").strip().lower()
    gender_b = profile_b.get("gender", "").strip().lower()
    if gender_a and gender_b and gender_a != gender_b:
        return False, f"Gender mismatch: {profile_a.get('full_name','')} is {gender_a}, {profile_b.get('full_name','')} is {gender_b}"

    budget_min_a = profile_a.get("budget_min", 0)
    budget_max_a = profile_a.get("budget_max", 999999)
    budget_min_b = profile_b.get("budget_min", 0)
    budget_max_b = profile_b.get("budget_max", 999999)
    if min(budget_max_a, budget_max_b) - max(budget_min_a, budget_min_b) < 0:
        return False, "Budget ranges don't overlap"

    return True, ""


# ─────────────────────────────────────────────
# LAYER 2 — CONFLICT SCORING
# ─────────────────────────────────────────────
def extract_sleep_hour(text: str):
    if not text:
        return None
    text = text.lower()
    if "midnight" in text:
        return 0
    match = re.search(r'(\d{1,2})(?::\d{2})?\s*(am|pm)', text)
    if match:
        hour   = int(match.group(1))
        period = match.group(2)
        if period == "pm" and hour != 12:
            hour += 12
        if period == "am" and hour == 12:
            hour = 0
        return hour
    return None

def sleep_conflict_score(profile_a: dict, profile_b: dict) -> float:
    hour_a = extract_sleep_hour(profile_a.get("sleep_schedule", ""))
    hour_b = extract_sleep_hour(profile_b.get("sleep_schedule", ""))

    if hour_a is None or hour_b is None:
        return 0.6

    diff = abs(hour_a - hour_b)
    diff = min(diff, 24 - diff)

    if diff == 0:  return 1.00
    if diff <= 1:  return 0.85
    if diff <= 2:  return 0.65
    if diff <= 3:  return 0.40
    if diff <= 4:  return 0.20
    return 0.05

def cleanliness_conflict_score(profile_a: dict, profile_b: dict) -> float:
    CLEANLINESS_MAP = {
        "immediately":     5,
        "right away":      5,
        "obsessive":       5,
        "very particular": 5,
        "every day":       4,
        "daily":           4,
        "every weekend":   3,
        "weekly":          3,
        "when needed":     2,
        "not obsessive":   2,
        "relaxed":         1,
        "messy":           1,
    }

    def get_level(profile):
        text = profile.get("cleanliness", "").lower()
        for keyword, level in CLEANLINESS_MAP.items():
            if keyword in text:
                return level
        return 3

    diff = abs(get_level(profile_a) - get_level(profile_b))
    return max(0.0, 1.0 - diff * 0.25)


# ─────────────────────────────────────────────
# PRINT HELPER
# ─────────────────────────────────────────────
def print_result(result: dict):
    print(f"\n  Pair: {result['pair']}")

    if not result.get("eligible", True):
        print(f"  ❌ ELIMINATED by Hard Filter")
        print(f"  Reason: {result.get('reason', 'unknown')}")
        print(f"  Final Score: 0%")
        return

    print(f"  ✅ Eligible")
    print(f"  NLP score:         {result.get('nlp_score',   0):>6}%")
    print(f"  Sleep score:       {result.get('sleep_score', 0):>6}%")
    print(f"  Cleanliness score: {result.get('clean_score', 0):>6}%")
    print(f"  {'─' * 30}")
    print(f"  FINAL SCORE:       {result.get('final_score', 0):>6}%")


# ─────────────────────────────────────────────
# COMPUTE COMPATIBILITY — combines all 3 layers
# ─────────────────────────────────────────────
def compute_compatibility(profile_a: dict, profile_b: dict) -> dict:

    passed, reason = passes_hard_filters(profile_a, profile_b)
    if not passed:
        return {
            "pair":        f"{profile_a.get('full_name','')} × {profile_b.get('full_name','')}",
            "eligible":    False,
            "reason":      reason,
            "final_score": 0.0,
        }

    sleep_score = sleep_conflict_score(profile_a, profile_b)
    clean_score = cleanliness_conflict_score(profile_a, profile_b)

    vec_a     = np.array(profile_a["final_vector"])
    vec_b     = np.array(profile_b["final_vector"])
    nlp_score = cosine_similarity([vec_a], [vec_b])[0][0]

    final = (
        nlp_score   * 0.50 +
        sleep_score * 0.30 +
        clean_score * 0.20
    )

    return {
        "pair":        f"{profile_a.get('full_name','')} × {profile_b.get('full_name','')}",
        "eligible":    True,
        "nlp_score":   round(nlp_score   * 100, 1),
        "sleep_score": round(sleep_score * 100, 1),
        "clean_score": round(clean_score * 100, 1),
        "final_score": round(final       * 100, 1),
    }


# ─────────────────────────────────────────────
# FIND TOP MATCHES
# ─────────────────────────────────────────────
def find_top_matches(target_email: str, profiles: list, top_n: int = 5) -> list:
    target = next((p for p in profiles if p["email"] == target_email), None)
    if not target:
        print(f"Profile not found: {target_email}")
        return []

    results = []
    for p in profiles:
        if p["email"] == target_email:
            continue
        results.append(compute_compatibility(target, p))

    results.sort(key=lambda x: x["final_score"], reverse=True)

    print(f"\n── Top {top_n} Matches for {target['full_name']} ──────────────")
    for i, r in enumerate(results[:top_n], 1):
        print(f"\n#{i}")
        print_result(r)

    return results[:top_n]


# ─────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────
def test_compatibility(profiles):
    profile_a = profiles[0]
    profile_b = profiles[1]
    profile_c = profiles[2]

    result_ab = compute_compatibility(profile_a, profile_b)
    result_ac = compute_compatibility(profile_a, profile_c)

    print("\n── Compatibility Test ───────────────────────")
    print(f"Profile A: {profile_a['full_name']}")
    print(f"\n  vs. {profile_b['full_name']}:")
    print_result(result_ab)
    print(f"\n  vs. {profile_c['full_name']}:")
    print_result(result_ac)


# ─────────────────────────────────────────────
# DB LOADER — same as nlp_vectorizer but
# loads already-vectorized profiles from DB
# by running nlp_vectorizer.load_profiles_from_db()
# then vectorizing on the fly
# ─────────────────────────────────────────────
def load_vectorized_profiles_from_db() -> list[dict]:
    """
    Loads profiles from Neon DB, calculates Big Five,
    vectorizes them — returns list of dicts with final_vector.
    Same result as profiles_vectorized.json but from DB.
    """
    PROJECT_ROOT = Path(__file__).resolve().parents[2]
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))

    # Import vectorizer functions
    from nlp_vectorizeer import (
        load_profiles_from_db,
        vectorize_profile,
        build_final_vector,
    )

    profiles = load_profiles_from_db()

    print(f"\nVectorizing {len(profiles)} profiles from DB...")
    for i, profile in enumerate(profiles):
        profile["text_vector"]  = vectorize_profile(profile)
        profile["final_vector"] = build_final_vector(profile)
        print(f"  ✅ {i+1}/{len(profiles)} — {profile['full_name']}")

    return profiles

 # ─────────────────────────────────────────────
# FASTAPI ENTRY POINT
# This is the function router.py calls
# ─────────────────────────────────────────────

def get_roommate_matches(
    current_user_id: int,
    db,
    top_n: int = 20,
) -> list[dict]:

    PROJECT_ROOT = Path(__file__).resolve().parents[2]
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))

    from backend.backend_user.auth import SeekerProfile
    from backend.backend_user.models import User
    from nlp_vectorizeer import vectorize_profile, build_final_vector, calculate_big_five, _to_cat

    # ── Convert SQLAlchemy row → dict ──────────
    def seeker_to_dict(seeker, user) -> dict:
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
        profile.update(calculate_big_five(profile))
        return profile

    # ── Load current user's profile ────────────
    current_seeker = (
        db.query(SeekerProfile)
        .filter(SeekerProfile.user_id == current_user_id)
        .first()
    )
    if not current_seeker:
        raise ValueError("Complete your seeker profile first")

    current_user = db.query(User).filter(User.id == current_user_id).first()
    current_profile = seeker_to_dict(current_seeker, current_user)
    current_profile["text_vector"]  = vectorize_profile(current_profile)
    current_profile["final_vector"] = build_final_vector(current_profile)

    # ── Load all other profiles ────────────────
    all_rows = (
        db.query(SeekerProfile, User)
        .join(User, User.id == SeekerProfile.user_id)
        .filter(SeekerProfile.user_id != current_user_id)
        .all()
    )

    if not all_rows:
        return []

    # ── Score each candidate ───────────────────
    results = []
    for seeker, user in all_rows:
        try:
            candidate = seeker_to_dict(seeker, user)
            candidate["text_vector"]  = vectorize_profile(candidate)
            candidate["final_vector"] = build_final_vector(candidate)

            result = compute_compatibility(current_profile, candidate)
            if not result.get("eligible", False):
                continue

            # Lifestyle chips
            chips = []
            sleep = _to_cat(candidate.get("sleep_schedule", ""), "sleep")
            if sleep == "early":    chips.append("Early bird")
            elif sleep == "late":   chips.append("Night owl")
            clean = _to_cat(candidate.get("cleanliness", ""), "clean")
            if clean == "high":     chips.append("Very organized")
            elif clean == "low":    chips.append("Relaxed about cleaning")
            social = _to_cat(candidate.get("social_life", ""), "social")
            if social == "introvert":  chips.append("Introverted")
            elif social == "extrovert": chips.append("Very social")
            work = _to_cat(candidate.get("work_style", ""), "work")
            if work == "remote":    chips.append("Works from home")
            elif work == "on-site": chips.append("Office worker")
            if candidate.get("occupation"):
                chips.append(candidate["occupation"].capitalize())

            # Reasons
            reasons = []
            for field, label_map in [
                ("sleep_schedule", {"early": "early birds 🌅", "late": "night owls 🌙", "normal": "on similar sleep schedules"}),
            ]:
                cat_a = _to_cat(current_profile.get(field, ""), "sleep")
                cat_b = _to_cat(candidate.get(field, ""), "sleep")
                if cat_a == cat_b:
                    reasons.append(f"You are both {label_map.get(cat_a, 'compatible')}")

            cat_a = _to_cat(current_profile.get("cleanliness", ""), "clean")
            cat_b = _to_cat(candidate.get("cleanliness", ""), "clean")
            if cat_a == cat_b:
                reasons.append("You share the same cleanliness standards")

            cat_a = _to_cat(current_profile.get("social_life", ""), "social")
            cat_b = _to_cat(candidate.get("social_life", ""), "social")
            if cat_a == cat_b:
                label = {"introvert": "introverts who value quiet", "extrovert": "social people", "ambivert": "balanced types"}
                reasons.append(f"You are both {label.get(cat_a, 'compatible')}")

            cat_a = _to_cat(current_profile.get("work_style", ""), "work")
            cat_b = _to_cat(candidate.get("work_style", ""), "work")
            if cat_a == cat_b:
                label = {"remote": "both work from home", "on-site": "both go to the office", "hybrid": "both have hybrid schedules"}
                reasons.append(f"You {label.get(cat_a, 'have compatible work styles')}")

            results.append({
                "id":        candidate["user_id"],
                "name":      candidate["full_name"],
                "age":       candidate["age"],
                "role":      candidate["occupation"],
                "location":  candidate["location"],
                "match":     result["final_score"],
                "about":     candidate["social_life"],
                "lifestyle": chips[:5],
                "reasons":   reasons[:4],
                "image":     candidate["image_url"],
            })

        except Exception as e:
            print(f"Skipping user {seeker.user_id}: {e}")
            continue

    results.sort(key=lambda x: x["match"], reverse=True)
    return results[:top_n]
# ─────────────────────────────────────────────
# MAIN
# Now loads from DB instead of JSON file
# ─────────────────────────────────────────────

if __name__ == "__main__":

    # ── Option 1: Load from DB (recommended) ──
    profiles = load_vectorized_profiles_from_db()

    # ── Option 2: Load from JSON (for offline testing) ──
    # with open("profiles_vectorized.json", "r", encoding="utf-8") as f:
    #     profiles = json.load(f)

    if len(profiles) < 3:
        print("Need at least 3 profiles to test. Add more seeker profiles to the DB.")
        sys.exit(0)

    test_compatibility(profiles)
    find_top_matches(profiles[0]["email"], profiles, top_n=5)