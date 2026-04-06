import { useEffect, useState } from "react";

export type AppTheme = "Light" | "Dark" | "System";
export type AppLanguage = "English" | "French" | "Arabic";
export type AppCurrency = "Dollar" | "Euro" | "DT";

type SettingsStoreState = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  twoFactorEnabled: boolean;
  language: AppLanguage;
  currency: AppCurrency;
  theme: AppTheme;
  blockedUsers: string[];
};

let settings: SettingsStoreState = {
  pushEnabled: true,
  emailEnabled: true,
  twoFactorEnabled: false,
  language: "English",
  currency: "DT",
  theme: "Light",
  blockedUsers: ["Samir K.", "Nadine B."],
};

const listeners = new Set<() => void>();

export const getSettings = () => settings;

export const updateSettings = (partial: Partial<SettingsStoreState>) => {
  settings = { ...settings, ...partial };
  listeners.forEach((listener) => listener());
};

export const subscribeSettings = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSettings = () => {
  const [state, setState] = useState(getSettings());

  useEffect(() => {
    return subscribeSettings(() => setState(getSettings()));
  }, []);

  return state;
};

// Expo Router treats files under app/ as routes; provide a no-op component.
export default function SettingsState() {
  return null;
}
