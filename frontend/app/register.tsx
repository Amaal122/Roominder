import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // useLocalSearchParams can return string | string[]; normalise and default to known role
  const rawRole = params.role;
  const role = Array.isArray(rawRole) ? rawRole[0] : (rawRole ?? "seeker");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleContinue = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8001/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          role, // 👈 from RoleSelection
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || data.error || "Registration failed");
        return;
      }

      alert("Account created successfully 🎉");

      // redirect after register
      if (role === "owner") {
        router.push("/propertyowner");
      } else {
        router.push("/lookingfor");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient
        colors={["#F4896B", "#7ECEC4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>
          Join our community and find your perfect home
        </Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <InputField
          label="Full Name"
          icon="user"
          placeholder="user name "
          value={name}
          onChangeText={setName}
        />
        <InputField
          label="Email Address"
          icon="mail"
          placeholder="user.email@supcom.tn"
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Password"
          icon="lock"
          placeholder="........"
          value={password}
          onChangeText={setPassword}
        />
        <InputField
          label="Confirm Password"
          icon="lock"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleContinue}>
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push({ pathname: "/login", params: { role } })}
        >
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
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
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Feather name={icon} size={18} color="#999" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={secure}
        placeholderTextColor="#CCC"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#FFF7F3" },
  header: { padding: 40, paddingTop: 60 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
  },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", marginTop: 5 },
  formCard: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    alignItems: "center",
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
  input: { flex: 1, marginLeft: 10, color: "#333" },
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
  link: { color: "#7ECEC4", fontWeight: "bold" },
  terms: {
    textAlign: "center",
    color: "#999",
    fontSize: 11,
    marginTop: 30,
    lineHeight: 18,
  },
});
