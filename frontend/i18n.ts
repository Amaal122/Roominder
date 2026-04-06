// i18n.ts  (at root of your project)
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

const LANG_KEY = "app_language";
const LANG_EXPLICIT_KEY = "app_language_explicit";

const normalizeLanguage = (saved: string | null) => {
  if (!saved) return null;

  // Current format: persisted i18n codes
  if (saved === "en" || saved === "fr" || saved === "ar") return saved;

  // Backward compatibility: persisted app labels
  if (saved === "English") return "en";
  if (saved === "French") return "fr";
  if (saved === "Arabic") return "ar";

  return null;
};

export const initI18n = async () => {
  const savedRaw = await AsyncStorage.getItem(LANG_KEY);
  const explicitRaw = await AsyncStorage.getItem(LANG_EXPLICIT_KEY);
  const isExplicit = explicitRaw === "1" || explicitRaw === "true";
  const saved = normalizeLanguage(savedRaw);

  // Important UX: default to English unless user chose otherwise.
  const lng = (isExplicit ? saved : null) ?? "en";

  // Handle RTL for Arabic
  const isRTL = lng === "ar";
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
};

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await AsyncStorage.setItem(LANG_EXPLICIT_KEY, "1");
  await i18n.changeLanguage(lang);

  const isRTL = lang === "ar";
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
};

export default i18n;