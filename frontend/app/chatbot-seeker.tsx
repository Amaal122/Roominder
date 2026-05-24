import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import {
    ActivityIndicator,
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
import { getAuthToken } from "./state/auth";

const API_URL = "http://127.0.0.1:8001";

type Message = {
    role: "user" | "assistant";
    content: string;
    links?: ChatLink[];
};

type ChatLink = {
    label: string;
    route: string;
    params?: Record<string, string>;
};

export default function ChatbotSeeker() {
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Bonjour ! Je suis SeekerBot 🏠 Comment puis-je vous aider à trouver un logement ?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/chatbot/seeker/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: input,
                    history: messages.slice(-10),
                }),
            });

            const data = await response.json();
            const botMessage: Message = {
                role: "assistant",
                content: data.response,
                links: Array.isArray(data.links) ? data.links : [],
            };
            setMessages([...newMessages, botMessage]);
        } catch (error) {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Désolé, je rencontre un problème technique. Réessayez !",
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <LinearGradient
            colors={["#c8f7d8", "#d8fae6", "#f6fef9", "#ffffff"]}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backBtn}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>🏠 SeekerBot</Text>
                        <Text style={styles.headerSub}>Assistant Locataire</Text>
                    </View>
                    <View style={styles.onlineDot} />
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({ animated: true })
                    }
                >
                    {messages.map((msg, index) => (
                        <View
                            key={index}
                            style={[
                                styles.messageBubble,
                                msg.role === "user" ? styles.userBubble : styles.botBubble,
                            ]}
                        >
                            {msg.role === "assistant" && (
                                <Text style={styles.botEmoji}>🤖</Text>
                            )}
                            <View
                                style={[
                                    styles.bubbleContent,
                                    msg.role === "user"
                                        ? styles.userBubbleContent
                                        : styles.botBubbleContent,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        msg.role === "user"
                                            ? styles.userText
                                            : styles.botText,
                                    ]}
                                >
                                    {msg.content}
                                </Text>
                                {msg.role === "assistant" && msg.links && msg.links.length > 0 && (
                                    <View style={styles.linkRow}>
                                        {msg.links.map((link, linkIndex) => (
                                            <TouchableOpacity
                                                key={`${link.route}-${linkIndex}`}
                                                style={styles.linkButton}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: link.route as any,
                                                        params: link.params ?? {},
                                                    })
                                                }
                                            >
                                                <Text style={styles.linkButtonText}>{link.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}

                    {loading && (
                        <View style={[styles.messageBubble, styles.botBubble]}>
                            <Text style={styles.botEmoji}>🤖</Text>
                            <View style={styles.botBubbleContent}>
                                <ActivityIndicator size="small" color="#36b37e" />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Écrivez votre message..."
                            placeholderTextColor="#999"
                            multiline
                            onSubmitEditing={sendMessage}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                            onPress={sendMessage}
                            disabled={!input.trim() || loading}
                        >
                            <Text style={styles.sendIcon}>➤</Text>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "rgba(255,255,255,0.8)",
        borderBottomWidth: 1,
        borderBottomColor: "#e0f5ea",
    },
    backBtn: { fontSize: 22, color: "#0f3d2a", marginRight: 12 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f3d2a" },
    headerSub: { fontSize: 12, color: "#36b37e" },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#36b37e",
    },
    messagesContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    messageBubble: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
    },
    userBubble: { justifyContent: "flex-end" },
    botBubble: { justifyContent: "flex-start" },
    botEmoji: { fontSize: 20, marginRight: 6, marginBottom: 4 },
    bubbleContent: {
        maxWidth: "75%",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    userBubbleContent: {
        backgroundColor: "#36b37e",
        borderBottomRightRadius: 4,
    },
    botBubbleContent: {
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: "#fff" },
    botText: { color: "#1e1f2b" },
    linkRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
    },
    linkButton: {
        backgroundColor: "#e8f8f1",
        borderWidth: 1,
        borderColor: "#bfead8",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    linkButtonText: {
        color: "#1f8f63",
        fontSize: 13,
        fontWeight: "700",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0f5ea",
    },
    input: {
        flex: 1,
        backgroundColor: "#f4faf7",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: "#1e1f2b",
        maxHeight: 100,
        borderWidth: 1,
        borderColor: "#d0efe0",
    },
    sendBtn: {
        marginLeft: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#36b37e",
        justifyContent: "center",
        alignItems: "center",
    },
    sendBtnDisabled: { backgroundColor: "#b2dfcd" },
    sendIcon: { color: "#fff", fontSize: 18 },
});
