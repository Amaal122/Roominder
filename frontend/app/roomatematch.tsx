import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { useSeekerProfile } from "./contexts/SeekerProfileContext";
import {
  loadRoommateRecommendations,
  saveRoommateMatch,
  type RoommateMatchProfile,
} from "./state/roommateMatching";

function formatLifestyleIcon(label: string) {
  if (label.toLowerCase().includes("cook")) return "🍳";
  if (label.toLowerCase().includes("organized")) return "🧹";
  if (label.toLowerCase().includes("early")) return "🌅";
  if (label.toLowerCase().includes("night")) return "🌙";
  if (label.toLowerCase().includes("plant")) return "🌿";
  if (label.toLowerCase().includes("read")) return "📚";
  if (label.toLowerCase().includes("coffee")) return "☕";
  if (label.toLowerCase().includes("run")) return "🏃";
  return "✨";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F2FA" },
  safeAreaDark: { backgroundColor: Colors.dark.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: { fontSize: 18, color: "#FFF" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  headerSubtitle: { fontSize: 14, color: "#F2E8FF", marginTop: 2 },
  headerHint: { color: "#F5EFFF", marginTop: 10, fontSize: 12 },
  deckArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardDark: { backgroundColor: Colors.dark.card },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  nextCard: {
    position: "absolute",
    width: "100%",
    alignSelf: "center",
  },
  imageWrapper: { position: "relative" },
  photo: { width: "100%", height: 270 },
  matchBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderWidth: 4,
    borderColor: "#FFF",
    backgroundColor: "rgba(255,255,255,0.85)",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBadgeDark: {
    borderColor: Colors.dark.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  matchText: { fontSize: 18, fontWeight: "800", color: "#7ECEC4" },
  cardBody: { padding: 16 },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  titleDark: { color: Colors.dark.text },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaIcon: { fontSize: 13, marginRight: 6 },
  metaText: { fontSize: 13, color: "#61677A" },
  mutedTextDark: { color: Colors.dark.mutedText },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A2E",
    marginTop: 12,
  },
  about: { color: "#5A6172", marginTop: 6, lineHeight: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F6F1FF",
    borderRadius: 14,
    gap: 6,
  },
  chipDark: { backgroundColor: Colors.dark.cardMuted },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 12, color: "#7ECEC4", fontWeight: "700" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingBottom: 24,
  },
  circleButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: { backgroundColor: "#F2F2F7" },
  likeButton: { backgroundColor: "#7ECEC4" },
  buttonIcon: { fontSize: 24, color: "#1A1A2E" },
  stamp: {
    position: "absolute",
    top: 28,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  passStamp: {
    left: 18,
    borderColor: "#E65C5C",
    backgroundColor: "rgba(230,92,92,0.12)",
  },
  saveStamp: {
    right: 18,
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76,175,80,0.14)",
  },
  stampText: { fontSize: 14, fontWeight: "800", color: "#1A1A2E" },
  stampTextDark: { color: Colors.dark.text },
  emptyCard: {
    alignItems: "center",
    padding: 28,
    gap: 10,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  emptySubtitle: { color: "#6B7280", textAlign: "center", lineHeight: 20 },
  emptySubtitleDark: { color: Colors.dark.mutedText },
  primaryButton: {
    marginTop: 6,
    backgroundColor: "#7ECEC4",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryLabel: { color: "#FFF", fontWeight: "700" },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 22,
    color: "#7ECEC4",
  },
  tabLabel: {
    fontSize: 12,
    color: "#61677A",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#F4896B",
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  tabBarDark: {
    backgroundColor: Colors.dark.card,
    borderTopColor: Colors.dark.border,
  },
  tabLabelDark: { color: Colors.dark.mutedText },
});

export default function RoomateMatch() {
  const { width } = Dimensions.get("window");
  const swipeThreshold = width * 0.25;
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { profile } = useSeekerProfile();
  const pan = useRef(new Animated.ValueXY()).current;

  const showRoommates = profile.looking_for !== "house";
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/roomatematch" as Href },
    ...(showRoommates ? [{ icon: "👥", label: "Match", route: "/match" as Href }] : []),
    { icon: "💬", label: "Chat", route: "/chat" as Href },
    { icon: "👤", label: "Profile", route: "/profile" as Href },
  ];

  const [profiles, setProfiles] = useState<RoommateMatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");

  const refreshMatches = useCallback(
    async (shouldAbort?: () => boolean) => {
      const abort = shouldAbort ?? (() => false);

      setLoading(true);
      setError(null);

      try {
        const data = await loadRoommateRecommendations();
        if (abort()) return;

        setProfiles(data);
        setIndex(0);
        pan.setValue({ x: 0, y: 0 });
      } catch (fetchError) {
        console.error("Failed to fetch matches", fetchError);
        if (abort()) return;

        setProfiles([]);
        setError("Unable to load roommate suggestions right now.");
      } finally {
        if (!abort()) {
          setLoading(false);
        }
      }
    },
    [pan],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void refreshMatches(() => cancelled);

      return () => {
        cancelled = true;
      };
    }, [refreshMatches]),
  );

  const currentProfile = profiles[index];
  const nextProfile = profiles[index + 1];

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      bounciness: 10,
    }).start();
  };

  const handleSwipeComplete = () => {
    const nextIndex = index + 1;
    pan.setValue({ x: 0, y: 0 });

    if (nextIndex >= profiles.length) {
      setIndex(0);
      return;
    }

    setIndex(nextIndex);
  };

  const forceSwipe = async (direction: "left" | "right") => {
    if (!currentProfile) return;

    if (direction === "right") {
      try {
        await saveRoommateMatch(currentProfile.id);
      } catch (saveError) {
        console.error("Failed to save match", saveError);
        setError("Unable to save this roommate right now.");
        resetPosition();
        return;
      }
    }

    const destinationX = direction === "right" ? width * 1.2 : -width * 1.2;
    Animated.timing(pan, {
      toValue: { x: destinationX, y: 0 },
      duration: 240,
      useNativeDriver: false,
    }).start(handleSwipeComplete);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > swipeThreshold) {
          void forceSwipe("right");
          return;
        }

        if (gesture.dx < -swipeThreshold) {
          void forceSwipe("left");
          return;
        }

        resetPosition();
      },
    }),
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp",
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const nopeOpacity = pan.x.interpolate({
    inputRange: [-swipeThreshold, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const nextCardScale = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.95, 0.93, 0.95],
    extrapolate: "clamp",
  });

  const renderProfile = (roommate: RoommateMatchProfile) => (
    <>
      <View style={styles.imageWrapper}>
        {roommate.image ? (
          <Image source={{ uri: roommate.image }} style={styles.photo} />
        ) : null}
        <View style={[styles.matchBadge, isDark && styles.matchBadgeDark]}>
          <Text style={styles.matchText}>{roommate.match}%</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isDark && styles.titleDark]}>
            {roommate.name}, {roommate.age}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>💼</Text>
          <Text style={[styles.metaText, isDark && styles.mutedTextDark]}>{roommate.role}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={[styles.metaText, isDark && styles.mutedTextDark]}>
            {roommate.location}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>About</Text>
        <Text style={[styles.about, isDark && styles.mutedTextDark]}>{roommate.about}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 10 }, isDark && styles.titleDark]}>
          Lifestyle
        </Text>

        <View style={styles.chipRow}>
          {roommate.lifestyle.length > 0 ? (
            roommate.lifestyle.map((item) => (
              <View key={item} style={[styles.chip, isDark && styles.chipDark]}>
                <Text style={styles.chipIcon}>{formatLifestyleIcon(item)}</Text>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.about, isDark && styles.mutedTextDark]}>
              No lifestyle preferences shared yet.
            </Text>
          )}
        </View>
      </View>
    </>
  );

  const handleTabPress = (label: string, route: Href) => {
    setActiveTab(label);
    if (label === "Home") return;
    router.push(route);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.push("/homescreen")}
          >
            <Text style={styles.headerIcon}>←</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>Matches</Text>
            <Text style={styles.headerSubtitle}>{profiles.length} potential matches</Text>
          </View>
        </View>

        <Text style={styles.headerHint}>Swipe right to save, left to pass</Text>
      </LinearGradient>

      <View style={styles.deckArea}>
        {loading ? (
          <View style={[styles.card, isDark && styles.cardDark, styles.shadow, styles.emptyCard]}>
            <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>Finding matches...</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, isDark && styles.cardDark, styles.shadow, styles.emptyCard]}>
            <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>Something went wrong</Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              {error}
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => void refreshMatches()}>
              <Text style={styles.primaryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : currentProfile ? (
          <>
            {nextProfile ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.card,
                  isDark && styles.cardDark,
                  styles.shadow,
                  styles.nextCard,
                  { transform: [{ scale: nextCardScale }, { translateY: 12 }] },
                ]}
              >
                {renderProfile(nextProfile)}
              </Animated.View>
            ) : null}

            <Animated.View
              style={[
                styles.card,
                isDark && styles.cardDark,
                styles.shadow,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={[styles.stamp, styles.passStamp, { opacity: nopeOpacity }]}>
                <Text style={[styles.stampText, isDark && styles.stampTextDark]}>PASS</Text>
              </View>

              <View style={[styles.stamp, styles.saveStamp, { opacity: likeOpacity }]}>
                <Text style={[styles.stampText, isDark && styles.stampTextDark]}>SAVE</Text>
              </View>

              {renderProfile(currentProfile)}
            </Animated.View>
          </>
        ) : (
          <View style={[styles.card, isDark && styles.cardDark, styles.shadow, styles.emptyCard]}>
            <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>No suggestions yet</Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              Complete your roommate preferences and we will bring back fresh AI suggestions.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/form")}>
              <Text style={styles.primaryLabel}>Update preferences</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.circleButton, styles.skipButton]}
          onPress={() => void forceSwipe("left")}
        >
          <Text style={styles.buttonIcon}>✕</Text>
        </Pressable>

        <Pressable
          style={[styles.circleButton, styles.likeButton]}
          onPress={() => void forceSwipe("right")}
        >
          <Text style={styles.buttonIcon}>❤️</Text>
        </Pressable>
      </View>

      <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
        {tabs.map((tab) => (
          <AnimatedTabIcon
            key={tab.label}
            icon={tab.icon}
            label={tab.label}
            active={activeTab === tab.label}
            onPress={() => handleTabPress(tab.label, tab.route)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function AnimatedTabIcon({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress?: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -7,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.Text style={[styles.tabIcon, { transform: [{ translateY }] }]}>
        {icon}
      </Animated.Text>
      <Text
        style={[
          styles.tabLabel,
          isDark && styles.tabLabelDark,
          active && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
