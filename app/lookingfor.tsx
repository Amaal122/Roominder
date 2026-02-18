import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const OPTIONS = [
  {
    key: "housing",
    title: "Looking for Housing",
    subtitle: "Find places that fit you",
    icon: <Feather name="home" size={26} color="#7C3AED" />,
  },
  {
    key: "roommate",
    title: "Looking for Roommate",
    subtitle: "Meet people to share with",
    icon: <Feather name="users" size={26} color="#7C3AED" />,
  },
] as const;

type OptionKey = (typeof OPTIONS)[number]["key"];

type SelectedState = Record<OptionKey, boolean>;

export default function LookingFor() {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedState>({
    housing: false,
    roommate: false,
  });

  const hasSelection = useMemo(
    () => Object.values(selected).some(Boolean),
    [selected],
  );

  const toggle = (key: OptionKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    if (!hasSelection) return;
    router.push("/location");
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

          <Text style={styles.stepLabel}>Step 1 of 5</Text>
          <Text style={styles.title}>What are you looking for?</Text>
          <Text style={styles.subtitle}>Select one or both options</Text>

          <View style={styles.optionsContainer}>
            {OPTIONS.map((option) => {
              const isActive = selected[option.key];
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionCard,
                    isActive && styles.optionCardActive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => toggle(option.key)}
                >
                  <View style={styles.optionIcon}>{option.icon}</View>
                  <View style={styles.optionTextBox}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <View style={[styles.check, isActive && styles.checkActive]}>
                    {isActive && (
                      <AntDesign name="check" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, !hasSelection && styles.ctaDisabled]}
          activeOpacity={hasSelection ? 0.9 : 1}
          onPress={handleContinue}
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
    gap: 12,
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
    width: "22%",
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  stepLabel: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#6B7280", fontSize: 15 },
  optionsContainer: { gap: 12, marginTop: 8 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionCardActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#F3E8FF",
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionTextBox: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  optionSubtitle: { color: "#6B7280", marginTop: 4, fontSize: 13 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
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
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
