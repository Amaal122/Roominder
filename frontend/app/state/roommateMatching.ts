import { API_BASE } from "@/constants/api";
import { getAuthToken } from "./auth";


export type RoommateMatchProfile = {
  id: string;
  name: string;
  age: number;
  role: string;
  location: string;
  about: string;
  lifestyle: string[];
  reasons?: string[];
  match: number;
  image?: string | null;
};

export type RoommateProfileDetail = RoommateMatchProfile & {
  profile_id?: number | null;
  user_id?: number | null;
  radius?: number | null;
  occupation?: string | null;
  image_url?: string | null;
  gender?: string | null;
  looking_for?: string | null;
  sleep_schedule?: string | null;
  cleanliness?: string | null;
  social_life?: string | null;
  guests?: string | null;
  work_style?: string | null;
  interests?: string | null;
  values?: string | null;
};

type SavedMatchRecord = {
  matched_id?: string | number | null;
};

const getAccessToken = async (providedToken?: string | null) => {
  if (providedToken) return providedToken;
  return getAuthToken();
};

const toHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const normalizeProfile = (value: unknown): RoommateMatchProfile | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const lifestyle = Array.isArray(raw.lifestyle)
    ? raw.lifestyle.filter((item): item is string => typeof item === "string")
    : [];
  const age = Number(raw.age);
  const match = Number(raw.match);

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    age: Number.isFinite(age) ? age : 0,
    role: String(raw.role ?? raw.occupation ?? ""),
    location: String(raw.location ?? ""),
    about: String(raw.about ?? ""),
    lifestyle,
    reasons: Array.isArray(raw.reasons)
      ? raw.reasons.filter((item): item is string => typeof item === "string")
      : [],
    match: Number.isFinite(match) ? match : 0,
    image: typeof raw.image === "string" ? raw.image : null,
  };
};

const normalizeProfileDetail = (value: unknown): RoommateProfileDetail | null => {
  const base = normalizeProfile(value);
  if (!base || !value || typeof value !== "object") return base;

  const raw = value as Record<string, unknown>;
  const profileId = Number(raw.profile_id);
  const userId = Number(raw.user_id);
  const radius = Number(raw.radius);

  return {
    ...base,
    profile_id: Number.isFinite(profileId) ? profileId : null,
    user_id: Number.isFinite(userId) ? userId : null,
    radius: Number.isFinite(radius) ? radius : null,
    occupation: typeof raw.occupation === "string" ? raw.occupation : null,
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
    gender: typeof raw.gender === "string" ? raw.gender : null,
    looking_for: typeof raw.looking_for === "string" ? raw.looking_for : null,
    sleep_schedule: typeof raw.sleep_schedule === "string" ? raw.sleep_schedule : null,
    cleanliness: typeof raw.cleanliness === "string" ? raw.cleanliness : null,
    social_life: typeof raw.social_life === "string" ? raw.social_life : null,
    guests: typeof raw.guests === "string" ? raw.guests : null,
    work_style: typeof raw.work_style === "string" ? raw.work_style : null,
    interests: typeof raw.interests === "string" ? raw.interests : null,
    values: typeof raw.values === "string" ? raw.values : null,
  };
};

export const loadRoommateRecommendations = async (providedToken?: string | null) => {
  const token = await getAccessToken(providedToken);
  if (!token) return [];

  const response = await fetch(`${API_BASE}/roommates/matches`, {
    headers: toHeaders(token),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to load roommate recommendations");
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];

  return data
    .map(normalizeProfile)
    .filter((profile): profile is RoommateMatchProfile => Boolean(profile?.id));
};

export const saveRoommateMatch = async (
  matchedProfileId: string,
  providedToken?: string | null,
) => {
  const token = await getAccessToken(providedToken);
  if (!token) {
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${API_BASE}/matches/${matchedProfileId}`, {
    method: "POST",
    headers: toHeaders(token),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to save roommate match");
  }
};

export const loadSavedRoommateMatches = async (providedToken?: string | null) => {
  const token = await getAccessToken(providedToken);
  if (!token) return [];

  const savedResponse = await fetch(`${API_BASE}/matches/`, {
    headers: toHeaders(token),
  });

  if (!savedResponse.ok) {
    const detail = await savedResponse.text();
    throw new Error(detail || "Failed to load saved roommate matches");
  }

  const savedMatches = (await savedResponse.json()) as SavedMatchRecord[];
  const savedIds = new Set(
    savedMatches
      .map((item) => item.matched_id)
      .filter((value): value is string | number => value != null)
      .map((value) => String(value)),
  );

  if (savedIds.size === 0) return [];

  const recommendations = await loadRoommateRecommendations(token);
  return recommendations.filter((profile) => savedIds.has(profile.id));
};

export const loadRoommateProfile = async (
  profileId: string,
  providedToken?: string | null,
) => {
  const token = await getAccessToken(providedToken);
  if (!token) return null;

  const response = await fetch(`${API_BASE}/roommates/${profileId}`, {
    headers: toHeaders(token),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to load roommate profile");
  }

  return normalizeProfileDetail(await response.json());
};
