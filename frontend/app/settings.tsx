import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { updateSettings, useSettings } from "./state/settings";
import { useTranslation } from "react-i18next";
import { clearAuthToken } from "./state/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export default function Settings() {
  const router = useRouter();
  const settings = useSettings();
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [disconnecting, setDisconnecting] = useState(false);

  const performDisconnect = async () => {
    try {
      setDisconnecting(true);
      await clearAuthToken();
      const target = "/findhome";

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.replace(target);
        return;
      }

      const dismissAll = (router as { dismissAll?: () => void }).dismissAll;
      dismissAll?.();
      router.replace(target);
    } catch (logoutError) {
      console.error("Failed to disconnect:", logoutError);
      Alert.alert(t("about.logout_failed_title"), t("about.logout_failed_body"));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (disconnecting) {
      return;
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const confirmed = window.confirm(t("about.logout_confirm_body"));
      if (!confirmed) {
        return;
      }
      void performDisconnect();
      return;
    }

    Alert.alert(t("about.logout_confirm_title"), t("about.logout_confirm_body"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("about.logout_action"),
        style: "destructive",
        onPress: () => {
          void performDisconnect();
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? [Colors.dark.background, Colors.dark.background, Colors.dark.background]
          : ["#F4896B", "#F7B89A", "#7ECEC4"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={() => router.back()}
          >
            <Feather
              name="arrow-left"
              size={20}
              color={isDark ? Colors.dark.text : "#2B2B33"}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
              <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                {t("settings.title")}
              </Text>
              <Text style={[styles.headerSub, isDark && styles.headerSubDark]}>
                {t("settings.subtitle")}
              </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {t("settings.notifications")}
            </Text>
            <SettingRow
              label={t("settings.push_notifications")}
              value={settings.pushEnabled}
              onChange={(value) => updateSettings({ pushEnabled: value })}
            />
            <SettingRow
              label={t("settings.email_alerts")}
              value={settings.emailEnabled}
              onChange={(value) => updateSettings({ emailEnabled: value })}
            />
            <ActionRow
              label={t("settings.currency")}
              value={settings.currency}
              onPress={() => router.push("/currency")}
            />
          </View>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {t("settings.privacy")}
            </Text>
            <ActionRow
              label={t("settings.change_password")}
              onPress={() => router.push("/change-password")}
            />
            <ActionRow
              label={t("settings.two_factor")}
              value={settings.twoFactorEnabled ? t("settings.on") : t("settings.off")}
              onPress={() => router.push("/two-factor")}
            />
            <ActionRow
              label={t("settings.blocked_users")}
              value={`${settings.blockedUsers.length}`}
              onPress={() => router.push("/blocked-users")}
            />
          </View>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {t("settings.app")}
            </Text>
            <ActionRow
              label={t("settings.messages")}
              onPress={() => router.push("/chat")}
            />
            <ActionRow
              label={t("settings.language")}
              value={settings.language}
              onPress={() => router.push("/language")}
            />
            <ActionRow
              label={t("settings.theme")}
              value={settings.theme}
              onPress={() => router.push("/theme")}
            />
            <ActionRow label={t("settings.about")} onPress={() => router.push("/about")} />
          </View>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <ActionRow
              label={t("profile.disconnect")}
              value={disconnecting ? t("about.logging_out") : undefined}
              onPress={handleDisconnect}
            />
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
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={[styles.row, isDark && styles.rowDark]}>
      <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>{label}</Text>
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
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <TouchableOpacity
      style={[styles.row, isDark && styles.rowDark]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>{value}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, padding: 16 },
  safeAreaDark: { backgroundColor: Colors.dark.background },
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
  iconBtnDark: { backgroundColor: Colors.dark.cardMuted, borderWidth: 1, borderColor: Colors.dark.border },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerTitleDark: { color: Colors.dark.text },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)" },
  headerSubDark: { color: Colors.dark.mutedText },
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
  cardDark: {
    backgroundColor: Colors.dark.card,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2B2B33",
    marginBottom: 8,
  },
  sectionTitleDark: { color: Colors.dark.text },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1E3DC",
  },
  rowDark: { borderTopColor: Colors.dark.border },
  rowLabel: { fontSize: 13, color: "#2B2B33", fontWeight: "700" },
  rowLabelDark: { color: Colors.dark.text },
  rowValue: { fontSize: 12, color: "#7A6D6A", fontWeight: "600" },
  rowValueDark: { color: Colors.dark.mutedText },
});
