import { MaterialIcons } from "@expo/vector-icons";
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
  View,
} from "react-native";

import { chatApi } from "../../src/api/chat";
import { Input } from "../../src/components/Input";
import { useAuth } from "../../src/state/auth";
import type { MessageRole } from "../../src/types";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

interface DisplayMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
        { id: `${Date.now()}-assistant`, role: "assistant", content: data.reply, createdAt: new Date() },
      ]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, role: "user", content: text, createdAt: new Date() },
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
      <View style={styles.contextStrip}>
        <MaterialIcons name="tune" size={16} color={colors.inkMuted} />
        <Text style={styles.contextText}>Thread: Life Agent</Text>
        <View style={styles.autonomousBadge}>
          <Text style={styles.autonomousBadgeText}>Autonomous Mode</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          return (
            <View style={[styles.messageBlock, isUser && styles.messageBlockUser]}>
              <View style={[styles.metaRow, isUser && styles.metaRowUser]}>
                {isUser ? (
                  <>
                    <Text style={styles.metaTime}>{formatTime(item.createdAt)}</Text>
                    <Text style={styles.metaName}>You</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.metaNameAssistant}>Life Agent</Text>
                    <Text style={styles.metaTime}>{formatTime(item.createdAt)}</Text>
                  </>
                )}
              </View>
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Say hello to your Life Agent.</Text>
        }
      />
      {sendMutation.isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : null}
      <View style={styles.inputRow}>
        <Pressable style={styles.iconButton} disabled>
          <MaterialIcons name="attach-file" size={20} color={colors.inkSubtle} />
        </Pressable>
        <View style={styles.inputWrap}>
          <Input
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Life Agent..."
            multiline
          />
          <Pressable style={styles.micButton} disabled>
            <MaterialIcons name="mic" size={18} color={colors.inkSubtle} />
          </Pressable>
        </View>
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <MaterialIcons name="arrow-upward" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  contextStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  contextText: { ...typography.caption, color: colors.inkMuted, flex: 1 },
  autonomousBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  autonomousBadgeText: { ...typography.caption, color: colors.accent },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  messageBlock: { maxWidth: "85%", alignSelf: "flex-start" },
  messageBlockUser: { alignSelf: "flex-end" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxs, marginBottom: 2 },
  metaRowUser: { justifyContent: "flex-end" },
  metaName: { ...typography.caption, color: colors.inkMuted },
  metaNameAssistant: { ...typography.caption, color: colors.accent, fontWeight: "600" },
  metaTime: { ...typography.caption, color: colors.inkSubtle },
  bubble: {
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderTopRightRadius: radius.xs,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radius.xs,
  },
  bubbleTextUser: { color: colors.onPrimary, ...typography.body },
  bubbleTextAssistant: { color: colors.ink, ...typography.body },
  empty: { textAlign: "center", color: colors.inkMuted, marginTop: spacing.lg },
  loading: { marginBottom: spacing.xs },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: { flex: 1, position: "relative", justifyContent: "center" },
  input: {
    maxHeight: 120,
    paddingRight: spacing.xl,
  },
  micButton: {
    position: "absolute",
    right: spacing.xs,
    bottom: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
