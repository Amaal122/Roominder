import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuthToken } from "./state/auth";
import { useTranslation } from "react-i18next";

const API_URL = "http://127.0.0.1:8001";

export default function ChangePassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSave = next.length >= 6 && next === confirm && current.length > 0;

const handleSave = async () => {
  if (!canSave) return;

  try {
    const token = await getAuthToken();

    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        current_password: current,
        new_password: next,
      }),
    });

    const raw = await res.text();
    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      Alert.alert(
        t("common.error"),
        data?.detail ?? raw ?? t("common.something_went_wrong"),
      );
      return;
    }

    Alert.alert(t("common.success"), t("auth.password_change_success"));
    setCurrent("");
    setNext("");
    setConfirm("");
    router.back();
  } catch (e) {
    Alert.alert(t("common.error"), t("common.could_not_connect"));
  }
};

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
          <Text style={styles.headerTitle}>{t("settings.change_password")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("auth.current_password")}</Text>
          <TextInput
            style={styles.input}
            value={current}
            onChangeText={setCurrent}
            placeholder="••••••••"
            secureTextEntry
          />
          <Text style={styles.label}>{t("auth.new_password")}</Text>
          <TextInput
            style={styles.input}
            value={next}
            onChangeText={setNext}
            placeholder={t("auth.password_min", { count: 6 })}
            secureTextEntry
          />
          <Text style={styles.label}>{t("auth.confirm_password")}</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder={t("auth.repeat_new_password")}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.cta, !canSave && styles.ctaDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!canSave}
          >
            <Text style={styles.ctaText}>{t("common.save")}</Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  label: { fontSize: 12, color: "#7A6D6A", fontWeight: "700", marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1E3DC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  cta: {
    marginTop: 16,
    backgroundColor: "#7ECEC4",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontWeight: "800" },
});
