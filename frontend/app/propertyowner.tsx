import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePendingCount, useStats, loadStats } from "./state/ownerDashboard";
import { loadMyProperties, useProperties } from "./state/properties";

export default function PropertyOwner() {
  const router = useRouter();
  const pendingCount = usePendingCount();
  const properties = useProperties();
  const stats = useStats();

  useFocusEffect(
    useCallback(() => {
      void loadMyProperties();
      void loadStats();
    }, []),
  );

  const handleNewProperty = () => {
    router.push("/newproperty");
  };

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
          {/* ── Header ────────────────────────────────── */}
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>My Properties</Text>
                <Text style={styles.headerSubtitle}>
                  {properties.length} active listings
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push("/notifications")}
                >
                  <Feather name="bell" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push("/settings")}
                >
                  <Feather name="settings" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addBtnWrapper}
              activeOpacity={0.9}
              onPress={handleNewProperty}
            >
              <LinearGradient
                colors={["#F4896B", "#7ECEC4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addBtn}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add New Property</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Stats ─────────────────────────────────── */}
          <View style={styles.statsRow}>

            {/* Monthly */}
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#10B98115" }]}>
                <Feather name="dollar-sign" size={18} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                {stats.monthly_revenue} {stats.currency}
              </Text>
              <Text style={styles.statLabel}>Monthly</Text>
            </View>

            {/* Occupancy */}
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#6366F115" }]}>
                <Feather name="trending-up" size={18} color="#6366F1" />
              </View>
              <Text style={[styles.statValue, { color: "#6366F1" }]}>
                {stats.occupancy_percent}%
              </Text>
              <Text style={styles.statLabel}>Occupancy</Text>
            </View>

            {/* Pending */}
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#F59E0B15" }]}>
                <Feather name="clock" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                {String(pendingCount)}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

          </View>

          {/* ── Properties List ───────────────────────── */}
          <Text style={styles.sectionTitle}>Your Properties</Text>

          <View style={styles.propertiesList}>
            {properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                activeOpacity={0.9}
                style={styles.propertyCard}
                onPress={() =>
                  router.push({
                    pathname: "/propertyownerdetail",
                    params: {
                      id: property.id,
                      title: property.title,
                      location: property.location,
                      price: property.price,
                      tenants: property.tenants,
                      status: property.status,
                      image: property.image,
                      beds: String(property.beds),
                      baths: String(property.baths),
                      size: String(property.size),
                      views: String(property.views ?? 0),
                      applications: String(property.applications ?? 0),
                    },
                  })
                }
              >
                {property.image && !property.image.startsWith("blob:") && (
                  <Image
                    source={{ uri: property.image }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.statusBadgeWrapper}>
                  <View
                    style={[
                      styles.statusBadge,
                      property.status === "Available"
                        ? styles.statusAvailable
                        : styles.statusOccupied,
                    ]}
                  >
                    <Feather
                      name={
                        property.status === "Available"
                          ? "check-circle"
                          : "circle"
                      }
                      size={12}
                      color={
                        property.status === "Available" ? "#16A34A" : "#1D4ED8"
                      }
                    />
                    <Text
                      style={[
                        styles.statusText,
                        property.status === "Available"
                          ? styles.statusTextAvailable
                          : styles.statusTextOccupied,
                      ]}
                    >
                      {property.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.propertyBody}>
                  <Text style={styles.propertyTitle}>{property.title}</Text>
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={14} color="#6B7280" />
                    <Text style={styles.locationText}>{property.location}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>{property.price}/month</Text>
                    <Text style={styles.tenantsText}>{property.tenants}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28, gap: 16 },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 26,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 12,
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontSize: 13,
  },
  headerActions: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnWrapper: { borderRadius: 16, overflow: "hidden" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 6,
  },
  propertiesList: {
    gap: 16,
  },
  propertyCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  propertyImage: {
    width: "100%",
    height: 190,
    backgroundColor: "#E5E7EB",
  },
  statusBadgeWrapper: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusAvailable: {
    backgroundColor: "rgba(240,253,244,0.95)",
  },
  statusOccupied: {
    backgroundColor: "rgba(239,246,255,0.95)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextAvailable: {
    color: "#16A34A",
  },
  statusTextOccupied: {
    color: "#1D4ED8",
  },
  propertyBody: {
    padding: 18,
    gap: 10,
  },
  propertyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F97316",
  },
  tenantsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
});
