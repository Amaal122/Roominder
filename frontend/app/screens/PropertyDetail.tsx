import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
    Animated,
    BackHandler,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PropertyMap from "../../components/PropertyMap";
import { addFavorite } from "../../store/favoriteStore";

const { width } = Dimensions.get("window");

const CORAL = "#F4896B";
const CORAL_PASTEL = "#F9D4C2";
const TEAL = "#7ECEC4";
const INK = "#2B2B33";
const MUTED = "#7A6D6A";
const BG = "#FFF7F3";
const BORDER = "#F1E3DC";

// ── Icons (inline SVG-like with View shapes) ──────────────────────────────────
const IconWifi = () => (
  <View style={{ alignItems: "center", gap: 3 }}>
    {[20, 14, 8].map((w, i) => (
      <View
        key={i}
        style={{
          width: w,
          height: 3,
          borderRadius: 2,
          backgroundColor: TEAL,
          opacity: 1 - i * 0.15,
        }}
      />
    ))}
    <View
      style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: TEAL,
      }}
    />
  </View>
);
const IconTV = () => (
  <View
    style={{
      width: 24,
      height: 18,
      borderWidth: 2,
      borderColor: TEAL,
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View style={{ width: 10, height: 1.5, backgroundColor: TEAL }} />
  </View>
);
const IconKitchen = () => (
  <View
    style={{
      width: 20,
      height: 22,
      borderWidth: 2,
      borderColor: TEAL,
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 4,
    }}
  >
    <View style={{ width: 12, height: 1.5, backgroundColor: TEAL }} />
  </View>
);
const IconElevator = () => (
  <View
    style={{
      width: 20,
      height: 22,
      borderWidth: 2,
      borderColor: TEAL,
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    }}
  >
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderBottomWidth: 5,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: TEAL,
      }}
    />
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 5,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: TEAL,
      }}
    />
  </View>
);
const IconParking = () => (
  <View
    style={{
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: TEAL,
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ fontSize: 13, fontWeight: "700", color: TEAL }}>P</Text>
  </View>
);
const IconPeople = () => (
  <View style={{ flexDirection: "row", gap: -6 }}>
    {[0, 1].map((i) => (
      <View key={i} style={{ alignItems: "center", gap: 2 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: TEAL,
          }}
        />
        <View
          style={{
            width: 14,
            height: 8,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: TEAL,
          }}
        />
      </View>
    ))}
  </View>
);

const AMENITIES = [
  { icon: <IconWifi />, label: "WiFi" },
  { icon: <IconTV />, label: "TV" },
  { icon: <IconKitchen />, label: "Kitchen" },
  { icon: <IconElevator />, label: "Elevator" },
  { icon: <IconParking />, label: "Parking" },
  { icon: <IconPeople />, label: "Flatmates" },
];

const SCORES = [
  { label: "Location", value: 98 },
  { label: "Price", value: 92 },
  { label: "Lifestyle", value: 95 },
];

// ── Animated Progress Bar ─────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [anim, value]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

