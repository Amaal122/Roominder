# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from sentence_transformers import SentenceTransformer
import numpy as np
import json

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
# MAIN — reads profiles_clean.json, saves profiles_vectorized.json
# ─────────────────────────────────────────────
if __name__ == "__main__":
    with open("profiles_clean.json", "r", encoding="utf-8") as f:
        profiles = json.load(f)

    print(f"\nVectorizing {len(profiles)} profiles...")
    for i, profile in enumerate(profiles):
        profile["text_vector"]  = vectorize_profile(profile)
        profile["final_vector"] = build_final_vector(profile)
        print(f"  ✅ {i+1}/{len(profiles)} — {profile['full_name']}")

    with open("profiles_vectorized.json", "w", encoding="utf-8") as f:
        json.dump(profiles, f, ensure_ascii=False, indent=2)

    print("\n✅ Saved profiles_vectorized.json")