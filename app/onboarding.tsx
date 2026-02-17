import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SafeSecureScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://votre-image-bureau.jpg" }}
        style={styles.topSection}
      >
        <LinearGradient
          colors={["rgba(142, 68, 173, 0.8)", "rgba(243, 156, 18, 0.6)"]}
          style={styles.overlay}
        >
          <View style={styles.iconBox}>
            <Feather name="shield" size={40} color="white" />
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.bottomSection}>
        <Text style={styles.title}>Safe & Secure Platform</Text>
        <Text style={styles.description}>
          Digital contracts, verified profiles, and secure communication for a
          trustworthy colocation experience.
        </Text>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.activeDot} />
        </View>

        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => router.push("/findhome")}
        >
          <View style={styles.sliderThumb}>
            <AntDesign name="right" size={20} color="#6D28D9" />
          </View>
          <Text style={styles.sliderText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  topSection: { flex: 1.2 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  iconBox: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
  },
  bottomSection: {
    flex: 1,
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 15,
  },
  description: { fontSize: 16, color: "#6B7280", lineHeight: 24 },
  pagination: {
    flexDirection: "row",
    marginVertical: 30,
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6D28D9",
  },
  sliderButton: {
    backgroundColor: "#312E81",
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },
  sliderThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 52,
  },
});
