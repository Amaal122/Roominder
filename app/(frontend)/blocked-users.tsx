import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { updateSettings, useSettings } from "../state/settings";

export default function BlockedUsers() {
  const router = useRouter();
  const settings = useSettings();

  const unblock = (name: string) => {
    updateSettings({
      blockedUsers: settings.blockedUsers.filter((u) => u !== name),
    });
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
          <Text style={styles.headerTitle}>Blocked Users</Text>
        </View>

        <View style={styles.card}>
          {settings.blockedUsers.length === 0 ? (
            <Text style={styles.emptyText}>No blocked users.</Text>
          ) : (
            settings.blockedUsers.map((name) => (
              <View key={name} style={styles.row}>
                <Text style={styles.rowLabel}>{name}</Text>
                <TouchableOpacity
                  style={styles.unblockBtn}
                  onPress={() => unblock(name)}
                >
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 14, fontWeight: "700", color: "#2B2B33" },
  unblockBtn: {
    backgroundColor: "#F4896B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  unblockText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  emptyText: { fontSize: 12, color: "#7A6D6A" },
});
