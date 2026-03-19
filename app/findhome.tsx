import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelection() {
  const router = useRouter();
  const housingScale = React.useRef(new Animated.Value(1)).current;
  const ownerScale = React.useRef(new Animated.Value(1)).current;

  const animatePress = (anim: Animated.Value, toValue: number) => {
    Animated.timing(anim, {
      toValue,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* En-tête avec Icône */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Feather name="home" size={32} color="#fcbf77" />
          </View>
          <Text style={styles.mainTitle}>Roominder</Text>
          <Text style={styles.subTitle}>AI-Powered Colocation Platform</Text>
        </View>

        {/* Section des Cartes de Rôle */}
        <View style={styles.cardsContainer}>
          {/* Carte : Looking for Housing */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.roleCard, { transform: [{ scale: housingScale }] }]}
            onPressIn={() => animatePress(housingScale, 0.95)}
            onPressOut={() => animatePress(housingScale, 1)}
            onPress={() =>
              router.push({
                pathname: "/signIn",
                params: { role: "housing" },
              })
            }
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.cardGradient}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(255,255,255,0.12)" },
                ]}
              >
                <Feather name="home" size={24} color="#fcbf77" />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Looking for Housing</Text>
                <Text style={styles.cardDesc}>
                  Search for housing 🏠, find compatible roommates 👥, or both
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Carte : Property Owner */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.roleCard, { transform: [{ scale: ownerScale }] }]}
            onPressIn={() => animatePress(ownerScale, 0.95)}
            onPressOut={() => animatePress(ownerScale, 1)}
            onPress={() =>
              router.push({ pathname: "/signIn", params: { role: "owner" } })
            }
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.cardGradient}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(255,255,255,0.12)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="key-variant"
                  size={24}
                  color="#fcbf77"
                />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Property Owner</Text>
                <Text style={styles.cardDesc}>
                  List properties 🔑, manage tenants, and track occupancy
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer avec Slider de progression (Visuel) */}
        <View style={styles.footer}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressCircle} />
            <Text style={styles.footerText}>Select your role to continue</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 25 },
  header: { alignItems: "center", marginTop: 60, marginBottom: 50 },
  logoBadge: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  mainTitle: { fontSize: 32, fontWeight: "bold", color: "#0f3d2a" },
  subTitle: { fontSize: 16, color: "#2f5a48", marginTop: 5 },
  cardsContainer: { gap: 20 },
  roleCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.7)",
    shadowColor: "#36b37e",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardGradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTextContent: { flex: 1 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f3d2a",
    marginBottom: 5,
  },
  cardDesc: { fontSize: 14, color: "#2f5a48", lineHeight: 20 },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 25,
    right: 25,
    alignItems: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    justifyContent: "center",
  },
  progressCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    position: "absolute",
    left: 0,
  },
  footerText: { color: "#2f5a48", marginTop: 40, fontSize: 13 },
});
