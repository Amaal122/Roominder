import { useEffect, useState } from "react";

export type AppTheme = "Light" | "Dark" | "System";
export type AppLanguage = "English" | "French" | "Arabic";

type SettingsState = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  twoFactorEnabled: boolean;
  language: AppLanguage;
  theme: AppTheme;
  blockedUsers: string[];
};

let settings: SettingsState = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  twoFactorEnabled: false,
  language: "English",
  theme: "Light",
  blockedUsers: ["Samir K.", "Nadine B."],
};

const listeners = new Set<() => void>();

export const getSettings = () => settings;

export const updateSettings = (partial: Partial<SettingsState>) => {
  settings = { ...settings, ...partial };
  listeners.forEach((listener) => listener());
};

export const subscribeSettings = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
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
