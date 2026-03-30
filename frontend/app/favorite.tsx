import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavoritesStore } from "../store/favoriteStore";

export default function Favorite() {
  const favorites = useFavoritesStore();
  const router = useRouter();
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" },
    { icon: "👥", label: "Match", route: "/match" },
    { icon: "💬", label: "Chat", route: "/chat" },
    { icon: "❤️", label: "Favorites", route: "/favorite" },
    { icon: "👤", label: "Profile", route: "/homescreen" },
  ];
  const [activeTab, setActiveTab] = useState("Favorites");

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
              {favorites.length} saved{" "}
              {favorites.length === 1 ? "place" : "places"}
            </Text>
          </View>
          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.sheet}>
          {favorites.length === 0 ? (
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
              {favorites.map((item) => (
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
