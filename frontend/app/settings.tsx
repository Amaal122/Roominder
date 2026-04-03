import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { updateSettings, useSettings } from "./state/settings";

export default function Settings() {
  const router = useRouter();
  const settings = useSettings();

  return (
    <LinearGradient
      colors={["#F4896B", "#F7B89A", "#7ECEC4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#2B2B33" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSub}>Preferences & account</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <SettingRow
              label="Push notifications"
              value={settings.pushEnabled}
              onChange={(value) => updateSettings({ pushEnabled: value })}
            />
            <SettingRow
              label="Email alerts"
              value={settings.emailEnabled}
              onChange={(value) => updateSettings({ emailEnabled: value })}
            />
            <SettingRow
              label="SMS alerts"
              value={settings.smsEnabled}
              onChange={(value) => updateSettings({ smsEnabled: value })}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <ActionRow
              label="Change password"
              onPress={() => router.push("/change-password")}
            />
            <ActionRow
              label="Two‑factor authentication"
              value={settings.twoFactorEnabled ? "Enabled" : "Off"}
              onPress={() => router.push("/two-factor")}
            />
            <ActionRow
              label="Blocked users"
              value={`${settings.blockedUsers.length}`}
              onPress={() => router.push("/blocked-users")}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>App</Text>
            <ActionRow
              label="Messages"
              onPress={() => router.push("/chat")}
            />
            <ActionRow
              label="Language"
              value={settings.language}
              onPress={() => router.push("/language")}
            />
            <ActionRow
              label="Theme"
              value={settings.theme}
              onPress={() => router.push("/theme")}
            />
            <ActionRow label="About" onPress={() => router.push("/about")} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SettingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function ActionRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </TouchableOpacity>
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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
  scroll: { flex: 1, marginTop: 8 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2B2B33",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1E3DC",
  },
  rowLabel: { fontSize: 13, color: "#2B2B33", fontWeight: "700" },
  rowValue: { fontSize: 12, color: "#7A6D6A", fontWeight: "600" },
});
