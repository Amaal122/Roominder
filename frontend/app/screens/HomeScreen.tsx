// app/screens/HomeScreen.tsx

import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useSeekerProfile } from "../contexts/SeekerProfileContext";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuthToken } from "../state/auth";

// ─── Types ─────────────────────────────────────────────────────
type Listing = {
  id: string;
  title: string;
  location: string;
  price: string;
  rooms: string;
  baths: string;
  size: string;
  match: number;
  image: string;
  description?: string;
  ownerName?: string;
  ownerAvatar?: string;
  ownerRating?: string;
  ownerResponse?: string;
};

type HouseRecord = {
  id: number;
  owner_id: number;
  owner_name?: string | null;
  title: string;
  address?: string | null;
  city?: string | null;
  price: number;
  rooms?: number | null;
  bathrooms?: number | null;
  space?: number | null;
  description?: string | null;
  image_url?: string | null;
};

type DashboardResponse = {
  houses?: HouseRecord[];
};

// ─── AnimatedTabIcon ──────────────────────────────────────────────────────────
const AnimatedTabIcon = ({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress?: () => void;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;

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
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── ListingCard ──────────────────────────────────────────────────────────────
const ListingCard = ({
  title,
  location,
  price,
  rooms,
  match,
  image,
  onPress,
}: Listing & { onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;



  return (
    <Pressable
      style={styles.listingCard}
      onPress={onPress}>
      <View style={styles.imageWrapper}>
        {image && !image.startsWith('blob:') && (
          <Animated.Image
            source={{ uri: image }}
            style={[styles.listingImage, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="cover"
          />
        )}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>✨ {match}%</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.listingTitle}>{title}</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>{location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {price}
            <Text style={styles.perMonth}>/month</Text>
          </Text>
          <View style={styles.roomsBadge}>
            <Text style={styles.roomsText}>{rooms}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8001";

const resolveImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return `${API_BASE}${imageUrl}`;
  return `${API_BASE}/${imageUrl}`;
};

const toListing = (item: HouseRecord): Listing => ({
  id: String(item.id),
  title: item.title,
  location: `${item.address ?? ""}${item.city ? `, ${item.city}` : ""}`.trim()
    || "Unknown location",
  price: `DT ${item.price}`,
  rooms: `${item.rooms ?? 1} room${(item.rooms ?? 1) > 1 ? "s" : ""}`,
  baths: `${item.bathrooms ?? 1} Bath${(item.bathrooms ?? 1) > 1 ? "s" : ""}`,
  size: `${item.space ?? 0} m²`,
  match: Math.floor(Math.random() * 30) + 70,
  image:
    resolveImageUrl(item.image_url) ??
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  description: item.description ?? undefined,
  ownerName: item.owner_name ?? undefined,
});

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  // 🔥 FETCH DATA FROM BACKEND
  useEffect(() => {
    void fetchListings();
  }, []);
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      let nextListings: Listing[] = [];

      if (token) {
        const dashboardResponse = await fetch(`${API_BASE}/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (dashboardResponse.ok) {
          const data: DashboardResponse = await dashboardResponse.json();
          nextListings = (data.houses ?? []).map(toListing);
        } else {
          console.warn(
            "Dashboard fetch failed, using public properties fallback.",
            dashboardResponse.status,
          );
        }
      }

      if (nextListings.length === 0) {
        const propertiesResponse = await fetch(`${API_BASE}/properties/`);

        if (!propertiesResponse.ok) {
          throw new Error(
            `Failed to fetch properties (${propertiesResponse.status})`,
          );
        }

        const publicData: HouseRecord[] = await propertiesResponse.json();
        nextListings = publicData.map(toListing);
      }

      setListings(nextListings);

      if (nextListings.length === 0) {
        setError("No properties available right now.");
      }

      return;
      /*

      const formatted = (data.houses ?? []).map((item) => ({
        id: String(item.id),
        title: item.title,
        location: `${item.address ?? ""}${
          item.city ? `, ${item.city}` : ""
        }`.trim() || "Unknown location",
        price: `€${item.price}`,
        rooms: `${item.rooms ?? 1} rooms`,
        match: Math.floor(Math.random() * 30) + 70,
        image:
          resolveImageUrl(item.image_url) ??
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        description: item.description ?? undefined,
        ownerName: item.owner_name ?? undefined,
      }));

      setListings(formatted);
      setError(null);
      */
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
      setError("Unable to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Use SeekerProfile context to determine if Roommates tab/toggle should show
  const { profile } = useSeekerProfile();
  let showRoommates = true;
  if (profile.looking_for === "house") {
    showRoommates = false;
  }
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" as Href },
    ...(showRoommates ? [{ icon: "👥", label: "Match", route: "/match" as Href }] : []),
    { icon: "💬", label: "Chat", route: "/chat" as Href },
    { icon: "❤️", label: "Favorites", route: "/favorite" as Href },
    { icon: "👤", label: "Profile", route: "/profile" as Href },
  ];

  const handleTabPress = (label: string, route: Href) => {
    setActiveTab(label);
    if (label === "Home") return;
    router.push(route);
  };

  const goToDetails = (item: Listing) => {
    router.push({
      pathname: "/screens/PropertyDetail",
      params: {
        id: item.id,
        title: item.title,
        location: item.location,
        price: item.price,
        rooms: item.rooms,
        baths: item.baths,
        size: item.size,
        match: String(item.match),
        image: item.image,
        description: item.description,
        ownerName: item.ownerName,
        ownerAvatar: item.ownerAvatar,
        ownerRating: item.ownerRating,
        ownerResponse: item.ownerResponse,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={CORAL} />
        <View style={styles.container}>
          <Text style={{ textAlign: "center", marginTop: 24, color: INK }}>
            Loading recommendations...
          </Text>
          {error ? (
            <Text style={{ textAlign: "center", marginTop: 8, color: CORAL }}>
              {error}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={CORAL} />

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO ── */}
          <LinearGradient
            colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroTitle}>Welcome to{"\n"}Roominder</Text>
                <Text style={styles.heroSubtitle}>Find your perfect match</Text>
                <View style={styles.heroChips}>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>New in Paris</Text>
                  </View>
                  <View style={[styles.heroChip, styles.heroChipTeal]}>
                    <Text style={styles.heroChipTextDark}>Verified</Text>
                  </View>
                </View>
              </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/notifications")}
            >
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
            </View>

            {showRoommates ? (
              <View style={styles.toggleContainer}>
                <TouchableOpacity style={[styles.toggleBtn, styles.toggleActive]}>
                  <Text style={styles.toggleIconActive}>🏠</Text>
                  <Text style={styles.toggleTextActive}>Housing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => router.push("/roomatematch")}
                >
                  <Text style={styles.toggleIcon}>👥</Text>
                  <Text style={styles.toggleText}>Roommates</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.toggleContainer}>
                <TouchableOpacity style={[styles.toggleBtn, styles.toggleActive]}>
                  <Text style={styles.toggleIconActive}>🏠</Text>
                  <Text style={styles.toggleTextActive}>Housing</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>

          {/* ── STATS ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>📈 New Listings</Text>
              <Text style={[styles.statValue, styles.statValueTeal]}>24</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>✨ Best Match</Text>
              <Text style={[styles.statValue, styles.statValueAccent]}>
                95%
              </Text>
            </View>
          </View>

          {/* ── LISTINGS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for{"\n"}You</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View{"\n"}All</Text>
            </TouchableOpacity>
          </View>

          {listings.map((item) => (
            <ListingCard
              key={item.id}
              {...item}
              onPress={() => goToDetails(item)}
            />
          ))}

          {!listings.length && error ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>No properties to show</Text>
              <Text style={styles.feedbackText}>{error}</Text>
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => void fetchListings()}
              >
                <Text style={styles.feedbackButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── BOTTOM TAB BAR ── */}
        <View style={styles.tabBar}>
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
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CORAL = "#F4896B";
const CORAL_PASTEL = "#F9D4C2";
const TEAL = "#78CFC7";
const INK = "#2B2B33";

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "transparent" },
  container: { flex: 1 },

  // HERO
  hero: {
    backgroundColor: CORAL,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#FFF", lineHeight: 34 },
  heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  heroChips: { flexDirection: "row", gap: 8, marginTop: 10 },
  heroChip: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroChipTeal: { backgroundColor: "rgba(255,255,255,0.85)" },
  heroChipText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  heroChipTextDark: { color: INK, fontSize: 11, fontWeight: "700" },
  bellButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: { fontSize: 18 },

  // TOGGLE
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleIcon: { fontSize: 16 },
  toggleIconActive: { fontSize: 16 },
  toggleText: { fontSize: 14, color: TEAL, fontWeight: "600" },
  toggleTextActive: { fontSize: 14, color: CORAL, fontWeight: "700" },

  // STATS
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: CORAL_PASTEL,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { fontSize: 11, color: "#7A6D6A", marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: "800", color: INK },
  statValueTeal: { color: TEAL },
  statValueAccent: { color: TEAL },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: INK,
    lineHeight: 24,
  },
  viewAll: {
    fontSize: 13,
    color: TEAL,
    fontWeight: "600",
    textAlign: "right",
  },

  // LISTING CARD
  listingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: CORAL_PASTEL,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: { position: "relative" },
  listingImage: { width: "100%", height: 190 },
  matchBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: TEAL,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  matchBadgeText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  cardBody: { padding: 14 },
  listingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
    marginBottom: 4,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  locationPin: { fontSize: 12, marginRight: 4 },
  locationText: { fontSize: 12, color: "#7A6D6A" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontSize: 18, fontWeight: "800", color: CORAL },
  perMonth: { fontSize: 12, fontWeight: "400", color: "#7A6D6A" },
  roomsBadge: {
    backgroundColor: CORAL_PASTEL,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roomsText: { fontSize: 12, color: CORAL, fontWeight: "600" },
  feedbackCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORAL_PASTEL,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK,
  },
  feedbackText: {
    fontSize: 13,
    color: "#7A6D6A",
    textAlign: "center",
    lineHeight: 18,
  },
  feedbackButton: {
    backgroundColor: CORAL,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  feedbackButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // BOTTOM TAB BAR
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CORAL_PASTEL,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelActive: { color: CORAL, fontWeight: "700" },
});
