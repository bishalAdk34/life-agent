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

import { interestsApi } from "../src/api/interests";
import { useAuth } from "../src/state/auth";

export default function InterestsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["interests"],
    queryFn: () => interestsApi.list(token as string),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () => interestsApi.create(token as string, label),
    onSuccess: () => {
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["interests"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interestsApi.remove(token as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interests"] }),
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. hiking"
        />
        <Pressable
          style={styles.addButton}
          onPress={() => label.trim() && createMutation.mutate()}
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
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.label}</Text>
              <Pressable onPress={() => deleteMutation.mutate(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No interests yet.</Text>}
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
  deleteText: { color: "#dc2626" },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
