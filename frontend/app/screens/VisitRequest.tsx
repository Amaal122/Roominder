import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getAuthToken } from "../state/auth";

const API_BASE = "http://127.0.0.1:8001";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function VisitRequest() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
  }>();

  const propertyId = getSingleParam(params.id);
  const title = getSingleParam(params.title) ?? "Modern Loft in Marais";
  const location = getSingleParam(params.location) ?? "Le Marais, Paris";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOption, setDateOption] = useState<"Today" | "Tomorrow" | "Weekend">(
    "Tomorrow",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canContinue = useMemo(() => {
    return (
      Boolean(propertyId) &&
      fullName.trim().length > 1 &&
      phone.trim().length > 5 &&
      !submitting
    );
  }, [fullName, phone, propertyId, submitting]);

  const handleSubmit = async () => {
    if (!propertyId) {
      Alert.alert("Missing property", "This property could not be identified.");
      return;
    }

    const numericPropertyId = Number(propertyId);
    if (!Number.isFinite(numericPropertyId)) {
      Alert.alert("Invalid property", "This property id is not valid.");
      return;
    }

    try {
      setSubmitting(true);

      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Login required", "Please log in before sending a visit request.");
        return;
      }

      const response = await fetch(`${API_BASE}/visits/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: numericPropertyId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          preferred_time: dateOption,
          message: message.trim() || null,
        }),
      });

      const raw = await response.text();
      let data: unknown = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }

      if (!response.ok) {
        const detail =
          (data && typeof data === "object" && "detail" in data && data.detail) ||
          "Unable to send visit request.";
        Alert.alert("Visit request failed", String(detail));
        return;
      }

      router.push({
        pathname: "/screens/VisitConfirmation",
        params: { id: propertyId, title, location },
      });
    } catch (error) {
      console.error("Visit request error:", error);
      Alert.alert("Network error", "Could not contact the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <LinearGradient
          colors={["#F4896B", "#7ECEC4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Visit Request</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Property</Text>
          <Text style={styles.propertyTitle}>{title}</Text>
          <Text style={styles.propertyLocation}>{location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <TextInput
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholderTextColor="#A0A0B5"
          />
          <TextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            placeholderTextColor="#A0A0B5"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Time</Text>
          <View style={styles.choiceRow}>
            {(["Today", "Tomorrow", "Weekend"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.choicePill,
                  dateOption === opt && styles.choicePillActive,
                ]}
                onPress={() => setDateOption(opt)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    dateOption === opt && styles.choiceTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message (optional)</Text>
          <TextInput
            placeholder="Tell the owner about yourself..."
            value={message}
            onChangeText={setMessage}
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#A0A0B5"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canContinue && styles.btnDisabled]}
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryText}>
            {submitting ? "Sending..." : "Send Visit Request"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CORAL = "#F4896B";
const TEAL = "#7ECEC4";
const BG = "#FFF7F3";
const TEXT = "#2B2B33";
const MUTED = "#7A6D6A";
const BORDER = "#F1E3DC";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  backIcon: { fontSize: 16, color: TEXT },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "white" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 12, color: MUTED, marginBottom: 6 },
  propertyTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
  propertyLocation: { fontSize: 13, color: MUTED, marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT,
    marginBottom: 10,
  },
  textArea: { height: 110, textAlignVertical: "top" },
  choiceRow: { flexDirection: "row", gap: 10 },
  choicePill: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  choicePillActive: { backgroundColor: TEAL, borderColor: TEAL },
  choiceText: { fontSize: 13, color: MUTED, fontWeight: "600" },
  choiceTextActive: { color: "white" },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: CORAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});
