import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ApplicationConfirmation() {
  const params = useLocalSearchParams<{
    title?: string;
    location?: string;
    owner_id?: string;
    owner_name?: string;
    id?: string;
  }>();
  const title = params.title ?? "Modern Loft in Marais";
  const location = params.location ?? "Le Marais, Paris";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconCheck}>✓</Text>
        </View>
        <Text style={styles.title}>Application Done</Text>
        <Text style={styles.subtitle}>{title}</Text>
        <Text style={styles.meta}>{location}</Text>
        <Text style={styles.note}>
          Your documents were submitted successfully. The owner will review your
          application and reply soon.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => {
            const ownerId = params.owner_id;
            if (!ownerId) {
              Alert.alert(
                "Missing owner",
                "Owner information is not available for chat."
              );
              return;
            }

            router.push({
              pathname: "/chat/[id]",
              params: { id: ownerId, name: params.owner_name ?? "Owner" },
            });
          }}
        >
          <Text style={styles.primaryText}>Chat with Owner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => router.replace("/screens/HomeScreen")}
        >
          <Text style={styles.secondaryText}>Back to Home</Text>
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
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
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
  note: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 10,
  },
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
  secondaryText: { color: CORAL, fontSize: 14, fontWeight: "700" },
});
