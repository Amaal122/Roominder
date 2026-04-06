import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function OwnerProfile() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
    ownerId?: string;
    ownerName?: string;
    ownerAvatar?: string;
    ownerRating?: string;
    ownerResponse?: string;
    description?: string;
  }>();

  const propertyId = getSingleParam(params.id);
  const ownerId = getSingleParam(params.ownerId);
  const title = getSingleParam(params.title) ?? "Modern Loft in Marais";
  const location = getSingleParam(params.location) ?? "Le Marais, Paris";
  const [ownerName, setOwnerName] = useState<string | undefined>(
    getSingleParam(params.ownerName) ?? undefined,
  );
  const [ownerAvatar, setOwnerAvatar] = useState(
    getSingleParam(params.ownerAvatar) ??
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  );
  const [ownerRating] = useState(
    getSingleParam(params.ownerRating) ?? "4.9",
  );
  const [ownerResponse] = useState(
    getSingleParam(params.ownerResponse) ?? "2h response",
  );
  const description =
    getSingleParam(params.description)?.trim() || "No description provided.";

  useEffect(() => {
    if (!ownerId || ownerName) return;

    let cancelled = false;
    const loadOwner = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8001/users/${ownerId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        if (data.full_name) {
          setOwnerName(data.full_name);
          setOwnerAvatar(
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              data.full_name,
            )}&background=7ECEC4&color=fff`,
          );
        }
      } catch {
        // ignore
      }
    };
    void loadOwner();

    return () => {
      cancelled = true;
    };
  }, [ownerId, ownerName]);

  const handleRequestVisit = () => {
    if (!propertyId) return;
    router.push({
      pathname: "/screens/VisitRequest",
      params: { id: propertyId, title, location },
    });
  };

  const handleChatWithOwner = () => {
    if (!ownerId) return;
    router.push({
      pathname: "/chat/[id]",
      params: { id: ownerId, name: ownerName ?? "Owner" },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <LinearGradient
          colors={
            isDark
              ? [Colors.dark.card, Colors.dark.card]
              : ["#F4896B", "#7ECEC4"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, isDark && styles.headerDark]}
        >
          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.backBtnDark]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, isDark && styles.backIconDark]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Owner Profile
          </Text>
        </LinearGradient>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Image source={{ uri: ownerAvatar }} style={styles.avatar} />
          <View style={styles.ownerInfo}>
            <Text style={[styles.ownerName, isDark && styles.ownerNameDark]}>
              {ownerName ?? "Unknown Owner"}
            </Text>
            <Text style={[styles.ownerMeta, isDark && styles.ownerMetaDark]}>
              Verified · {ownerRating} ★ · {ownerResponse}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Property
          </Text>
          <Text style={[styles.propertyTitle, isDark && styles.propertyTitleDark]}>
            {title}
          </Text>
          <Text
            style={[styles.propertyLocation, isDark && styles.propertyLocationDark]}
          >
            {location}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            About
          </Text>
          <Text style={[styles.aboutText, isDark && styles.aboutTextDark]}>
            {description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Next Step
          </Text>
          <Text style={[styles.aboutText, isDark && styles.aboutTextDark]}>
            Your application was received. Start a chat to confirm the visit
            time.
          </Text>
        </View>

        <View style={styles.ctaGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleRequestVisit}
          >
            <Text style={styles.primaryText}>Request a Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, isDark && styles.secondaryBtnDark]}
            activeOpacity={0.85}
            onPress={handleChatWithOwner}
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
  safeAreaDark: { backgroundColor: Colors.dark.background },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  headerDark: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
  backBtnDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  backIconDark: { color: Colors.dark.text },
  headerTitleDark: { color: Colors.dark.text },
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
  cardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
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
  ownerNameDark: { color: Colors.dark.text },
  ownerMetaDark: { color: Colors.dark.mutedText },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
  },
  sectionTitleDark: { color: Colors.dark.text },
  propertyTitle: { fontSize: 15, fontWeight: "600", color: TEXT },
  propertyLocation: { fontSize: 13, color: MUTED, marginTop: 4 },
  aboutText: { fontSize: 13, color: MUTED, lineHeight: 20 },
  propertyTitleDark: { color: Colors.dark.text },
  propertyLocationDark: { color: Colors.dark.mutedText },
  aboutTextDark: { color: Colors.dark.mutedText },
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
  secondaryBtnDark: {
    backgroundColor: Colors.dark.cardMuted,
  },
  secondaryText: { color: CORAL, fontSize: 15, fontWeight: "700" },
});
