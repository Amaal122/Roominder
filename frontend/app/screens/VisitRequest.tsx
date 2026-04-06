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

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

import { getAuthToken } from "../state/auth";

const API_BASE = "http://127.0.0.1:8001";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function VisitRequest() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

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
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <LinearGradient
          colors={
            isDark
              ? [Colors.dark.card, Colors.dark.card]
              : ["#F4896B", "#7ECEC4"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, isDark && styles.headerDark]}
        >
          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.backBtnDark]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, isDark && styles.backIconDark]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Visit Request
          </Text>
        </LinearGradient>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
            Property
          </Text>
          <Text style={[styles.propertyTitle, isDark && styles.propertyTitleDark]}>
            {title}
          </Text>
          <Text
            style={[styles.propertyLocation, isDark && styles.propertyLocationDark]}
          >
            {location}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Your Details
          </Text>
          <TextInput
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            style={[styles.input, isDark && styles.inputDark]}
            placeholderTextColor={
              isDark ? Colors.dark.mutedText : "#A0A0B5"
            }
          />
          <TextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, isDark && styles.inputDark]}
            placeholderTextColor={
              isDark ? Colors.dark.mutedText : "#A0A0B5"
            }
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Preferred Time
          </Text>
          <View style={styles.choiceRow}>
            {(["Today", "Tomorrow", "Weekend"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.choicePill,
                  isDark && styles.choicePillDark,
                  dateOption === opt && styles.choicePillActive,
                ]}
                onPress={() => setDateOption(opt)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    isDark && styles.choiceTextDark,
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
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Message (optional)
          </Text>
          <TextInput
            placeholder="Tell the owner about yourself..."
            value={message}
            onChangeText={setMessage}
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholderTextColor={
              isDark ? Colors.dark.mutedText : "#A0A0B5"
            }
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
  safeAreaDark: { backgroundColor: Colors.dark.background },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  headerDark: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
  backBtnDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  backIconDark: { color: Colors.dark.text },
  headerTitleDark: { color: Colors.dark.text },
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
  cardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  cardTitleDark: { color: Colors.dark.mutedText },
  propertyTitleDark: { color: Colors.dark.text },
  propertyLocationDark: { color: Colors.dark.mutedText },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },
  sectionTitleDark: { color: Colors.dark.text },
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
  inputDark: {
    backgroundColor: Colors.dark.cardMuted,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
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
  choicePillDark: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.cardMuted,
  },
  choicePillActive: { backgroundColor: TEAL, borderColor: TEAL },
  choiceText: { fontSize: 13, color: MUTED, fontWeight: "600" },
  choiceTextDark: { color: Colors.dark.mutedText },
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
