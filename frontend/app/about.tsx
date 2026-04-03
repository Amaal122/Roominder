import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSeekerProfile } from "./contexts/SeekerProfileContext";
import { clearAuthToken, getAuthToken } from "./state/auth";

const API_BASE = "http://127.0.0.1:8001";

type CurrentUserProfile = {
  id: number;
  email: string;
  full_name?: string | null;
  role?: string | null;
  is_active: boolean;
  created_at: string;
};

const formatMemberSince = (value?: string) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function About() {
  const router = useRouter();
  const { resetProfile } = useSeekerProfile();
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        if (!token) {
          throw new Error("Missing auth token");
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load profile");
        }

        if (!cancelled) {
          setProfile(data as CurrentUserProfile);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error("Failed to load current profile:", loadError);
          setProfile(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load owner details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!profile) {
      return "Owner";
    }

    return profile.full_name?.trim() || profile.email;
  }, [profile]);

  const initials = useMemo(() => {
    const source = displayName.trim();
    if (!source) {
      return "O";
    }

    const words = source.split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("") || "O";
  }, [displayName]);

  const roleLabel = useMemo(() => {
    const role = profile?.role?.trim().toLowerCase();
    if (role === "owner") {
      return "Property Owner";
    }
    if (role === "seeker") {
      return "Seeker";
    }
    return profile?.role || "Member";
  }, [profile]);

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      await clearAuthToken();
      resetProfile();
      setProfile(null);
      const target = "/findhome";

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.replace(target);
        return;
      }

      const dismissAll = (router as { dismissAll?: () => void }).dismissAll;
      dismissAll?.();
      router.replace(target);
    } catch (logoutError) {
      console.error("Failed to log out:", logoutError);
      Alert.alert("Logout failed", "Could not log out right now. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Do you want to disconnect from this profile?",
      );
      if (!confirmed) {
        return;
      }
      void performLogout();
      return;
    }

    Alert.alert(
      "Log out",
      "Do you want to disconnect from this profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ],
    );
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
            <Text style={styles.headerTitle}>About</Text>
            <Text style={styles.headerSub}>Roominder & owner profile</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Feather name="home" size={16} color="#fff" />
              <Text style={styles.heroBadgeText}>Roominder</Text>
            </View>
            <Text style={styles.heroTitle}>Manage homes, visits, and applications in one place.</Text>
            <Text style={styles.heroBody}>
              Roominder helps owners publish listings, review visit requests,
              accept applications, and stay close to renters through fast,
              simple communication.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Owner Profile</Text>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#F4896B" />
                <Text style={styles.loadingText}>Loading owner details...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorTitle}>Could not load profile</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.profileTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={styles.profileTextWrap}>
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Text style={styles.profileRole}>{roleLabel}</Text>
                    <Text style={styles.profileEmail}>{profile?.email}</Text>
                  </View>
                </View>

                <View style={styles.detailsWrap}>
                  <DetailRow label="Full name" value={profile?.full_name?.trim() || "Not set"} />
                  <DetailRow label="Email" value={profile?.email || "Unknown"} />
                  <DetailRow label="Role" value={roleLabel} />
                  <DetailRow
                    label="Account status"
                    value={profile?.is_active ? "Active" : "Inactive"}
                  />
                  <DetailRow
                    label="Member since"
                    value={formatMemberSince(profile?.created_at)}
                  />
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Feather name="log-out" size={18} color="#fff" />
            <Text style={styles.logoutText}>
              {loggingOut ? "Logging out..." : "Log Out"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24, gap: 14 },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  heroBody: {
    marginTop: 10,
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2B2B33",
    marginBottom: 14,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: {
    color: "#7A6D6A",
    fontSize: 13,
    fontWeight: "600",
  },
  errorWrap: {
    borderRadius: 14,
    backgroundColor: "#FFF5F5",
    padding: 14,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2B2B33",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#7A6D6A",
    lineHeight: 18,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#7ECEC4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  profileTextWrap: { flex: 1 },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2B2B33",
  },
  profileRole: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: "#F4896B",
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A6D6A",
  },
  detailsWrap: {
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: "#F1E3DC",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E3DC",
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#2B2B33",
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "600",
    color: "#7A6D6A",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F4896B",
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: "#F4896B",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