// ── Room Illustration ─────────────────────────────────────────────────────────
function RoomIllustration() {
  return (
    <View style={styles.roomScene}>
      <View style={styles.roomBg} />
      <View style={styles.window}>
        <View style={styles.windowGlow} />
      </View>
      <View style={[styles.curtain, { left: "22%" }]} />
      <View style={[styles.curtain, { right: "22%" }]} />
      <View style={styles.floor} />
      <View style={styles.sofa}>
        <View style={styles.sofaBack} />
      </View>
      <View style={styles.coffeeTable} />
      <View style={styles.chair}>
        <View style={styles.chairBack} />
      </View>
      <View style={styles.lampPost} />
      <View style={styles.lampShade} />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PropertyDetail() {
  // ✅ ناخذ الداتا اللي بعثناها من HomeScreen
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
    price?: string;
    rooms?: string;
    match?: string;
    image?: string;
    baths?: string;
    size?: string;
    description?: string;
    lat?: string;
    lng?: string;
    ownerName?: string;
    ownerAvatar?: string;
    ownerRating?: string;
    ownerResponse?: string;
  }>();

  const title = params.title ?? "Modern Loft\nin Marais";
  const price = params.price ?? "€1200";
  const location = params.location ?? "Le Marais, Paris";
  const rooms = params.rooms ?? "2 Beds";
  const match = params.match ?? "95";
  const image = Array.isArray(params.image) ? params.image[0] : params.image;
  const baths = params.baths ?? "1 Bath";
  const size = params.size ?? "65 m²";
  const description =
    params.description ??
    "Beautiful modern loft in the heart of Le Marais. This spacious apartment features high ceilings, large windows, and a contemporary design. Perfect for young professionals looking for a stylish living space in a vibrant neighborhood.";
  const lat = params.lat ? Number(params.lat) : 48.8566;
  const lng = params.lng ? Number(params.lng) : 2.3522;
  const ownerName = params.ownerName ?? "Amina Diallo";
  const ownerAvatar =
    params.ownerAvatar ??
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200";
  const ownerRating = params.ownerRating ?? "4.9";
  const ownerResponse = params.ownerResponse ?? "2h response";

  const handleFavorite = () => {
    const id = params.id ?? `${title}-${location}`;
    addFavorite({ id, title, location, price, image });
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
      return true;
    }
    router.replace("/homescreen");
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [handleBack]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HERO */}
        <View style={styles.hero}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <RoomIllustration />
          )}
          <LinearGradient
            colors={["rgba(244,137,107,0.2)", "rgba(126,206,196,0.3)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroOverlay}
            pointerEvents="none"
          />

          {/* Top Nav */}
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.navBtn} onPress={handleBack}>
              <Text style={styles.navIcon}>←</Text>
            </TouchableOpacity>

            <View style={styles.navRight}>
              <TouchableOpacity style={styles.navBtn} onPress={handleFavorite}>
                <Text style={styles.navIcon}>♡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn}>
                <Text style={styles.navIcon}>⬆</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Match Badge */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchStar}>✦</Text>
            <Text style={styles.matchText}>{match}% Match</Text>
          </View>
        </View>

        {/* CONTENT CARD */}
        <View style={styles.card}>
          <View style={styles.pill} />

          {/* Title + Price */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <View>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.pricePer}>/month</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>

          {/* Specs */}
          <View style={styles.specsRow}>
            {[rooms, baths, size].map((s) => (
              <View key={s} style={styles.specTag}>
                <Text style={styles.specText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* AI Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreTitleRow}>
              <Text style={styles.scoreStar}>✦</Text>
              <Text style={styles.scoreTitle}>AI Compatibility Score</Text>
            </View>

            {SCORES.map(({ label, value }) => (
              <View key={label} style={styles.scoreRow}>
                <View style={styles.scoreLabelRow}>
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <Text style={styles.scoreValue}>{value}%</Text>
                </View>
                <ProgressBar value={value} />
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionArrow}>▲</Text>
            </View>
            <Text style={styles.descText}>{description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITIES.map(({ icon, label }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.amenityCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.amenityIcon}>{typeof icon === 'string' ? <Text>{icon}</Text> : icon}</View>
                  <Text style={styles.amenityLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              {Platform.OS === "web" ? (
                <View style={styles.mapPlaceholder}>
                  <View style={styles.mapPin} />
                  <Text style={styles.mapTitle}>Map Preview</Text>
                  <Text style={styles.mapCoords}>
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </Text>
                </View>
              ) : (
                <PropertyMap lat={lat} lng={lng} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/screens/OwnerProfile",
              params: {
                title,
                location,
                ownerName,
                ownerAvatar,
                ownerRating,
                ownerResponse,
              },
            })
          }
        >
          <Text style={styles.ctaText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },

  // HERO
  hero: { height: 300, position: "relative", overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  roomScene: { flex: 1, position: "relative" },
  roomBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#FAE8D8" },
  window: {
    position: "absolute",
    top: "8%",
    left: "38%",
    width: 80,
    height: 110,
    backgroundColor: "#FFF9F0",
    borderWidth: 3,
    borderColor: "rgba(200,160,100,0.3)",
    borderRadius: 2,
  },
  windowGlow: {
    position: "absolute",
    inset: -30,
    backgroundColor: "rgba(255,235,180,0.5)",
    borderRadius: 60,
  },
  curtain: {
    position: "absolute",
    top: "5%",
    width: 55,
    height: 120,
    backgroundColor: "#E8D0B0",
    borderRadius: 2,
  },
  floor: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: "#E0C898",
  },
  sofa: {
    position: "absolute",
    bottom: 65,
    left: "8%",
    width: 110,
    height: 50,
    backgroundColor: "#E8D5C0",
    borderRadius: 8,
  },
  sofaBack: {
    position: "absolute",
    top: -18,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: "#DDC9B4",
    borderRadius: 6,
  },
  coffeeTable: {
    position: "absolute",
    bottom: 63,
    left: "42%",
    width: 55,
    height: 28,
    backgroundColor: "#EDE0C8",
    borderRadius: 28,
  },
  chair: {
    position: "absolute",
    bottom: 65,
    left: "62%",
    width: 55,
    height: 60,
    backgroundColor: "#5C4D3C",
    borderRadius: 5,
  },
  chairBack: {
    position: "absolute",
    top: -18,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: "#6B5A47",
    borderRadius: 5,
  },
  lampPost: {
    position: "absolute",
    bottom: 65,
    right: "10%",
    width: 4,
    height: 85,
    backgroundColor: "#B8956A",
  },
  lampShade: {
    position: "absolute",
    bottom: 148,
    right: "calc(10% - 18px)" as any,
    width: 40,
    height: 24,
    backgroundColor: "#D4AA7D",
    borderRadius: 20,
  },
  heroNav: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  navIcon: { fontSize: 16, color: "#333" },
  navRight: { flexDirection: "row", gap: 10 },
  matchBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  matchStar: { fontSize: 14, color: CORAL },
  matchText: { fontSize: 13, fontWeight: "600", color: INK },

  // CARD
  card: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  pill: {
    width: 36,
    height: 4,
    backgroundColor: "#EAD6CC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: INK, lineHeight: 28 },
  price: { fontSize: 22, fontWeight: "700", color: CORAL, textAlign: "right" },
  pricePer: { fontSize: 12, color: MUTED, textAlign: "right" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  locationPin: { fontSize: 13 },
  locationText: { fontSize: 13, color: MUTED },
  specsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  specTag: {
    backgroundColor: CORAL_PASTEL,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  specText: { fontSize: 12, fontWeight: "600", color: CORAL },

  // SCORE
  scoreCard: {
    backgroundColor: "#FFF5F0",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  scoreTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  scoreStar: { fontSize: 18, color: TEAL },
  scoreTitle: { fontSize: 15, fontWeight: "600", color: INK },
  scoreRow: { marginBottom: 14 },
  scoreLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  scoreLabel: { fontSize: 13, color: INK },
  scoreValue: { fontSize: 13, fontWeight: "600", color: TEAL },
  progressTrack: {
    height: 6,
    backgroundColor: "#F6D9CC",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, backgroundColor: TEAL, borderRadius: 3 },

  // SECTIONS
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
    marginBottom: 12,
  },
  sectionArrow: { fontSize: 14, color: MUTED },
  descText: { fontSize: 13, lineHeight: 22, color: MUTED },

  // AMENITIES
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  amenityCard: {
    width: (width - 48 - 24) / 3,
    backgroundColor: "#FFF5F0",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  amenityIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  amenityLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "500",
    textAlign: "center",
  },

  // MAP
  mapContainer: {
    backgroundColor: CORAL_PASTEL,
    borderRadius: 16,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    position: "relative",
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  mapPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CORAL,
    marginBottom: 8,
  },
  mapTitle: { fontSize: 12, fontWeight: "600", color: INK },
  mapCoords: { fontSize: 11, color: MUTED, marginTop: 2 },

  // CTA
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  ctaBtn: {
    backgroundColor: TEAL,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: TEAL,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
