import random
import json
import os
from pathlib import Path
import anthropic
from faker import Faker

fake = Faker(["fr_FR", "ar_AA", "en_US"])

_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=_API_KEY) if _API_KEY else None

# ══════════════════════════════════════════════════════
# TEXT POOLS — full sentences instead of single words
# ══════════════════════════════════════════════════════

LOCATIONS = [
    "Tunis",
    "Sfax",
    "Sousse",
    "Bizerte",
    "Monastir",
    "Nabeul",
    "Gabès",
    "Ariana",
    "Ben Arous",
    "La Marsa",
]

SLEEP_SENTENCES = [
    # Early
    "I go to bed at 9pm and wake up at 5am every day without exception",
    "I sleep at 10pm sharp and wake up at 6am, I need a strict routine",
    "I am in bed by 10pm and up at 6am, early mornings are my favourite time",
    # Normal
    "I usually wind down around 11pm and wake up naturally around 7am",
    "I sleep around midnight and wake up around 8am feeling refreshed",
    "I go to sleep around 11pm and get up at 7am on most days",
    # Late
    "I rarely sleep before 2am, night is when I feel most alive and creative",
    "I stay up until 3am most nights gaming or watching series",
    "I never sleep before 1am, I do my best work late at night",
]

CLEAN_SENTENCES = [
    # High
    "I clean every single day without exception, everything must be in its place",
    "I am very particular about cleanliness, dishes must be washed immediately after use",
    "I keep the apartment spotless at all times, cleanliness is a top priority for me",
    # Medium
    "I do a proper clean every weekend but I am not obsessive during the week",
    "I keep things reasonably tidy and clean up after myself consistently",
    "I maintain a clean space but I will not stress over a cup left out overnight",
    # Low
    "I clean when it starts bothering me, maybe every few weeks or so",
    "I am pretty relaxed about cleanliness, I tidy up when I have the motivation",
    "Cleanliness is not my priority, I clean occasionally but I am not messy",
]

SOCIAL_SENTENCES = [
    # Introvert
    "I am deeply introverted and need complete silence at home to recharge after work",
    "I prefer quiet evenings alone at home, social interactions drain my energy quickly",
    "I need the apartment to be calm and quiet, I recharge by spending time alone",
    # Ambivert
    "I enjoy socializing a few times a week but also treasure my quiet evenings at home",
    "I balance social time and alone time depending on how my week has been going",
    "I like having people around sometimes but I equally enjoy peaceful evenings alone",
    # Extrovert
    "I am very outgoing and thrive when the apartment is full of energy and people",
    "I love having people around me constantly, a lively home makes me happy",
    "I am extremely social and need regular human interaction to feel good at home",
]

GUESTS_SENTENCES = [
    # Never
    "I never have anyone over, my home is my private sanctuary and I need it that way",
    "I keep my home completely private, zero guests ever, I am very protective of my space",
    "I do not invite people to my home at all, I prefer meeting friends outside",
    # Rarely
    "I occasionally have one close friend over, maybe once or twice a month at most",
    "Maybe once a month I will have a friend over for dinner, always planned ahead",
    "I rarely have guests, perhaps a close friend visits every few weeks maximum",
    # Sometimes
    "I host a small dinner maybe once or twice a month on weekends with advance notice",
    "Friends come over sometimes, usually planned a few days ahead on weekends",
    "I have people over occasionally, maybe a couple of times a month for dinner",
    # Often
    "My friends are over almost every weekend, I love hosting gatherings at home",
    "I regularly have people over for dinner or games, hosting is one of my favourite things",
    "I host friends frequently, almost every weekend there is someone at my place",
]

WORK_SENTENCES = [
    # Remote
    "I work fully remote so I am home all day, I respect quiet hours and use headphones",
    "I work from home every single day, I need a calm environment during work hours",
    "I am remote full time so I spend the whole day at home working from my desk",
    # Hybrid
    "I go to the office three days a week and work from home the other two days",
    "My schedule is hybrid, I am out most mornings but home by 5pm regularly",
    "I work hybrid so some days I am home, some days I am at the office until evening",
    # On-site
    "I leave at 7am and get back at 7pm every day, I am barely home on weekdays",
    "I work on-site full time so the apartment is completely yours during the day",
    "I am at the office every single day from 8am to 6pm, home only in the evenings",
]

