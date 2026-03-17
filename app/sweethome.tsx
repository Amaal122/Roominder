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

export default function SweetHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
        }}
        style={styles.topSection}
      >
        <LinearGradient
          colors={["rgba(244, 137, 107, 0.9)", "rgba(126, 206, 196, 0.8)"]}
          style={styles.overlay}
        >
          <View style={styles.iconBox}>
            <Feather name="users" size={38} color="white" />
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.bottomSection}>
        <Text style={styles.title}>Match Compatible Roommates</Text>
        <Text style={styles.description}>
          Connect with like-minded people who share your values, habits, and
          lifestyle for harmonious living.
        </Text>

        <View style={styles.pagination}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.replace("/onboarding")}
        >
          <Text style={styles.nextText}>Next</Text>
          <AntDesign name="right" size={18} color="white" />
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
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
  },
  bottomSection: { flex: 1, padding: 30, backgroundColor: "#FFF7F3" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2B2B33",
    marginBottom: 12,
  },
  description: { fontSize: 16, color: "#7A6D6A", lineHeight: 24 },
  pagination: {
    flexDirection: "row",
    marginVertical: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F9D4C2",
  },
  activeDot: {
    width: 24,
    borderRadius: 6,
    backgroundColor: "#7ECEC4",
  },
  nextButton: {
    backgroundColor: "#F4896B",
    height: 58,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
