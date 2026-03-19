import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MESSAGES = [
  {
    id: "1",
    name: "Sarah Mitchell",
    time: "2m ago",
    preview: "Great! I'll be moving in o...",
    initials: "SM",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "James Anderson",
    time: "1h ago",
    preview: "Thanks for signing the contract!",
    initials: "JA",
    unread: 1,
    online: true,
  },
  {
    id: "3",
    name: "Emily Davis",
    time: "3h ago",
    preview: "Can we schedule a viewi...",
    initials: "ED",
    unread: 1,
    online: true,
  },
  {
    id: "4",
    name: "Michael Brown",
    time: "Yesterday",
    preview: "The apartment looks amazing!",
    initials: "MB",
    unread: 0,
    online: false,
  },
  {
    id: "5",
    name: "Lisa Thompson",
    time: "2 days ago",
    preview: "Is the place still available?",
    initials: "LT",
    unread: 0,
    online: false,
  },
];

export default function Chat() {
  const router = useRouter();
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" },
    { icon: "👥", label: "Match", route: "/match" },
    { icon: "💬", label: "Chat", route: "/chat" },
    { icon: "❤️", label: "Favorites", route: "/homescreen" },
    { icon: "👤", label: "Profile", route: "/homescreen" },
  ];
  const [activeTab, setActiveTab] = useState("Chat");

  const handleTabPress = (tabLabel: string, route: Href) => {
    setActiveTab(tabLabel);
    if (tabLabel === "Chat") return;
    router.push(route);
  };

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
          />
        </View>

        {/* Messages list */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {MESSAGES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/chat/[id]",
                  params: { id: item.id, name: item.name },
                })
              }
            >
              <View style={styles.avatarWrap}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>
                {item.online ? <View style={styles.onlineDot} /> : null}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <View style={styles.cardBottomRow}>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.preview}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2AD37F",
    position: "absolute",
    right: 6,
    bottom: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
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
