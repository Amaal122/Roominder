import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePendingCount } from "./state/ownerDashboard";
import { useProperties } from "./state/properties";

const STATS = [
  {
    key: "monthly",
    label: "Monthly",
    value: "€1200",
    icon: "dollar-sign",
    color: "#10B981",
  },
  {
    key: "occupancy",
    label: "Occupancy",
    value: "50%",
    icon: "trending-up",
    color: "#6366F1",
  },
  {
    key: "pending",
    label: "Pending",
    value: "7",
    icon: "clock",
    color: "#F59E0B",
  },
] as const;

export default function PropertyOwner() {
  const router = useRouter();
  const pendingCount = usePendingCount();
  const properties = useProperties();

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

          <View style={styles.statsRow}>
            {STATS.map((stat) => (
              <View key={stat.key} style={styles.statCard}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: `${stat.color}15` },
                  ]}
                >
                  {" "}
                  {/* light tint */}
                  <Feather name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.key === "pending" ? String(pendingCount) : stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

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
                <Image
                  source={{ uri: property.image }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
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
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    alignItems: "flex-start",
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#7A6D6A", fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2B2B33",
    marginTop: 4,
    marginBottom: 4,
  },
  propertiesList: { gap: 14 },
  propertyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: "hidden",
  },
  propertyImage: { width: "100%", height: 150 },
  statusBadgeWrapper: { position: "absolute", top: 12, right: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusAvailable: { backgroundColor: "#DCFCE7" },
  statusOccupied: { backgroundColor: "#FDE7DD" },
  statusText: { fontWeight: "700", fontSize: 12 },
  statusTextAvailable: { color: "#166534" },
  statusTextOccupied: { color: "#C2410C" },
  propertyBody: { padding: 14, gap: 8 },
  propertyTitle: { fontSize: 16, fontWeight: "800", color: "#2B2B33" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: "#7A6D6A", fontSize: 13 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: { color: "#F4896B", fontWeight: "800", fontSize: 16 },
  tenantsText: { color: "#7A6D6A", fontWeight: "700", fontSize: 12 },
});
