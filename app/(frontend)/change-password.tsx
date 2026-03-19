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

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSave = next.length >= 6 && next === confirm && current.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Alert.alert("Password updated", "Your password was changed successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
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
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            value={current}
            onChangeText={setCurrent}
            placeholder="••••••••"
            secureTextEntry
          />
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={next}
            onChangeText={setNext}
            placeholder="Minimum 6 characters"
            secureTextEntry
          />
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat new password"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.cta, !canSave && styles.ctaDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!canSave}
          >
            <Text style={styles.ctaText}>Save</Text>
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
