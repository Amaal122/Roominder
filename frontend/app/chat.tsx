import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { getAuthToken } from "./state/auth";
import { useSeekerProfile } from "./contexts/SeekerProfileContext";

const API_BASE = "http://127.0.0.1:8001";

type ConversationItem = {
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
};

const formatTime = (isoDate: string) => {
  const timestamp = new Date(isoDate);
  if (Number.isNaN(timestamp.getTime())) return "";
  return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function Chat() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

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
  const [activeTab, setActiveTab] = useState("Chat");
  const [isOwner, setIsOwner] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const handleTabPress = (tabLabel: string, route: Href) => {
    setActiveTab(tabLabel);
    if (tabLabel === "Chat") return;
    router.push(route);
  };

useFocusEffect(
  useCallback(() => {
    let isMounted = true;

    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getAuthToken();
        if (!token) throw new Error("Missing auth token");

        // Determine role so we can hide the bottom nav for owners
        try {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (meRes.ok) {
            const meRaw = await meRes.text();
            let me: any = null;
            if (meRaw) {
              try {
                me = JSON.parse(meRaw);
              } catch {
                me = null;
              }
            }

            const role = typeof me?.role === "string" ? me.role : undefined;
            const userType = typeof me?.user_type === "string" ? me.user_type : undefined;
            const ownerFlag = me?.is_owner === true;

            const looksLikeOwner =
              (typeof role === "string" && role.toLowerCase().includes("owner")) ||
              (typeof userType === "string" && userType.toLowerCase().includes("owner")) ||
              ownerFlag;

            if (isMounted) {
              setIsOwner(looksLikeOwner);
            }
          }
        } catch (roleErr) {
          // Don't block the chat list if role detection fails
          console.warn("Failed to detect user role:", roleErr);
        }

        const response = await fetch(`${API_BASE}/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = await response.text();
        let data: unknown = null;
        if (raw) {
          try { data = JSON.parse(raw); } catch { data = raw; }
        }

        if (!response.ok) {
          const detail =
            (data && typeof data === "object" && "detail" in data && (data as any).detail) ||
            "Failed to load conversations";
          throw new Error(String(detail));
        }

        if (isMounted) setConversations((data as ConversationItem[]) ?? []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        if (isMounted) {
          setError("Unable to load messages right now.");
          setConversations([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadConversations();
    return () => { isMounted = false; };
  }, [])
);

  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((item) => {
      return (
        item.other_user_name.toLowerCase().includes(term) ||
        item.last_message.toLowerCase().includes(term)
      );
    });
  }, [conversations, query]);

  return (
    <LinearGradient
      colors={
        isDark
          ? [Colors.dark.background, Colors.dark.background]
          : ["#F4896B", "#78CFC7", "#78CFC7"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? Colors.dark.text : "#fff"}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Messages
          </Text>
          <TouchableOpacity style={[styles.iconBtn, isDark && styles.iconBtnDark]}>
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={isDark ? Colors.dark.text : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
          <Ionicons
            name="search"
            size={18}
            color={isDark ? Colors.dark.mutedText : "#d9cfff"}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search messages..."
            placeholderTextColor={isDark ? Colors.dark.mutedText : "#d9cfff"}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Messages list */}
        <ScrollView
          contentContainerStyle={[styles.listContent, isOwner ? { paddingBottom: 24 } : null]}
          style={[styles.list, isDark && styles.listDark]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text
              style={{
                textAlign: "center",
                marginTop: 40,
                color: isDark ? Colors.dark.mutedText : "#aaa",
              }}
            >
              Loading...
            </Text>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="alert-circle-outline"
                size={56}
                color={isDark ? Colors.dark.mutedText : "#b7bdd1"}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                Something went wrong
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                {error}
              </Text>
            </View>
          ) : filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={56}
                color={isDark ? Colors.dark.mutedText : "#b7bdd1"}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No messages yet
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                Your conversations will appear here.
              </Text>
            </View>
          ) : (
            filteredConversations.map((item) => (
              <TouchableOpacity
                key={item.other_user_id}
                style={[styles.card, isDark && styles.cardDark]}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[id]",
                    params: { id: String(item.other_user_id), name: item.other_user_name },
                  })
                }
              >
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{getInitials(item.other_user_name)}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.name, isDark && styles.titleDark]}>
                      {item.other_user_name}
                    </Text>
                    <Text style={[styles.time, isDark && styles.mutedTextDark]}>
                      {formatTime(item.last_message_at)}
                    </Text>
                  </View>
                  <View style={styles.cardBottomRow}>
                    <Text
                      style={[styles.preview, isDark && styles.mutedTextDark]}
                      numberOfLines={1}
                    >
                      {item.last_message}
                    </Text>
                    {item.unread_count > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unread_count}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Bottom nav (hide for owners) */}
        {!isOwner ? (
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
        ) : null}
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  headerTitleDark: { color: Colors.dark.text },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  iconBtnDark: {
    backgroundColor: Colors.dark.cardMuted,
  },
  searchBox: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 46,
  },
  searchBoxDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#fff",
    fontSize: 15,
  },
  searchInputDark: {
    color: Colors.dark.text,
  },
  list: {
    flex: 1,
    backgroundColor: "#f8f8fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  listDark: { backgroundColor: Colors.dark.background },
  listContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#78CFC7",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
    shadowOpacity: 0,
    elevation: 0,
  },
  avatarWrap: { marginRight: 12 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#835CFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { color: "#2b2b33", fontSize: 15, fontWeight: "800" },
  time: { color: "#9a9fb2", fontSize: 12, fontWeight: "700" },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  preview: { color: "#7a7d8a", fontSize: 13, flex: 1 },
  titleDark: { color: Colors.dark.text },
  mutedTextDark: { color: Colors.dark.mutedText },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff5f6d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "800",
    color: "#2b2b33",
  },
  emptyTitleDark: { color: Colors.dark.text },
  emptySubtitle: { color: "#7a7d8a", fontSize: 13, marginTop: 8, textAlign: "center" },
  emptySubtitleDark: { color: Colors.dark.mutedText },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eceef4",
  },
  tabBarDark: {
    backgroundColor: Colors.dark.card,
    borderTopColor: Colors.dark.border,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelDark: { color: Colors.dark.mutedText },
  tabLabelActive: { color: "#7d5dff", fontWeight: "700" },
});
