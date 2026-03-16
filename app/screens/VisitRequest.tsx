import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function VisitRequest() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
  }>();

  const title = params.title ?? "Modern Loft in Marais";
  const location = params.location ?? "Le Marais, Paris";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOption, setDateOption] = useState<"Today" | "Tomorrow" | "Weekend">(
    "Tomorrow"
  );
  const [message, setMessage] = useState("");

  const canContinue = useMemo(() => {
    return fullName.trim().length > 1 && phone.trim().length > 5;
  }, [fullName, phone]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Visit Request</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Property</Text>
          <Text style={styles.propertyTitle}>{title}</Text>
          <Text style={styles.propertyLocation}>{location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <TextInput
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholderTextColor="#A0A0B5"
          />
          <TextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            placeholderTextColor="#A0A0B5"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Time</Text>
          <View style={styles.choiceRow}>
            {(["Today", "Tomorrow", "Weekend"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.choicePill,
                  dateOption === opt && styles.choicePillActive,
                ]}
                onPress={() => setDateOption(opt)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    dateOption === opt && styles.choiceTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message (optional)</Text>
          <TextInput
            placeholder="Tell the owner about yourself..."
            value={message}
            onChangeText={setMessage}
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#A0A0B5"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canContinue && styles.btnDisabled]}
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={() =>
            router.push({
              pathname: "/screens/VisitConfirmation",
              params: { id: params.id, title, location },
            })
          }
        >
          <Text style={styles.primaryText}>Send Visit Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = "#6C63FF";
const BG = "#F8F7FF";
const TEXT = "#1A1A2E";
const MUTED = "#8B8CA8";
const BORDER = "#EEECFA";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  backIcon: { fontSize: 16, color: TEXT },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
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
  choiceRow: { flexDirection: "row", gap: 10 },
  choicePill: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  choicePillActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  choiceText: { fontSize: 13, color: MUTED, fontWeight: "600" },
  choiceTextActive: { color: "white" },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});
