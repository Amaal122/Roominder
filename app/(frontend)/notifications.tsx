import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

type NoticeType = "message" | "application" | "visit" | "payment" | "system";

type Notice = {
  id: string;
  type: NoticeType;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const NOTIFICATIONS: Notice[] = [
  {
    id: "1",
    type: "application",
    title: "New application received",
    body: "Lina Moreau applied to Modern Loft in Marais.",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "New message",
    body: "Amina Diallo: “Can we schedule the visit for Friday?”",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    type: "visit",
    title: "Visit confirmed",
    body: "Your visit to Bright Flat near Canal is confirmed.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "payment",
    title: "Payment reminder",
    body: "Rent due in 3 days for Cozy Studio in Bastille.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "5",
    type: "system",
    title: "Profile verified",
    body: "Your profile verification is complete.",
    time: "3 days ago",
    read: true,
  },
];

const TYPE_LABELS: Record<NoticeType, string> = {
  message: "Messages",
  application: "Applications",
  visit: "Visits",
  payment: "Payments",
  system: "System",
};

export default function Notifications() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | NoticeType>("all");
  const [items, setItems] = useState<Notice[]>(NOTIFICATIONS);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((n) => n.type === filter);
  }, [items, filter]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <LinearGradient
      colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#2B2B33" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              {unreadCount} unread · {items.length} total
            </Text>
          </View>
          <TouchableOpacity style={styles.markBtn} onPress={markAllRead}>
            <Text style={styles.markText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {(["all", "message", "application", "visit", "payment"] as const).map(
            (key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  filter === key && styles.filterChipActive,
                ]}
                onPress={() => setFilter(key)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === key && styles.filterTextActive,
                  ]}
                >
                  {key === "all" ? "All" : TYPE_LABELS[key]}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                You’re all caught up for now.
              </Text>
            </View>
          ) : (
            filtered.map((n) => (
              <View key={n.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.dot,
                      n.read ? styles.dotRead : styles.dotUnread,
                    ]}
                  />
                  <View>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    <Text style={styles.cardBody}>{n.body}</Text>
                    <Text style={styles.cardTime}>{n.time}</Text>
                  </View>
                </View>
                {!n.read ? <View style={styles.unreadPill} /> : null}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
  markBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  markText: { fontSize: 12, fontWeight: "700", color: "#2B2B33" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: "#7ECEC4" },
  filterText: { fontSize: 12, fontWeight: "700", color: "#2B2B33" },
  filterTextActive: { color: "#fff" },
  list: { marginTop: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", gap: 10, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  dotUnread: { backgroundColor: "#F4896B" },
  dotRead: { backgroundColor: "#D6D3D1" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#2B2B33" },
  cardBody: { fontSize: 12, color: "#7A6D6A", marginTop: 2 },
  cardTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
  unreadPill: {
    width: 6,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#F4896B",
    alignSelf: "center",
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#2B2B33" },
  emptySubtitle: { fontSize: 12, color: "#7A6D6A", marginTop: 4 },
});
