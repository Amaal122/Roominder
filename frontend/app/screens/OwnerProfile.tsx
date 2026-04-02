import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function OwnerProfile() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
    ownerName?: string;
    ownerAvatar?: string;
    ownerRating?: string;
    ownerResponse?: string;
    description?: string;
  }>();

  const propertyId = getSingleParam(params.id);
  const title = getSingleParam(params.title) ?? "Modern Loft in Marais";
  const location = getSingleParam(params.location) ?? "Le Marais, Paris";
  const ownerName = getSingleParam(params.ownerName) ?? "Amina Diallo";
  const ownerAvatar =
    getSingleParam(params.ownerAvatar) ??
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200";
  const ownerRating = getSingleParam(params.ownerRating) ?? "4.9";
  const ownerResponse = getSingleParam(params.ownerResponse) ?? "2h response";
  const description =
    getSingleParam(params.description)?.trim() || "No description provided.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <LinearGradient
          colors={["#F4896B", "#7ECEC4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Owner Profile</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Image source={{ uri: ownerAvatar }} style={styles.avatar} />
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>{ownerName}</Text>
            <Text style={styles.ownerMeta}>
              Verified · {ownerRating} ★ · {ownerResponse}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <Text style={styles.propertyTitle}>{title}</Text>
          <Text style={styles.propertyLocation}>{location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Step</Text>
          <Text style={styles.aboutText}>
            Your application was received. Start a chat to confirm the visit
            time.
          </Text>
        </View>

        <View style={styles.ctaGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/screens/VisitRequest",
                params: { id: propertyId, title, location },
              })
            }
          >
            <Text style={styles.primaryText}>Request a Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/screens/OwnerChat",
                params: { ownerName },
              })
            }
          >
            <Text style={styles.secondaryText}>Chat with Owner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CORAL = "#F4896B";
const CORAL_PASTEL = "#F9D4C2";
const TEAL = "#7ECEC4";
const BG = "#FFF7F3";
const TEXT = "#2B2B33";
const MUTED = "#7A6D6A";
const BORDER = "#F1E3DC";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  backIcon: { fontSize: 16, color: "#2B2B33" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "white" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CORAL_PASTEL,
  },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 16, fontWeight: "700", color: TEXT },
  ownerMeta: { fontSize: 12, color: MUTED, marginTop: 4 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
  },
  propertyTitle: { fontSize: 15, fontWeight: "600", color: TEXT },
  propertyLocation: { fontSize: 13, color: MUTED, marginTop: 4 },
  aboutText: { fontSize: 13, color: MUTED, lineHeight: 20 },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  ctaGroup: { gap: 12 },
  stepHint: { fontSize: 12, color: MUTED, textAlign: "center" },
  secondaryBtn: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: CORAL,
  },
  secondaryText: { color: CORAL, fontSize: 15, fontWeight: "700" },
});
