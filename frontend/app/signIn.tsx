import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SignIn() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const handleSignIn = () => {
    if (role === "owner") {
      router.push("/propertyowner");
      return;
    }
    router.push("/homescreen");
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
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>
          Sign in to continue your Roominder journey
        </Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <InputField
          label="Email Address"
          icon="mail"
          placeholder="you@example.com"
        />
        <InputField
          label="Password"
          icon="lock"
          placeholder="••••••••"
          secure
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleSignIn}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/register",
              params: { role: role ?? "housing" },
            })
          }
        >
          <Text style={styles.footerText}>
            Don&apos;t have an account? <Text style={styles.link}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
});
