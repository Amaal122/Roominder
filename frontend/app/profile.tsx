import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSeekerProfile } from "./contexts/SeekerProfileContext";
  import { clearAuthToken } from "./state/auth";
import { getAuthToken } from "./state/auth";
import { QUESTIONS } from "./form";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useSettings } from "./state/settings";

const API_BASE = "http://127.0.0.1:8001";

type ProfileMeOut = {
  user_id: number;
  email: string;
  full_name?: string | null;
  image_url?: string | null;
  location?: string | null;
  occupation?: string | null;
  looking_for?: string | null;
  sleep_schedule?: string | null;
  cleanliness?: string | null;
  social_life?: string | null;
  guests?: string | null;
  work_style?: string | null;
};

const preferenceQuestionKeyByField: Record<string, string> = {
  sleep_schedule: "sleep",
  cleanliness: "cleanliness",
  social_life: "social",
  guests: "guests",
  work_style: "work",
};

const formatPreference = (field: keyof ProfileMeOut, value?: string | null) => {
  if (!value) return null;
  const qKey = preferenceQuestionKeyByField[String(field)];
  const question = QUESTIONS.find((q) => q.key === qKey);
  if (!question) return `${String(field)}: ${value}`;
  const option = question.options.find((o) => o.id === value);
  return `${question.title}: ${option?.label ?? value}`;
};

