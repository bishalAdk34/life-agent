import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { tasksApi } from "../../src/api/tasks";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useAuth } from "../../src/state/auth";
import type { TaskStatus } from "../../src/types";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Scheduled",
  completed: "Done",
  skipped: "Skipped",
  rescheduled: "Rescheduled",
};

type Filter = "all" | "today" | "completed";

function roundedDefaultSchedule() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (d.getMinutes() === 0) d.setHours(d.getHours() + 1);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function TasksScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Backend Task has no priority field, so the "High Priority" chip is
  // shown for visual parity with the design but does not filter anything.
  const defaultSchedule = useMemo(() => roundedDefaultSchedule(), []);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(token as string),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.create(token as string, {
        title,
        scheduled_for: defaultSchedule.toISOString(),
      }),
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.complete(token as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasks = data ?? [];
  const activeCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const filtered = tasks.filter((t) => {
    if (filter === "completed") return t.status === "completed";
    if (filter === "today") return isSameDay(new Date(t.scheduled_for), new Date());
    return true;
  });

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>
            {activeCount} active • {completedCount} completed
          </Text>
        </View>
        <View style={styles.syncPill}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>Sync Active</Text>
        </View>
      </View>

      <Card style={styles.quickCreate}>
        <Text style={styles.quickCreateTitle}>Quick Create</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
        />
        <View style={styles.quickCreateRow}>
          <View style={styles.schedulePill}>
            <MaterialIcons name="event" size={14} color={colors.inkMuted} />
            <Text style={styles.schedulePillText}>
              {defaultSchedule.toLocaleString([], {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.priorityPill}>
            <Text style={styles.priorityPillText}>Normal</Text>
          </View>
        </View>
        <Button
          title="+ Add task"
          onPress={() => title.trim() && createMutation.mutate()}
          loading={createMutation.isPending}
          style={styles.addButton}
        />
      </Card>

      <View style={styles.filterRow}>
        {(["all", "today", "completed"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === "all" ? "All" : f === "today" ? "Today" : "Completed"}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.chip} onPress={() => {}}>
          <Text style={styles.chipText}>High Priority</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isPending = item.status === "pending";
            const isCompleted = item.status === "completed";
            return (
              <Card style={styles.item}>
                <Pressable
                  style={[styles.checkbox, isCompleted && styles.checkboxDone]}
                  disabled={!isPending}
                  onPress={() => isPending && completeMutation.mutate(item.id)}
                >
                  {isCompleted ? (
                    <MaterialIcons name="check" size={14} color={colors.onPrimary} />
                  ) : null}
                </Pressable>
                <View style={styles.itemBody}>
                  <Text style={[styles.itemText, isCompleted && styles.itemDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {isCompleted && item.completed_at
                      ? `Completed ${new Date(item.completed_at).toLocaleString()}`
                      : new Date(item.scheduled_for).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No tasks yet.</Text>}
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
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  syncText: { ...typography.caption, color: colors.inkMuted },
  quickCreate: { backgroundColor: colors.surface2, padding: spacing.md, gap: spacing.xs },
  quickCreateTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  quickCreateRow: { flexDirection: "row", gap: spacing.xs },
  schedulePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.surfaceLowest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  schedulePillText: { ...typography.caption, color: colors.inkMuted },
  priorityPill: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    opacity: 0.6,
  },
  priorityPillText: { ...typography.caption, color: colors.inkMuted },
  addButton: { marginTop: spacing.xxs },
  filterRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.inkMuted },
  chipTextActive: { color: colors.onPrimary },
  list: { gap: spacing.xs },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.hairlineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  itemBody: { flex: 1 },
  itemText: { ...typography.body, color: colors.ink },
  itemDone: { textDecorationLine: "line-through", color: colors.inkMuted },
  itemMeta: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  statusBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  statusBadgeText: { ...typography.caption, color: colors.accent },
  empty: { textAlign: "center", color: colors.inkMuted, marginTop: spacing.lg },
});
