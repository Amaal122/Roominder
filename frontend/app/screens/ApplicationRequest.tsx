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

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

import { getAuthToken } from "../state/auth";

const API_BASE = "http://127.0.0.1:8001";

type DocKey = "id" | "income" | "employment" | "guarantor";

export default function ApplicationRequest() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const params = useLocalSearchParams<{
    id?: string;
    application_id?: string;
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
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return email.includes("@") && !submitting;
  }, [email, submitting]);

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
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <LinearGradient
          colors={
            isDark
              ? [Colors.dark.card, Colors.dark.card]
              : ["#F4896B", "#7ECEC4"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, isDark && styles.headerDark]}
        >
          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.backBtnDark]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, isDark && styles.backIconDark]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Application & Documents
          </Text>
        </LinearGradient>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
            Property
          </Text>
          <Text style={[styles.propertyTitle, isDark && styles.propertyTitleDark]}>
            {title}
          </Text>
          <Text
            style={[styles.propertyLocation, isDark && styles.propertyLocationDark]}
          >
            {location}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Contact
          </Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, isDark && styles.inputDark]}
            placeholderTextColor={
              isDark ? Colors.dark.mutedText : "#A0A0B5"
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Documents (Scanned)
          </Text>
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
                    style={[styles.scanFrame, isDark && styles.scanFrameDark]}
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
                        <Text
                          style={[
                            styles.scanPlaceholderTitle,
                            isDark && styles.scanPlaceholderTitleDark,
                          ]}
                        >
                          Upload
                        </Text>
                        <Text
                          style={[
                            styles.scanPlaceholderHint,
                            isDark && styles.scanPlaceholderHintDark,
                          ]}
                        >
                          3:4 scan
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.scanLabel, isDark && styles.scanLabelDark]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.helperText, isDark && styles.helperTextDark]}>
            Tap each frame to upload a scanned image.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Notes (optional)
          </Text>
          <TextInput
            placeholder="Any extra info for the owner..."
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholderTextColor={
              isDark ? Colors.dark.mutedText : "#A0A0B5"
            }
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
onPress={async () => {
  if (!canSubmit || submitting) return;

  setSubmitting(true);

  try {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert("Login required", "Please sign in first.");
      setSubmitting(false);
      return;
    }

    const baseMessage = `Contact: ${email}. Notes: ${notes}`;

    const getPropertyId = async (applicationId: number): Promise<number> => {
      const propertyId = Number(params.id);
      if (Number.isFinite(propertyId)) return propertyId;

      const sentRes = await fetch(`${API_BASE}/applications/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!sentRes.ok) {
        throw new Error(`Failed to load sent applications: ${sentRes.status}`);
      }
      const sent = (await sentRes.json()) as Array<any>;
      const existing = sent.find((a) => Number(a.id) === applicationId);
      const foundPropertyId = Number(existing?.property_id);
      if (!Number.isFinite(foundPropertyId)) {
        throw new Error("Could not resolve property id for this application.");
      }
      return foundPropertyId;
    };

    const getOrCreateApplicationId = async (): Promise<number> => {
      const fromParams = Number(params.application_id);
      if (Number.isFinite(fromParams)) return fromParams;

      const propertyId = Number(params.id);
      if (!Number.isFinite(propertyId)) {
        throw new Error("Missing property ID.");
      }

      const createRes = await fetch(`${API_BASE}/applications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: propertyId,
          message: baseMessage,
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        return Number(created.id);
      }

      const createText = await createRes.text();
      // If already applied, try to find the existing application id.
      if (createRes.status === 400) {
        const sentRes = await fetch(`${API_BASE}/applications/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sentRes.ok) {
          const sent = (await sentRes.json()) as Array<any>;
          const existing = sent.find((a) => Number(a.property_id) === propertyId);
          if (existing?.id) return Number(existing.id);
        }
      }

      throw new Error(`Failed to create application: ${createRes.status} ${createText}`);
    };

    const applicationId = await getOrCreateApplicationId();
    const propertyId = await getPropertyId(applicationId);

    const formData = new FormData();
    formData.append("application_id", String(applicationId));
    formData.append("message", baseMessage);

    const appendDoc = async (field: string, uri: string) => {
      const filename = uri.split("/").pop() || `${field}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

      if (uri.startsWith("blob:") || uri.startsWith("data:")) {
        const blobRes = await fetch(uri);
        const blob = await blobRes.blob();
        formData.append(field, blob as any, filename);
        return;
      }

      formData.append(field, { uri, name: filename, type: mimeType } as any);
    };

    if (docs.id) await appendDoc("id_doc", docs.id);
    if (docs.income) await appendDoc("income_doc", docs.income);
    if (docs.employment) await appendDoc("employment_doc", docs.employment);
    if (docs.guarantor) await appendDoc("guarantor_doc", docs.guarantor);

    const response = await fetch(`${API_BASE}/rental-applications/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const content = await response.text();
      Alert.alert("Submission failed", `${response.status}: ${content}`);
      console.warn("Application error", response.status, content);
      return;
    }

    // Fetch owner_id for chat routing on the confirmation screen.
    let ownerId: string | undefined;
    let ownerName: string | undefined;
    try {
      const propRes = await fetch(`${API_BASE}/properties/${propertyId}`);
      if (propRes.ok) {
        const prop = await propRes.json();
        if (prop?.owner_id != null) {
          ownerId = String(prop.owner_id);
        }
      }

      if (ownerId) {
        const ownerRes = await fetch(`${API_BASE}/users/${ownerId}`);
        if (ownerRes.ok) {
          const owner = await ownerRes.json();
          if (owner?.full_name) {
            ownerName = String(owner.full_name);
          }
        }
      }
    } catch {
      // Non-blocking: user can still go back home even if owner_id fetch fails.
    }

    router.replace({
      pathname: "/screens/ApplicationConfirmation",
      params: {
        title,
        location,
        owner_id: ownerId,
        owner_name: ownerName,
        id: String(propertyId),
      },
    });
  } catch (error) {
    console.error("Submission network error:", error);
    const message = error instanceof Error ? error.message : "Could not submit application at this time.";
    Alert.alert("Submission failed", message);
  } finally {
    setSubmitting(false);
  }
}}
        >
          <Text style={styles.primaryText}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const TEAL = "#7ECEC4";
const BG = "#FFF7F3";
const TEXT = "#2B2B33";
const MUTED = "#7A6D6A";
const BORDER = "#F1E3DC";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  safeAreaDark: { backgroundColor: Colors.dark.background },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  headerDark: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
  backBtnDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  backIconDark: { color: Colors.dark.text },
  headerTitleDark: { color: Colors.dark.text },
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
  cardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  cardTitleDark: { color: Colors.dark.mutedText },
  propertyTitleDark: { color: Colors.dark.text },
  propertyLocationDark: { color: Colors.dark.mutedText },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },
  sectionTitleDark: { color: Colors.dark.text },
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
  inputDark: {
    backgroundColor: Colors.dark.cardMuted,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
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
  scanFrameDark: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.cardMuted,
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
  scanPlaceholderTitleDark: { color: Colors.dark.text },
  scanPlaceholderHintDark: { color: Colors.dark.mutedText },
  scanLabel: { fontSize: 12, color: TEXT, marginTop: 8 },
  scanLabelDark: { color: Colors.dark.text },
  helperText: { fontSize: 12, color: MUTED, marginTop: 8 },
  helperTextDark: { color: Colors.dark.mutedText },
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
