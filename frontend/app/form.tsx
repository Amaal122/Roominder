import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSeekerProfile } from "./contexts/SeekerProfileContext";
import { getAuthToken } from "./state/auth";
type Question = {
  key: string;
  title: string;
  minChars: number;
  maxChars: number;
  placeholder?: string;
  options: { id: string; label: string; icon: keyof typeof Feather.glyphMap }[];
};

const API_BASE = "http://127.0.0.1:8001";

export const QUESTIONS: Question[] = [
  {
    key: "sleep",
    title: "Sleep Schedule",
    minChars: 2,
    maxChars: 160,
    placeholder: "Describe your sleep schedule...",
    options: [
      { id: "early", label: "Early Bird", icon: "sunrise" },
      { id: "night", label: "Night Owl", icon: "moon" },
    ],
  },
  {
    key: "cleanliness",
    title: "Cleanliness",
    minChars: 2,
    maxChars: 160,
    placeholder: "Describe your cleanliness habits...",
    options: [
      { id: "tidy", label: "Very Organized", icon: "check-circle" },
      { id: "relaxed", label: "Relaxed", icon: "wind" },
    ],
  },
  {
    key: "social",
    title: "Social Life",
    minChars: 2,
    maxChars: 160,
    placeholder: "Describe your social life...",
    options: [
      { id: "party", label: "Love Parties", icon: "music" },
      { id: "quiet", label: "Quiet Time", icon: "coffee" },
    ],
  },
  {
    key: "guests",
    title: "Guests",
    minChars: 2,
    maxChars: 160,
    placeholder: "How often do you have guests?",
    options: [
      { id: "often", label: "Guests Often", icon: "users" },
      { id: "rarely", label: "Prefer Private", icon: "shield" },
    ],
  },
  {
    key: "work",
    title: "Work Style",
    minChars: 2,
    maxChars: 160,
    placeholder: "Describe your work style...",
    options: [
      { id: "home", label: "Work From Home", icon: "home" },
      { id: "office", label: "Office/Hybrid", icon: "briefcase" },
    ],
  },
  {
    key: "interests",
    title: "Interests",
    minChars: 2,
    maxChars: 220,
    placeholder: "What are your interests/hobbies?",
    options: [],
  },
  {
    key: "values",
    title: "Values",
    minChars: 2,
    maxChars: 220,
    placeholder: "What values matter most to you in shared living?",
    options: [],
  },
];

