import pandas as pd
import json
import random
import re
import unicodedata
import gender_guesser.detector as gender_detector
from langdetect import detect
from langdetect.lang_detect_exception import LangDetectException
from langdetect import DetectorFactory

DetectorFactory.seed = 42
d = gender_detector.Detector()

# ══════════════════════════════════════════════════════
# LOAD
# ══════════════════════════════════════════════════════

with open("profiles.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

df = pd.DataFrame(raw)
print(f"Loaded {len(df)} profiles")
print("\nColumns:\n", df.columns.tolist())
print("\nData types:\n", df.dtypes)
print("\nMissing values:\n", df.isnull().sum())
print("\nSample:\n", df.head(3))
print("\nBasic stats:\n", df.describe())


# ══════════════════════════════════════════════════════
# FIX 1 — EMAILS
# ══════════════════════════════════════════════════════

def name_to_email(full_name: str) -> str:
    titles = [
        "الدكتورة", "الدكتور", "الأستاذة", "الأستاذ",
        "السيدة", "السيد", "المهندس", "المهندسة",
        "الآنسة", "dr", "prof", "mr", "mrs", "ms", "md"
    ]

    normalized = unicodedata.normalize("NFKD", str(full_name))
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")

    clean = ascii_name.lower().strip()
    for title in titles:
        clean = clean.replace(title, "")

    clean = re.sub(r"[^a-z\s]", "", clean).strip()
    parts = clean.split()

    if len(parts) >= 2:
        base = f"{parts[0]}.{parts[-1]}"
    elif len(parts) == 1:
        base = parts[0]
    else:
        base = "user"

    suffix = random.randint(10, 99)
    domain = random.choice(["gmail.com", "yahoo.fr", "outlook.com", "hotmail.fr"])
    return f"{base}{suffix}@{domain}"


# ══════════════════════════════════════════════════════
# FIX 2 — GENDER
# ══════════════════════════════════════════════════════

ARABIC_FEMALE_TITLES  = ["الدكتورة", "الأستاذة", "السيدة", "الآنسة", "المهندسة"]
ARABIC_MALE_TITLES    = ["الدكتور",  "الأستاذ",  "السيد",  "المهندس"]
ARABIC_FEMALE_ENDINGS = ["ة", "اء", "ى", "ية"]

def detect_gender_from_name(full_name: str) -> str:
    name = str(full_name).strip()

    for title in ARABIC_FEMALE_TITLES:
        if title in name:
            return "female"

    for title in ARABIC_MALE_TITLES:
        if title in name:
            return "male"

    words      = name.split()
    first      = words[1] if len(words) > 1 else words[0]

    for ending in ARABIC_FEMALE_ENDINGS:
        if first.endswith(ending):
            return "female"

    ascii_first = unicodedata.normalize("NFKD", first) \
                             .encode("ascii", "ignore") \
                             .decode("ascii")

    if ascii_first:
        result = d.get_gender(ascii_first.capitalize())
        if result in ["female", "mostly_female"]:
            return "female"
        if result in ["male", "mostly_male"]:
            return "male"

    return "unknown"


# ══════════════════════════════════════════════════════
# FIX 3 — AGE / OCCUPATION
# ══════════════════════════════════════════════════════

MIN_AGE = {
    "student":    18,
    "engineer":   22,
    "doctor":     26,
    "teacher":    22,
    "freelancer": 20,
    "nurse":      21,
    "architect":  23,
    "lawyer":     24,
    "pharmacist": 23,
    "accountant": 22,
}

MAX_AGE = {
    "student":    30,
    "engineer":   45,
    "doctor":     50,
    "teacher":    50,
    "freelancer": 45,
    "nurse":      45,
    "architect":  45,
    "lawyer":     45,
    "pharmacist": 45,
    "accountant": 45,
}

def fix_age_for_occupation(row):
    occ     = str(row["occupation"]).lower().strip()
    age     = int(row["age"])
    min_age = MIN_AGE.get(occ, 18)
    max_age = MAX_AGE.get(occ, 45)

    if age < min_age:
        new_age = random.randint(min_age, min_age + 5)
        print(f"  ❌ Fixed: {str(row['full_name'])[:25]:25s} | {occ:12s} | {age} → {new_age}")
        return new_age

    if age > max_age:
        new_age = random.randint(max_age - 5, max_age)
        print(f"  ❌ Fixed: {str(row['full_name'])[:25]:25s} | {occ:12s} | {age} → {new_age}")
        return new_age

    return age


# ══════════════════════════════════════════════════════
# DUPLICATE CHECK
# ══════════════════════════════════════════════════════

def remove_duplicates(df):
    print(f"Duplicates before: {df.duplicated().sum()}")
    df = df.drop_duplicates()
    print(f"Duplicate emails:  {df.duplicated(subset=['email']).sum()}")
    df = df.drop_duplicates(subset=["email"], keep="first")
    print(f"Duplicates after:  {df.duplicated().sum()}")
    print(f"Shape after dedup: {df.shape}")
    return df


# ══════════════════════════════════════════════════════
# TEXT CLEANING
# ══════════════════════════════════════════════════════

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.strip()
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[\x00-\x1f\x7f]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_garbage_text(text: str) -> bool:
    if not isinstance(text, str) or len(text.strip()) == 0:
        return True
    if text.strip().startswith("{") or text.strip().startswith("["):
        return True
    if "```" in text or "**" in text or "##" in text:
        return True
    if len(set(text.replace(" ", ""))) < 3:
        return True
    error_keywords = ["error", "exception", "traceback", "none", "null", "undefined"]
    if text.lower().strip() in error_keywords:
        return True
    return False


# ══════════════════════════════════════════════════════
# LANGUAGE DETECTION
# ══════════════════════════════════════════════════════

# langdetect sometimes misclassifies English as Afrikaans ("af")
# so we include "af" in supported languages to avoid losing valid profiles
SUPPORTED_LANGUAGES = {"fr", "en", "ar", "af"}

def detect_language(text: str) -> str:
    try:
        return detect(str(text))
    except LangDetectException:
        return "unknown"


# ══════════════════════════════════════════════════════
# MAIN CLEANING PIPELINE
# ══════════════════════════════════════════════════════

def clean_all(df):
    print("\nStarting cleaning...\n")

    # ── Step 1: Fix emails ────────────────────────────
    print("── Step 1: Fixing emails ────────────────")
    df["email"] = df["full_name"].apply(name_to_email)
    print("✅ Emails regenerated from names\n")

    # ── Step 2: Remove duplicates ─────────────────────
    print("── Step 2: Removing duplicates ──────────")
    df = remove_duplicates(df)
    print()

    # ── Step 3: Fix data types ────────────────────────
    print("── Step 3: Validating data types ────────")
    df["age"] = pd.to_numeric(df["age"], errors="coerce")

    invalid_ages = df[(df["age"] < 16) | (df["age"] > 80)]
    print(f"Invalid ages: {len(invalid_ages)}")
    print(invalid_ages[["full_name", "age"]])

    def is_valid_email(email):
        return bool(re.match(r"^[\w\.-]+@[\w\.-]+\.\w{2,}$", str(email)))

    df["email_valid"] = df["email"].apply(is_valid_email)
    print(f"Invalid emails: {(~df['email_valid']).sum()}")

    personality_cols = [
        "personality_openness",
        "personality_conscientiousness",
        "personality_extraversion",
        "personality_agreeableness",
        "personality_neuroticism",
    ]
    for col in personality_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    print()

    # ── Step 4: Handle missing values ─────────────────
    print("── Step 4: Handling missing values ──────")
    critical = ["email", "full_name", "sleep_schedule",
                "cleanliness", "social_life"]
    before = len(df)
    df = df.dropna(subset=critical)
    print(f"Dropped {before - len(df)} rows with missing critical fields")

    for col in personality_cols:
        df[col] = df[col].fillna(3.0)

    for col in ["interests", "values", "guests", "work_style", "occupation"]:
        df[col] = df[col].fillna("")

    median_age = df["age"].median()
    df["age"]  = df["age"].fillna(median_age)
    print(f"Filled missing ages with median: {median_age}\n")

    # ── Step 5: Clean text fields ─────────────────────
    print("── Step 5: Cleaning text fields ─────────")
    text_cols = [
        "sleep_schedule", "cleanliness", "social_life",
        "guests", "work_style", "interests", "values",
        "full_name", "occupation"
    ]
    for col in text_cols:
        df[col] = df[col].apply(clean_text)
    print("Text fields cleaned ✅\n")

    # ── Step 6: Remove garbage text ───────────────────
    print("── Step 6: Removing garbage text ────────")
    for col in text_cols:
        garbage_mask  = df[col].apply(is_garbage_text)
        garbage_count = garbage_mask.sum()
        if garbage_count > 0:
            print(f"Found {garbage_count} garbage values in '{col}'")
            df.loc[garbage_mask, col] = None
    df["interests"] = df["interests"].fillna("not specified")
    df["values"]    = df["values"].fillna("not specified")
    df["work_style"] = df["work_style"].fillna("standard schedule")
    df["guests"]    = df["guests"].fillna("occasionally")
    print()

    # ── Step 7: Validate text length (NLP needs ≥10 chars) ──
    print("── Step 7: Validating text lengths ──────")
    NLP_FIELDS  = ["sleep_schedule", "cleanliness", "social_life", "guests", "work_style"]
    MIN_LENGTH  = 10
    for col in NLP_FIELDS:
        too_short = df[df[col].str.len() < MIN_LENGTH]
        if len(too_short) > 0:
            print(f"'{col}' has {len(too_short)} entries shorter than {MIN_LENGTH} chars")
            df = df[df[col].str.len() >= MIN_LENGTH]
    print(f"Shape after length validation: {df.shape}\n")

    # ── Step 8: Normalize ranges ──────────────────────
    print("── Step 8: Normalizing ranges ───────────")
    df["age"] = df["age"].clip(lower=16, upper=80)
    for col in personality_cols:
        df[col] = df[col].clip(lower=1.0, upper=5.0).round(1)
    df["age_normalized"] = (df["age"] - df["age"].min()) / \
                           (df["age"].max() - df["age"].min())
    print("Normalization done ✅\n")

    # ── Step 9: Language detection ────────────────────
    print("── Step 9: Language detection ───────────")
    df["detected_lang"] = df["sleep_schedule"].apply(detect_language)
    unsupported = df[~df["detected_lang"].isin(SUPPORTED_LANGUAGES)]
    print(f"Unsupported language profiles: {len(unsupported)}")
    if len(unsupported) > 0:
        print(unsupported[["full_name", "sleep_schedule", "detected_lang"]].to_string())
    df = df[df["detected_lang"].isin(SUPPORTED_LANGUAGES)]
    print(f"Shape after language filter: {df.shape}\n")

    # ── Step 10: Fix gender ───────────────────────────
    print("── Step 10: Fixing gender ───────────────")
    df["gender_detected"] = df["full_name"].apply(detect_gender_from_name)
    mismatches = (df["gender"] != df["gender_detected"]) & \
                 (df["gender_detected"] != "unknown")
    print(f"Fixed {mismatches.sum()} gender mismatches")
    if mismatches.sum() > 0:
        print(df.loc[mismatches, ["full_name", "gender", "gender_detected"]].to_string())
    df.loc[df["gender_detected"] != "unknown", "gender"] = \
        df.loc[df["gender_detected"] != "unknown", "gender_detected"]
    df = df.drop(columns=["gender_detected"])
    print("✅ Gender fixed\n")

    # ── Step 11: Fix age / occupation ─────────────────
    print("── Step 11: Fixing age/occupation ───────")
    df["age"] = df.apply(fix_age_for_occupation, axis=1)
    print("✅ Age/occupation fixed\n")

    # ── Cleanup helper columns ────────────────────────
    df = df.drop(columns=["email_valid"], errors="ignore")

    return df


# ══════════════════════════════════════════════════════
# FINAL REPORT
# ══════════════════════════════════════════════════════

def generate_report(df):
    personality_cols = [
        "personality_openness", "personality_conscientiousness",
        "personality_extraversion", "personality_agreeableness",
        "personality_neuroticism",
    ]
    NLP_FIELDS = [
        "sleep_schedule", "cleanliness",
        "social_life", "guests", "work_style"
    ]

    print("\n" + "=" * 50)
    print("   FINAL DATA QUALITY REPORT")
    print("=" * 50)
    print(f"\n Total profiles:         {len(df)}")
    print(f" Missing values total:   {df.isnull().sum().sum()}")
    print(f" Duplicate emails:       {df.duplicated(subset=['email']).sum()}")

    print("\n── Text field lengths ──────────────────")
    for col in NLP_FIELDS:
        avg_len = df[col].str.len().mean()
        min_len = df[col].str.len().min()
        print(f"  {col:20s} avg={avg_len:.0f} chars  min={min_len:.0f}")

    print("\n── Personality score ranges ────────────")
    for col in personality_cols:
        print(
            f"  {col:35s} "
            f"min={df[col].min():.1f}  "
            f"max={df[col].max():.1f}  "
            f"mean={df[col].mean():.1f}"
        )

    print("\n── Age distribution ────────────────────")
    print(f"  min={df['age'].min():.0f}  max={df['age'].max():.0f}  mean={df['age'].mean():.1f}")

    if "detected_lang" in df.columns:
        print("\n── Language distribution ───────────────")
        print(df["detected_lang"].value_counts().to_string())

    print("\n✅ Data is clean and ready")
    print("=" * 50)


# ══════════════════════════════════════════════════════
# RUN
# ══════════════════════════════════════════════════════

df      = clean_all(df)
generate_report(df)

# Drop helper columns before saving
save_df = df.drop(
    columns=["detected_lang", "age_normalized"],
    errors="ignore"
).reset_index(drop=True)

# Save
save_df.to_json(
    "profiles_clean.json",
    orient="records",
    force_ascii=False,
    indent=2
)
save_df.to_csv(
    "profiles_clean.csv",
    index=False,
    encoding="utf-8-sig"
)

print(f"\n✅ Saved {len(save_df)} clean profiles → profiles_clean.json")
print(f"✅ Saved {len(save_df)} clean profiles → profiles_clean.csv")