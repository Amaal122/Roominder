import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function CompleteProfile() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");

  const handleContinue = () => {
    router.push("/sweethome");
  };

  return (
    <LinearGradient
      colors={["#6D28D9", "#9333EA", "#F472B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#4C1D95" />
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.stepLabel}>Step 3 of 5</Text>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us find your perfect match
          </Text>

          <View style={styles.avatarBox}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraBadge}>
              <Feather name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="gift" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="briefcase" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Occupation"
              placeholderTextColor="#9CA3AF"
              value={occupation}
              onChangeText={setOccupation}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.9}
          onPress={handleContinue}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  cardWrapper: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    width: "66%",
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  stepLabel: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { color: "#6B7280", fontSize: 15 },
  avatarBox: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: "#fff",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 12,
    right: 90,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
