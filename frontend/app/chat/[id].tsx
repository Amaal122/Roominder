import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SAMPLE_MESSAGES = [
  { id: "m1", from: "them", text: "Hi! Thanks for reaching out." },
  { id: "m2", from: "them", text: "Can we schedule a viewing tomorrow?" },
  {
    id: "m3",
    from: "me",
    text: "Hi! Yes, tomorrow works. What time suits you?",
  },
  { id: "m4", from: "them", text: "Around 5pm would be great." },
];

export default function ChatDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [input, setInput] = useState("");

  const title = useMemo(() => params.name || "Conversation", [params.name]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: `me-${Date.now()}`,
      from: "me" as const,
      text: input.trim(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <LinearGradient
      colors={["#6a36ff", "#b845ff", "#f56fa5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={styles.threadContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isMe = m.from === "me";
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubbleRow,
                    isMe ? styles.rowMe : styles.rowThem,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{m.text}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="add" size={22} color="#9aa0b5" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message"
              placeholderTextColor="#9aa0b5"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                input.trim() ? styles.sendBtnActive : null,
              ]}
              onPress={sendMessage}
              disabled={!input.trim()}
            >
              <Ionicons
                name="send"
                size={18}
                color={input.trim() ? "#fff" : "#c6c9d6"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSubtitle: { color: "#e4dafd", fontSize: 12, marginTop: 2 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  thread: { flex: 1, backgroundColor: "#f8f8fb" },
  threadContent: { paddingHorizontal: 14, paddingVertical: 16 },
  bubbleRow: { marginBottom: 10 },
  rowMe: { alignItems: "flex-end" },
  rowThem: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleMe: { backgroundColor: "#7d5dff" },
  bubbleThem: { backgroundColor: "#fff" },
  bubbleText: { color: "#1e1e2e", fontSize: 14 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eceef4",
    gap: 10,
  },
  attachBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#f0f1f6",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f5f6fb",
    color: "#1e1e2e",
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#f0f1f6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: { backgroundColor: "#7d5dff" },
});
