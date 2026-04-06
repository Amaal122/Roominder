import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

const API_BASE = "http://127.0.0.1:8001";

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function VisitConfirmation() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const params = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    location?: string | string[];
  }>();
  const propertyId = getSingleParam(params.id);
  const title = getSingleParam(params.title) ?? "Modern Loft in Marais";
  const location = getSingleParam(params.location) ?? "Le Marais, Paris";
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("Owner");

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    let cancelled = false;

    const loadOwner = async () => {
      try {
        const propertyResponse = await fetch(`${API_BASE}/properties/${propertyId}`);
        if (!propertyResponse.ok) {
          return;
        }

        const property = (await propertyResponse.json()) as {
          owner_id?: number | null;
        };
        if (cancelled || property.owner_id == null) {
          return;
        }

        const resolvedOwnerId = String(property.owner_id);
        setOwnerId(resolvedOwnerId);

        const ownerResponse = await fetch(`${API_BASE}/users/${resolvedOwnerId}`);
        if (!ownerResponse.ok) {
          return;
        }

        const owner = (await ownerResponse.json()) as { full_name?: string | null };
        if (!cancelled && owner.full_name?.trim()) {
          setOwnerName(owner.full_name.trim());
        }
      } catch (error) {
        console.error("Failed to resolve owner for visit confirmation:", error);
      }
    };

    void loadOwner();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const handleChatWithOwner = () => {
    if (!ownerId) {
      Alert.alert(
        "Owner unavailable",
        "Could not open the owner conversation for this property.",
      );
      return;
    }

    router.push({
      pathname: "/chat/[id]",
      params: { id: ownerId, name: ownerName },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconCheck}>✓</Text>
        </View>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Visit Request Sent
        </Text>
        <Text style={[styles.subtitle, isDark && styles.titleDark]}>{title}</Text>
        <Text style={[styles.meta, isDark && styles.mutedTextDark]}>{location}</Text>
        <Text style={[styles.note, isDark && styles.mutedTextDark]}>
          The owner will confirm a time soon. You can proceed with your application
          now or wait for the visit confirmation.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/screens/ApplicationRequest",
              params: { id: propertyId, title, location },
            })
          }
        >
          <Text style={styles.primaryText}>Continue to Application</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, isDark && styles.secondaryBtnDark]}
          activeOpacity={0.85}
          onPress={handleChatWithOwner}
        >
          <Text style={styles.secondaryText}>Chat with Owner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CORAL = "#F4896B";
const TEAL = "#7ECEC4";
const BG = "#FFF7F3";
const TEXT = "#2B2B33";
const MUTED = "#7A6D6A";
const BORDER = "#F1E3DC";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  safeAreaDark: { backgroundColor: Colors.dark.background },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconCheck: { color: "white", fontSize: 26, fontWeight: "800" },
  title: { fontSize: 18, fontWeight: "700", color: TEXT },
  subtitle: { fontSize: 14, fontWeight: "600", color: TEXT, marginTop: 6 },
  meta: { fontSize: 12, color: MUTED, marginTop: 2 },
  note: { fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18, marginTop: 10 },
  titleDark: { color: Colors.dark.text },
  mutedTextDark: { color: Colors.dark.mutedText },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: CORAL,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryText: { color: "white", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: CORAL,
  },
  secondaryBtnDark: {
    backgroundColor: Colors.dark.cardMuted,
  },
  secondaryText: { color: CORAL, fontSize: 14, fontWeight: "700" },
});
