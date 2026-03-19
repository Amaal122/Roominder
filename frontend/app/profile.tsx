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

const PROFILE = {
  name: "Alex Martin",
  location: "Paris, France",
  role: "Product Designer",
  bio: "Loves bright kitchens, quiet streets, and roommates who enjoy weekend markets.",
  preferences: ["Quiet after 10pm", "No smoking", "Shared cooking nights"],
  budget: "€1 000 - €1 200",
  moveIn: "April 12, 2026",
  avatar:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
};

export default function Profile() {
  const router = useRouter();
  const tabs: { icon: string; label: string; route: Href }[] = [
    { icon: "🏠", label: "Home", route: "/homescreen" },
    { icon: "👥", label: "Match", route: "/match" },
    { icon: "💬", label: "Chat", route: "/chat" },
    { icon: "❤️", label: "Favorites", route: "/favorite" },
    { icon: "👤", label: "Profile", route: "/profile" },
  ];
  const [activeTab, setActiveTab] = useState("Profile");

  const handleTabPress = (tabLabel: string, route: Href) => {
    setActiveTab(tabLabel);
    if (tabLabel === "Profile") return;
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.iconPlaceholder} />
        </View>

        <ScrollView
          style={styles.sheet}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Image source={{ uri: PROFILE.avatar }} style={styles.avatar} />
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{PROFILE.name}</Text>
              <Text style={styles.meta}>{PROFILE.role}</Text>
              <Text style={styles.meta}>{PROFILE.location}</Text>
            </View>
            <View style={styles.chipRow}>
              <View style={[styles.chip, styles.chipPrimary]}>
                <Text style={styles.chipText}>Budget {PROFILE.budget}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Move-in {PROFILE.moveIn}</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>Bio</Text>
            <Text style={styles.body}>{PROFILE.bio}</Text>
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
              Preferences
            </Text>
            <View style={styles.prefList}>
              {PROFILE.preferences.map((pref) => (
                <View key={pref} style={styles.prefItem}>
                  <Text style={styles.prefBullet}>•</Text>
                  <Text style={styles.prefText}>{pref}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost]}
                onPress={() => router.push("/completeprofile")}
              >
                <Text style={[styles.actionLabel, styles.actionGhostLabel]}>
                  Edit profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => router.push("/match")}
              >
                <Text style={styles.actionLabel}>Find roommates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

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
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#78CFC7",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 12,
  },
  nameBlock: { alignItems: "center", gap: 2, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "800", color: "#1e1f2b" },
  meta: { color: "#6c6f7d", fontSize: 13 },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#eef5f2",
  },
  chipPrimary: { backgroundColor: "#d9f6f0" },
  chipText: { color: "#2b2b33", fontWeight: "600", fontSize: 12 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#1e1f2b" },
  body: { color: "#4a4c59", lineHeight: 20, marginTop: 6 },
  prefList: { marginTop: 6, gap: 6 },
  prefItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  prefBullet: { color: "#78CFC7", fontSize: 14 },
  prefText: { color: "#4a4c59" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: { backgroundColor: "#78CFC7" },
  actionGhost: {
    borderWidth: 1,
    borderColor: "#d7dbdf",
    backgroundColor: "#fff",
  },
  actionLabel: { fontWeight: "800", color: "#fff" },
  actionGhostLabel: { color: "#2b2b33" },
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
