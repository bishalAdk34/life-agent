import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { activitiesApi } from "../src/api/activities";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Input } from "../src/components/Input";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAuth } from "../src/state/auth";
import { colors, radius, spacing, typography } from "../src/theme/theme";

const CATEGORIES = ["Health", "Deep Work", "Travel", "Social"];
type Filter = "All" | "Health" | "Focus" | "Sync";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ActivitiesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filter, setFilter] = useState<Filter>("All");

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
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const activities = data ?? [];
  const today = new Date();
  const loggedToday = activities.filter((a) => isSameDay(new Date(a.occurred_at), today)).length;

  const filtered = activities.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Sync") return a.source === "suggested";
    if (filter === "Health") return a.category === "Health";
    if (filter === "Focus") return a.category === "Deep Work";
    return true;
  });

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activities</Text>
          <Text style={styles.subtitle}>{loggedToday} logged today</Text>
        </View>
        <Pressable style={styles.iconButton} disabled>
          <MaterialIcons name="settings" size={20} color={colors.inkMuted} />
        </Pressable>
      </View>

      <Card style={styles.quickCreate}>
        <Text style={styles.quickCreateTitle}>Quick Capture</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Played chess"
        />
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button
          title="Log activity"
          onPress={() => title.trim() && createMutation.mutate()}
          loading={createMutation.isPending}
        />
      </Card>

      <View style={styles.filterRow}>
        {(["All", "Health", "Focus", "Sync"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.item}>
              <View style={styles.itemIcon}>
                <MaterialIcons name="fitness-center" size={18} color={colors.accent} />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemText}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {item.category}
                  {item.duration_minutes ? ` · ${item.duration_minutes}min` : ""} ·{" "}
                  {new Date(item.occurred_at).toLocaleString()}
                </Text>
              </View>
              {item.source === "suggested" ? (
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceBadgeText}>Synced</Text>
                </View>
              ) : null}
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No activities yet.</Text>}
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCreate: { backgroundColor: colors.surface2, padding: spacing.md, gap: spacing.xs },
  quickCreateTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xxs },
  categoryChip: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryChipText: { ...typography.caption, color: colors.inkMuted },
  categoryChipTextActive: { color: colors.onPrimary, fontWeight: "600" },
  filterRow: { flexDirection: "row", gap: spacing.xxs },
  filterChip: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: colors.surface3 },
  filterChipText: { ...typography.caption, color: colors.inkMuted },
  filterChipTextActive: { color: colors.ink, fontWeight: "600" },
  list: { gap: spacing.xs },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: { flex: 1 },
  itemText: { ...typography.body, fontWeight: "600", color: colors.ink },
  itemMeta: { ...typography.caption, color: colors.inkSubtle, marginTop: 2 },
  sourceBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  sourceBadgeText: { ...typography.caption, color: colors.accent },
  empty: { textAlign: "center", color: colors.inkSubtle, marginTop: spacing.lg },
});