export default function Form() {
  const router = useRouter();
  const { profile, updateProfile } = useSeekerProfile();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log("[Form] profile snapshot", profile);
  }, [profile]);

  useEffect(() => {
    console.log("[Form] answers", answers);
  }, [answers]);

  const allAnswered = useMemo(
    () =>
      QUESTIONS.every((q) => {
        const value = (answers[q.key] ?? "").trim();
        return value.length >= q.minChars && value.length <= q.maxChars;
      }),
    [answers],
  );

  const handleChange = (qKey: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qKey]: text }));
  };

  const handleContinue = async () => {
    if (!allAnswered) {
      const missing = QUESTIONS.filter((q) => {
        const value = (answers[q.key] ?? "").trim();
        return value.length < q.minChars;
      }).map((q) => `- ${q.title} (min ${q.minChars})`);

      alert(
        missing.length
          ? `Please answer the following questions:\n${missing.join("\n")}`
          : "Please complete all questions.",
      );
      return;
    }

    // merge lifestyle answers into profile context (store as strings)
    updateProfile({
      sleep_schedule: answers.sleep,
      cleanliness: answers.cleanliness,
      social_life: answers.social,
      guests: answers.guests,
      work_style: answers.work,
      interests: answers.interests,
      values: answers.values,
    });

    // Get auth token

    let token = await getAuthToken();
    console.log("[Form] getAuthToken() returned:", token);
    if (!token) {
      alert("You must be logged in to complete your profile.");
      return;
    }

    // Fetch user info to get user_id
    let user_id = null;
    try {
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        user_id = me.id;
      }
    } catch {
      // ignore, will fail below if user_id is missing
    }
    if (!user_id) {
      alert("Could not determine user ID. Please log in again.");
      return;
    }

    // If the user is editing their profile, some fields (like location/radius)
    // might not be present in the current in-memory context. Fetch saved values
    // so we don't accidentally omit them when confirming.
    let saved: any = null;
    try {
      const savedRes = await fetch(`${API_BASE}/seeker/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (savedRes.ok) {
        saved = await savedRes.json();
      }
    } catch {
      saved = null;
    }

    const savedDefaults = saved
      ? {
          looking_for: saved.looking_for,
          location: saved.location,
          radius: saved.radius,
          age: saved.age,
          gender: saved.gender,
          occupation: saved.occupation,
          image_url: saved.image_url,
          sleep_schedule: saved.sleep_schedule,
          cleanliness: saved.cleanliness,
          social_life: saved.social_life,
          guests: saved.guests,
          work_style: saved.work_style,
          interests: saved.interests,
          values: saved.values,
        }
      : {};

    const profileData = {
      ...savedDefaults,
      ...profile,
      user_id,
      sleep_schedule: answers.sleep,
      cleanliness: answers.cleanliness,
      social_life: answers.social,
      guests: answers.guests,
      work_style: answers.work,
      interests: answers.interests,
      values: answers.values,
    };

    try {
      const response = await fetch(`${API_BASE}/seeker/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const result = await response.json();
      console.log("Profile saved successfully:", result);

      router.push({
        pathname: "/reviewprofile",
        params: { profileData: JSON.stringify(profileData) },
      });
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("There was an error submitting your profile. Please try again.");
    }
  };
  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <BlurView
          intensity={90}
          tint="light"
          style={
            Platform.OS === "web"
              ? [styles.cardWrapper, styles.cardWrapperWeb]
              : styles.cardWrapper
          }
        >
          <View pointerEvents="none" style={styles.glassOverlay} />
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#36b37e" />
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.stepLabel}>Step 4 of 5</Text>
          <Text style={styles.title}>Your Lifestyle</Text>
          <Text style={styles.subtitle}>
            Help us match you with compatible roommates
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {QUESTIONS.map((question) => (
              <View key={question.key} style={styles.questionBlock}>
                <Text style={styles.questionTitle}>{question.title}</Text>
                <TextInput
                  value={answers[question.key] ?? ""}
                  onChangeText={(text) => handleChange(question.key, text)}
                  placeholder={question.placeholder}
                  placeholderTextColor="#6B7280"
                  style={styles.textInput}
                  multiline
                  maxLength={question.maxChars}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                />
                <View style={styles.helperRow}>
                  <Text style={styles.helperText}>
                    Min {question.minChars} / Max {question.maxChars} characters
                  </Text>
                  <Text style={styles.helperText}>
                    {(answers[question.key] ?? "").length}/{question.maxChars}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </BlurView>

        <TouchableOpacity
          style={[styles.cta, !allAnswered && styles.ctaDisabled]}
          activeOpacity={0.9}
          onPress={handleContinue}
          disabled={!allAnswered}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  cardWrapper: {
    marginTop: 12,
    marginHorizontal: 20,
    width: "92%",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 24,
    padding: 16,
    gap: 14,
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardWrapperWeb: {
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(10.8px)",
          WebkitBackdropFilter: "blur(10.8px)",
        } as any)
      : {}),
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
    width: "80%",
    height: "100%",
    backgroundColor: "#36b37e",
  },
  stepLabel: { color: "#5c7a6a", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#0f3d2a" },
  subtitle: { color: "#4f6a5b", fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12, gap: 16 },
  questionBlock: { gap: 10 },
  questionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  textInput: {
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.25)",
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: "#111827",
    shadowColor: "#36b37e",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  helperRow: { flexDirection: "row", justifyContent: "space-between" },
  helperText: { color: "#4f6a5b", fontSize: 12, fontWeight: "600" },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#36b37e",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#36b37e",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#0f3d2a", fontSize: 16, fontWeight: "700" },
});
