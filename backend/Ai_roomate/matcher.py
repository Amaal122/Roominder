# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
import re

# ─────────────────────────────────────────────
# LAYER 1 — HARD FILTERS
# ─────────────────────────────────────────────
def passes_hard_filters(profile_a: dict, profile_b: dict) -> tuple[bool, str]:

    # Filter 1: Location must match
    loc_a = profile_a.get("location", "").strip().lower()
    loc_b = profile_b.get("location", "").strip().lower()
    if loc_a and loc_b and loc_a != loc_b:
        return False, f"Different locations: {loc_a} vs {loc_b}"

    # Filter 2: Gender must match
    gender_a = profile_a.get("gender", "").strip().lower()
    gender_b = profile_b.get("gender", "").strip().lower()
    if gender_a and gender_b and gender_a != gender_b:
        return False, f"Gender mismatch: {profile_a['full_name']} is {gender_a}, {profile_b['full_name']} is {gender_b}"

    # Filter 3: Budget overlap
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
def extract_sleep_hour(text: str) -> int | None:
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

    # ── LAYER 1 ──
    passed, reason = passes_hard_filters(profile_a, profile_b)
    if not passed:
        return {
            "pair":        f"{profile_a['full_name']} × {profile_b['full_name']}",
            "eligible":    False,
            "reason":      reason,
            "final_score": 0.0,
        }

    # ── LAYER 2 ──
    sleep_score = sleep_conflict_score(profile_a, profile_b)
    clean_score = cleanliness_conflict_score(profile_a, profile_b)

    # ── LAYER 3 ──
    vec_a     = np.array(profile_a["final_vector"])
    vec_b     = np.array(profile_b["final_vector"])
    nlp_score = cosine_similarity([vec_a], [vec_b])[0][0]

    # ── WEIGHTED BLEND ──
    final = (
        nlp_score   * 0.50 +
        sleep_score * 0.30 +
        clean_score * 0.20
    )

    return {
        "pair":        f"{profile_a['full_name']} × {profile_b['full_name']}",
        "eligible":    True,
        "nlp_score":   round(nlp_score   * 100, 1),
        "sleep_score": round(sleep_score * 100, 1),
        "clean_score": round(clean_score * 100, 1),
        "final_score": round(final       * 100, 1),
    }


# ─────────────────────────────────────────────
# FIND TOP MATCHES — brute force, no clustering
# Used for testing or small datasets
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

    a_eligible = result_ab.get("eligible", True)
    c_eligible = result_ac.get("eligible", True)

    print("\n── Verdict ──────────────────────────────────")
    if not a_eligible and not c_eligible:
        print("→ Both eliminated by hard filters. No compatible match found.")
    elif not a_eligible:
        print(f"→ Best match: {profile_c['full_name']} ({result_ac['final_score']}%)")
        print(f"  ({profile_b['full_name']} was eliminated: {result_ab.get('reason')})")
    elif not c_eligible:
        print(f"→ Best match: {profile_b['full_name']} ({result_ab['final_score']}%)")
        print(f"  ({profile_c['full_name']} was eliminated: {result_ac.get('reason')})")
    else:
        if result_ab["final_score"] >= result_ac["final_score"]:
            print(f"→ Best match: {profile_b['full_name']} ({result_ab['final_score']}%)")
        else:
            print(f"→ Best match: {profile_c['full_name']} ({result_ac['final_score']}%)")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    with open("profiles_vectorized.json", "r", encoding="utf-8") as f:
        profiles = json.load(f)

    test_compatibility(profiles)
    find_top_matches(profiles[0]["email"], profiles, top_n=5)