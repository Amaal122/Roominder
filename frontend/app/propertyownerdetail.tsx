import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeProperty } from "./state/properties";

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
  const propertyId = params.id ?? "";
  const [deleting, setDeleting] = useState(false);

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
      views: Number(params.views || "0"),
      applications: Number(params.applications || "0"),
    };
  }, [params]);

  const showDeleteError = (message: string) => {
    if (Platform.OS === "web" && typeof globalThis.alert === "function") {
      globalThis.alert(message);
      return;
    }

    Alert.alert("Delete failed", message);
  };

  const deletePropertyAndExit = async () => {
    if (!propertyId || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await removeProperty(propertyId);
      router.replace("/propertyowner");
    } catch (error) {
      setDeleting(false);
      console.error("Failed to delete property:", error);
      showDeleteError(
        error instanceof Error ? error.message : "Could not delete this property.",
      );
    }
  };

  const handleDelete = () => {
    if (!propertyId || deleting) {
      return;
    }

    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      const confirmed = globalThis.confirm(
        "Delete this property and all its related requests?",
      );
      if (confirmed) {
        void deletePropertyAndExit();
      }
      return;
    }

    Alert.alert(
      "Delete property",
      "This will permanently remove this property and its related requests.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deletePropertyAndExit();
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrapper}>
            {details.image && !details.image.startsWith('blob:') && (
              <Image
                source={{ uri: details.image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.roundBtn}
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={18} color="#111827" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.roundBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/newproperty",
                      params: { id: propertyId },
                    })
                  }
                >
                  <Feather name="edit-2" size={16} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roundBtn, deleting && styles.roundBtnDisabled]}
                  disabled={deleting}
                  onPress={handleDelete}
                >
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
  roundBtnDisabled: {
    opacity: 0.6,
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
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#2B2B33" },
  location: { color: "#7A6D6A", fontSize: 14 },
  metaRow: { flexDirection: "row", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9D4C2",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: { color: "#F4896B", fontWeight: "700", fontSize: 12 },
  price: { color: "#F4896B", fontSize: 24, fontWeight: "800" },
  perMonth: { color: "#7A6D6A", fontSize: 13, fontWeight: "600" },
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
  statLabel: { color: "#7A6D6A", fontWeight: "700", fontSize: 12 },
  statValue: { color: "#2B2B33", fontWeight: "800", fontSize: 20 },
  statSub: { color: "#7ECEC4", fontWeight: "700", fontSize: 12 },
});
