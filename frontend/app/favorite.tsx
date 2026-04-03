import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavoritesStore } from "../store/favoriteStore";
import { getAuthToken } from "./state/auth";

const API_BASE = "http://127.0.0.1:8001";

type PropertyOut = {
  id: number;
  title: string;
  address: string;
  city: string;
  price: number;
  image_url?: string | null;
};

type FavoriteOut = {
  id: number;
  user_id: number;
  property_id: number;
  created_at: string;
};

export default function Favorite() {
  const localFavorites = useFavoritesStore();
  const router = useRouter();
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" },
    { icon: "👥", label: "Match", route: "/match" },
    { icon: "💬", label: "Chat", route: "/chat" },
    { icon: "❤️", label: "Favorites", route: "/favorite" },
    { icon: "👤", label: "Profile", route: "/homescreen" },
  ];
  const [activeTab, setActiveTab] = useState("Favorites");
  const [items, setItems] = useState(localFavorites);
  const [loading, setLoading] = useState(false);

  const localNumericPropertyIds = useMemo(() => {
    const ids = new Set<number>();
    for (const fav of localFavorites) {
      const parsed = Number(fav.id);
      if (Number.isFinite(parsed)) ids.add(parsed);
    }
    return [...ids];
  }, [localFavorites]);

  useEffect(() => {
    let cancelled = false;

    const syncAndLoad = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();

        // If not logged in, fall back to local in-memory favorites.
        if (!token) {
          if (!cancelled) setItems(localFavorites);
          return;
        }

        // 1) Best-effort sync local favorites to backend so users see them here.
        await Promise.all(
          localNumericPropertyIds.map((propertyId) =>
            fetch(`${API_BASE}/favorites/${propertyId}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null),
          ),
        );

        // 2) Load favorites from backend.
        const favRes = await fetch(`${API_BASE}/favorites/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!favRes.ok) {
          const text = await favRes.text();
          throw new Error(`${favRes.status}: ${text}`);
        }

        const favs = (await favRes.json()) as FavoriteOut[];

        // 3) Hydrate each favorite with property details.
        const properties = await Promise.all(
          favs.map(async (fav) => {
            const propRes = await fetch(`${API_BASE}/properties/${fav.property_id}`);
            if (!propRes.ok) return null;
            return (await propRes.json()) as PropertyOut;
          }),
        );

        const hydrated = properties
          .filter((p): p is PropertyOut => Boolean(p))
          .map((p) => ({
            id: String(p.id),
            title: p.title,
            location: p.city ? `${p.address}, ${p.city}` : p.address,
            price: Number.isFinite(p.price) ? `${p.price} €` : undefined,
            image: p.image_url ?? undefined,
          }));

        if (!cancelled) setItems(hydrated);
      } catch (error) {
        console.error("Failed to load favorites:", error);
        if (!cancelled) {
          setItems(localFavorites);
          Alert.alert("Favorites", "Could not load favorites from server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void syncAndLoad();
    return () => {
      cancelled = true;
    };
  }, [localFavorites, localNumericPropertyIds]);

  const handleTabPress = (tabLabel: string, route: Href) => {
    setActiveTab(tabLabel);
    if (tabLabel === "Favorites") return;
    router.push(route);
  };

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/homescreen")}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Favorites</Text>
            <Text style={styles.subtitle}>
              {items.length} saved {items.length === 1 ? "place" : "places"}
            </Text>
          </View>
          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.sheet}>
          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color="#7d5dff" />
              <Text style={styles.emptyCopy}>Loading favorites...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptyCopy}>
                Tap the heart on a property to add it here.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/homescreen")}
              >
                <Text style={styles.primaryLabel}>Browse homes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {items.map((item) => (
                <View key={item.id} style={styles.card}>
                  {item.image && !item.image.startsWith('blob:') ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.location ? (
                      <Text style={styles.cardMeta}>{item.location}</Text>
                    ) : null}
                    {item.price ? (
                      <Text style={styles.cardMeta}>{item.price}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/screens/PropertyDetail",
                        params: {
                          id: item.id,
                          title: item.title,
                          location: item.location,
                          price: item.price,
                          image: item.image,
                        },
                      })
                    }
                  >
                    <Text style={styles.contactLabel}>Property details</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Bottom nav */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.8}
              onPress={() => handleTabPress(tab.label, tab.route)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.label && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 16, fontWeight: "700", color: "#2b2b33" },
  title: { fontSize: 22, fontWeight: "800", color: "#2b2b33" },
  subtitle: { color: "#6c6f7d", fontSize: 12, marginTop: 2 },
  iconPlaceholder: { width: 40, height: 40 },
  sheet: {
    flex: 1,
    backgroundColor: "#f6fef9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#2b2b33" },
  emptyCopy: {
    color: "#6c6f7d",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#7d5dff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryLabel: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#78CFC7",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardText: { gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1e1f2b" },
  cardMeta: { color: "#6c6f7d", fontSize: 13 },
  contactBtn: {
    marginTop: 12,
    backgroundColor: "#78CFC7",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  contactLabel: { color: "#fff", fontWeight: "800" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e6e9ef",
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: "#AAAAAA", fontWeight: "500" },
  tabLabelActive: { color: "#F4896B", fontWeight: "700" },
});
