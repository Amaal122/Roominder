import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function VisitConfirmation() {
  const params = useLocalSearchParams<{ title?: string; location?: string }>();
  const title = params.title ?? "Modern Loft in Marais";
  const location = params.location ?? "Le Marais, Paris";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconCheck}>✓</Text>
        </View>
        <Text style={styles.title}>Visit Request Sent</Text>
        <Text style={styles.subtitle}>{title}</Text>
        <Text style={styles.meta}>{location}</Text>
        <Text style={styles.note}>
          The owner will confirm a time soon. You can proceed with your application
          now or wait for the visit confirmation.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/screens/ApplicationRequest",
              params: { title, location },
            })
          }
        >
          <Text style={styles.primaryText}>Continue to Application</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/screens/OwnerChat")}
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
  note: { fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18, marginTop: 10 },
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
