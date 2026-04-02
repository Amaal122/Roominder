import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Message = { id: string; from: "owner" | "me"; text: string };

export default function OwnerChat() {
  const params = useLocalSearchParams<{ ownerName?: string }>();
  const ownerName = params.ownerName ?? "Amina Diallo";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "owner",
      text: "Hello! I received your application. When would you like to visit?",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const send = () => {
    if (!canSend) return;
    const newMsg: Message = {
      id: String(Date.now()),
      from: "me",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F4896B", "#7ECEC4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{ownerName}</Text>
          <Text style={styles.headerSub}>Owner · Typically replies in 2h</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.chat}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.from === "me" ? styles.bubbleMe : styles.bubbleOwner,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.from === "me" ? styles.bubbleTextMe : styles.bubbleTextOwner,
                ]}
              >
                {m.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#9FA2B8"
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendDisabled]}
            onPress={send}
            activeOpacity={0.85}
            disabled={!canSend}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CORAL = "#F4896B";
const CORAL_PASTEL = "#F9D4C2";
const TEAL = "#7ECEC4";
const BG = "#FFF7F3";
const TEXT = "#2B2B33";
const BORDER = "#F1E3DC";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.4)",
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: "white" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  chat: { flex: 1, padding: 16 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  bubbleOwner: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: CORAL_PASTEL,
  },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: TEAL },
  bubbleText: { fontSize: 13, lineHeight: 18 },
  bubbleTextOwner: { color: TEXT },
  bubbleTextMe: { color: "white" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT,
  },
  sendBtn: {
    backgroundColor: CORAL,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: "white", fontSize: 13, fontWeight: "700" },
});
