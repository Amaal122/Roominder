import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { setPendingCount } from "./state/ownerDashboard";
import {
  connectWebSocket,
  disconnectWebSocket,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  respondToRentalApplication,
  respondToVisitRequest,
  type AppNotification,
} from "./state/notifications";

type NoticeGroup = "visit-owner" | "visit-seeker" | "visit" | "system";

const getGroup = (notification: AppNotification): NoticeGroup => {
  const audience = notification.data?.audience;
  if (audience === "owner") return "visit-owner";
  if (audience === "seeker") return "visit-seeker";
  if (notification.type.startsWith("visit") || notification.type === "application_submitted") {
    return "visit";
  }
  return "system";
};

const getStringField = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const getNumberField = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

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

const countPendingVisitDecisions = (notifications: AppNotification[]) => {
  const pendingVisitIds = new Set<number>();
  let notificationsWithoutVisitId = 0;

  notifications.forEach((notification) => {
    if (!(notification.can_act && notification.visit_status === "pending")) {
      return;
    }

    if (typeof notification.visit_id === "number") {
      pendingVisitIds.add(notification.visit_id);
      return;
    }

    notificationsWithoutVisitId += 1;
  });

  return pendingVisitIds.size + notificationsWithoutVisitId;
};

export default function Notifications() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | NoticeGroup>("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const groupLabel = useCallback(
    (key: NoticeGroup) => {
      if (key === "visit-owner") return t("notifications.owner");
      if (key === "visit-seeker") return t("notifications.seeker");
      if (key === "visit") return t("notifications.visits");
      return t("notifications.system");
    },
    [t],
  );

  const loadNotifications = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const notifications = await fetchNotifications();
      setItems(notifications);
      setError(null);
    } catch (loadError) {
      console.error("Failed to load notifications:", loadError);
      setError("Unable to load notifications right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handleNewNotification = (notification: AppNotification) => {
      setItems((prev) => [notification, ...prev]);
    };

    connectWebSocket(handleNewNotification);

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.is_read).length,
    [items],
  );

  const pendingVisitsCount = useMemo(
    () => countPendingVisitDecisions(items),
    [items],
  );

  useEffect(() => {
    setPendingCount(pendingVisitsCount);
  }, [pendingVisitsCount]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((notification) => getGroup(notification) === filter);
  }, [filter, items]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
    } catch (markError) {
      console.error("Failed to mark all notifications as read:", markError);
      Alert.alert("Error", "Could not mark all notifications as read.");
    }
  };

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.is_read) {
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item,
      ),
    );

    try {
      await markNotificationRead(notification.id);
    } catch (markError) {
      console.error("Failed to mark notification as read:", markError);
    }
  };

  const handleVisitDecision = async (
    notification: AppNotification,
    decision: "confirmed" | "cancelled",
  ) => {
    if (!notification.visit_id) {
      Alert.alert("Error", "This notification is missing its visit id.");
      return;
    }

    const currentActionKey = `${notification.id}-${decision}`;
    try {
      setActionKey(currentActionKey);
      await respondToVisitRequest(notification.visit_id, decision);
      await handleMarkRead(notification);
      await loadNotifications("refresh");
    } catch (decisionError) {
      console.error("Failed to update visit decision:", decisionError);
      Alert.alert("Error", "Could not update this visit request.");
    } finally {
      setActionKey(null);
    }
  };

  const handleApplicationDecision = async (
    notification: AppNotification,
    decision: "accepted" | "rejected",
  ) => {
    const payload = notification.data ?? {};
    const rentalApplicationId = getNumberField(payload.rental_application_id);
    if (!rentalApplicationId) {
      Alert.alert("Error", "This application is missing its id.");
      return;
    }

    const currentActionKey = `${notification.id}-application-${decision}`;
    try {
      setActionKey(currentActionKey);
      await respondToRentalApplication(rentalApplicationId, decision);
      setItems((prev) => prev.filter((item) => item.id !== notification.id));
      await loadNotifications("refresh");
    } catch (decisionError) {
      console.error("Failed to update rental application:", decisionError);
      Alert.alert("Error", "Could not update this application right now.");
    } finally {
      setActionKey(null);
    }
  };

  const handleOpenApplicationForm = async (notification: AppNotification) => {
    const payload = notification.data ?? {};
    const propertyId = getNumberField(payload.property_id);
    const applicationId = getNumberField(payload.application_id);
    const propertyTitle = getStringField(payload.property_title) ?? "Property";
    const propertyLocation = getStringField(payload.property_location) ?? "";

    await handleMarkRead(notification);

    router.push({
      pathname: "/screens/ApplicationRequest",
      params: {
        id: propertyId ? String(propertyId) : undefined,
        application_id: applicationId ? String(applicationId) : undefined,
        title: propertyTitle,
        location: propertyLocation,
      },
    });
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? [Colors.dark.background, Colors.dark.background]
          : ["#F4896B", "#F7B89A", "#7ECEC4"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={() => router.back()}
          >
            <Feather
              name="arrow-left"
              size={20}
              color={isDark ? Colors.dark.text : "#2B2B33"}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
              {t("notifications.title")}
            </Text>
            <Text style={styles.headerSub}>
              {t("notifications.unread", { unread: unreadCount, total: items.length })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.markBtn, isDark && styles.markBtnDark]}
            onPress={handleMarkAllRead}
          >
            <Text style={[styles.markText, isDark && styles.markTextDark]}>
              {t("notifications.mark_all")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {(["all", "visit-owner", "visit-seeker", "visit", "system"] as const).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                isDark && styles.filterChipDark,
                filter === key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(key)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterText,
                  isDark && styles.filterTextDark,
                  filter === key && styles.filterTextActive,
                ]}
              >
                {key === "all" ? t("notifications.all") : groupLabel(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <ActivityIndicator color="#F4896B" />
              <Text style={[styles.emptySubtitle, isDark && styles.mutedTextDark]}>
                {t("notifications.loading")}
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>
                {t("notifications.load_error_title")}
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.mutedTextDark]}>
                {error}
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadNotifications("refresh")}
              >
                <Text style={styles.retryText}>
                  {refreshing ? t("common.refreshing") : t("common.try_again")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>
                {t("notifications.empty_title")}
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.mutedTextDark]}>
                {t("notifications.empty_subtitle")}
              </Text>
            </View>
          ) : (
            filtered.map((notification) => {
              const payload = notification.data ?? {};
              const requesterName = getStringField(payload.requester_name);
              const requesterEmail = getStringField(payload.requester_email);
              const requesterPhone = getStringField(payload.requester_phone);
              const preferredTime = getStringField(payload.preferred_time);
              const message = getStringField(payload.message);
              const propertyTitle = getStringField(payload.property_title);
              const propertyLocation = getStringField(payload.property_location);
              const ownerName = getStringField(payload.owner_name);
              const applicantName =
                requesterName ?? getStringField(payload.seeker_name);
              const applicantEmail =
                requesterEmail ?? getStringField(payload.seeker_email);
              const ctaLabel =
                getStringField(payload.cta_label) ?? t("notifications.fill_application");
              const isOwnerVisitRequest = notification.type === "visit_request";
                            const displayTitle = isOwnerVisitRequest
                              ? t("notifications.new_visit")
                              : notification.title;
              const isAcceptedVisit = notification.type === "visit_confirmed";
              const isDeclinedVisit = notification.type === "visit_cancelled";
              const isApplicationSubmitted = notification.type === "application_submitted";
              const isOwnerApplicationSubmission =
                isApplicationSubmitted && payload.audience === "owner";
              const isApplicationAccepted = notification.type === "application_accepted";
              const isApplicationRejected = notification.type === "application_rejected";

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[styles.card, isDark && styles.cardDark]}
                  activeOpacity={0.92}
                  onPress={() => handleMarkRead(notification)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.dot,
                          notification.is_read ? styles.dotRead : styles.dotUnread,
                        ]}
                      />
                      <View style={styles.cardTextWrap}>
                        <Text style={[styles.cardTitle, isDark && styles.titleDark]}>
                          {displayTitle}
                        </Text>
                        <Text style={[styles.cardBody, isDark && styles.mutedTextDark]}>
                          {notification.body}
                        </Text>
                      </View>
                    </View>
                    {!notification.is_read ? <View style={styles.unreadPill} /> : null}
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={[styles.cardTime, isDark && styles.mutedTextDark]}>
                      {formatRelativeTime(notification.created_at)}
                    </Text>
                    {notification.visit_status ? (
                      <View
                        style={[
                          styles.statusPill,
                          notification.visit_status === "confirmed"
                            ? styles.statusConfirmed
                            : notification.visit_status === "cancelled"
                              ? styles.statusCancelled
                              : styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>{notification.visit_status}</Text>
                      </View>
                    ) : null}
                  </View>

                  {propertyTitle ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      {t("notifications.property")}: {propertyTitle}
                    </Text>
                  ) : null}
                  {propertyLocation ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      {t("notifications.location")}: {propertyLocation}
                    </Text>
                  ) : null}
                  {isOwnerVisitRequest && requesterName ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      {t("notifications.user")}: {requesterName}
                    </Text>
                  ) : null}
                  {!isOwnerVisitRequest && ownerName ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      {t("notifications.owner")}: {ownerName}
                    </Text>
                  ) : null}
                  {isOwnerVisitRequest && requesterEmail ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      Email: {requesterEmail}
                    </Text>
                  ) : null}
                  {isOwnerVisitRequest && requesterPhone ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      {t("notifications.phone")}: {requesterPhone}
                    </Text>
                  ) : null}
                  {preferredTime ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      {t("notifications.preferred_time")}: {preferredTime}
                    </Text>
                  ) : null}
                  {isOwnerVisitRequest && message ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      Message: {message}
                    </Text>
                  ) : null}
                  {isOwnerApplicationSubmission && applicantName ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      Applicant: {applicantName}
                    </Text>
                  ) : null}
                  {isOwnerApplicationSubmission && applicantEmail ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      Email: {applicantEmail}
                    </Text>
                  ) : null}
                  {isOwnerApplicationSubmission && message ? (
                    <Text style={[styles.infoLine, isDark && styles.mutedTextDark]}>
                      Message: {message}
                    </Text>
                  ) : null}
                  {isAcceptedVisit ? (
                    <View style={[styles.userNoticeBox, isDark && styles.userNoticeBoxDark]}>
                      <Text style={[styles.userNoticeTitle, isDark && styles.titleDark]}>
                        Next step
                      </Text>
                      <Text style={[styles.userNoticeText, isDark && styles.mutedTextDark]}>
                        Your visit was accepted. Complete the application form so the owner
                        can review your file.
                      </Text>
                      <TouchableOpacity
                        style={styles.userCtaBtn}
                        onPress={() => void handleOpenApplicationForm(notification)}
                      >
                        <Text style={styles.userCtaText}>{ctaLabel}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {isDeclinedVisit ? (
                    <View style={[styles.userNoticeBox, isDark && styles.userNoticeBoxDark]}>
                      <Text style={[styles.userNoticeTitle, isDark && styles.titleDark]}>
                        Update
                      </Text>
                      <Text style={[styles.userNoticeText, isDark && styles.mutedTextDark]}>
                        This visit request was declined. You can keep exploring other homes
                        and send a new request anytime.
                      </Text>
                    </View>
                  ) : null}
                  {isOwnerApplicationSubmission ? (
                    <View style={[styles.userNoticeBox, isDark && styles.userNoticeBoxDark]}>
                      <Text style={[styles.userNoticeTitle, isDark && styles.titleDark]}>
                        Application Details
                      </Text>
                      <Text style={[styles.userNoticeText, isDark && styles.mutedTextDark]}>
                        Review the applicant documents below, then decide whether to accept
                        or reject this rental application.
                      </Text>
                      {[
                        ["Identity document",   payload.id_doc_url],
                        ["Proof of income",     payload.income_doc_url],
                        ["Employment letter",   payload.employment_doc_url],
                        ["Guarantor info",      payload.guarantor_doc_url],
                      ].map(([label, url]) =>
                        url ? (
                          <TouchableOpacity
                            key={label as string}
                            style={[styles.docLink, isDark && styles.docLinkDark]}
                            onPress={() => {
                              // Open the Cloudinary URL in browser
                              const { Linking } = require("react-native");
                              Linking.openURL(url as string);
                            }}
                          >
                            <Text style={styles.docLinkText}>📄 {label as string}</Text>
                          </TouchableOpacity>
                        ) : null
                      )}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[styles.rejectBtn, isDark && styles.rejectBtnDark]}
                          onPress={() => void handleApplicationDecision(notification, "rejected")}
                          disabled={Boolean(actionKey)}
                        >
                          <Text style={[styles.rejectText, isDark && styles.rejectTextDark]}>
                            {actionKey === `${notification.id}-application-rejected`
                              ? "Rejecting..."
                              : "Reject"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => void handleApplicationDecision(notification, "accepted")}
                          disabled={Boolean(actionKey)}
                        >
                          <Text style={styles.approveText}>
                            {actionKey === `${notification.id}-application-accepted`
                              ? "Accepting..."
                              : "Accept"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                  {isApplicationAccepted ? (
                    <View style={[styles.userNoticeBox, isDark && styles.userNoticeBoxDark]}>
                      <Text style={[styles.userNoticeTitle, isDark && styles.titleDark]}>
                        Application update
                      </Text>
                      <Text style={[styles.userNoticeText, isDark && styles.mutedTextDark]}>
                        Your rental application was accepted. You can continue with the owner
                        to finalize the next steps.
                      </Text>
                    </View>
                  ) : null}
                  {isApplicationRejected ? (
                    <View style={[styles.userNoticeBox, isDark && styles.userNoticeBoxDark]}>
                      <Text style={[styles.userNoticeTitle, isDark && styles.titleDark]}>
                        Application update
                      </Text>
                      <Text style={[styles.userNoticeText, isDark && styles.mutedTextDark]}>
                        Your rental application was declined. You can keep exploring other
                        homes and submit a new application anytime.
                      </Text>
                    </View>
                  ) : null}

                  {notification.can_act && notification.visit_status === "pending" ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.rejectBtn, isDark && styles.rejectBtnDark]}
                        onPress={() => handleVisitDecision(notification, "cancelled")}
                        disabled={Boolean(actionKey)}
                      >
                        <Text style={[styles.rejectText, isDark && styles.rejectTextDark]}>
                          {actionKey === `${notification.id}-cancelled`
                            ? "Declining..."
                            : "Decline"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleVisitDecision(notification, "confirmed")}
                        disabled={Boolean(actionKey)}
                      >
                        <Text style={styles.approveText}>
                          {actionKey === `${notification.id}-confirmed`
                            ? "Accepting..."
                            : "Accept"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, padding: 16 },
  safeAreaDark: { backgroundColor: Colors.dark.background },
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
  iconBtnDark: { backgroundColor: Colors.dark.cardMuted, borderWidth: 1, borderColor: Colors.dark.border },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerTitleDark: { color: Colors.dark.text },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
  markBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  markBtnDark: { backgroundColor: Colors.dark.cardMuted, borderWidth: 1, borderColor: Colors.dark.border },
  markText: { fontSize: 12, fontWeight: "700", color: "#2B2B33" },
  markTextDark: { color: Colors.dark.text },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipDark: { backgroundColor: Colors.dark.cardMuted, borderWidth: 1, borderColor: Colors.dark.border },
  filterChipActive: { backgroundColor: "#7ECEC4" },
  filterText: { fontSize: 12, fontWeight: "700", color: "#2B2B33" },
  filterTextDark: { color: Colors.dark.text },
  filterTextActive: { color: "#fff" },
  list: { marginTop: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardDark: { backgroundColor: Colors.dark.card, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: Colors.dark.border },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardLeft: { flexDirection: "row", gap: 10, flex: 1 },
  cardTextWrap: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  dotUnread: { backgroundColor: "#F4896B" },
  dotRead: { backgroundColor: "#D6D3D1" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#2B2B33" },
  cardBody: { fontSize: 12, color: "#7A6D6A", marginTop: 2, lineHeight: 18 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  cardTime: { fontSize: 11, color: "#9CA3AF" },
  unreadPill: {
    width: 6,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#F4896B",
    alignSelf: "center",
  },
  infoLine: {
    fontSize: 12,
    color: "#5F6472",
    marginTop: 4,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  rejectBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  rejectText: { color: "#7A6D6A", fontWeight: "700", fontSize: 12 },
  rejectBtnDark: { backgroundColor: Colors.dark.cardMuted, borderWidth: 1, borderColor: Colors.dark.border },
  rejectTextDark: { color: Colors.dark.text },
  approveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F4896B",
  },
  approveText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusConfirmed: { backgroundColor: "#DCFCE7" },
  statusCancelled: { backgroundColor: "#FEE2E2" },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize",
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyCardDark: { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#2B2B33" },
  emptySubtitle: { fontSize: 12, color: "#7A6D6A", marginTop: 4, textAlign: "center" },
  titleDark: { color: Colors.dark.text },
  mutedTextDark: { color: Colors.dark.mutedText },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#F4896B",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  userNoticeBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 8,
  },
  userNoticeBoxDark: {
    backgroundColor: Colors.dark.cardMuted,
    borderColor: Colors.dark.border,
  },
  userNoticeTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2B2B33",
  },
  userNoticeText: {
    fontSize: 12,
    color: "#5F6472",
    lineHeight: 18,
  },
  userCtaBtn: {
    marginTop: 2,
    backgroundColor: "#7ECEC4",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  userCtaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  docLink: {
  marginTop: 8,
  backgroundColor: "#EEF2FF",
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 12,
},
  docLinkDark: { backgroundColor: Colors.dark.card },
docLinkText: {
  fontSize: 12,
  fontWeight: "700",
  color: "#4F46E5",
},
});
