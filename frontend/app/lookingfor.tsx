import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSeekerProfile } from "../app/contexts/SeekerProfileContext";

const OPTIONS = [
  {
    key: "housing",
    title: "Looking for Housing",
    subtitle: "Find places that fit you",
    icon: <Feather name="home" size={26} color="#36b37e" />,
  },
  {
    key: "roommate",
    title: "Looking for Roommate",
    subtitle: "Meet people to share with",
    icon: <Feather name="users" size={26} color="#36b37e" />,
  },
] as const;

type OptionKey = (typeof OPTIONS)[number]["key"];
type SelectedState = Record<OptionKey, boolean>;

type OptionCardProps = {
  option: (typeof OPTIONS)[number];
  isActive: boolean;
  onPress: () => void;
};

const OptionCard = ({ option, isActive, onPress }: OptionCardProps) => {
  const lift = useRef(new Animated.Value(0)).current;

  const animateTo = (value: number) => {
    Animated.timing(lift, {
      toValue: value,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.optionCardShadow,
        {
          transform: [
            {
              translateY: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -6],
              }),
            },
            {
              scale: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.03],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        key={option.key}
        style={[styles.optionCard, isActive && styles.optionCardActive]}
        onPress={onPress}
        onHoverIn={() => animateTo(1)}
        onHoverOut={() => animateTo(0)}
        onPressIn={() => animateTo(1)}
        onPressOut={() => animateTo(0)}
      >
        <View style={styles.optionIcon}>{typeof option.icon === 'string' ? <Text>{option.icon}</Text> : option.icon}</View>
        <View style={styles.optionTextBox}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
        </View>
        <View style={[styles.check, isActive && styles.checkActive]}>
          {isActive && <AntDesign name="check" size={16} color="#fff" />}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function LookingFor() {
  const router = useRouter();
  const { profile, updateProfile } = useSeekerProfile();
  const [selected, setSelected] = useState<SelectedState>({
    housing: false,
    roommate: false,
  });
  const getLookingFor = () => {
    if (selected.housing && selected.roommate) return "both";
    if (selected.housing) return "house";
    if (selected.roommate) return "roommate";
    return null;
  };

  const hasSelection = useMemo(
    () => Object.values(selected).some(Boolean),
    [selected],
  );

  const toggle = (key: OptionKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    console.log("[LookingFor] profile snapshot", profile);
  }, [profile]);

  const handleContinue = () => {
    if (!hasSelection) return;
    const looking_for = getLookingFor();
    if (!looking_for) return;

    // Save to context
    updateProfile({ looking_for });

    // If only housing, skip form and set form data null, go to location
    if (looking_for === "house") {
      updateProfile({
        sleep_schedule: undefined,
        cleanliness: undefined,
        social_life: undefined,
        guests: undefined,
        work_style: undefined,
      });
      router.push("/location");
      return;
    }
    // If only roommate, skip location and set location data undefined, go to form
    if (looking_for === "roommate") {
      updateProfile({ location: undefined, radius: undefined });
      router.push("/completeprofile");
      return;
    }
    // If both, proceed as normal (location first)
    router.push("/location");
  };

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#2f9b6e" />
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
                <OptionCard
                  key={option.key}
                  option={option}
                  isActive={isActive}
                  onPress={() => toggle(option.key)}
                />
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
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 20,
    gap: 12,
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
    width: "22%",
    height: "100%",
    backgroundColor: "#36b37e",
  },
  stepLabel: { color: "#5c7a6a", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#0f3d2a" },
  subtitle: { color: "#4f6a5b", fontSize: 15 },
  optionsContainer: { gap: 12, marginTop: 8 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(54, 179, 126, 0.35)",
  },
  optionCardActive: {
    borderColor: "#36b37e",
    backgroundColor: "rgba(54, 179, 126, 0.08)",
  },
  optionCardShadow: {
    borderRadius: 18,
    shadowColor: "#2f9b6e",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(54, 179, 126, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionTextBox: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: "700", color: "#0f3d2a" },
  optionSubtitle: { color: "#4f6a5b", marginTop: 4, fontSize: 13 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(54, 179, 126, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkActive: {
    backgroundColor: "#36b37e",
    borderColor: "#36b37e",
  },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#36b37e",
    borderWidth: 0,
    borderColor: "#36b37e",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "transparent",
    elevation: 0,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: { color: "#0f3d2a", fontSize: 16, fontWeight: "700" },
});
