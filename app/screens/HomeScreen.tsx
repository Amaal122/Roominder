// app/screens/HomeScreen.tsx

import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Data ────────────────────────────────────────────────────────────────────
const LISTINGS = [
  {
    id: "1",
    title: "Modern Loft in Marais",
    location: "Le Marais, Paris",
    price: "€1 200",
    rooms: "2 bedrooms",
    match: 95,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
  },
  {
    id: "2",
    title: "Luxury Studio with Terrace",
    location: "Saint-Germain, Paris",
    price: "€950",
    rooms: "1 bedroom",
    match: 88,
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600",
  },
  {
    id: "3",
    title: "Cozy Apartment Near Metro",
    location: "Bastille, Paris",
    price: "€850",
    rooms: "1 bedroom",
    match: 82,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
  },
  {
    id: "4",
    title: "Bright Flat with Garden",
    location: "Montmartre, Paris",
    price: "€1 050",
    rooms: "2 bedrooms",
    match: 79,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600",
  },
  {
    id: "5",
    title: "Chic Penthouse Oberkampf",
    location: "Oberkampf, Paris",
    price: "€1 600",
    rooms: "3 bedrooms",
    match: 74,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
  },
  {
    id: "6",
    title: "Quiet Studio Near Louvre",
    location: "Châtelet, Paris",
    price: "€780",
    rooms: "1 bedroom",
    match: 70,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600",
  },
];

type Listing = (typeof LISTINGS)[0];

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

  // hover يخدم على web فقط، مش مشكل نخليوه
  const handleHoverIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };
  const handleHoverOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      style={styles.listingCard}
      onPress={onPress} // ✅ أهم حاجة
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
    >
      <View style={styles.imageWrapper}>
        <Animated.Image
          source={{ uri: image }}
          style={[styles.listingImage, { transform: [{ scale: scaleAnim }] }]}
          resizeMode="cover"
        />
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
export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");

  const tabs = [
    { icon: "🏠", label: "Home" },
    { icon: "👥", label: "Match" },
    { icon: "💬", label: "Chat" },
    { icon: "❤️", label: "Favorites" },
    { icon: "👤", label: "Profile" },
  ];

  const goToDetails = (item: Listing) => {
    router.push({
      pathname: "/screens/PropertyDetail", // ✅ بما أن الملف داخل app/screens/
      params: {
        id: item.id,
        title: item.title,
        location: item.location,
        price: item.price,
        rooms: item.rooms,
        match: String(item.match),
        image: item.image,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Your Sweet{"\n"}Home</Text>
              <Text style={styles.heroSubtitle}>Find your perfect match</Text>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleBtn, styles.toggleActive]}>
              <Text style={styles.toggleIconActive}>🏠</Text>
              <Text style={styles.toggleTextActive}>Housing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn}>
              <Text style={styles.toggleIcon}>👥</Text>
              <Text style={styles.toggleText}>Roommates</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>📈 New Listings</Text>
            <Text style={styles.statValue}>24</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>✨ Best Match</Text>
            <Text style={[styles.statValue, styles.statValuePurple]}>95%</Text>
          </View>
        </View>

        {/* ── LISTINGS ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for{"\n"}You</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View{"\n"}All</Text>
          </TouchableOpacity>
        </View>

        {LISTINGS.map((item) => (
          <ListingCard
            key={item.id}
            {...item}
            onPress={() => goToDetails(item)}
          />
        ))}

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
            onPress={() => setActiveTab(tab.label)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const PURPLE = "#7B2FBE";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { flex: 1 },

  // HERO
  hero: {
    backgroundColor: PURPLE,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#FFF", lineHeight: 34 },
  heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  bellButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
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
    backgroundColor: "rgba(255,255,255,0.95)",
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
  toggleText: { fontSize: 14, color: PURPLE, fontWeight: "500" },
  toggleTextActive: { fontSize: 14, color: "#1A1A2E", fontWeight: "700" },

  // STATS
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { fontSize: 11, color: "#888", marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#1A1A2E" },
  statValuePurple: { color: PURPLE },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
    lineHeight: 24,
  },
  viewAll: {
    fontSize: 13,
    color: PURPLE,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: { position: "relative" },
  listingImage: { width: "100%", height: 180 },
  matchBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  matchBadgeText: { fontSize: 13, fontWeight: "700", color: "#F0A500" },
  cardBody: { padding: 14 },
  listingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  locationPin: { fontSize: 12, marginRight: 4 },
  locationText: { fontSize: 12, color: "#888" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontSize: 18, fontWeight: "800", color: PURPLE },
  perMonth: { fontSize: 12, fontWeight: "400", color: "#888" },
  roomsBadge: {
    backgroundColor: "#F3E8FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roomsText: { fontSize: 12, color: PURPLE, fontWeight: "600" },

  // BOTTOM TAB BAR
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F5",
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelActive: { color: PURPLE, fontWeight: "700" },
});
