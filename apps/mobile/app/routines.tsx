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

import { routinesApi } from "../src/api/routines";
import { useAuth } from "../src/state/auth";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RoutinesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: () => routinesApi.list(token as string),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      routinesApi.create(token as string, {
        title,
        scheduled_time: scheduledTime,
        days_of_week: daysOfWeek
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number),
        duration_minutes: Number(durationMinutes),
      }),
    onSuccess: () => {
      setTitle("");
      setScheduledTime("");
      setDaysOfWeek("");
      setDurationMinutes("");
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const canSubmit =
    title.trim() && scheduledTime.trim() && daysOfWeek.trim() && durationMinutes.trim();

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Routine title (e.g. Gym)"
      />
      <TextInput
        style={styles.input}
        value={scheduledTime}
        onChangeText={setScheduledTime}
        placeholder="Time (HH:MM:SS, e.g. 07:00:00)"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={daysOfWeek}
        onChangeText={setDaysOfWeek}
        placeholder="Days (0=Mon..6=Sun, e.g. 0,2,4)"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        placeholder="Duration minutes"
        keyboardType="numeric"
      />
      <Pressable
        style={styles.addButton}
        onPress={() => canSubmit && createMutation.mutate()}
      >
        <Text style={styles.addButtonText}>Add routine</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                {item.scheduled_time.slice(0, 5)} ·{" "}
                {item.days_of_week.map((d) => DAY_LABELS[d]).join(", ")} ·{" "}
                {item.duration_minutes}min
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No routines yet.</Text>}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 16 },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
