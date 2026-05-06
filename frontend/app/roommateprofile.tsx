import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import {
  loadRoommateProfile,
  type RoommateProfileDetail,
} from "./state/roommateMatching";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parseProfileParam = (value?: string | string[]) => {
  const raw = getSingleParam(value);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RoommateProfileDetail;
  } catch {
    return null;
  }
};

const cleanValue = (value?: string | null) => {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
};

type DetailRow = {
  label: string;
  value?: string | number | null;
};

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "Not shared";
  if (typeof value === "number") return String(value);
  return cleanValue(value) || "Not shared";
};

export default function RoommateProfile() {
  const params = useLocalSearchParams<{
    id?: string;
    profile?: string;
  }>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const id = getSingleParam(params.id);
  const initialProfile = useMemo(
    () => parseProfileParam(params.profile),
    [params.profile],
  );

  const [profile, setProfile] = useState<RoommateProfileDetail | null>(initialProfile);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No roommate profile was selected.");
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await loadRoommateProfile(id);
        if (cancelled) return;
        if (data) {
          setProfile(data);
        }
      } catch (loadError) {
        console.error("Failed to load roommate profile", loadError);
        if (!cancelled && !initialProfile) {
          setError("Unable to load this roommate profile right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [id, initialProfile]);

  const preferenceRows: DetailRow[] = [
    { label: "Sleep", value: profile?.sleep_schedule },
    { label: "Cleanliness", value: profile?.cleanliness },
    { label: "Social life", value: profile?.social_life },
    { label: "Guests", value: profile?.guests },
    { label: "Work style", value: profile?.work_style },
    { label: "Interests", value: profile?.interests },
    { label: "Values", value: profile?.values },
  ];

  const handleContact = () => {
    if (!profile) return;
    router.push({
      pathname: "/chat/[id]",
      params: { id: profile.id, name: profile.name },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {profile?.image ? (
            <Image source={{ uri: profile.image }} style={styles.photo} />
          ) : (
            <LinearGradient
              colors={isDark ? ["#1f2937", "#111827"] : ["#F4896B", "#7ECEC4"]}
              style={styles.photoFallback}
            >
              <Text style={styles.fallbackInitial}>
                {(profile?.name || "R").slice(0, 1).toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.backBtnDark]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.backText, isDark && styles.darkText]}>{"<"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading && !profile ? (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.emptyTitle, isDark && styles.darkText]}>Loading profile...</Text>
            </View>
          ) : error && !profile ? (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
                Profile unavailable
              </Text>
              <Text style={[styles.copy, isDark && styles.mutedDark]}>{error}</Text>
            </View>
          ) : profile ? (
            <>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, isDark && styles.darkText]}>
                    {profile.name}
                    {profile.age ? `, ${profile.age}` : ""}
                  </Text>
                  <Text style={[styles.subtitle, isDark && styles.mutedDark]}>
                    {profile.role || "Potential roommate"}
                  </Text>
                </View>

                {profile.match > 0 ? (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{Math.round(profile.match)}%</Text>
                    <Text style={styles.matchLabel}>Match</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.section, isDark && styles.sectionDark]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>About</Text>
                <Text style={[styles.copy, isDark && styles.mutedDark]}>
                  {profile.about || "No bio shared yet."}
                </Text>
              </View>

              {profile.lifestyle.length > 0 ? (
                <View style={[styles.section, isDark && styles.sectionDark]}>
                  <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Lifestyle</Text>
                  <View style={styles.chipRow}>
                    {profile.lifestyle.map((item) => (
                      <View key={item} style={[styles.chip, isDark && styles.chipDark]}>
                        <Text style={styles.chipText}>{cleanValue(item)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={[styles.section, isDark && styles.sectionDark]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  Roommate Preferences
                </Text>
                {preferenceRows.map((row) => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, isDark && styles.mutedDark]}>
                      {row.label}
                    </Text>
                    <Text style={[styles.detailValue, isDark && styles.darkText]}>
                      {formatValue(row.value)}
                    </Text>
                  </View>
                ))}
              </View>

              {profile.reasons && profile.reasons.length > 0 ? (
                <View style={[styles.section, isDark && styles.sectionDark]}>
                  <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                    Why You Match
                  </Text>
                  {profile.reasons.map((reason) => (
                    <Text key={reason} style={[styles.copy, isDark && styles.mutedDark]}>
                      - {reason}
                    </Text>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {profile ? (
        <View style={[styles.footer, isDark && styles.footerDark]}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact} activeOpacity={0.85}>
            <Text style={styles.contactText}>Contact</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6FEF9" },
  safeAreaDark: { backgroundColor: Colors.dark.background },
  hero: { position: "relative" },
  photo: { width: "100%", height: 330 },
  photoFallback: {
    width: "100%",
    height: 330,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackInitial: { color: "#fff", fontSize: 74, fontWeight: "800" },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnDark: { backgroundColor: "rgba(17,24,39,0.86)" },
  backText: { fontSize: 22, fontWeight: "800", color: "#1E1F2B" },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 104,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  name: { color: "#1E1F2B", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#6C6F7D", fontSize: 14, marginTop: 4 },
  darkText: { color: Colors.dark.text },
  mutedDark: { color: Colors.dark.mutedText },
  matchBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#7ECEC4",
    alignItems: "center",
    justifyContent: "center",
  },
  matchText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  matchLabel: { color: "#fff", fontSize: 11, fontWeight: "700" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  sectionDark: { backgroundColor: Colors.dark.card },
  sectionTitle: {
    color: "#1E1F2B",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  copy: { color: "#5B6170", lineHeight: 21, marginTop: 2 },
  emptyTitle: { color: "#1E1F2B", fontSize: 20, fontWeight: "800" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDE3E8",
  },
  detailLabel: { color: "#7A8090", fontWeight: "700" },
  detailValue: {
    flex: 1,
    color: "#1E1F2B",
    fontWeight: "700",
    textAlign: "right",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#EAF8F6",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipDark: { backgroundColor: Colors.dark.cardMuted },
  chipText: { color: "#4FAFA5", fontWeight: "800", fontSize: 12 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "rgba(246,254,249,0.94)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DDE3E8",
  },
  footerDark: {
    backgroundColor: Colors.dark.background,
    borderTopColor: Colors.dark.border,
  },
  contactBtn: {
    backgroundColor: "#F4896B",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  contactText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
