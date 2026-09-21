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

import { goalsApi } from "../src/api/goals";
import { useAuth } from "../src/state/auth";
import type { Goal } from "../src/types";

export default function GoalsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.list(token as string),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () => goalsApi.create(token as string, { title }),
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const toggleDoneMutation = useMutation({
    mutationFn: (goal: Goal) =>
      goalsApi.update(token as string, goal.id, {
        status: goal.status === "done" ? "active" : "done",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Learn FastAPI"
        />
        <Pressable
          style={styles.addButton}
          onPress={() => title.trim() && createMutation.mutate()}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => toggleDoneMutation.mutate(item)}
            >
              <Text
                style={[
                  styles.itemText,
                  item.status === "done" && styles.itemDone,
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.status}>{item.status}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No goals yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
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
  status: { color: "#2563eb", fontSize: 12 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
