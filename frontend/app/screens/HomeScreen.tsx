// app/screens/HomeScreen.tsx

import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useSeekerProfile } from "../contexts/SeekerProfileContext";
import {
  Animated,
  FlatList,
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
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

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
  scoreLocation?: string;
  scoreBudget?: string;
  scoreLifestyle?: string;
  explanation?: string;
  image: string;
  description?: string;
  ownerId?: string;
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
  match?: number;
  score?: number;
  score_details?: {
    budget?: number;
    location?: number;
    rooms?: number;
    lifestyle?: number;
  };
};

type AIHouseRecord = HouseRecord & {
  property_id?: number;
  score_details?: {
    budget?: number;
    location?: number;
    rooms?: number;
    lifestyle?: number;
  };
  explanation?: string[];
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
  const scheme = useColorScheme();
  const isDark = scheme === "dark";



  return (
    <Pressable
      style={[styles.listingCard, isDark && styles.listingCardDark]}
      onPress={onPress}>
      <View style={styles.imageWrapper}>
        {image && !image.startsWith('blob:') && (
          <Animated.Image
            source={{ uri: image }}
            style={[styles.listingImage, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="cover"
          />
        )}
        {match > 0 && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>✨ {match}%</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.listingTitle, isDark && styles.listingTitleDark]}>{title}</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={[styles.locationText, isDark && styles.mutedTextDark]}>{location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {price}
            <Text style={[styles.perMonth, isDark && styles.mutedTextDark]}>/month</Text>
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

const toListing = (item: HouseRecord | AIHouseRecord, activeFilter: string): Listing => {
  let displayMatch = Number(item.score ?? item.match ?? 0);
  if (activeFilter === "budget") displayMatch = Number(item.score_details?.budget ?? displayMatch);
  if (activeFilter === "location") displayMatch = Number(item.score_details?.location ?? displayMatch);
  if (activeFilter === "lifestyle") displayMatch = Number(item.score_details?.lifestyle ?? displayMatch);

  return {
    id: String(item.id ?? item.property_id ?? ""),
    title: item.title,
    location: `${item.address ?? ""}${item.city ? `, ${item.city}` : ""}`.trim()
      || "Unknown location",
    price: `DT ${item.price}`,
    rooms: `${item.rooms ?? 1} room${(item.rooms ?? 1) > 1 ? "s" : ""}`,
    baths: `${item.bathrooms ?? 1} Bath${(item.bathrooms ?? 1) > 1 ? "s" : ""}`,
    size: `${item.space ?? 0} m²`,
    match: displayMatch,
    scoreLocation: item.score_details ? String(item.score_details.location ?? 0) : undefined,
    scoreBudget: item.score_details ? String(item.score_details.budget ?? 0) : undefined,
    scoreLifestyle: item.score_details ? String(item.score_details.lifestyle ?? 0) : undefined,
    explanation: JSON.stringify(item.explanation || []),
    image:
      resolveImageUrl(item.image_url) ??
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    description: item.description ?? undefined,
    ownerId: typeof item.owner_id === "number" ? String(item.owner_id) : undefined,
    ownerName: item.owner_name ?? undefined,
  };
};

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");
  const [activeFilter, setActiveFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const [userName, setUserName] = useState<string>("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ new_listings: 0, best_match: 0 });
  const { profile, loaded } = useSeekerProfile();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("http://127.0.0.1:8001/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = (await res.json()) as { full_name?: string; email?: string };
      if (!isMounted) return;

      setUserName(data.full_name || data.email || "");
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // 🔥 FETCH DATA FROM BACKEND
  useEffect(() => {
    const fetchStats = async () => {
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/seeker/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    };

    void fetchStats();
    if (loaded) {
      void fetchListings();
    }
  }, [loaded, profile, activeFilter]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      let nextListings: Listing[] = [];

      if (loaded) {
        const aiPayload = {
          budget: Number((profile as any)?.budget ?? 1200),
          city: profile?.location ?? "tunis",
          rooms_needed: Number((profile as any)?.rooms ?? 1) || 1,
          sleep_schedule: profile?.sleep_schedule ?? "flexible",
          cleanliness: profile?.cleanliness ?? "moderate",
          social_life: profile?.social_life ?? "moderate",
          work_style: profile?.work_style ?? "hybrid",
          filter_by: activeFilter,
        };

        const aiHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) aiHeaders.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/ai/match-properties`, {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify(aiPayload),
        });

        if (res.ok) {
          const data = (await res.json()) as { matches?: AIHouseRecord[] };
          if (Array.isArray(data.matches) && data.matches.length > 0) {
            nextListings = data.matches.map((item) => toListing(item, activeFilter));
          }
        }
      }

      setListings(nextListings);
      if (nextListings.length === 0) setError("No properties available right now.");
    } catch (e) {
      console.error("Error fetching listings:", e);
      setError("Unable to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Use SeekerProfile context to determine if Roommates tab/toggle should show
  let showRoommates = true;
  if (profile?.looking_for === "house") {
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
        scoreLocation: item.scoreLocation,
        scoreBudget: item.scoreBudget,
        scoreLifestyle: item.scoreLifestyle,
        explanation: item.explanation,
        image: item.image,
        description: item.description,
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        ownerAvatar: item.ownerAvatar,
        ownerRating: item.ownerRating,
        ownerResponse: item.ownerResponse,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? Colors.dark.background : "#FFFFFF"}
        />
        <View style={[styles.container, isDark && styles.containerDark]}>
          <Text
            style={{
              textAlign: "center",
              marginTop: 24,
              color: isDark ? Colors.dark.text : INK,
            }}
          >
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
      colors={
        isDark
          ? [Colors.dark.background, Colors.dark.background]
          : ["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <StatusBar barStyle="light-content" backgroundColor={CORAL} />

        <FlatList
          style={[styles.container, isDark && styles.containerDark]}
          showsVerticalScrollIndicator={false}
          data={listings.slice(0, visibleCount)}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (visibleCount < listings.length) {
              setVisibleCount((prev) => prev + 10);
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <>
          {/* ── HERO ── */}
          <LinearGradient
            colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroTitle}>
                   Welcome,{"\n"}{userName || "Roominder"} 👋
                </Text>
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
              <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    styles.toggleActive,
                    isDark && styles.toggleActiveDark,
                  ]}
                >
                  <Text style={styles.toggleIconActive}>🏠</Text>
                  <Text style={styles.toggleTextActive}>Housing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => router.push("/roomatematch")}
                >
                  <Text style={[styles.toggleIcon, isDark && styles.toggleIconDark]}>👥</Text>
                  <Text style={[styles.toggleText, isDark && styles.toggleTextDark]}>Roommates</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    styles.toggleActive,
                    isDark && styles.toggleActiveDark,
                  ]}
                >
                  <Text style={styles.toggleIconActive}>🏠</Text>
                  <Text style={styles.toggleTextActive}>Housing</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>

          {/* ── STATS ── */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>📈 New Listings</Text>
              <Text style={[styles.statValue, styles.statValueTeal, isDark && styles.statValueDark]}>{stats.new_listings}</Text>
            </View>
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>✨ Best Match</Text>
              <Text style={[styles.statValue, styles.statValueAccent, isDark && styles.statValueDark]}>
                {stats.best_match}%
              </Text>
            </View>
          </View>

          {/* ── FILTERS ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {["all", "location", "budget", "lifestyle"].map((filterOpt) => (
              <TouchableOpacity
                key={filterOpt}
                style={[
                  styles.filterChip,
                  activeFilter === filterOpt && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filterOpt)}
              >
                <Text style={[
                  styles.filterChipText,
                  activeFilter === filterOpt && styles.filterChipTextActive
                ]}>
                  {filterOpt.charAt(0).toUpperCase() + filterOpt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── LISTINGS ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Recommended for{"\n"}You
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, isDark && styles.viewAllDark]}>
                View{"\n"}All
              </Text>
            </TouchableOpacity>
          </View>

            </>
          }
          renderItem={({ item }) => (
            <ListingCard
              {...item}
              onPress={() => goToDetails(item)}
            />
          )}
          ListEmptyComponent={
            !loading && error ? (
              <View style={[styles.feedbackCard, isDark && styles.feedbackCardDark]}>
                <Text style={[styles.feedbackTitle, isDark && styles.feedbackTitleDark]}>
                  No properties to show
                </Text>
                <Text style={[styles.feedbackText, isDark && styles.feedbackTextDark]}>{error}</Text>
                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={() => void fetchListings()}
                >
                  <Text style={styles.feedbackButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListFooterComponent={<View style={{ height: 16 }} />}
        />

        {/* ── BOTTOM TAB BAR ── */}
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
  safeAreaDark: { backgroundColor: Colors.dark.background },
  containerDark: { backgroundColor: Colors.dark.background },

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
  toggleContainerDark: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
  toggleActiveDark: {
    backgroundColor: Colors.dark.cardMuted,
  },
  toggleIcon: { fontSize: 16 },
  toggleIconActive: { fontSize: 16 },
  toggleIconDark: { color: Colors.dark.mutedText },
  toggleText: { fontSize: 14, color: TEAL, fontWeight: "600" },
  toggleTextActive: { fontSize: 14, color: CORAL, fontWeight: "700" },
  toggleTextDark: { color: Colors.dark.mutedText },

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
  statCardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  statLabelDark: { color: Colors.dark.mutedText },
  statValueDark: { color: Colors.dark.text },
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
  sectionTitleDark: { color: Colors.dark.text },
  viewAll: {
    fontSize: 13,
    color: TEAL,
    fontWeight: "600",
    textAlign: "right",
  },
  viewAllDark: { color: TEAL },

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
  listingCardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
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
  listingTitleDark: { color: Colors.dark.text },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  locationPin: { fontSize: 12, marginRight: 4 },
  locationText: { fontSize: 12, color: "#7A6D6A" },
  mutedTextDark: { color: Colors.dark.mutedText },
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
  feedbackCardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK,
  },
  feedbackTitleDark: { color: Colors.dark.text },
  feedbackText: {
    fontSize: 13,
    color: "#7A6D6A",
    textAlign: "center",
    lineHeight: 18,
  },
  feedbackTextDark: { color: Colors.dark.mutedText },
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

  // FILTERS
  filterScroll: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8, gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: CORAL_PASTEL,
  },
  filterChipActive: { backgroundColor: CORAL, borderColor: CORAL },
  filterChipText: { color: INK, fontSize: 13, fontWeight: "600" },
  filterChipTextActive: { color: "#FFF" },

  // BOTTOM TAB BAR
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CORAL_PASTEL,
  },
  tabBarDark: {
    backgroundColor: Colors.dark.card,
    borderTopColor: Colors.dark.border,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelDark: { color: Colors.dark.mutedText },
  tabLabelActive: { color: CORAL, fontWeight: "700" },
});
