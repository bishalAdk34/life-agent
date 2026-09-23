import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { routinesApi } from "../../src/api/routines";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { syncRoutineNotifications } from "../../src/notifications/routineNotifications";
import { useAuth } from "../../src/state/auth";
import type { Routine } from "../../src/types";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RoutinesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: () => routinesApi.list(token as string),
    enabled: !!token,
  });

  useEffect(() => {
    if (data) syncRoutineNotifications(data);
  }, [data]);

  const createMutation = useMutation({
    mutationFn: () =>
      routinesApi.create(token as string, {
        title,
        scheduled_time: scheduledTime,
        days_of_week: Array.from(selectedDays).sort(),
        duration_minutes: Number(durationMinutes),
      }),
    onSuccess: () => {
      setTitle("");
      setScheduledTime("");
      setDurationMinutes("");
      setSelectedDays(new Set());
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (routine: Routine) =>
      routinesApi.update(token as string, routine.id, { is_active: !routine.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routines"] }),
  });

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  const routines = data ?? [];
  const activeCount = routines.filter((r) => r.is_active).length;
  const canSubmit =
    title.trim() && scheduledTime.trim() && durationMinutes.trim() && selectedDays.size > 0;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Routines</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{activeCount} active</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Autonomous circadian &amp; productivity schedules</Text>

      <Card style={styles.quickCreate}>
        <Text style={styles.quickCreateTitle}>Quick Create</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Routine name"
        />
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Trigger Time</Text>
            <Input
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="07:00:00"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <Input
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="45"
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.dayRow}>
          {DAY_LABELS.map((label, i) => (
            <Pressable
              key={i}
              style={[styles.dayCircle, selectedDays.has(i) && styles.dayCircleActive]}
              onPress={() => toggleDay(i)}
            >
              <Text
                style={[styles.dayCircleText, selectedDays.has(i) && styles.dayCircleTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button
          title="Add routine"
          onPress={() => canSubmit && createMutation.mutate()}
          disabled={!canSubmit}
          loading={createMutation.isPending}
        />
      </Card>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Active Schedules</Text>
        <View style={styles.autonomousBadge}>
          <Text style={styles.autonomousBadgeText}>Autonomous Mode</Text>
        </View>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        scrollEnabled={!isLoading}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemText}>{item.title}</Text>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActiveMutation.mutate(item)}
                trackColor={{ true: colors.primary, false: colors.surface3 }}
                thumbColor={colors.onPrimary}
              />
            </View>
            <Text style={styles.itemMeta}>
              {item.scheduled_time.slice(0, 5)} · {item.duration_minutes}min
            </Text>
            <View style={styles.dayChipRow}>
              {item.days_of_week.map((d) => (
                <View key={d} style={styles.dayChip}>
                  <Text style={styles.dayChipText}>{DAY_FULL[d]}</Text>
                </View>
              ))}
            </View>
            {item.description ? (
              <Text style={styles.itemDescription}>{item.description}</Text>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No routines yet.</Text> : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { ...typography.cardTitle, color: colors.ink },
  subtitle: { ...typography.caption, color: colors.inkMuted, marginBottom: spacing.xs },
  countPill: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  countPillText: { ...typography.caption, color: colors.accent },
  quickCreate: { backgroundColor: colors.surface2, padding: spacing.md, gap: spacing.xs },
  quickCreateTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  fieldRow: { flexDirection: "row", gap: spacing.xs },
  field: { flex: 1, gap: spacing.xxs },
  fieldLabel: { ...typography.caption, color: colors.inkMuted },
  dayRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayCircleText: { ...typography.caption, color: colors.inkMuted, fontWeight: "600" },
  dayCircleTextActive: { color: colors.onPrimary },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  sectionTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  autonomousBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  autonomousBadgeText: { ...typography.caption, color: colors.accent },
  list: { gap: spacing.xs, paddingBottom: spacing.md },
  item: { gap: spacing.xxs },
  itemHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemText: { ...typography.body, fontWeight: "600", color: colors.ink },
  itemMeta: { ...typography.caption, color: colors.inkMuted },
  dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  dayChip: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  dayChipText: { ...typography.caption, color: colors.inkMuted },
  itemDescription: { ...typography.caption, color: colors.inkSubtle, marginTop: 2 },
  empty: { textAlign: "center", color: colors.inkMuted, marginTop: spacing.lg },
});
