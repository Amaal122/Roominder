import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSeekerProfile } from "./contexts/SeekerProfileContext";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { setAuthToken } from "./state/auth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function Login() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { updateProfile } = useSeekerProfile();
  const handleContinue = async () => {
    try {
      const resolvedRole = Array.isArray(role) ? role[0] : role;

      const response = await fetch("http://127.0.0.1:8001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(resolvedRole ? { role: resolvedRole } : {}),
        }),
      });

      const raw = await response.text();
      let data: any = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }

      if (!response.ok) {
        const message =
          (data && typeof data === "object" && (data.error || data.detail)) ||
          (typeof data === "string" && data) ||
          "Login failed";

        alert(String(message));
        if (data && typeof data === "object" && data.correct_role) {
          alert("You should login as: " + String(data.correct_role));
        }
        return;
      }

      const token = data?.access_token;

      if (token) {
        await setAuthToken(token);
      }

      const nextRole = (data && typeof data === "object" && data.role) || resolvedRole;

      if (nextRole === "owner") {
        router.push("/propertyowner");
        return;
      }

      // Fetch seeker profile after login
      const seekerRes = await fetch("http://127.0.0.1:8001/seeker/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (seekerRes.ok) {
        const seekerProfile = await seekerRes.json();
        updateProfile(seekerProfile);
        if (seekerProfile.looking_for === "roommate") {
          router.replace("/roomatematch");
          return;
        }
        // If house or both, go to homescreen (Roommates tab logic handled in HomeScreen)
        router.replace("/homescreen");
        return;
      } else {
        // If no profile found, fallback to homescreen
        router.replace("/homescreen");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isDark && styles.containerDark]}
    >
      <LinearGradient
        colors={["#F4896B", "#7ECEC4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welcome to Roominder</Text>
        <Text style={styles.headerSubtitle}>
          Sign in to start your Roominder journey
        </Text>
      </LinearGradient>

      <View style={[styles.formCard, isDark && styles.formCardDark]}>
        <InputField
          label="Email Address"
          icon="mail"
          placeholder="hanine.hamrouni@supcom.tn"
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Password"
          icon="lock"
          placeholder="........"
          secure
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleContinue}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/register", params: { role } })
          }
        >
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
            New here? <Text style={styles.link}>Create Account</Text>
          </Text>
        </TouchableOpacity>

        <Text style={[styles.terms, isDark && styles.termsDark]}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}

// Reusable input field for form entries.
const InputField = ({
  label,
  icon,
  placeholder,
  secure = false,
  value,
  onChangeText,
}: any) => (
  (() => {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    return (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
      <Feather
        name={icon}
        size={18}
        color={isDark ? Colors.dark.mutedText : "#999"}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder={placeholder}
        secureTextEntry={secure}
        placeholderTextColor={isDark ? Colors.dark.mutedText : "#CCC"}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  </View>
    );
  })()
);

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#FFF7F3" },
  containerDark: { backgroundColor: Colors.dark.background },
  header: { padding: 40, paddingTop: 60 },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    marginTop: 20,
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", marginTop: 5 },
  formCard: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    alignItems: "center",
  },
  formCardDark: {
    backgroundColor: Colors.dark.background,
  },
  inputWrapper: { width: "100%", marginBottom: 20 },
  label: {
    color: "#F4896B",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    marginLeft: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputContainerDark: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.card,
  },
  input: { flex: 1, marginLeft: 10, color: "#333" },
  inputDark: { color: Colors.dark.text },
  btnPrimary: {
    backgroundColor: "#7ECEC4",
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  footerText: { marginTop: 25, color: "#666" },
  footerTextDark: { color: Colors.dark.mutedText },
  link: { color: "#7ECEC4", fontWeight: "bold" },
  terms: {
    textAlign: "center",
    color: "#999",
    fontSize: 11,
    marginTop: 30,
    lineHeight: 18,
  },
  termsDark: { color: Colors.dark.mutedText },
});
