import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getAuthToken } from "./state/auth";

const API_BASE = "http://127.0.0.1:8001";

type Params = {
  id?: string | string[];
  title?: string | string[];
  location?: string | string[];
  price?: string | string[];
  image?: string | string[];
  applications?: string | string[];
};

type OwnerApplication = {
  id: number;
  application_id: number;
  property_id: number;
  seeker_id: number;
  message?: string | null;
  status: "pending" | "accepted" | "rejected";
  id_doc_url?: string | null;
  income_doc_url?: string | null;
  employment_doc_url?: string | null;
  guarantor_doc_url?: string | null;
  created_at: string;
  seeker_name?: string | null;
  seeker_email?: string | null;
};

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const formatRelativeTime = (isoDate: string) => {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoDate).toLocaleDateString();
};

export default function PropertyOwnerApplications() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const propertyIdParam = getSingleParam(params.id);
  const propertyId = propertyIdParam ? Number(propertyIdParam) : NaN;

  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!Number.isFinite(propertyId)) {
      setApplications([]);
      setError("This property could not be identified.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("Missing auth token");
      }

      const response = await fetch(`${API_BASE}/rental-applications/property/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load applications");
      }

      setApplications(data as OwnerApplication[]);
      setError(null);
    } catch (loadError) {
      console.error("Failed to load owner applications:", loadError);
      setApplications([]);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load applications",
      );
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      void loadApplications();
    }, [loadApplications]),
  );

  const updateApplicationStatus = async (
    application: OwnerApplication,
    nextStatus: "accepted" | "rejected",
  ) => {
    const currentActionKey = `${application.id}-${nextStatus}`;

    try {
      setActionKey(currentActionKey);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("Missing auth token");
      }

      const response = await fetch(
        `${API_BASE}/rental-applications/${application.id}/status?status=${encodeURIComponent(nextStatus)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update application");
      }

      const updated = data as OwnerApplication;
      setApplications((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (updateError) {
      console.error("Failed to update application:", updateError);
      Alert.alert("Error", "Could not update this application right now.");
    } finally {
      setActionKey(null);
    }
  };

  const details = useMemo(() => {
    return {
      title: getSingleParam(params.title) || "Modern Loft in Marais",
      location: getSingleParam(params.location) || "Le Marais, Paris",
      price: getSingleParam(params.price) || "DT 0",
      image:
        getSingleParam(params.image) ||
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    };
  }, [params.image, params.location, params.price, params.title]);

  const openDocument = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (linkError) {
      console.error("Failed to open document:", linkError);
      Alert.alert("Error", "Could not open this document.");
    }
  };

  const applicationsCount = applications.length;

  return (
    <LinearGradient
      colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
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
            {details.image && !details.image.startsWith("blob:") ? (
              <Image source={{ uri: details.image }} style={styles.heroImage} resizeMode="cover" />
            ) : null}
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
                <Feather name="arrow-left" size={18} color="#111827" />
              </TouchableOpacity>
              <View style={styles.heroSpacer} />
            </View>
          </View>

          <View style={styles.tabsCard}>
            <TouchableOpacity style={styles.tab} activeOpacity={0.9} onPress={() => router.back()}>
              <Text style={styles.tabText}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, styles.tabActive]} activeOpacity={1}>
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

          {loading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color="#F4896B" />
              <Text style={styles.emptySubtitle}>Loading applications...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Could not load applications</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => void loadApplications()}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : applicationsCount === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Pas encore d'applications</Text>
              <Text style={styles.emptySubtitle}>
                Les formulaires remplis par les locataires apparaissent ici.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {applications.map((application) => {
                const applicantName =
                  application.seeker_name ||
                  application.seeker_email ||
                  `Applicant #${application.seeker_id}`;
                const docLinks = [
                  ["Identity document", application.id_doc_url],
                  ["Proof of income", application.income_doc_url],
                  ["Employment letter", application.employment_doc_url],
                  ["Guarantor info", application.guarantor_doc_url],
                ].filter(([, url]) => Boolean(url)) as Array<[string, string]>;

                return (
                  <View key={application.id} style={styles.appCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {applicantName.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{applicantName}</Text>
                      <Text style={styles.appRole}>
                        {application.seeker_email || "No email provided"}
                      </Text>

                      <View style={styles.appMetaRow}>
                        <View
                          style={[
                            styles.statusPill,
                            application.status === "accepted"
                              ? styles.statusAccepted
                              : application.status === "rejected"
                                ? styles.statusRejected
                                : styles.statusPending,
                          ]}
                        >
                          <Text style={styles.statusText}>{application.status}</Text>
                        </View>
                        <Text style={styles.timeText}>
                          {formatRelativeTime(application.created_at)}
                        </Text>
                      </View>

                      {application.message ? (
                        <Text style={styles.messageText}>{application.message}</Text>
                      ) : null}

                      {docLinks.length > 0 ? (
                        <View style={styles.docsWrap}>
                          {docLinks.map(([label, url]) => (
                            <TouchableOpacity
                              key={label}
                              style={styles.docLink}
                              onPress={() => void openDocument(url)}
                            >
                              <Text style={styles.docLinkText}>{label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}

                      {application.status === "pending" ? (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => void updateApplicationStatus(application, "rejected")}
                            disabled={Boolean(actionKey)}
                          >
                            <Feather name="x" size={14} color="#6B7280" />
                            <Text style={styles.rejectText}>
                              {actionKey === `${application.id}-rejected`
                                ? "Saving..."
                                : "Reject"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => void updateApplicationStatus(application, "accepted")}
                            disabled={Boolean(actionKey)}
                          >
                            <Feather name="check" size={14} color="#fff" />
                            <Text style={styles.approveText}>
                              {actionKey === `${application.id}-accepted`
                                ? "Saving..."
                                : "Approve"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
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
  heroSpacer: { width: 42, height: 42 },
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
  tabActive: { backgroundColor: "#F4896B" },
  tabActiveText: { color: "#fff", fontWeight: "800" },
  tabText: { color: "#7A6D6A", fontWeight: "700" },
  badge: {
    backgroundColor: "#DDF3F1",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#0F766E", fontWeight: "800", fontSize: 12 },
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
  title: { fontSize: 18, fontWeight: "800", color: "#2B2B33" },
  location: { color: "#7A6D6A", fontSize: 13 },
  price: { color: "#F4896B", fontSize: 20, fontWeight: "800" },
  perMonth: { color: "#7A6D6A", fontSize: 12, fontWeight: "600" },
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
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#2B2B33" },
  emptySubtitle: { fontSize: 13, color: "#7A6D6A", textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#F4896B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "800" },
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
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FDE7DD",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#F4896B", fontWeight: "800", fontSize: 18 },
  appInfo: { flex: 1, gap: 6 },
  appName: { fontSize: 15, fontWeight: "800", color: "#2B2B33" },
  appRole: { color: "#7A6D6A", fontSize: 12 },
  appMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusAccepted: { backgroundColor: "#DCFCE7" },
  statusRejected: { backgroundColor: "#FEE2E2" },
  statusText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 11,
    textTransform: "capitalize",
  },
  timeText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  messageText: { color: "#5F6472", fontSize: 12, lineHeight: 18 },
  docsWrap: { gap: 8, marginTop: 4 },
  docLink: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docLinkText: { color: "#4F46E5", fontWeight: "700", fontSize: 12 },
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
  rejectText: { color: "#7A6D6A", fontWeight: "700", fontSize: 12 },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F4896B",
  },
  approveText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
