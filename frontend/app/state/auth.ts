import { Platform } from "react-native";

let authToken: string | null = null;
let AsyncStorage: any = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AsyncStorage = require("@react-native-async-storage/async-storage").default;
  } catch {
    console.warn("[Auth] AsyncStorage not available");
  }
}

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  if (Platform.OS === "web") {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  } else if (AsyncStorage) {
    if (token) {
      await AsyncStorage.setItem("authToken", token);
    } else {
      await AsyncStorage.removeItem("authToken");
    }
  }
};

export const getAuthToken = async () => {
  if (authToken) return authToken;
  if (Platform.OS === "web") {
    authToken = localStorage.getItem("authToken");
    return authToken;
  } else if (AsyncStorage) {
    authToken = await AsyncStorage.getItem("authToken");
    return authToken;
  }
  return null;
};

export const clearAuthToken = async () => {
  authToken = null;
  if (Platform.OS === "web") {
    localStorage.removeItem("authToken");
  } else if (AsyncStorage) {
    await AsyncStorage.removeItem("authToken");
  }
};