import { getAuthToken } from "./auth";

const API_BASE = "http://127.0.0.1:8001";

export type RoommateMatchProfile = {
  id: string;
  name: string;
  age: number;
  role: string;
  location: string;
  about: string;
  lifestyle: string[];
  match: number;
  image?: string | null;
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
    match: Number.isFinite(match) ? match : 0,
    image: typeof raw.image === "string" ? raw.image : null,
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
