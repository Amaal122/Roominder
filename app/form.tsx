import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allAnswered = useMemo(
    () => QUESTIONS.every((q) => !!answers[q.key]),
    [answers],
  );

  const handleSelect = (qKey: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [qKey]: optionId }));
  };

  const handleContinue = () => {
    if (!allAnswered) return;
    router.push({
      pathname: "/reviewprofile",
      params: { answers: JSON.stringify(answers) },
    });
  };

  return (
    <LinearGradient
      colors={["#6D28D9", "#9333EA", "#F472B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#4C1D95" />
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
                        activeOpacity={0.85}
                        onPress={() => handleSelect(question.key, option.id)}
                      >
                        <View style={styles.optionIconCircle}>
                          <Feather
                            name={option.icon}
                            size={18}
                            color={selected ? "#7C3AED" : "#6B7280"}
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
        </View>

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
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    gap: 14,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    width: "80%",
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  stepLabel: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#6B7280", fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12, gap: 16 },
  questionBlock: { gap: 10 },
  questionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  optionRow: { flexDirection: "row", gap: 12 },
  optionCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionSelected: {
    borderColor: "#7C3AED",
    shadowOpacity: 0.12,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { color: "#111827", fontSize: 14, fontWeight: "600" },
  optionLabelSelected: { color: "#7C3AED" },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
