import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateSettings, useSettings } from "./state/settings";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import type { AppLanguage } from "./state/settings";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

// Map display names to i18n codes
const LANGS = [
  { label: "English", code: "en", value: "English" as const },
  { label: "Français", code: "fr", value: "French" as const },
  { label: "العربية", code: "ar", value: "Arabic" as const },
];

export default function Language() {
  const router = useRouter();
  const settings = useSettings();
  const { t } = useTranslation(); // ✅ moved inside the component
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const handleSelect = (code: string, value: AppLanguage) => {
    changeLanguage(code);                  // ✅ actually switches i18n
    updateSettings({ language: value });   // keeps your local state in sync
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? [Colors.dark.background, Colors.dark.background, Colors.dark.background]
          : ["#F4896B", "#F7B89A", "#7ECEC4"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#2B2B33" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("settings.language")}</Text>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          {LANGS.map(({ label, code, value }) => {
            const active = settings.language === value;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.row, isDark && styles.rowDark, active && styles.rowActive]}
                onPress={() => handleSelect(code, value)}  // ✅ both called here
              >
                <Text
                  style={[
                    styles.rowLabel,
                    isDark && styles.rowLabelDark,
                    active && styles.rowLabelActive,
                  ]}
                >
                  {label}
                </Text>
                {active ? <Text style={styles.check}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 8,
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowDark: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rowActive: { backgroundColor: "#F9D4C2" },
  rowLabel: { fontSize: 14, fontWeight: "700", color: "#2B2B33" },
  rowLabelDark: { color: Colors.dark.text },
  rowLabelActive: { color: "#F4896B" },
  check: { fontSize: 14, fontWeight: "800", color: "#F4896B" },
});