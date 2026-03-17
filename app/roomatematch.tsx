import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;

const PROFILES = [
  {
    id: "1",
    name: "Sarah Miller",
    age: 26,
    role: "Graphic Designer",
    location: "Le Marais, Paris",
    about:
      "Creative professional looking for a clean, friendly roommate to share a cozy apartment.",
    lifestyle: ["Early Bird", "Very Organized", "Love to Cook"],
    match: 92,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&w=900&q=80",
  },
  {
    id: "2",
    name: "Lena Kim",
    age: 24,
    role: "Product Designer",
    location: "Canal Saint-Martin, Paris",
    about:
      "Chill, tidy, and loves plants. Down for movie nights and board games.",
    lifestyle: ["Plant Lover", "Night Owl", "Board Games"],
    match: 88,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&w=900&q=80",
  },
  {
    id: "3",
    name: "Mia Laurent",
    age: 27,
    role: "Marketing Lead",
    location: "Bastille, Paris",
    about: "Sociable but respects quiet time. Enjoys cooking and Sunday runs.",
    lifestyle: ["Runner", "Great Cook", "Clean"],
    match: 85,
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&w=900&q=80",
  },
  {
    id: "4",
    name: "Jade Cohen",
    age: 25,
    role: "UX Researcher",
    location: "Montmartre, Paris",
    about: "Bookworm with a calm vibe. Loves coffee spots and weekend markets.",
    lifestyle: ["Calm", "Reads a lot", "Loves Coffee"],
    match: 80,
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&w=900&q=80",
  },
];

type Profile = (typeof PROFILES)[number];

const formatLifestyleIcon = (label: string) => {
  if (label.toLowerCase().includes("cook")) return "🍳";
  if (label.toLowerCase().includes("organized")) return "🧹";
  if (label.toLowerCase().includes("early")) return "🌅";
  if (label.toLowerCase().includes("night")) return "🌙";
  if (label.toLowerCase().includes("plant")) return "🌿";
  if (label.toLowerCase().includes("read")) return "📚";
  if (label.toLowerCase().includes("coffee")) return "☕";
  if (label.toLowerCase().includes("run")) return "🏃";
  return "✨";
};

export default function RoomateMatch() {
  const router = useRouter();
  const profiles = useMemo(() => PROFILES, []);
  const [index, setIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;

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
    } else {
      setIndex(nextIndex);
    }
  };

  const forceSwipe = (direction: "left" | "right") => {
    if (!currentProfile) return;
    const destX = direction === "right" ? width * 1.2 : -width * 1.2;
    Animated.timing(pan, {
      toValue: { x: destX, y: 0 },
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
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
          return;
        }
        if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
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
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const nextCardScale = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.95, 0.93, 0.95],
    extrapolate: "clamp",
  });

  const renderProfile = (profile: Profile) => (
    <>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: profile.image }} style={styles.photo} />
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{profile.match}%</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {profile.name}, {profile.age}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>💼</Text>
          <Text style={styles.metaText}>{profile.role}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText}>{profile.location}</Text>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.about}>{profile.about}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Lifestyle</Text>
        <View style={styles.chipRow}>
          {profile.lifestyle.map((item) => (
            <View key={item} style={styles.chip}>
              <Text style={styles.chipIcon}>{formatLifestyleIcon(item)}</Text>
              <Text style={styles.chipText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#7B2FBE", "#9D42FF"]}
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
            <Text style={styles.headerTitle}>Roommatch</Text>
            <Text style={styles.headerSubtitle}>3 potential matches</Text>
          </View>

          <View style={styles.infoBubble}>
            <Text style={styles.infoIcon}>ℹ️</Text>
          </View>
        </View>
        <Text style={styles.headerHint}>Swipe right to save, left to pass</Text>
      </LinearGradient>

      <View style={styles.deckArea}>
        {nextProfile && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.card,
              styles.shadow,
              styles.nextCard,
              { transform: [{ scale: nextCardScale }, { translateY: 12 }] },
            ]}
          >
            {renderProfile(nextProfile)}
          </Animated.View>
        )}

        {currentProfile ? (
          <Animated.View
            style={[
              styles.card,
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
            <View
              style={[styles.stamp, styles.passStamp, { opacity: nopeOpacity }]}
            >
              <Text style={styles.stampText}>PASS</Text>
            </View>
            <View
              style={[styles.stamp, styles.saveStamp, { opacity: likeOpacity }]}
            >
              <Text style={styles.stampText}>SAVE</Text>
            </View>
            {renderProfile(currentProfile)}
          </Animated.View>
        ) : (
          <View style={[styles.card, styles.shadow, styles.emptyCard]}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySubtitle}>
              You have seen everyone for now. We will refresh suggestions soon.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => setIndex(0)}>
              <Text style={styles.primaryLabel}>Restart</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.circleButton, styles.skipButton]}
          onPress={() => forceSwipe("left")}
        >
          <Text style={styles.buttonIcon}>✕</Text>
        </Pressable>
        <Pressable
          style={[styles.circleButton, styles.likeButton]}
          onPress={() => forceSwipe("right")}
        >
          <Text style={styles.buttonIcon}>❤️</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F2FA" },
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
  infoBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: { fontSize: 18 },

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
  photo: { width: "100%", height: 360 },
  matchBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderWidth: 3,
    borderColor: "#FFF",
    backgroundColor: "rgba(255,255,255,0.85)",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  matchText: { fontSize: 18, fontWeight: "800", color: "#7B2FBE" },
  cardBody: { padding: 16 },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaIcon: { fontSize: 13, marginRight: 6 },
  metaText: { fontSize: 13, color: "#61677A" },
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
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 12, color: "#5A3671", fontWeight: "700" },

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
  likeButton: { backgroundColor: "#7B2FBE" },
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

  emptyCard: {
    alignItems: "center",
    padding: 28,
    gap: 10,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  emptySubtitle: { color: "#6B7280", textAlign: "center", lineHeight: 20 },
  primaryButton: {
    marginTop: 6,
    backgroundColor: "#7B2FBE",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryLabel: { color: "#FFF", fontWeight: "700" },
});
