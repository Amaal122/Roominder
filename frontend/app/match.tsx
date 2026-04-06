import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "./state/auth"; // adjust path
import { useSeekerProfile } from "./contexts/SeekerProfileContext";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";


export default function Match() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [matches, setMatches] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadMatches = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Step 1: get saved match IDs
      const matchRes = await fetch("http://127.0.0.1:8001/matches/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!matchRes.ok) return;
      const savedMatches = await matchRes.json();
      const savedIds = new Set(savedMatches.map((m: any) => String(m.matched_id)));

      if (savedIds.size === 0) {
        setMatches([]);
        return;
      }

      // Step 2: get full profiles from roommates endpoint
      const profilesRes = await fetch("http://127.0.0.1:8001/roommates/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profilesRes.ok) return;
      const allProfiles = await profilesRes.json();

      // Step 3: filter only the ones the user liked
      const filtered = allProfiles.filter((p: any) => savedIds.has(String(p.id)));
      setMatches(filtered);
    } catch (e) {
      console.error("Failed to load matches", e);
    } finally {
      setLoading(false);
    }
  };

  loadMatches();
}, []);
  const router = useRouter();
  const { profile } = useSeekerProfile();
  const tabs: { icon: string; label: string; route: Href }[] = useMemo(() => {
    const lookingFor = profile?.looking_for;
    const showMatch = lookingFor !== "house";
    const showFavorites = lookingFor !== "roommate";
    const homeRoute =
      (lookingFor === "roommate" ? "/roomatematch" : "/homescreen") as Href;

    return [
      { icon: "🏠", label: "Home", route: homeRoute },
      ...(showMatch ? [{ icon: "👥", label: "Match", route: "/match" as Href }] : []),
      { icon: "💬", label: "Chat", route: "/chat" },
      ...(showFavorites
        ? [{ icon: "❤️", label: "Favorites", route: "/favorite" as Href }]
        : []),
      { icon: "👤", label: "Profile", route: "/profile" },
    ];
  }, [profile?.looking_for]);
  const [activeTab, setActiveTab] = useState("Match");

  const handleContact = (id: string, name: string) => {
    router.push({ pathname: "/chat/[id]", params: { id, name } });
  };

  const handleTabPress = (tabLabel: string, route: Href) => {
    setActiveTab(tabLabel);
    if (tabLabel === "Match") return;
    router.push(route);
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? [Colors.dark.background, Colors.dark.background]
          : ["#F4896B", "#F7B89A", "#78CFC7"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={() => router.push("/homescreen")}
          >
            <Text style={[styles.iconText, isDark && styles.iconTextDark]}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, isDark && styles.titleDark]}>
              Your Matches
            </Text>
            <Text style={[styles.subtitle, isDark && styles.mutedTextDark]}>
              {matches.length === 1
                ? "1 person you saved"
                : `${matches.length} people you saved`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={() => router.push("/roomatematch")}
          >
            <Text style={[styles.iconText, isDark && styles.iconTextDark]}>✨</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sheet, isDark && styles.sheetDark]}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>
                Loading...
              </Text>
            </View>
          ) : null}
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>
                No matches yet
              </Text>
              <Text style={[styles.emptyCopy, isDark && styles.mutedTextDark]}>
                Swipe right or tap the heart in Roommate Match to add someone
                here.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/roomatematch")}
              >
                <Text style={styles.primaryLabel}>Find roommates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {matches.map((profile) => (
                <View key={profile.id} style={[styles.card, isDark && styles.cardDark]}>
                  {profile.image ? (
                    <Image source={{ uri: profile.image }} style={styles.photo} />
                  ) : null}
                  <View style={styles.cardBody}>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.name, isDark && styles.titleDark]}>
                        {profile.name}, {profile.age}
                      </Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{profile.match}%</Text>
                      </View>
                    </View>
                    <Text style={[styles.meta, isDark && styles.mutedTextDark]}>
                      {profile.role}
                    </Text>
                    <Text style={[styles.meta, isDark && styles.mutedTextDark]}>
                      {profile.location}
                    </Text>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleContact(profile.id, profile.name)}
                    >
                      <Text style={styles.contactLabel}>Contact</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Bottom nav */}
        <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.8}
              onPress={() => handleTabPress(tab.label, tab.route)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  isDark && styles.tabLabelDark,
                  activeTab === tab.label && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  safeAreaDark: { backgroundColor: Colors.dark.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDark: {
    backgroundColor: Colors.dark.cardMuted,
    borderColor: Colors.dark.border,
  },
  iconText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconTextDark: { color: Colors.dark.text },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#f5e9ff", fontSize: 12, marginTop: 4 },
  titleDark: { color: Colors.dark.text },
  mutedTextDark: { color: Colors.dark.mutedText },
  sheet: {
    flex: 1,
    backgroundColor: "#f6fef9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sheetDark: { backgroundColor: Colors.dark.background },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#2b2b33" },
  emptyCopy: {
    color: "#6c6f7d",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#7d5dff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryLabel: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#7ECEC4",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
    shadowOpacity: 0,
    elevation: 0,
  },
  photo: { width: "100%", height: 160 },
  cardBody: { padding: 14 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "800", color: "#1e1f2b" },
  badge: {
    backgroundColor: "#7ECEC4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontWeight: "800" },
  meta: { color: "#6c6f7d", marginTop: 4 },
  contactBtn: {
    marginTop: 12,
    backgroundColor: "#78CFC7",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  contactLabel: { color: "#fff", fontWeight: "800" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e6e9ef",
  },
  tabBarDark: {
    backgroundColor: Colors.dark.card,
    borderTopColor: Colors.dark.border,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelDark: { color: Colors.dark.mutedText },
  tabLabelActive: { color: "#F4896B", fontWeight: "700" },
});
