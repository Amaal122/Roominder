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

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type Message = { id: string; from: "owner" | "me"; text: string };

export default function OwnerChat() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

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
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
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
          <Text style={[styles.backIcon, isDark && styles.backIconDark]}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {ownerName}
          </Text>
          <Text style={[styles.headerSub, isDark && styles.headerSubDark]}>
            Owner · Typically replies in 2h
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={[styles.chat, isDark && styles.chatDark]}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.from === "me" ? styles.bubbleMe : styles.bubbleOwner,
                isDark && m.from === "owner" && styles.bubbleOwnerDark,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.from === "me" ? styles.bubbleTextMe : styles.bubbleTextOwner,
                  isDark && m.from === "owner" && styles.bubbleTextOwnerDark,
                ]}
              >
                {m.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, isDark && styles.inputBarDark]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={
              isDark ? Colors.dark.mutedText : "#9FA2B8"
            }
            style={[styles.input, isDark && styles.inputDark]}
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
  safeAreaDark: { backgroundColor: Colors.dark.background },
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
  headerDark: { borderBottomColor: Colors.dark.border },
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
  backBtnDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  backIconDark: { color: Colors.dark.text },
  headerTitleDark: { color: Colors.dark.text },
  headerSubDark: { color: Colors.dark.mutedText },
  chat: { flex: 1, padding: 16 },
  chatDark: { backgroundColor: Colors.dark.background },
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
  bubbleOwnerDark: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
  },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: TEAL },
  bubbleText: { fontSize: 13, lineHeight: 18 },
  bubbleTextOwner: { color: TEXT },
  bubbleTextMe: { color: "white" },
  bubbleTextOwnerDark: { color: Colors.dark.text },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "white",
  },
  inputBarDark: {
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.card,
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
  inputDark: {
    backgroundColor: Colors.dark.cardMuted,
    color: Colors.dark.text,
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
