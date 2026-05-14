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

    # ── Location ──────────────────────────────
    # FIX: removed the "if loc_a and loc_b" guard — now filters even if one side
    # is empty, treating an empty location as "unknown" and allowing the match,
    # but if BOTH are filled and differ → eliminate.
    loc_a = (profile_a.get("location") or "").strip().lower()
    loc_b = (profile_b.get("location") or "").strip().lower()
    if loc_a and loc_b and loc_a != loc_b:
        return False, f"Different locations: {loc_a!r} vs {loc_b!r}"

    # ── Gender ────────────────────────────────
    # FIX: same guard issue — now properly eliminates mismatched genders
    # when both sides have a value.
    gender_a = (profile_a.get("gender") or "").strip().lower()
    gender_b = (profile_b.get("gender") or "").strip().lower()
    if gender_a and gender_b and gender_a != gender_b:
        return False, (
            f"Gender mismatch: {profile_a.get('full_name', '')} is {gender_a}, "
            f"{profile_b.get('full_name', '')} is {gender_b}"
        )

    # ── Budget ────────────────────────────────
    budget_min_a = profile_a.get("budget_min") or 0
    budget_max_a = profile_a.get("budget_max") or 999_999
    budget_min_b = profile_b.get("budget_min") or 0
    budget_max_b = profile_b.get("budget_max") or 999_999
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
        text = (profile.get("cleanliness") or "").lower()
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
            "pair":        f"{profile_a.get('full_name', '')} × {profile_b.get('full_name', '')}",
            "eligible":    False,
            "reason":      reason,
            "final_score": 0.0,
        }

    sleep_score = sleep_conflict_score(profile_a, profile_b)
    clean_score = cleanliness_conflict_score(profile_a, profile_b)

    vec_a     = np.array(profile_a["final_vector"])
    vec_b     = np.array(profile_b["final_vector"])
    nlp_score = float(cosine_similarity([vec_a], [vec_b])[0][0])

    final = (
        nlp_score   * 0.50 +
        sleep_score * 0.30 +
        clean_score * 0.20
    )

    return {
        "pair":        f"{profile_a.get('full_name', '')} × {profile_b.get('full_name', '')}",
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
# DB LOADER
# ─────────────────────────────────────────────

def load_vectorized_profiles_from_db() -> list[dict]:
    PROJECT_ROOT = Path(__file__).resolve().parents[2]
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))

    try:
        from .nlp_vectorizeer import (
            load_profiles_from_db,
            vectorize_profile,
            build_final_vector,
        )
    except ImportError:
        # Fallback for running as a script (python backend/Ai_roomate/Maatcher.py)
        from backend.Ai_roomate.nlp_vectorizeer import (
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
    try:
        from .nlp_vectorizeer import (
            vectorize_profile,
            build_final_vector,
            calculate_big_five,
            _to_cat,
        )
    except ImportError:
        # Fallback for running as a script
        from backend.Ai_roomate.nlp_vectorizeer import (
            vectorize_profile,
            build_final_vector,
            calculate_big_five,
            _to_cat,
        )

    # ── Convert SQLAlchemy row → dict ──────────
    def seeker_to_dict(seeker, user) -> dict:
        profile = {
            "user_id":        seeker.user_id,
            "full_name":      (user.full_name or "Unknown"),
            "email":          user.email,
            "age":            seeker.age or 25,
            # FIX: use getattr with fallback to avoid AttributeError if column missing
            "gender":         (getattr(seeker, "gender",         None) or "").strip(),
            "occupation":     (getattr(seeker, "occupation",     None) or "").strip(),
            "location":       (getattr(seeker, "location",       None) or "").strip(),
            "looking_for":    (getattr(seeker, "looking_for",    None) or "both"),
            "sleep_schedule": (getattr(seeker, "sleep_schedule", None) or "").strip(),
            "cleanliness":    (getattr(seeker, "cleanliness",    None) or "").strip(),
            "social_life":    (getattr(seeker, "social_life",    None) or "").strip(),
            "guests":         (getattr(seeker, "guests",         None) or "").strip(),
            "work_style":     (getattr(seeker, "work_style",     None) or "").strip(),
            "interests":      (getattr(seeker, "interests",      None) or "").strip(),
            "values":         (getattr(seeker, "values",         None) or "").strip(),
            "budget_min":     getattr(seeker, "budget_min",      None),
            "budget_max":     getattr(seeker, "budget_max",      None),
            "image_url":      getattr(seeker, "image_url",       None),
        }
        profile.update(calculate_big_five(profile))

        # DEBUG — remove once confirmed working
        print(
            f"[seeker_to_dict] {profile['full_name']} | "
            f"gender={profile['gender']!r} | "
            f"location={profile['location']!r} | "
            f"budget={profile['budget_min']}–{profile['budget_max']}"
        )

        return profile

    # ── Load current user's profile ────────────
    current_seeker = (
        db.query(SeekerProfile)
        .filter(SeekerProfile.user_id == current_user_id)
        .first()
    )
    if not current_seeker:
        raise ValueError("Complete your seeker profile first")

    current_user    = db.query(User).filter(User.id == current_user_id).first()
    current_profile = seeker_to_dict(current_seeker, current_user)
    current_profile["text_vector"]  = vectorize_profile(current_profile)
    current_profile["final_vector"] = build_final_vector(current_profile)

    print(f"\n[get_roommate_matches] Loaded current user: {current_profile['full_name']}")

    # ── Load all other profiles ────────────────
    all_rows = (
        db.query(SeekerProfile, User)
        .join(User, User.id == SeekerProfile.user_id)
        .filter(SeekerProfile.user_id != current_user_id)
        .all()
    )

    if not all_rows:
        print("[get_roommate_matches] No other profiles found in DB.")
        return []

    print(f"[get_roommate_matches] Scoring {len(all_rows)} candidates...")

    # ── Score each candidate ───────────────────
    results = []
    for seeker, user in all_rows:
        try:
            candidate = seeker_to_dict(seeker, user)
            candidate["text_vector"]  = vectorize_profile(candidate)
            candidate["final_vector"] = build_final_vector(candidate)

            result = compute_compatibility(current_profile, candidate)

            # DEBUG — shows whether each candidate passes or fails hard filters
            print(
                f"  → {candidate['full_name']}: eligible={result.get('eligible')} | "
                f"score={result.get('final_score')}% | "
                f"reason={result.get('reason', '')}"
            )

            if not result.get("eligible", False):
                continue

            # ── Lifestyle chips ────────────────
            chips = []
            sleep = _to_cat(candidate.get("sleep_schedule", ""), "sleep")
            if sleep == "early":         chips.append("Early bird")
            elif sleep == "late":        chips.append("Night owl")
            clean = _to_cat(candidate.get("cleanliness", ""), "clean")
            if clean == "high":          chips.append("Very organized")
            elif clean == "low":         chips.append("Relaxed about cleaning")
            social = _to_cat(candidate.get("social_life", ""), "social")
            if social == "introvert":    chips.append("Introverted")
            elif social == "extrovert":  chips.append("Very social")
            work = _to_cat(candidate.get("work_style", ""), "work")
            if work == "remote":         chips.append("Works from home")
            elif work == "on-site":      chips.append("Office worker")
            if candidate.get("occupation"):
                chips.append(candidate["occupation"].capitalize())

            # ── Reasons ───────────────────────
            reasons = []
            cat_a = _to_cat(current_profile.get("sleep_schedule", ""), "sleep")
            cat_b = _to_cat(candidate.get("sleep_schedule", ""), "sleep")
            label_map = {"early": "early birds 🌅", "late": "night owls 🌙", "normal": "on similar sleep schedules"}
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
            # FIX: print full traceback so errors are never silently swallowed
            import traceback
            print(f"[get_roommate_matches] Skipping user {seeker.user_id}: {e}")
            traceback.print_exc()
            continue

    results.sort(key=lambda x: x["match"], reverse=True)
    print(f"[get_roommate_matches] Returning {len(results)} matches.")
    return results[:top_n]


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":

    profiles = load_vectorized_profiles_from_db()

    if len(profiles) < 3:
        print("Need at least 3 profiles to test. Add more seeker profiles to the DB.")
        sys.exit(0)

    test_compatibility(profiles)
    find_top_matches(profiles[0]["email"], profiles, top_n=5)