import { router, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OwnerProfile() {
  const params = useLocalSearchParams<{ title?: string; location?: string }>();
  const title = params.title ?? "Modern Loft in Marais";
  const location = params.location ?? "Le Marais, Paris";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Owner Profile</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatar} />
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>Amina Diallo</Text>
            <Text style={styles.ownerMeta}>Verified · 4.9 ★ · 2h response</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <Text style={styles.propertyTitle}>{title}</Text>
          <Text style={styles.propertyLocation}>{location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            I manage a small portfolio of modern apartments in central Paris. I
            respond quickly and can schedule visits within 48 hours.
          </Text>
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
                params: { title, location },
              })
            }
          >
            <Text style={styles.primaryText}>Request a Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/screens/OwnerChat")}
          >
            <Text style={styles.secondaryText}>Chat with Owner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = "#6C63FF";
const BG = "#F8F7FF";
const TEXT = "#1A1A2E";
const MUTED = "#8B8CA8";
const BORDER = "#EEECFA";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  backIcon: { fontSize: 16, color: TEXT },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
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
    backgroundColor: "#D9D6FF",
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
    backgroundColor: PURPLE,
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
    borderColor: BORDER,
  },
  secondaryText: { color: TEXT, fontSize: 15, fontWeight: "700" },
});
