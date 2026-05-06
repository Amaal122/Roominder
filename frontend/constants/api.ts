import { Platform } from "react-native";

const localApiBase = Platform.OS === "android"
  ? "http://10.0.2.2:8001"
  : "http://127.0.0.1:8001";

export const API_BASE = (
  process.env.EXPO_PUBLIC_API_BASE_URL || localApiBase
).replace(/\/+$/, "");

export const WS_BASE = API_BASE.replace(/^http/, "ws");

export const apiUrl = (path: string) =>
  path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`;

export const mediaUrl = (value?: string | null) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return apiUrl(value);
};