export default function Profile() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { profile } = useSeekerProfile();
  const settings = useSettings();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  type TabId = "home" | "match" | "chat" | "favorites" | "profile";
  const tabs: { id: TabId; icon: string; label: string; route: Href }[] = useMemo(() => {
    const lookingFor = profile?.looking_for;
    const showMatch = lookingFor !== "house";
    const showFavorites = lookingFor !== "roommate";
    const homeRoute =
      (lookingFor === "roommate" ? "/roomatematch" : "/homescreen") as Href;

    return [
      { id: "home", icon: "🏠", label: t("tabs.home"), route: homeRoute },
      ...(showMatch
        ? [{ id: "match" as const, icon: "👥", label: t("tabs.match"), route: "/match" as Href }]
        : []),
      { id: "chat", icon: "💬", label: t("tabs.chat"), route: "/chat" },
      ...(showFavorites
        ? [{ id: "favorites" as const, icon: "❤️", label: t("tabs.favorites"), route: "/favorite" as Href }]
        : []),
      { id: "profile", icon: "👤", label: t("tabs.profile"), route: "/profile" },
    ];
  }, [profile?.looking_for, i18n.language]);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [remote, setRemote] = useState<ProfileMeOut | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const handleTabPress = (tabId: TabId, route: Href) => {
    setActiveTab(tabId);
    if (tabId === "profile") return;
    router.push(route);
  };

  const handleDisconnect = async () => {
    await clearAuthToken();
    router.replace("/login");
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingRemote(true);
        const token = await getAuthToken();
        if (!token) {
          if (!cancelled) setRemote(null);
          return;
        }

        const res = await fetch(`${API_BASE}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text();
          console.warn("Failed to load profile:", res.status, text);
          if (!cancelled) setRemote(null);
          return;
        }

        const data = (await res.json()) as ProfileMeOut;
        if (!cancelled) setRemote(data);
      } catch (e) {
        console.warn("Failed to load profile:", e);
        if (!cancelled) setRemote(null);
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = (remote?.full_name ?? "").trim() || remote?.email || t("profile.title");
  const displayRole = (remote?.occupation ?? "").trim();
  const displayLocation = (remote?.location ?? "").trim() || "—";
  const displayAvatar = (remote?.image_url ?? "").trim();

  const preferences = useMemo(() => {
    if (!remote) return [];
    return [
      formatPreference("sleep_schedule", remote.sleep_schedule),
      formatPreference("cleanliness", remote.cleanliness),
      formatPreference("social_life", remote.social_life),
      formatPreference("guests", remote.guests),
      formatPreference("work_style", remote.work_style),
    ].filter((p): p is string => Boolean(p));
  }, [remote]);

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/homescreen")}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile.title")}</Text>
          <View style={styles.iconPlaceholder} />
        </View>

        <ScrollView
          style={[styles.sheet, isDark && styles.sheetDark]}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isDark && styles.cardDark]}>
            {loadingRemote ? (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  isDark && styles.avatarPlaceholderDark,
                ]}
              >
                <ActivityIndicator />
              </View>
            ) : displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  isDark && styles.avatarPlaceholderDark,
                ]}
              />
            )}
            <View style={styles.nameBlock}>
              <Text style={[styles.name, isDark && styles.titleDark]}>{displayName}</Text>
              {displayRole ? (
                <Text style={[styles.meta, isDark && styles.mutedTextDark]}>{displayRole}</Text>
              ) : null}
              <Text style={[styles.meta, isDark && styles.mutedTextDark]}>{displayLocation}</Text>
            </View>
            <Text style={[styles.sectionLabel, { marginTop: 14 }, isDark && styles.titleDark]}>
              {t("profile.preferences")}
            </Text>
            <View style={styles.prefList}>
              {preferences.length ? (
                preferences.map((pref) => (
                  <View key={pref} style={styles.prefItem}>
                    <Text style={styles.prefBullet}>•</Text>
                    <Text style={[styles.prefText, isDark && styles.mutedTextDark]}>{pref}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.body, isDark && styles.mutedTextDark]}>
                  {t("profile.no_preferences")}
                </Text>
              )}
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost, isDark && styles.actionGhostDark]}
                onPress={() => router.push("/completeprofile")}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    styles.actionGhostLabel,
                    isDark && styles.actionGhostLabelDark,
                  ]}
                >
                  {t("profile.edit_profile")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => router.push("/match")}
              >
                <Text style={styles.actionLabel}>{t("profile.find_roommates")}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost, isDark && styles.actionGhostDark]}
                onPress={() => router.push("/change-password")}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    styles.actionGhostLabel,
                    isDark && styles.actionGhostLabelDark,
                  ]}
                >
                  {t("settings.change_password")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost, isDark && styles.actionGhostDark]}
                onPress={handleDisconnect}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    styles.actionGhostLabel,
                    isDark && styles.actionGhostLabelDark,
                  ]}
                >
                  {t("profile.disconnect")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost, isDark && styles.actionGhostDark]}
                onPress={() => router.push("/language")}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    styles.actionGhostLabel,
                    isDark && styles.actionGhostLabelDark,
                  ]}
                >
                  {t("settings.language")}: {settings.language}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost, isDark && styles.actionGhostDark]}
                onPress={() => router.push("/theme")}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    styles.actionGhostLabel,
                    isDark && styles.actionGhostLabelDark,
                  ]}
                >
                  {t("settings.theme")}: {settings.theme}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.8}
              onPress={() => handleTabPress(tab.id, tab.route)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  isDark && styles.tabLabelDark,
                  activeTab === tab.id && styles.tabLabelActive,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  iconPlaceholder: { width: 40, height: 40 },
  sheet: {
    flex: 1,
    backgroundColor: "#f6fef9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sheetDark: {
    backgroundColor: Colors.dark.background,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#78CFC7",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#eef5f2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderDark: { backgroundColor: Colors.dark.cardMuted },
  nameBlock: { alignItems: "center", gap: 2, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "800", color: "#1e1f2b" },
  titleDark: { color: Colors.dark.text },
  meta: { color: "#6c6f7d", fontSize: 13 },
  mutedTextDark: { color: Colors.dark.mutedText },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#eef5f2",
  },
  chipPrimary: { backgroundColor: "#d9f6f0" },
  chipText: { color: "#2b2b33", fontWeight: "600", fontSize: 12 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#1e1f2b" },
  body: { color: "#4a4c59", lineHeight: 20, marginTop: 6 },
  prefList: { marginTop: 6, gap: 6 },
  prefItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  prefBullet: { color: "#78CFC7", fontSize: 14 },
  prefText: { color: "#4a4c59" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: { backgroundColor: "#78CFC7" },
  actionGhost: {
    borderWidth: 1,
    borderColor: "#d7dbdf",
    backgroundColor: "#fff",
  },
  actionGhostDark: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.cardMuted,
  },
  actionLabel: { fontWeight: "800", color: "#fff" },
  actionGhostLabel: { color: "#2b2b33" },
  actionGhostLabelDark: { color: Colors.dark.text },
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
