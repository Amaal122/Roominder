import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewProperty() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");

  const formComplete = useMemo(
    () => title && address && rent && beds && baths && size && description,
    [title, address, rent, beds, baths, size, description],
  );

  const handlePublish = () => {
    if (!formComplete) return;
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

          <Text style={styles.stepLabel}>Add New Property</Text>
          <Text style={styles.title}>Fill in the property details</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={styles.uploadCard} activeOpacity={0.9}>
              <Feather name="image" size={26} color="#7C3AED" />
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadHint}>Tap to browse your gallery</Text>
            </TouchableOpacity>

            <InputField
              label="Property Title"
              icon="home"
              placeholder="Modern studio with balcony"
              value={title}
              onChangeText={setTitle}
            />
            <InputField
              label="Location / Address"
              icon="map-pin"
              placeholder="12 rue de Rivoli, Paris"
              value={address}
              onChangeText={setAddress}
            />
            <InputField
              label="Monthly Rent (€)"
              icon="dollar-sign"
              placeholder="1200"
              value={rent}
              onChangeText={setRent}
              keyboardType="numeric"
            />

            <View style={styles.inlineRow}>
              <View style={styles.inlineThird}>
                <InputField
                  label="Beds"
                  icon="layers"
                  placeholder="2"
                  value={beds}
                  onChangeText={setBeds}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inlineThird}>
                <InputField
                  label="Baths"
                  icon="droplet"
                  placeholder="1"
                  value={baths}
                  onChangeText={setBaths}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inlineThird}>
                <InputField
                  label="m²"
                  icon="maximize-2"
                  placeholder="70"
                  value={size}
                  onChangeText={setSize}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputContainer, styles.textArea]}>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Describe your property..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.cta, !formComplete && styles.ctaDisabled]}
          activeOpacity={formComplete ? 0.9 : 1}
          onPress={handlePublish}
        >
          <Text style={styles.ctaText}>Publish Property</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

type InputFieldProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
};

const InputField = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: InputFieldProps) => {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Feather name={icon} size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

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
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  stepLabel: { color: "#6B7280", fontSize: 13, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 18, gap: 14 },
  uploadCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  uploadTitle: { fontWeight: "700", color: "#111827", fontSize: 15 },
  uploadHint: { color: "#9CA3AF", fontSize: 13 },
  inputWrapper: { gap: 8 },
  label: { color: "#4C1D95", fontSize: 13, fontWeight: "700" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#FFFFFF",
  },
  input: { flex: 1, marginLeft: 10, color: "#111827", fontSize: 15 },
  inlineRow: { flexDirection: "row", gap: 10 },
  inlineThird: { flex: 1 },
  textArea: { height: 120, alignItems: "flex-start", paddingVertical: 12 },
  textAreaInput: { height: "100%", textAlignVertical: "top" },
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
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
