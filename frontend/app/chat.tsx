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
import { getAuthToken } from "./state/auth";

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
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" },
    { icon: "👥", label: "Match", route: "/match" },
    { icon: "💬", label: "Chat", route: "/chat" },
    { icon: "❤️", label: "Favorites", route: "/favorite" },
    { icon: "👤", label: "Profile", route: "/profile" },
  ];
  const [activeTab, setActiveTab] = useState("Chat");
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
      colors={["#F4896B", "#78CFC7", "#78CFC7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#d9cfff" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#d9cfff"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Messages list */}
        <ScrollView contentContainerStyle={styles.listContent} style={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text style={{ textAlign: "center", marginTop: 40, color: "#aaa" }}>
              Loading...
            </Text>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={56} color="#b7bdd1" />
              <Text style={styles.emptyTitle}>Something went wrong</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
            </View>
          ) : filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={56} color="#b7bdd1" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Your conversations will appear here.
              </Text>
            </View>
          ) : (
            filteredConversations.map((item) => (
              <TouchableOpacity
                key={item.other_user_id}
                style={styles.card}
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
                    <Text style={styles.name}>{item.other_user_name}</Text>
                    <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
                  </View>
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.preview} numberOfLines={1}>
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

        {/* Bottom nav */}
        <View style={styles.tabBar}>
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
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#fff",
    fontSize: 15,
  },
  list: {
    flex: 1,
    backgroundColor: "#f8f8fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
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
  emptySubtitle: { color: "#7a7d8a", fontSize: 13, marginTop: 8, textAlign: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eceef4",
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelActive: { color: "#7d5dff", fontWeight: "700" },
});
