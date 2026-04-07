import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { getAuthToken } from "./state/auth";
import { updateSettings, useSettings } from "./state/settings";

const API_BASE_URL = "http://127.0.0.1:8001";

async function authedFetch(path: string, init?: RequestInit) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers: Record<string, string> = {
    ...(init?.headers ? (init.headers as any) : {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
}

export default function TwoFactor() {
  const router = useRouter();
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"idle" | "setup" | "disable">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [disableToken, setDisableToken] = useState("");

  const isEnabled = settings.twoFactorEnabled;
  const showSetup = mode === "setup" && !isEnabled;
  const showDisable = mode === "disable" && isEnabled;

  const switchValue = useMemo(() => {
    // While setting up, keep the switch off until verification succeeds.
    if (mode === "setup") return false;
    // While disabling, keep it on until confirmed.
    if (mode === "disable") return true;
    return isEnabled;
  }, [isEnabled, mode]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          return;
        }
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const me = await res.json();
        if (cancelled) return;
        updateSettings({ twoFactorEnabled: !!me?.two_factor_enabled });
      } catch {
        // Ignore: screen still works, user can retry.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await authedFetch("/2fa/setup", { method: "POST" });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "2FA setup failed");
      }
      setQrCode(String(data?.qr_code || ""));
      setSecret(String(data?.secret || ""));
      setSetupToken("");
      setMode("setup");
    } catch (e: any) {
      alert(String(e?.message || "2FA setup failed"));
    } finally {
      setBusy(false);
    }
  };

  const verifySetup = async () => {
    const token = setupToken.trim();
    if (!token) {
      alert("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    try {
      const res = await authedFetch("/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Invalid code");
      }

      updateSettings({ twoFactorEnabled: true });
      setMode("idle");
      setQrCode(null);
      setSecret(null);
      setSetupToken("");
      alert("Two‑Factor Authentication enabled.");
    } catch (e: any) {
      alert(String(e?.message || "Verification failed"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    const token = disableToken.trim();
    if (!token) {
      alert("Enter the 6-digit code to disable 2FA.");
      return;
    }

    setBusy(true);
    try {
      const res = await authedFetch("/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Disable failed");
      }

      updateSettings({ twoFactorEnabled: false });
      setMode("idle");
      setDisableToken("");
      alert("Two‑Factor Authentication disabled.");
    } catch (e: any) {
      alert(String(e?.message || "Disable failed"));
    } finally {
      setBusy(false);
    }
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
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#2B2B33" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Two‑Factor Authentication</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Enable 2FA</Text>
            <Switch
              value={switchValue}
              disabled={busy}
              onValueChange={(value) => {
                if (value) {
                  startSetup();
                  return;
                }

                // Disable flow is confirmed with a code.
                if (isEnabled) {
                  setMode("disable");
                }
              }}
            />
          </View>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator />
              <Text style={styles.busyText}>Working…</Text>
            </View>
          ) : null}
          <Text style={styles.helper}>
            When enabled, you’ll confirm sign‑ins with a one‑time code from your
            authenticator app.
          </Text>

          {showSetup ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1) Scan this QR code</Text>
              {qrCode ? (
                <Image source={{ uri: qrCode }} style={styles.qr} />
              ) : null}
              {secret ? (
                <Text style={styles.secret}>Secret: {secret}</Text>
              ) : null}

              <Text style={styles.sectionTitle}>2) Enter the 6‑digit code</Text>
              <TextInput
                value={setupToken}
                onChangeText={setSetupToken}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <TouchableOpacity style={styles.btn} onPress={verifySetup} disabled={busy}>
                <Text style={styles.btnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showDisable ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disable 2FA</Text>
              <TextInput
                value={disableToken}
                onChangeText={setDisableToken}
                placeholder="Enter code to disable"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <TouchableOpacity style={styles.btn} onPress={confirmDisable} disabled={busy}>
                <Text style={styles.btnText}>Disable</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 14, fontWeight: "800", color: "#2B2B33" },
  helper: { fontSize: 12, color: "#7A6D6A", marginTop: 8, lineHeight: 18 },
  busyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  busyText: { fontSize: 12, color: "#7A6D6A" },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#2B2B33", marginBottom: 8 },
  qr: { width: 180, height: 180, alignSelf: "center", marginBottom: 10 },
  secret: { fontSize: 12, color: "#2B2B33", marginBottom: 10 },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#2B2B33",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
