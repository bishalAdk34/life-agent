import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { goalsApi } from "../../src/api/goals";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useAuth } from "../../src/state/auth";
import type { Goal, GoalStatus } from "../../src/types";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  paused: "Paused",
  done: "Completed",
};

// Backend Goal has no quarter/category fields, so the quarter pill and
// Career/Health/Wealth dots below are shown for visual parity with the
// design but do not affect goal creation.
const CATEGORY_DOTS: { label: string; color: string }[] = [
  { label: "Career", color: colors.primary },
  { label: "Health", color: colors.success },
  { label: "Wealth", color: colors.tertiary },
];

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

  const goals = data ?? [];
  const activeCount = goals.filter((g) => g.status === "active").length;
  const doneCount = goals.filter((g) => g.status === "done").length;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>
            {activeCount} Active · {doneCount} Completed
          </Text>
        </View>
        <Pressable style={styles.filterButton} disabled>
          <MaterialIcons name="filter-list" size={20} color={colors.inkMuted} />
        </Pressable>
      </View>

      <Card style={styles.quickCreate}>
        <Text style={styles.quickCreateTitle}>Create Milestone</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Learn FastAPI"
        />
        <View style={styles.quarterPill}>
          <MaterialIcons name="event" size={14} color={colors.inkMuted} />
          <Text style={styles.quarterPillText}>Q2 2025</Text>
          <MaterialIcons name="expand-more" size={16} color={colors.inkMuted} />
        </View>
        <View style={styles.categoryRow}>
          {CATEGORY_DOTS.map((c) => (
            <View key={c.label} style={styles.categoryPill}>
              <View style={[styles.categoryDot, { backgroundColor: c.color }]} />
              <Text style={styles.categoryPillText}>{c.label}</Text>
            </View>
          ))}
        </View>
        <Button
          title="+ Add goal"
          onPress={() => title.trim() && createMutation.mutate()}
          loading={createMutation.isPending}
        />
      </Card>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.item}>
              <Pressable
                style={styles.checkbox}
                onPress={() => toggleDoneMutation.mutate(item)}
              >
                {item.status === "done" ? (
                  <MaterialIcons name="check-circle" size={22} color={colors.success} />
                ) : (
                  <MaterialIcons name="radio-button-unchecked" size={22} color={colors.inkMuted} />
                )}
              </Pressable>
              <View style={styles.itemBody}>
                <Text
                  style={[styles.itemText, item.status === "done" && styles.itemDone]}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
                <Text style={styles.itemMeta}>
                  Updated {new Date(item.updated_at).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "done" && styles.statusBadgeDone,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === "done" && styles.statusBadgeTextDone,
                  ]}
                >
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No goals yet.</Text>}
        />
      )}

      <Text style={styles.footer}>Goals sync automatically across devices.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { ...typography.cardTitle, color: colors.ink },
  subtitle: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCreate: { backgroundColor: colors.surface2, padding: spacing.md, gap: spacing.xs },
  quickCreateTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  quarterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.surfaceLowest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    alignSelf: "flex-start",
    opacity: 0.7,
  },
  quarterPillText: { ...typography.caption, color: colors.inkMuted },
  categoryRow: { flexDirection: "row", gap: spacing.xs },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceLowest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    opacity: 0.7,
  },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  categoryPillText: { ...typography.caption, color: colors.inkMuted },
  list: { gap: spacing.xs },
  item: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  checkbox: { paddingTop: 2 },
  itemBody: { flex: 1 },
  itemText: { ...typography.body, fontWeight: "600", color: colors.ink },
  itemDone: { textDecorationLine: "line-through", color: colors.inkMuted },
  itemDescription: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  itemMeta: { ...typography.caption, color: colors.inkSubtle, marginTop: 2 },
  statusBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  statusBadgeDone: { backgroundColor: "rgba(39,166,68,0.15)" },
  statusBadgeText: { ...typography.caption, color: colors.accent },
  statusBadgeTextDone: { color: colors.success },
  empty: { textAlign: "center", color: colors.inkMuted, marginTop: spacing.lg },
  footer: { textAlign: "center", color: colors.inkSubtle, ...typography.caption, marginTop: spacing.xs },
});
