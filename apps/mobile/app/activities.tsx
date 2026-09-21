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

import { activitiesApi } from "../src/api/activities";
import { useAuth } from "../src/state/auth";

export default function ActivitiesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesApi.recent(token as string),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      activitiesApi.create(token as string, {
        title,
        category,
        occurred_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      setTitle("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Activity title (e.g. Played chess)"
      />
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Category (e.g. relax, exercise, social)"
        autoCapitalize="none"
      />
      <Pressable
        style={styles.addButton}
        onPress={() => title.trim() && category.trim() && createMutation.mutate()}
      >
        <Text style={styles.addButtonText}>Log activity</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View>
                <Text style={styles.itemText}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {item.category} · {new Date(item.occurred_at).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.source}>{item.source}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No activities yet.</Text>}
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
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  source: { color: "#2563eb", fontSize: 12 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
