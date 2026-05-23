# backend/seed/data_processing.py
import pandas as pd
import json

# Load generated data
with open("profiles.json", "r", encoding="utf-8") as f:
    raw_profiles = json.load(f)

df = pd.DataFrame(raw_profiles)

# ── First look ─────────────────────────────────────────
print("Shape:", df.shape)               # (100, 17) → 100 rows, 17 columns
print("\nColumns:\n", df.columns.tolist())
print("\nData types:\n", df.dtypes)
print("\nMissing values:\n", df.isnull().sum())
print("\nSample:\n", df.head(3))
print("\nBasic stats:\n", df.describe())
# ── Check duplicates ───────────────────────────────────
print("Duplicates before:", df.duplicated().sum())

# Remove fully identical rows
df = df.drop_duplicates()

# Remove duplicate emails (same person registered twice)
print("Duplicate emails:", df.duplicated(subset=["email"]).sum())
df = df.drop_duplicates(subset=["email"], keep="first")

print("Duplicates after:", df.duplicated().sum())
print("Shape after dedup:", df.shape)
# ── Age ───────────────────────────────────────────────
# Convert to numeric, force errors to NaN
df["age"] = pd.to_numeric(df["age"], errors="coerce")

# Flag invalid ages
invalid_ages = df[(df["age"] < 16) | (df["age"] > 80)]
print(f"Invalid ages: {len(invalid_ages)}")
print(invalid_ages[["full_name", "age"]])

# ── Email format ───────────────────────────────────────
import re

def is_valid_email(email):
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(pattern, str(email)))

df["email_valid"] = df["email"].apply(is_valid_email)
invalid_emails = df[~df["email_valid"]]
print(f"Invalid emails: {len(invalid_emails)}")

# ── Personality scores ─────────────────────────────────
personality_cols = [
    "personality_openness",
    "personality_conscientiousness",
    "personality_extraversion",
    "personality_agreeableness",
    "personality_neuroticism",
]

for col in personality_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")
    out_of_range = df[(df[col] < 1) | (df[col] > 5)]
    if len(out_of_range) > 0:
        print(f"Out of range in {col}: {len(out_of_range)} rows")

# ── Strategy per column ────────────────────────────────

# 1. Critical fields → drop row if missing
critical_fields = ["email", "full_name", "sleep_schedule",
                   "cleanliness", "social_life"]

before = len(df)
df = df.dropna(subset=critical_fields)
after = len(df)
print(f"Dropped {before - after} rows with missing critical fields")

# 2. Personality scores → fill with neutral value (3.0 = middle)
for col in personality_cols:
    missing = df[col].isnull().sum()
    if missing > 0:
        print(f"Filling {missing} missing values in {col} with 3.0")
        df[col] = df[col].fillna(3.0)

# 3. Optional text fields → fill with empty string
optional_text = ["interests", "values", "guests", "work_style", "occupation"]
for col in optional_text:
    df[col] = df[col].fillna("")

# 4. Age → fill with median age
median_age = df["age"].median()
df["age"] = df["age"].fillna(median_age)
print(f"Filled missing ages with median: {median_age}")
import unicodedata

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""

    # 1. Strip leading/trailing whitespace
    text = text.strip()

    # 2. Normalize unicode (fix encoding issues)
    text = unicodedata.normalize("NFKC", text)

    # 3. Remove control characters
    text = re.sub(r"[\x00-\x1f\x7f]", "", text)

    # 4. Collapse multiple spaces/newlines
    text = re.sub(r"\s+", " ", text)

    # 5. Remove lone special characters (artifacts from generation)
    text = re.sub(r"[^\w\s\.,;:!?'\"-]", "", text)

    return text.strip()


text_columns = [
    "sleep_schedule", "cleanliness", "social_life",
    "guests", "work_style", "interests", "values",
    "full_name", "occupation"
]

for col in text_columns:
    df[col] = df[col].apply(clean_text)

