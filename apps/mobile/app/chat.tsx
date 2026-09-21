import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { chatApi } from "../src/api/chat";
import { useAuth } from "../src/state/auth";
import type { MessageRole } from "../src/types";

interface DisplayMessage {
  id: string;
  role: MessageRole;
  content: string;
}

export default function ChatScreen() {
  const { token } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      chatApi.sendMessage(token as string, message, conversationId),
    onSuccess: (data) => {
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: "assistant", content: data.reply },
      ]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, role: "user", content: text },
    ]);
    setInput("");
    sendMutation.mutate(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            <Text
              style={
                item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant
              }
            >
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Say hello to your Life Agent.</Text>
        }
      />
      {sendMutation.isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message Life Agent..."
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
  },
  bubbleUser: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-end",
  },
  bubbleAssistant: {
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAssistant: { color: "#111" },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
  loading: { marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
