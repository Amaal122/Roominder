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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSeekerProfile } from "./contexts/SeekerProfileContext";
type Question = {
  key: string;
  title: string;
  options: { id: string; label: string; icon: keyof typeof Feather.glyphMap }[];
};

export const QUESTIONS: Question[] = [
  {
    key: "sleep",
    title: "Sleep Schedule",
    options: [
      { id: "early", label: "Early Bird", icon: "sunrise" },
      { id: "night", label: "Night Owl", icon: "moon" },
    ],
  },
  {
    key: "cleanliness",
    title: "Cleanliness",
    options: [
      { id: "tidy", label: "Very Organized", icon: "check-circle" },
      { id: "relaxed", label: "Relaxed", icon: "wind" },
    ],
  },
  {
    key: "social",
    title: "Social Life",
    options: [
      { id: "party", label: "Love Parties", icon: "music" },
      { id: "quiet", label: "Quiet Time", icon: "coffee" },
    ],
  },
  {
    key: "guests",
    title: "Guests",
    options: [
      { id: "often", label: "Guests Often", icon: "users" },
      { id: "rarely", label: "Prefer Private", icon: "shield" },
    ],
  },
  {
    key: "work",
    title: "Work Style",
    options: [
      { id: "home", label: "Work From Home", icon: "home" },
      { id: "office", label: "Office/Hybrid", icon: "briefcase" },
    ],
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
    () => QUESTIONS.every((q) => !!answers[q.key]),
    [answers],
  );

  const handleSelect = (qKey: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [qKey]: optionId }));
  };

  const handleContinue = async () => {
    if (!allAnswered) return;

    // merge lifestyle answers into profile context (store as strings)
    updateProfile({
      sleep_schedule: answers.sleep,
      cleanliness: answers.cleanliness,
      social_life: answers.social,
      guests: answers.guests,
      work_style: answers.work,
    });

    const profileData = {
      ...profile,
      answers,
    };

    try {
      const response = await fetch("http://localhost:8001/seeker/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                <View style={styles.optionRow}>
                  {question.options.map((option) => {
                    const selected = answers[question.key] === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionCard,
                          selected && styles.optionSelected,
                        ]}
                        activeOpacity={0.9}
                        onPress={() => handleSelect(question.key, option.id)}
                      >
                        <View style={styles.optionIconCircle}>
                          <Feather
                            name={option.icon}
                            size={18}
                            color={selected ? "#36b37e" : "#6B7280"}
                          />
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            selected && styles.optionLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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
  optionRow: { flexDirection: "row", gap: 12 },
  optionCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.25)",
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#36b37e",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  optionSelected: {
    borderColor: "#36b37e",
    shadowOpacity: 0.18,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eefbf4",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { color: "#111827", fontSize: 14, fontWeight: "600" },
  optionLabelSelected: { color: "#36b37e" },
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
