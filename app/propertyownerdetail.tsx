import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Params = {
  id?: string;
  title?: string;
  location?: string;
  price?: string;
  tenants?: string;
  status?: string;
  image?: string;
  beds?: string;
  baths?: string;
  size?: string;
  views?: string;
  applications?: string;
};

export default function PropertyDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const details = useMemo(() => {
    return {
      title: params.title || "Modern Loft in Marais",
      location: params.location || "Le Marais, Paris",
      price: params.price || "€1200",
      tenants: params.tenants || "2 tenants",
      status: params.status || "Occupied",
      image:
        params.image ||
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      beds: Number(params.beds || "2"),
      baths: Number(params.baths || "1"),
      size: Number(params.size || "65"),
      views: Number(params.views || "247"),
      applications: Number(params.applications || "2"),
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
              style={[styles.tab, styles.tabActive]}
              activeOpacity={1}
            >
              <Text style={styles.tabActiveText}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/propertyownerapplications",
                  params: {
                    id: params.id,
                    title: details.title,
                    location: details.location,
                    price: details.price,
                    image: details.image,
                    applications: details.applications,
                  },
                })
              }
            >
              <Text style={styles.tabText}>Applications</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{details.applications}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.location}>{details.location}</Text>

            <View style={styles.metaRow}>
              <MetaChip icon="home" label={`${details.beds} Beds`} />
              <MetaChip
                icon="droplet"
                label={`${details.baths} Bath${details.baths > 1 ? "s" : ""}`}
              />
              <MetaChip icon="maximize-2" label={`${details.size} m²`} />
            </View>

            <Text style={styles.price}>
              {details.price}
              <Text style={styles.perMonth}> per month</Text>
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Views</Text>
              <Text style={styles.statValue}>{details.views}</Text>
              <Text style={styles.statSub}>+15% this week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Applications</Text>
              <Text style={styles.statValue}>{details.applications}</Text>
              <Text style={styles.statSub}>Pending review</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type MetaChipProps = { icon: keyof typeof Feather.glyphMap; label: string };

const MetaChip = ({ icon, label }: MetaChipProps) => (
  <View style={styles.chip}>
    <Feather name={icon} size={14} color="#6B7280" />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

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
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  location: { color: "#6B7280", fontSize: 14 },
  metaRow: { flexDirection: "row", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: { color: "#111827", fontWeight: "700", fontSize: 12 },
  price: { color: "#7C3AED", fontSize: 24, fontWeight: "800" },
  perMonth: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 6,
  },
  statLabel: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
  statValue: { color: "#111827", fontWeight: "800", fontSize: 20 },
  statSub: { color: "#10B981", fontWeight: "700", fontSize: 12 },
});
