import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

type DocKey = "id" | "income" | "employment" | "guarantor";

export default function ApplicationRequest() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
  }>();

  const title = params.title ?? "Modern Loft in Marais";
  const location = params.location ?? "Le Marais, Paris";

  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [docs, setDocs] = useState<Record<DocKey, string | null>>({
    id: null,
    income: null,
    employment: null,
    guarantor: null,
  });

  const canSubmit = useMemo(() => {
    return email.includes("@");
  }, [email]);

  const pickImage = async (key: DocKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to upload documents."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDocs((prev) => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <LinearGradient
          colors={["#F4896B", "#7ECEC4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application & Documents</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Property</Text>
          <Text style={styles.propertyTitle}>{title}</Text>
          <Text style={styles.propertyLocation}>{location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#A0A0B5"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents (Scanned)</Text>
          <View style={styles.scanGrid}>
            {[
              ["id", "Identity document"],
              ["income", "Proof of income"],
              ["employment", "Employment letter"],
              ["guarantor", "Guarantor info"],
            ].map(([key, label]) => {
              const uri = docs[key as DocKey];
              return (
                <View key={key} style={styles.scanItem}>
                  <TouchableOpacity
                    style={styles.scanFrame}
                    onPress={() => pickImage(key as DocKey)}
                    activeOpacity={0.85}
                  >
                    {uri ? (
                      <>
                        <Image source={{ uri }} style={styles.scanImage} />
                        <View style={styles.scanOverlay}>
                          <Text style={styles.scanOverlayText}>Change</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.scanPlaceholder}>
                        <Text style={styles.scanPlaceholderTitle}>Upload</Text>
                        <Text style={styles.scanPlaceholderHint}>3:4 scan</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.scanLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            Tap each frame to upload a scanned image.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput
            placeholder="Any extra info for the owner..."
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#A0A0B5"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={() =>
            router.replace({
              pathname: "/screens/ApplicationConfirmation",
              params: { title, location },
            })
          }
        >
          <Text style={styles.primaryText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CORAL = "#F4896B";
const CORAL_PASTEL = "#F9D4C2";
const TEAL = "#7ECEC4";
const BG = "#FFF7F3";
const TEXT = "#2B2B33";
const MUTED = "#7A6D6A";
const BORDER = "#F1E3DC";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  backIcon: { fontSize: 16, color: TEXT },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "white" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 12, color: MUTED, marginBottom: 6 },
  propertyTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
  propertyLocation: { fontSize: 13, color: MUTED, marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT,
    marginBottom: 10,
  },
  textArea: { height: 110, textAlignVertical: "top" },
  scanGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  scanItem: { width: 160 },
  scanFrame: {
    width: 160,
    height: 214,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "white",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  scanImage: { width: "100%", height: "100%", resizeMode: "cover" },
  scanOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scanOverlayText: { color: "white", fontSize: 12, fontWeight: "700" },
  scanPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  scanPlaceholderTitle: { fontSize: 14, fontWeight: "700", color: TEXT },
  scanPlaceholderHint: { fontSize: 12, color: MUTED },
  scanLabel: { fontSize: 12, color: TEXT, marginTop: 8 },
  helperText: { fontSize: 12, color: MUTED, marginTop: 8 },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});
