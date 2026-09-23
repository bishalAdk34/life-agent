import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { interestsApi } from "../src/api/interests";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Input } from "../src/components/Input";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAuth } from "../src/state/auth";
import { colors, spacing, typography } from "../src/theme/theme";

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
    <ScreenContainer style={styles.container}>
      <View style={styles.row}>
        <Input
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. hiking"
        />
        <Button
          title="Add"
          onPress={() => label.trim() && createMutation.mutate()}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.item}>
              <Text style={styles.itemText}>{item.label}</Text>
              <Pressable onPress={() => deleteMutation.mutate(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No interests yet.</Text>}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.xs },
  input: { flex: 1 },
  list: { gap: spacing.xs },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: { ...typography.body, color: colors.ink },
  deleteText: { color: colors.danger },
  empty: { textAlign: "center", color: colors.inkSubtle, marginTop: spacing.lg },
});
