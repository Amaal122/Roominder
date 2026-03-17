import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
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

type Property = {
  id: string;
  title: string;
  location: string;
  price: string;
  tenants: string;
  status: "Occupied" | "Available";
  image: string;
  beds: number;
  baths: number;
  size: number;
  views?: number;
  applications?: number;
};

const PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Modern Loft in Marais",
    location: "Le Marais, Paris",
    price: "€1200",
    tenants: "2 tenants",
    status: "Occupied",
    beds: 2,
    baths: 1,
    size: 65,
    views: 247,
    applications: 2,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    title: "Bright Flat near Canal",
    location: "Canal Saint-Martin, Paris",
    price: "€980",
    tenants: "Available",
    status: "Available",
    beds: 1,
    baths: 1,
    size: 48,
    views: 180,
    applications: 1,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    title: "Cozy Studio in Bastille",
    location: "Bastille, Paris",
    price: "€850",
    tenants: "1 tenant",
    status: "Occupied",
    beds: 1,
    baths: 1,
    size: 32,
    views: 132,
    applications: 0,
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function PropertyOwner() {
  const router = useRouter();
  const pendingCount = usePendingCount();

  const handleNewProperty = () => {
    router.push("/newproperty" as Href);
  };

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
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>My Properties</Text>
                <Text style={styles.headerSubtitle}>3 active listings</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Feather name="bell" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
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
                colors={["#F97316", "#F43F5E"]}
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
            {PROPERTIES.map((property) => (
              <TouchableOpacity
                key={property.id}
                activeOpacity={0.9}
                style={styles.propertyCard}
                onPress={() =>
                  router.push({
                    pathname: "/propertyownerdetail" as Href,
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
    backgroundColor: "#7C3AED",
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
  headerSubtitle: { color: "#E0E7FF", marginTop: 4, fontSize: 13 },
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
    backgroundColor: "#FFFFFF",
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
  statLabel: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
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
  statusOccupied: { backgroundColor: "#DBEAFE" },
  statusText: { fontWeight: "700", fontSize: 12 },
  statusTextAvailable: { color: "#166534" },
  statusTextOccupied: { color: "#1D4ED8" },
  propertyBody: { padding: 14, gap: 8 },
  propertyTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: "#6B7280", fontSize: 13 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: { color: "#7C3AED", fontWeight: "800", fontSize: 16 },
  tenantsText: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
});
