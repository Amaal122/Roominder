import { Platform } from "react-native";

let authToken: string | null = null;
let AsyncStorage: any = null;
let asyncStoragePromise: Promise<any> | null = null;
const WEB_AUTH_TOKEN_KEY = "authToken";

const readWebToken = () => {
  if (typeof sessionStorage !== "undefined") {
    const tabToken = sessionStorage.getItem(WEB_AUTH_TOKEN_KEY);
    if (tabToken) {
      return tabToken;
    }
  }

  if (typeof localStorage !== "undefined") {
    const legacyToken = localStorage.getItem(WEB_AUTH_TOKEN_KEY);
    if (legacyToken) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(WEB_AUTH_TOKEN_KEY, legacyToken);
      }
      localStorage.removeItem(WEB_AUTH_TOKEN_KEY);
      return legacyToken;
    }
  }

  return null;
};

const getAsyncStorage = async () => {
  if (Platform.OS === "web") {
    return null;
  }

  if (AsyncStorage) {
    return AsyncStorage;
  }

  if (!asyncStoragePromise) {
    asyncStoragePromise = (async () => {
      try {
        const storageModule = await import("@react-native-async-storage/async-storage");
        AsyncStorage = storageModule?.default ?? storageModule;
        return AsyncStorage;
      } catch (error) {
        console.warn("[Auth] AsyncStorage not available, falling back to no-op storage", error);
        return null;
      }
    })();
  }

  return asyncStoragePromise;
};

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(WEB_AUTH_TOKEN_KEY);
    }

    if (token) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(WEB_AUTH_TOKEN_KEY, token);
      }
    } else if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(WEB_AUTH_TOKEN_KEY);
    }
  } else {
    const storage = await getAsyncStorage();
    if (!storage) {
      return;
    }

    if (token) {
      await storage.setItem(WEB_AUTH_TOKEN_KEY, token);
    } else {
      await storage.removeItem(WEB_AUTH_TOKEN_KEY);
    }
  }
};

export const getAuthToken = async () => {
  if (authToken) return authToken;
  if (Platform.OS === "web") {
    authToken = readWebToken();
    return authToken;
  } else {
    const storage = await getAsyncStorage();
    if (!storage) {
      return null;
    }

    authToken = await storage.getItem(WEB_AUTH_TOKEN_KEY);
    return authToken;
  }
};

export const clearAuthToken = async () => {
  authToken = null;
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(WEB_AUTH_TOKEN_KEY);
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(WEB_AUTH_TOKEN_KEY);
    }
  } else {
    const storage = await getAsyncStorage();
    if (!storage) {
      return;
    }
    await storage.removeItem(WEB_AUTH_TOKEN_KEY);
  }
};