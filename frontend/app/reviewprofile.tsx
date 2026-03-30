import { AntDesign, Feather } from "@expo/vector-icons";
import { QUESTIONS } from "./form";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import LookingFor from "./lookingfor";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


// List of all profile fields to display
const PROFILE_FIELDS = [
  { key: "user_id", label: "User ID" },
  { key: "looking_for", label: "Looking For" },
  { key: "location", label: "Location" },
  { key: "radius", label: "Radius" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "occupation", label: "Occupation" },
  { key: "image_url", label: "Image URL" },
  { key: "sleep_schedule", label: "Sleep Schedule" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "social_life", label: "Social Life" },
  { key: "guests", label: "Guests" },
  { key: "work_style", label: "Work Style" },
];

type ParsedAnswers = Record<string, string>;
type ParsedProfileData = { answers?: ParsedAnswers };
type Selection = {
  key: string;
  title: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

export default function ReviewProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    profileData?: string;
    answers?: string;
  }>();

  // Accept either legacy `answers` param or the newer `profileData.answers`
  const rawPayload = Array.isArray(params.profileData)
    ? params.profileData[0]
    : (params.profileData ??
      (Array.isArray(params.answers) ? params.answers[0] : params.answers));


  // Parse the full profileData object
  const parsedProfile = useMemo(() => {
    if (!rawPayload) return {};
    try {
      const data = JSON.parse(rawPayload);
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }, [rawPayload]);

  // For lifestyle fields, get the label from QUESTIONS
  function getLifestyleLabel(key: string, value: string) {
    const q = QUESTIONS.find(q => q.key === key);
    if (!q) return value;
    const opt = q.options.find(o => o.id === value);
    return opt ? opt.label : value;
  }

  // Build display list
  const displayFields = PROFILE_FIELDS.map(field => {
    let value = parsedProfile[field.key];
    // For lifestyle fields, show label
    if (["sleep_schedule","cleanliness","social_life","guests","work_style"].includes(field.key)) {
      value = getLifestyleLabel(field.key, value);
    }
    return { label: field.label, value: value ?? "Not provided" };
  });

  const handleConfirm = () => {
    // Route based on looking_for (handle string, array, or comma-separated)
    let lookingFor = parsedProfile.looking_for;
    if (Array.isArray(lookingFor)) {
      lookingFor = lookingFor.join(",");
    }
    if (typeof lookingFor === "string") {
      const values = lookingFor.split(",").map(v => v.trim());
      if (values.length === 1 && values[0] === "roommate") {
        router.replace("/roomatematch");
        return;
      }
      if (values.length === 1 && values[0] === "house") {
        router.replace("/homescreen");
        return;
      }
      if (values.includes("roommate") && values.includes("house")) {
        // Both selected, go to homescreen (or change as needed)
        router.replace("/homescreen");
        return;
      }
    }
    // Fallback
    router.replace("/homescreen");
  };

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={22} color="#36b37e" />
            </TouchableOpacity>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <Text style={styles.stepLabel}>Step 5 of 5</Text>
            <Text style={styles.title}>Review your profile</Text>
            <Text style={styles.subtitle}>
              Confirm your details before matching with roommates
            </Text>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusPill}>
                  <Feather name="shield" size={14} color="#36b37e" />
                  <Text style={styles.statusPillText}>Profile check</Text>
                </View>
                <View style={[styles.badge, styles.badgeReady]}>
                  <Text style={styles.badgeText}>Ready</Text>
                </View>
              </View>
              <Text style={styles.statusTitle}>Everything look correct?</Text>
              <Text style={styles.statusDesc}>
                Validate your details or go back to adjust them.
              </Text>
            </View>
            <View style={styles.summaryList}>
              {displayFields.map((item) => (
                <View key={item.label} style={styles.summaryRow}>
                  <View style={styles.summaryTextBox}>
                    <Text style={styles.summaryTitle}>{item.label}</Text>
                    <Text style={styles.summaryValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cta}
              activeOpacity={0.9}
              onPress={handleConfirm}
            >
              <Text style={styles.ctaText}>Confirm profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryText}>Edit answers</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    gap: 16,
  },
  cardWrapper: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 20,
    gap: 14,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(54, 179, 126, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(54, 179, 126, 0.16)",
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#36b37e",
  },
  stepLabel: { color: "#5c7a6a", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#0f3d2a" },
  subtitle: { color: "#4f6a5b", fontSize: 15 },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.18)",
    gap: 6,
    shadowColor: "#36b37e",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(54, 179, 126, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: { color: "#0f3d2a", fontWeight: "700", fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeReady: { backgroundColor: "#ECFDF3", borderColor: "#BBF7D0" },
  badgePending: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  statusTitle: { fontSize: 18, fontWeight: "800", color: "#0f3d2a" },
  statusDesc: { color: "#4f6a5b", fontSize: 13 },
  summaryList: { gap: 10 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.25)",
    padding: 12,
    gap: 10,
    shadowColor: "#36b37e",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(54, 179, 126, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryTextBox: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: "700", color: "#0f3d2a" },
  summaryValue: { fontSize: 13, color: "#0f3d2a", marginTop: 4 },
  summaryValueMissing: { color: "#9CA3AF" },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  checkCircleDone: { backgroundColor: "#36b37e", borderColor: "#36b37e" },
  checkCircleMissing: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  actions: { gap: 10, marginHorizontal: 16, marginBottom: 24 },
  cta: {
    backgroundColor: "#36b37e",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#36b37e",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#0f3d2a", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  secondaryText: { color: "#0f3d2a", fontSize: 15, fontWeight: "700" },
});
