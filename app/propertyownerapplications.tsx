import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { incrementPending } from "./state/ownerDashboard";

type Params = {
  id?: string;
  title?: string;
  location?: string;
  price?: string;
  image?: string;
  applications?: string;
};

type Applicant = {
  id: string;
  name: string;
  role: string;
  match: number;
  timeAgo: string;
  avatar: string;
};

const APPLICANTS: Applicant[] = [
  {
    id: "1",
    name: "Lina Moreau",
    role: "Graphic Designer",
    match: 92,
    timeAgo: "2 days ago",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "2",
    name: "Marcus Chen",
    role: "Marketing Manager",
    match: 88,
    timeAgo: "1 week ago",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "3",
    name: "Amina Diallo",
    role: "Product Analyst",
    match: 90,
    timeAgo: "3 days ago",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "4",
    name: "Nora Benali",
    role: "UX Researcher",
    match: 86,
    timeAgo: "5 days ago",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
  },
];

export default function PropertyOwnerApplications() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const applicationsCount = Number(
    params.applications || `${APPLICANTS.length}`,
  );
  const initialVisible = useMemo(
    () => APPLICANTS.slice(0, Math.max(0, applicationsCount)),
    [applicationsCount],
  );
  const [visibleApplicants, setVisibleApplicants] =
    useState<Applicant[]>(initialVisible);
  const [queueIndex, setQueueIndex] = useState(initialVisible.length);

  const details = useMemo(() => {
    return {
      title: params.title || "Modern Loft in Marais",
      location: params.location || "Le Marais, Paris",
      price: params.price || "€1200",
      image:
        params.image ||
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    };
  }, [params]);

  return (
    <LinearGradient
      colors={["#6D28D9", "#9333EA", "#F472B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrapper}>
            <Image
              source={{ uri: details.image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.roundBtn}
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={18} color="#111827" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={styles.roundBtn}>
                  <Feather name="edit-2" size={16} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.roundBtn}>
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.tabsCard}>
            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.9}
              onPress={() => router.back()}
            >
              <Text style={styles.tabText}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, styles.tabActive]}
              activeOpacity={1}
            >
              <Text style={styles.tabActiveText}>Applications</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{applicationsCount}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.location}>{details.location}</Text>
            <Text style={styles.price}>
              {details.price}
              <Text style={styles.perMonth}> per month</Text>
            </Text>
          </View>

          {applicationsCount === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Pas encore d'applications</Text>
              <Text style={styles.emptySubtitle}>
                Les demandes des locataires apparaîtront ici.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {visibleApplicants.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  <Image source={{ uri: app.avatar }} style={styles.avatar} />
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appRole}>{app.role}</Text>
                    <View style={styles.appMetaRow}>
                      <Text style={styles.matchText}>{app.match}% Match</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.timeText}>{app.timeAgo}</Text>
                    </View>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => {
                          setVisibleApplicants((prev) => {
                            const next = prev.filter((p) => p.id !== app.id);
                            const candidate = APPLICANTS[queueIndex];
                            if (candidate) {
                              return [...next, candidate];
                            }
                            return next;
                          });
                          setQueueIndex((i) => (APPLICANTS[i] ? i + 1 : i));
                        }}
                      >
                        <Feather name="x" size={14} color="#6B7280" />
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => {
                          incrementPending();
                          setVisibleApplicants((prev) => {
                            const next = prev.filter((p) => p.id !== app.id);
                            const candidate = APPLICANTS[queueIndex];
                            if (candidate) {
                              return [...next, candidate];
                            }
                            return next;
                          });
                          setQueueIndex((i) => (APPLICANTS[i] ? i + 1 : i));
                        }}
                      >
                        <Feather name="check" size={14} color="#fff" />
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28, gap: 16 },
  heroWrapper: { position: "relative" },
  heroImage: { width: "100%", height: 230 },
  heroActions: {
    position: "absolute",
    top: 18,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabsCard: {
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    flexDirection: "row",
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginTop: -30,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    flexDirection: "row",
    gap: 6,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: "#7C3AED" },
  tabActiveText: { color: "#fff", fontWeight: "800" },
  tabText: { color: "#6B7280", fontWeight: "700" },
  badge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#DC2626", fontWeight: "800", fontSize: 12 },
  card: {
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  location: { color: "#6B7280", fontSize: 13 },
  price: { color: "#7C3AED", fontSize: 20, fontWeight: "800" },
  perMonth: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  list: { gap: 14, marginHorizontal: 18 },
  emptyCard: {
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  appCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  appInfo: { flex: 1, gap: 6 },
  appName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  appRole: { color: "#6B7280", fontSize: 12 },
  appMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  matchText: { color: "#7C3AED", fontWeight: "700", fontSize: 12 },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  timeText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  rejectText: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
  },
  approveText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
