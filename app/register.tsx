import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>
          Join our community and find your perfect home
        </Text>
      </View>

      <View style={styles.formCard}>
        <InputField
          label="Full Name"
          icon="user"
          placeholder="hanine hamrouni"
        />
        <InputField
          label="Email Address"
          icon="mail"
          placeholder="hanine.hamrouni@supcom.tn"
        />
        <InputField
          label="Password"
          icon="lock"
          placeholder="........"
          secure
        />
        <InputField
          label="Confirm Password"
          icon="lock"
          placeholder="Confirm Password"
          secure
        />

        <TouchableOpacity style={styles.btnPrimary}>
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
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
const InputField = ({ label, icon, placeholder, secure = false }: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Feather name={icon} size={18} color="#999" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={secure}
        placeholderTextColor="#CCC"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#7B1FA2" },
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
    color: "#7B1FA2",
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
    backgroundColor: "#7B1FA2",
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  footerText: { marginTop: 25, color: "#666" },
  link: { color: "#7B1FA2", fontWeight: "bold" },
  terms: {
    textAlign: "center",
    color: "#999",
    fontSize: 11,
    marginTop: 30,
    lineHeight: 18,
  },
});