# Map sentence → categorical value for Big Five algorithm
def sentence_to_category(sentence: str, field: str) -> str:
    sentence = sentence.lower()

    if field == "sleep":
        if any(w in sentence for w in ["9pm", "10pm", "5am", "6am", "early", "strict routine"]):
            return "early"
        if any(w in sentence for w in ["2am", "3am", "1am", "night", "late"]):
            return "late"
        return "normal"

    if field == "clean":
        if any(w in sentence for w in ["every day", "spotless", "immediately", "top priority"]):
            return "high"
        if any(w in sentence for w in ["occasionally", "bothering", "few weeks", "relaxed", "motivation"]):
            return "low"
        return "medium"

    if field == "social":
        if any(w in sentence for w in ["introverted", "silence", "alone", "drain", "quiet evenings"]):
            return "introvert"
        if any(w in sentence for w in ["outgoing", "thrive", "constantly", "extremely social"]):
            return "extrovert"
        return "ambivert"

    if field == "guests":
        if any(w in sentence for w in ["never", "zero", "do not invite", "not at all"]):
            return "never"
        if any(w in sentence for w in ["rarely", "once a month", "occasionally", "few weeks"]):
            return "rarely"
        if any(w in sentence for w in ["every weekend", "frequently", "regularly", "almost every"]):
            return "often"
        return "sometimes"

    if field == "work":
        if any(w in sentence for w in ["remote", "home all day", "home every", "from home every"]):
            return "remote"
        if any(w in sentence for w in ["7am", "8am", "on-site", "office every", "barely home"]):
            return "on-site"
        return "hybrid"

    return "normal"


INTERESTS_POOL = [
    "hiking", "cooking", "gaming", "music", "reading",
    "football", "yoga", "travel", "cinema", "photography",
    "art", "coding", "gym", "dancing", "volunteering"
]

VALUES_POOL = [
    "respect", "cleanliness", "privacy", "honesty",
    "punctuality", "tolerance", "communication", "loyalty"
]

PERSONA_HINTS = [
    "Tunisian engineering student, introverted, loves coding and anime",
    "French expat working remotely, yoga enthusiast, very clean",
    "Young doctor, irregular hours, quiet, needs good sleep",
    "Extroverted marketing student, loves cooking for friends",
    "Freelance photographer, creative, flexible schedule",
    "Sport-loving student, early riser, very social",
    "Quiet nurse with night shifts, needs daytime silence",
    "Architect student, creative, messy but respectful",
    "Business student, ambitious, loves networking",
    "Teacher, organized, homebody, loves reading",
]


# ══════════════════════════════════════════════════════
# BIG FIVE ALGORITHM
# ══════════════════════════════════════════════════════

def calculate_big_five_from_profile(
    sleep_schedule: str,
    cleanliness: str,
    social_life: str,
    guests: str,
    work_style: str,
    occupation: str,
) -> dict:
    # ── EXTRAVERSION ──────────────────────────────────
    social_to_extra = {"extrovert": 5.0, "ambivert": 3.0, "introvert": 1.5}
    guests_to_extra = {"often": 5.0, "sometimes": 3.5, "rarely": 2.0, "never": 1.0}
    sleep_to_extra  = {"late": 4.0, "normal": 3.0, "early": 2.5}

    extraversion = (
        social_to_extra.get(social_life, 3.0)  * 0.5 +
        guests_to_extra.get(guests, 3.0)        * 0.3 +
        sleep_to_extra.get(sleep_schedule, 3.0) * 0.2
    )

    # ── CONSCIENTIOUSNESS ─────────────────────────────
    clean_to_con = {"high": 5.0, "medium": 3.0, "low": 1.5}
    work_to_con  = {"on-site": 4.5, "hybrid": 3.5, "remote": 2.5}
    sleep_to_con = {"early": 4.5, "normal": 3.0, "late": 2.0}

    conscientiousness = (
        clean_to_con.get(cleanliness, 3.0)   * 0.5 +
        work_to_con.get(work_style, 3.0)      * 0.3 +
        sleep_to_con.get(sleep_schedule, 3.0) * 0.2
    )

    # ── OPENNESS ──────────────────────────────────────
    occ_to_open = {
        "architect": 5.0, "freelancer": 4.5, "engineer": 4.0,
        "student": 4.0, "doctor": 3.5, "teacher": 3.5, "nurse": 3.0,
    }
    social_to_open = {"extrovert": 4.5, "ambivert": 3.5, "introvert": 2.0}
    work_to_open   = {"remote": 4.5, "hybrid": 3.5, "on-site": 2.5}

    openness = (
        occ_to_open.get(occupation, 3.0)     * 0.4 +
        social_to_open.get(social_life, 3.0) * 0.3 +
        work_to_open.get(work_style, 3.0)    * 0.3
    )

    # ── AGREEABLENESS ─────────────────────────────────
    guests_to_agree = {"often": 5.0, "sometimes": 4.0, "rarely": 2.5, "never": 1.5}
    social_to_agree = {"extrovert": 4.5, "ambivert": 3.5, "introvert": 2.0}
    clean_to_agree  = {"high": 2.5, "medium": 3.5, "low": 4.5}

    agreeableness = (
        guests_to_agree.get(guests, 3.0)      * 0.4 +
        social_to_agree.get(social_life, 3.0) * 0.4 +
        clean_to_agree.get(cleanliness, 3.0)  * 0.2
    )

    # ── NEUROTICISM ───────────────────────────────────
    clean_to_neuro  = {"high": 4.5, "medium": 2.5, "low": 1.5}
    sleep_to_neuro  = {"early": 2.0, "normal": 3.0, "late": 4.0}
    guests_to_neuro = {"never": 4.0, "rarely": 3.0, "sometimes": 2.5, "often": 2.0}

    neuroticism = (
        clean_to_neuro.get(cleanliness, 3.0)    * 0.4 +
        sleep_to_neuro.get(sleep_schedule, 3.0) * 0.3 +
        guests_to_neuro.get(guests, 3.0)        * 0.3
    )

    def add_noise(value: float) -> float:
        noisy = value + random.uniform(-0.3, 0.3)
        return round(max(1.0, min(5.0, noisy)), 1)

    return {
        "personality_extraversion":      add_noise(extraversion),
        "personality_conscientiousness": add_noise(conscientiousness),
        "personality_openness":          add_noise(openness),
        "personality_agreeableness":     add_noise(agreeableness),
        "personality_neuroticism":       add_noise(neuroticism),
    }