print("Text fields cleaned ✅")
def is_garbage_text(text: str) -> bool:
    if not isinstance(text, str) or len(text.strip()) == 0:
        return True

    # Too short to be meaningful
    if len(text.strip()) < 5:
        return True

    # Looks like raw JSON leaked into the field
    if text.strip().startswith("{") or text.strip().startswith("["):
        return True

    # Contains markdown artifacts
    if "```" in text or "**" in text or "##" in text:
        return True

    # Just repeated characters (aaaaaaa / ......)
    if len(set(text.replace(" ", ""))) < 3:
        return True

    # Looks like an error message
    error_keywords = ["error", "exception", "traceback", "none", "null", "undefined"]
    if text.lower().strip() in error_keywords:
        return True

    return False


# Check each text column for garbage
for col in text_columns:
    garbage_mask = df[col].apply(is_garbage_text)
    garbage_count = garbage_mask.sum()

    if garbage_count > 0:
        print(f"Found {garbage_count} garbage values in '{col}'")
        # Replace garbage with NaN then handle
        df.loc[garbage_mask, col] = None

# After marking garbage → re-apply missing value strategy
df["interests"]  = df["interests"].fillna("not specified")
df["values"]     = df["values"].fillna("not specified")
df["work_style"] = df["work_style"].fillna("standard schedule")
df["guests"]     = df["guests"].fillna("occasionally")
NLP_FIELDS = [
    "sleep_schedule", "cleanliness",
    "social_life", "guests", "work_style"
]

MIN_LENGTH = 10  # characters

for col in NLP_FIELDS:
    too_short = df[df[col].str.len() < MIN_LENGTH]
    if len(too_short) > 0:
        print(f"'{col}' has {len(too_short)} entries shorter than {MIN_LENGTH} chars")
        print(too_short[[col]])

        # Drop those rows — they're useless for NLP
        df = df[df[col].str.len() >= MIN_LENGTH]

print(f"Shape after length validation: {df.shape}")
# ── Age: clip to realistic range ───────────────────────
df["age"] = df["age"].clip(lower=16, upper=80)

# ── Personality: clip to 1–5 range ────────────────────
for col in personality_cols:
    df[col] = df[col].clip(lower=1.0, upper=5.0)
    df[col] = df[col].round(1)  # keep 1 decimal

# ── Normalize age to 0–1 for ML ───────────────────────
df["age_normalized"] = (df["age"] - df["age"].min()) / \
                       (df["age"].max() - df["age"].min())

print("Normalization done ✅")
# pip install langdetect
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

DetectorFactory.seed = 42  # reproducible results

SUPPORTED_LANGUAGES = {"fr", "en", "ar", "af"}

def detect_language(text: str) -> str:
    try:
        return detect(text)
    except LangDetectException:
        return "unknown"

# Check language on the bio/main text fields
df["detected_lang"] = df["sleep_schedule"].apply(detect_language)

# Flag unsupported languages
unsupported = df[~df["detected_lang"].isin(SUPPORTED_LANGUAGES)]
print(f"Unsupported language profiles: {len(unsupported)}")
print(unsupported[["full_name", "sleep_schedule", "detected_lang"]])

# Drop them — NLP model won't handle them well
df = df[df["detected_lang"].isin(SUPPORTED_LANGUAGES)]
print(f"Shape after language filter: {df.shape}")
def generate_report(df: pd.DataFrame):
    print("\n" + "="*50)
    print("   FINAL DATA QUALITY REPORT")
    print("="*50)

    print(f"\n Total profiles:         {len(df)}")
    print(f" Missing values total:   {df.isnull().sum().sum()}")
    print(f" Duplicate emails:       {df.duplicated(subset=['email']).sum()}")

    print("\n── Text field lengths ──────────────────")
    for col in NLP_FIELDS:
        avg_len = df[col].str.len().mean()
        min_len = df[col].str.len().min()
        print(f"  {col:20s} avg={avg_len:.0f} chars  min={min_len}")

    print("\n── Personality score ranges ────────────")
    for col in personality_cols:
        print(f"  {col:35s} min={df[col].min():.1f}  max={df[col].max():.1f}  mean={df[col].mean():.1f}")

    print("\n── Age distribution ────────────────────")
    print(f"  min={df['age'].min():.0f}  max={df['age'].max():.0f}  mean={df['age'].mean():.1f}")

    print("\n── Language distribution ───────────────")
    print(df["detected_lang"].value_counts().to_string())

    print("\n✅ Data is clean and ready")
    print("="*50)

generate_report(df)
