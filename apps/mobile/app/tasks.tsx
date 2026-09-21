import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { tasksApi } from "../src/api/tasks";
import { useAuth } from "../src/state/auth";

export default function TasksScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(token as string),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.create(token as string, { title, scheduled_for: scheduledFor }),
    onSuccess: () => {
      setTitle("");
      setScheduledFor("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.complete(token as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Task title"
      />
      <TextInput
        style={styles.input}
        value={scheduledFor}
        onChangeText={setScheduledFor}
        placeholder="Scheduled for (ISO, e.g. 2026-09-22T10:00:00Z)"
        autoCapitalize="none"
      />
      <Pressable
        style={styles.addButton}
        onPress={() => title.trim() && scheduledFor.trim() && createMutation.mutate()}
      >
        <Text style={styles.addButtonText}>Add task</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => completeMutation.mutate(item.id)}
            >
              <View>
                <Text
                  style={[
                    styles.itemText,
                    item.status === "completed" && styles.itemDone,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.itemDate}>
                  {new Date(item.scheduled_for).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.status}>{item.status}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No tasks yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 16 },
  itemDone: { textDecorationLine: "line-through", color: "#888" },
  itemDate: { fontSize: 12, color: "#888" },
  status: { color: "#2563eb", fontSize: 12 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