# ══════════════════════════════════════════════════════
# AI PROFILE GENERATOR
# ══════════════════════════════════════════════════════

def generate_ai_profile(persona_hint: str) -> dict:
    if client is None:
        return {
            "interests": ", ".join(random.sample(INTERESTS_POOL, 4)),
            "values":    ", ".join(random.sample(VALUES_POOL, 3)),
        }

    prompt = f"""
    Generate a realistic roommate seeker profile for: {persona_hint}

    Return ONLY a valid JSON object with exactly these fields:
    - interests (4-5 items, comma separated)
    - values (3 items, comma separated)

    No explanation. No markdown. Just the raw JSON.
    Example: {{"interests": "cooking, music, travel, yoga", "values": "respect, honesty, cleanliness"}}
    """

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


# ══════════════════════════════════════════════════════
# BUILD ONE FULL PROFILE
# ══════════════════════════════════════════════════════

def generate_profile(persona_hint: str) -> dict:
    ai_fields = generate_ai_profile(persona_hint)

    # Pick full sentence values
    sleep_sentence  = random.choice(SLEEP_SENTENCES)
    clean_sentence  = random.choice(CLEAN_SENTENCES)
    social_sentence = random.choice(SOCIAL_SENTENCES)
    guests_sentence = random.choice(GUESTS_SENTENCES)
    work_sentence   = random.choice(WORK_SENTENCES)
    occ             = random.choice([
        "student", "engineer", "doctor",
        "teacher", "freelancer", "nurse", "architect"
    ])

    # Convert sentences → categories for Big Five algorithm
    sleep_cat  = sentence_to_category(sleep_sentence,  "sleep")
    clean_cat  = sentence_to_category(clean_sentence,  "clean")
    social_cat = sentence_to_category(social_sentence, "social")
    guests_cat = sentence_to_category(guests_sentence, "guests")
    work_cat   = sentence_to_category(work_sentence,   "work")

    # Derive Big Five from categories
    big_five = calculate_big_five_from_profile(
        sleep_schedule=sleep_cat,
        cleanliness=clean_cat,
        social_life=social_cat,
        guests=guests_cat,
        work_style=work_cat,
        occupation=occ,
    )

    return {
        "full_name":      fake.name(),
        "email":          fake.unique.email(),
        "age":            random.randint(18, 35),
        "gender":         random.choice(["male", "female"]),
        "occupation":     occ,
        "location":       random.choice(LOCATIONS),   # ← NEW FIELD

        # Full sentences — used for NLP
        "sleep_schedule": sleep_sentence,
        "cleanliness":    clean_sentence,
        "social_life":    social_sentence,
        "guests":         guests_sentence,
        "work_style":     work_sentence,

        # AI generated
        "interests": ai_fields.get("interests", "music, cooking"),
        "values":    ai_fields.get("values",    "respect, honesty"),

        # Big Five — derived from sentence categories
        "personality_openness":          big_five["personality_openness"],
        "personality_conscientiousness": big_five["personality_conscientiousness"],
        "personality_extraversion":      big_five["personality_extraversion"],
        "personality_agreeableness":     big_five["personality_agreeableness"],
        "personality_neuroticism":       big_five["personality_neuroticism"],
    }


# ══════════════════════════════════════════════════════
# GENERATE FULL DATASET
# ══════════════════════════════════════════════════════

