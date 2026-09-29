import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { observationsApi } from "../src/api/observations";
import { Card } from "../src/components/Card";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAuth } from "../src/state/auth";
import type { ObservationKind } from "../src/types";
import { colors, radius, spacing, typography } from "../src/theme/theme";

const KIND_LABEL: Record<ObservationKind, string> = {
  explicit: "Stated",
  derived: "Inferred",
};

type Filter = "all" | "explicit" | "derived";

export default function ObservationsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["observations", filter],
    queryFn: () =>
      observationsApi.list(
        token as string,
        filter === "all" ? undefined : { kind: filter }
      ),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => observationsApi.delete(token as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["observations"] }),
  });

  const confirmDelete = (id: string, text: string) => {
    Alert.alert(
      "Delete Memory",
      `Remove "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  const observations = data ?? [];
  const explicitCount = observations.filter((o) => o.kind === "explicit").length;
  const derivedCount = observations.filter((o) => o.kind === "derived").length;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memory</Text>
          <Text style={styles.subtitle}>
            {explicitCount} stated · {derivedCount} inferred
          </Text>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="memory" size={16} color={colors.accent} />
        </View>
      </View>

      <Text style={styles.description}>
        Things the agent remembers about you. Stated facts come from your messages.
        Inferred patterns are learned from your behavior.
      </Text>

      <View style={styles.filterRow}>
        {(["all", "explicit", "derived"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === "all" ? "All" : KIND_LABEL[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={observations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.item}>
              <View style={styles.itemBody}>
                <Text style={styles.itemText}>{item.text}</Text>
                <Text style={styles.itemMeta}>
                  {KIND_LABEL[item.kind]}
                  {item.confidence != null ? ` · ${Math.round(item.confidence * 100)}% confidence` : ""}
                  {item.source ? ` · ${item.source}` : ""}
                </Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => confirmDelete(item.id, item.text)}
              >
                <MaterialIcons name="close" size={16} color={colors.inkMuted} />
              </Pressable>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No memories yet. Chat with the agent to build context.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { ...typography.cardTitle, color: colors.ink },
  subtitle: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  description: { ...typography.bodySm, color: colors.inkMuted, lineHeight: 20 },
  filterRow: { flexDirection: "row", gap: spacing.xxs },
  filterChip: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { ...typography.caption, color: colors.inkMuted },
  filterChipTextActive: { color: colors.onPrimary, fontWeight: "600" },
  list: { gap: spacing.xs },
  item: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  itemBody: { flex: 1 },
  itemText: { ...typography.body, color: colors.ink },
  itemMeta: { ...typography.caption, color: colors.inkSubtle, marginTop: 4 },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { textAlign: "center", color: colors.inkSubtle, marginTop: spacing.lg, lineHeight: 20 },
});
