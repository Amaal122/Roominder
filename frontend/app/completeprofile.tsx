import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSeekerProfile } from "./contexts/SeekerProfileContext";
import { getAuthToken } from "./state/auth";

export default function CompleteProfile() {
  const router = useRouter();
  const { profile, updateProfile } = useSeekerProfile();

  const [gender, setGender] = useState(profile.gender ?? "");
  const [age, setAge] = useState(profile.age ? String(profile.age) : "");
  const [occupation, setOccupation] = useState(profile.occupation ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile.image_url ?? null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("[CompleteProfile] profile snapshot", profile);
  }, [profile]);

  const pickImage = async () => {
    setError("");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Permission required to access photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    const ageNumber = Number(age.trim());
    if (
      !gender ||
      !age.trim() ||
      Number.isNaN(ageNumber) ||
      ageNumber <= 0 ||
      !occupation.trim() ||
      !avatarUri
    ) {
      setError("Please select gender, add a photo, and fill in all fields.");
      return;
    }

    // Save data to context
    updateProfile({
      gender,
      age: ageNumber,
      occupation,
      image_url: avatarUri,
    });

    // If user is housing only, skip form and go to review profile (old logic: go to form)
    router.push("/form");
  };

  return (
    <LinearGradient
      colors={["#c8f7d8", "#d8fae6", "#e9fdf1", "#f6fef9", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#36b37e" />
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
                uri:
                  avatarUri ??
                  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' rx='100' fill='white'/><circle cx='100' cy='80' r='45' fill='%23e5e7eb'/><path d='M40 180c0-40 30-70 60-70s60 30 60 70' fill='%23e5e7eb'/></svg>",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraBadge} onPress={pickImage}>
              <Feather name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Select Gender</Text>
          <View style={styles.genderOptions}>
            {["Male", "Female", "Other"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderButton,
                  gender === option && styles.genderSelected,
                ]}
                onPress={() => setGender(option)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === option && styles.genderTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.9}
          onPress={handleContinue}
        >
          <Text style={styles.ctaText}>Confirm Profile</Text>
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
    backgroundColor: "transparent",
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(54, 179, 126, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(54, 179, 126, 0.16)",
    overflow: "hidden",
  },
  progressFill: {
    width: "66%",
    height: "100%",
    backgroundColor: "#36b37e",
  },
  stepLabel: { color: "#5c7a6a", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#0f3d2a" },
  subtitle: { color: "#4f6a5b", fontSize: 15 },
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
    shadowColor: "#36b37e",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 12,
    right: 90,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#36b37e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0f3d2a",
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#36b37e",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  genderSelected: {
    backgroundColor: "#36b37e",
  },
  genderText: {
    color: "#36b37e",
    fontWeight: "600",
  },
  genderTextSelected: {
    color: "#fff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(54, 179, 126, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: "rgba(255,255,255,0.8)",
    gap: 8,
    shadowColor: "#36b37e",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f3d2a",
  },
  errorText: { color: "#ef4444", marginTop: 8, fontWeight: "600" },
  cta: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#36b37e",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "transparent",
    elevation: 0,
  },
  ctaText: { color: "#0f3d2a", fontSize: 16, fontWeight: "700" },
});
