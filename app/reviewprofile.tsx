import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { QUESTIONS } from "./form";

type ParsedAnswers = Record<string, string>;
type Selection = {
  key: string;
  title: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

export default function ReviewProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers?: string }>();

  const answersParam = Array.isArray(params.answers)
    ? params.answers[0]
    : params.answers;

  const parsedAnswers = useMemo<ParsedAnswers>(() => {
    if (!answersParam) return {};
    try {
      const data = JSON.parse(answersParam);
      return typeof data === "object" && data ? data : {};
    } catch (error) {
      return {};
    }
  }, [answersParam]);

  const selections = useMemo<Selection[]>(
    () =>
      QUESTIONS.map((question) => {
        const selectedId = parsedAnswers[question.key];
        const option = question.options.find((item) => item.id === selectedId);
        return {
          key: question.key,
          title: question.title,
          label: option?.label ?? "Not selected",
          icon: option?.icon ?? "help-circle",
        };
      }),
    [parsedAnswers],
  );

  const allAnswered = selections.every((item) => item.label !== "Not selected");

  const handleConfirm = () => {
    router.replace("/sweethome");
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

          <Text style={styles.stepLabel}>Step 5 of 5</Text>
          <Text style={styles.title}>Review your profile</Text>
          <Text style={styles.subtitle}>
            Confirm your lifestyle details before matching with roommates
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <Feather name="shield" size={14} color="#2563EB" />
                <Text style={styles.statusPillText}>Profile check</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  allAnswered ? styles.badgeReady : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>
                  {allAnswered ? "Ready" : "Missing info"}
                </Text>
              </View>
            </View>
            <Text style={styles.statusTitle}>Everything look correct?</Text>
            <Text style={styles.statusDesc}>
              Validate your selections or go back to adjust them.
            </Text>
          </View>

          <View style={styles.summaryList}>
            {selections.map((item) => {
              const complete = item.label !== "Not selected";
              return (
                <View key={item.key} style={styles.summaryRow}>
                  <View style={styles.iconWrap}>
                    <Feather
                      name={item.icon}
                      size={18}
                      color={complete ? "#7C3AED" : "#9CA3AF"}
                    />
                  </View>
                  <View style={styles.summaryTextBox}>
                    <Text style={styles.summaryTitle}>{item.title}</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        !complete && styles.summaryValueMissing,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkCircle,
                      complete
                        ? styles.checkCircleDone
                        : styles.checkCircleMissing,
                    ]}
                  >
                    {complete ? (
                      <AntDesign name="check" size={14} color="#fff" />
                    ) : (
                      <Feather name="alert-circle" size={14} color="#F43F5E" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.cta, !allAnswered && styles.ctaDisabled]}
            activeOpacity={0.9}
            onPress={handleConfirm}
            disabled={!allAnswered}
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
    width: "100%",
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  stepLabel: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#6B7280", fontSize: 15 },
  statusCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    gap: 6,
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
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: { color: "#1D4ED8", fontWeight: "700", fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeReady: { backgroundColor: "#ECFDF3", borderColor: "#BBF7D0" },
  badgePending: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  statusTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statusDesc: { color: "#4B5563", fontSize: 13 },
  summaryList: { gap: 10 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryTextBox: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  summaryValue: { fontSize: 13, color: "#4B5563", marginTop: 4 },
  summaryValueMissing: { color: "#DC2626" },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  checkCircleDone: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  checkCircleMissing: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  actions: { gap: 10, marginHorizontal: 16, marginBottom: 24 },
  cta: {
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
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryText: { color: "#111827", fontSize: 15, fontWeight: "700" },
});