def generate_dataset(count: int = 100) -> list[dict]:
    profiles = []
    print(f"Generating {count} profiles via Claude API...")

    for i in range(count):
        hint = PERSONA_HINTS[i % len(PERSONA_HINTS)]
        try:
            profile = generate_profile(hint)
            profiles.append(profile)
            print(
                f"  ✅ {i+1}/{count} — {profile['full_name']:30s} | "
                f"extra={profile['personality_extraversion']:.1f} "
                f"con={profile['personality_conscientiousness']:.1f} "
                f"open={profile['personality_openness']:.1f} "
                f"agree={profile['personality_agreeableness']:.1f} "
                f"neuro={profile['personality_neuroticism']:.1f}"
            )
        except Exception as e:
            print(f"  ❌ {i+1}/{count} failed: {e}")
            profiles.append(generate_fallback_profile())

    return profiles


# ══════════════════════════════════════════════════════
# FALLBACK (no API)
# ══════════════════════════════════════════════════════

def generate_fallback_profile() -> dict:
    sleep_sentence  = random.choice(SLEEP_SENTENCES)
    clean_sentence  = random.choice(CLEAN_SENTENCES)
    social_sentence = random.choice(SOCIAL_SENTENCES)
    guests_sentence = random.choice(GUESTS_SENTENCES)
    work_sentence   = random.choice(WORK_SENTENCES)
    occ             = random.choice(["student", "engineer", "freelancer"])

    sleep_cat  = sentence_to_category(sleep_sentence,  "sleep")
    clean_cat  = sentence_to_category(clean_sentence,  "clean")
    social_cat = sentence_to_category(social_sentence, "social")
    guests_cat = sentence_to_category(guests_sentence, "guests")
    work_cat   = sentence_to_category(work_sentence,   "work")

    big_five = calculate_big_five_from_profile(
        sleep_schedule=sleep_cat,
        cleanliness=clean_cat,
        social_life=social_cat,
        guests=guests_cat,
        work_style=work_cat,
        occupation=occ,
    )

    return {
        "full_name":      fake.name(),
        "email":          fake.unique.email(),
        "age":            random.randint(18, 35),
        "gender":         random.choice(["male", "female"]),
        "occupation":     occ,
        "location":       random.choice(LOCATIONS),
        "sleep_schedule": sleep_sentence,
        "cleanliness":    clean_sentence,
        "social_life":    social_sentence,
        "guests":         guests_sentence,
        "work_style":     work_sentence,
        "interests":      ", ".join(random.sample(INTERESTS_POOL, 4)),
        "values":         ", ".join(random.sample(VALUES_POOL, 3)),
        "personality_openness":          big_five["personality_openness"],
        "personality_conscientiousness": big_five["personality_conscientiousness"],
        "personality_extraversion":      big_five["personality_extraversion"],
        "personality_agreeableness":     big_five["personality_agreeableness"],
        "personality_neuroticism":       big_five["personality_neuroticism"],
    }


# ══════════════════════════════════════════════════════
# FAKE FEEDBACK
# ══════════════════════════════════════════════════════

def generate_fake_feedback(profiles: list[dict], n_interactions: int = 1000) -> list[dict]:
    feedbacks = []
    print(f"Generating {n_interactions} fake interactions...")

    for _ in range(n_interactions):
        user    = random.choice(profiles)
        matched = random.choice(profiles)

        if user["email"] == matched["email"]:
            continue

        # Compare sentence meaning via shared keywords
        same_sleep  = sentence_to_category(user["sleep_schedule"], "sleep") == \
                      sentence_to_category(matched["sleep_schedule"], "sleep")
        same_clean  = sentence_to_category(user["cleanliness"], "clean") == \
                      sentence_to_category(matched["cleanliness"], "clean")
        same_social = sentence_to_category(user["social_life"], "social") == \
                      sentence_to_category(matched["social_life"], "social")

        compatibility_hints = sum([same_sleep, same_clean, same_social])
        liked_probability   = 0.2 + (compatibility_hints * 0.2)

        action = "liked" if random.random() < liked_probability else "skipped"
        rating = random.randint(3, 5) if action == "liked" else random.randint(1, 3)

        feedbacks.append({
            "user_email":    user["email"],
            "matched_email": matched["email"],
            "action":        action,
            "rating":        rating,
        })

    print(f"  ✅ {len(feedbacks)} interactions generated")
    return feedbacks


# ══════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════

def _write_json(path: Path, data) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    out_dir = Path(__file__).resolve().parent

    profiles  = generate_dataset(count=100)
    feedbacks = generate_fake_feedback(profiles, n_interactions=1000)

    profiles_path  = out_dir / "profiles.json"
    feedbacks_path = out_dir / "feedbacks.json"

    _write_json(profiles_path, profiles)
    _write_json(feedbacks_path, feedbacks)

    print(f"\nWrote {len(profiles)} profiles  → {profiles_path}")
    print(f"Wrote {len(feedbacks)} feedbacks → {feedbacks_path}")


if __name__ == "__main__":
    main()