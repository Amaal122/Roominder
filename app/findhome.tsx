import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RoleSelection() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#9333EA", "#7B1FA2", "#4C1D95"]} // Dégradé violet profond
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* En-tête avec Icône */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Feather name="home" size={32} color="white" />
          </View>
          <Text style={styles.mainTitle}>Roominder</Text>
          <Text style={styles.subTitle}>AI-Powered Colocation Platform</Text>
        </View>

        {/* Section des Cartes de Rôle */}
        <View style={styles.cardsContainer}>
          {/* Carte : Looking for Housing */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() =>
              router.push({
                pathname: "/register",
                params: { role: "housing" },
              })
            }
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.cardGradient}
            >
              <View style={[styles.iconBox, { backgroundColor: "#8B5CF6" }]}>
                <Feather name="home" size={24} color="white" />
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
            style={styles.roleCard}
            onPress={() =>
              router.push({ pathname: "/register", params: { role: "owner" } })
            }
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.cardGradient}
            >
              <View style={[styles.iconBox, { backgroundColor: "#F87171" }]}>
                <MaterialCommunityIcons
                  name="key-variant"
                  size={24}
                  color="white"
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
  mainTitle: { fontSize: 32, fontWeight: "bold", color: "white" },
  subTitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 5 },
  cardsContainer: { gap: 20 },
  roleCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
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
  },
  cardTextContent: { flex: 1 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  cardDesc: { fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20 },
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
  footerText: { color: "rgba(255,255,255,0.6)", marginTop: 40, fontSize: 13 },
});
