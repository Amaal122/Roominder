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
import { useMatchesStore } from "../../store/matchStore";

export default function Match() {
  const matches = useMatchesStore();
  const router = useRouter();
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" },
    { icon: "👥", label: "Match", route: "/match" },
    { icon: "💬", label: "Chat", route: "/chat" },
    { icon: "❤️", label: "Favorites", route: "/favorite" },
    { icon: "👤", label: "Profile", route: "/homescreen" },
  ];
  const [activeTab, setActiveTab] = useState("Match");

  const handleContact = (id: string, name: string) => {
    router.push({ pathname: "/chat/[id]", params: { id, name } });
  };

  const handleTabPress = (tabLabel: string, route: Href) => {
    setActiveTab(tabLabel);
    if (tabLabel === "Match") return;
    router.push(route);
  };

  return (
    <LinearGradient
      colors={["#F4896B", "#F7B89A", "#78CFC7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
            <Text style={styles.title}>Your Matches</Text>
            <Text style={styles.subtitle}>
              {matches.length === 1
                ? "1 person you saved"
                : `${matches.length} people you saved`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/roomatematch")}
          >
            <Text style={styles.iconText}>✨</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sheet}>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyCopy}>
                Swipe right or tap the heart in Roommate Match to add someone
                here.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/roomatematch")}
              >
                <Text style={styles.primaryLabel}>Find roommates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {matches.map((profile) => (
                <View key={profile.id} style={styles.card}>
                  <Image source={{ uri: profile.image }} style={styles.photo} />
                  <View style={styles.cardBody}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.name}>
                        {profile.name}, {profile.age}
                      </Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{profile.match}%</Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>{profile.role}</Text>
                    <Text style={styles.meta}>{profile.location}</Text>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleContact(profile.id, profile.name)}
                    >
                      <Text style={styles.contactLabel}>Contact</Text>
                    </TouchableOpacity>
                  </View>
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
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#f5e9ff", fontSize: 12, marginTop: 4 },
  sheet: {
    flex: 1,
    backgroundColor: "#f6fef9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 40,
  },
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
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#7ECEC4",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  photo: { width: "100%", height: 160 },
  cardBody: { padding: 14 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "800", color: "#1e1f2b" },
  badge: {
    backgroundColor: "#7ECEC4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontWeight: "800" },
  meta: { color: "#6c6f7d", marginTop: 4 },
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
