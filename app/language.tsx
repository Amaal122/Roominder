import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AppLanguage, updateSettings, useSettings } from "./state/settings";

const LANGS: AppLanguage[] = ["English", "French", "Arabic"];

export default function Language() {
  const router = useRouter();
  const settings = useSettings();

  return (
    <LinearGradient
      colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#2B2B33" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Language</Text>
        </View>

        <View style={styles.card}>
          {LANGS.map((lang) => {
            const active = settings.language === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => updateSettings({ language: lang })}
              >
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                  {lang}
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
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowActive: { backgroundColor: "#F9D4C2" },
  rowLabel: { fontSize: 14, fontWeight: "700", color: "#2B2B33" },
  rowLabelActive: { color: "#F4896B" },
  check: { fontSize: 14, fontWeight: "800", color: "#F4896B" },
});
