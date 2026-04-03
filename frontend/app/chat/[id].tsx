import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAuthToken } from "../state/auth";
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

const API_BASE = "http://127.0.0.1:8001";

type ChatMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
};

export default function ChatDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => params.name || "Conversation", [params.name]);
  const otherUserId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  // Fetch current user id + messages on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!otherUserId) {
          throw new Error("Invalid conversation id");
        }

        const token = await getAuthToken();
        if (!token) {
          throw new Error("Missing auth token");
        }

        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          throw new Error("Failed to load current user");
        }
        const me = (await meRes.json()) as { id: number };
        if (isMounted) {
          setCurrentUserId(me.id);
        }

        const res = await fetch(`${API_BASE}/chat/conversation/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const raw = await res.text();
          throw new Error(raw || "Failed to load conversation");
        }

        const data = (await res.json()) as ChatMessage[];
        if (isMounted) {
          setMessages(Array.isArray(data) ? data : []);
          scrollToBottom();
        }
      } catch (e) {
        console.error("Chat init error:", e);
        if (isMounted) {
          setError("Unable to load this conversation.");
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [otherUserId]);
  // Mark messages as read when messages + currentUserId are loaded
  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;

    const markAsRead = async () => {
      const token = await getAuthToken();
      if (!token) return;

      const unread = messages.filter(
        (m) => m.receiver_id === currentUserId && !m.is_read
      );
      if (unread.length === 0) return;

      await Promise.all(
        unread.map((m) =>
          fetch(`${API_BASE}/chat/messages/${m.id}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      // Update local state so UI reflects is_read = true
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver_id === currentUserId && !m.is_read
            ? { ...m, is_read: true }
            : m
        )
      );
    };

    markAsRead();
  }, [currentUserId, messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!otherUserId) return;
    const token = await getAuthToken();
    if (!token) return;

    const res = await fetch("http://127.0.0.1:8001/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiver_id: otherUserId,
        content: input.trim(),
      }),
    });

    if (res.ok) {
      const sent = (await res.json()) as ChatMessage;
      setMessages((prev) => [...prev, sent]);
      setInput("");
      scrollToBottom();
    }
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
            {loading ? (
              <Text style={{ textAlign: "center", marginTop: 24, color: "#777" }}>
                Loading...
              </Text>
            ) : error ? (
              <Text style={{ textAlign: "center", marginTop: 24, color: "#777" }}>
                {error}
              </Text>
            ) : (
              messages.map((m) => {
                const isMe = currentUserId != null && m.sender_id === currentUserId;
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
                      <Text
                        style={[
                          styles.bubbleText,
                          isMe ? styles.bubbleTextMe : null,
                        ]}
                      >
                        {m.content}
                      </Text>
                      <Text style={styles.timeText}>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
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
  bubbleTextMe: { color: "#fff" },
  timeText: {
    fontSize: 10,
    color: "#9aa0b5",
    marginTop: 4,
    alignSelf: "flex-end",
  },
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
