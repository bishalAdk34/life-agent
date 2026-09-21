import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { profileApi } from "../src/api/profile";
import { useAuth } from "../src/state/auth";

export default function ProfileScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(token as string),
    enabled: !!token,
  });

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (data) {
      setDisplayName(data.display_name ?? "");
      setTimezone(data.timezone);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      profileApi.update(token as string, { display_name: displayName, timezone }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Display name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
      />

      <Text style={styles.label}>Timezone</Text>
      <TextInput
        style={styles.input}
        value={timezone}
        onChangeText={setTimezone}
        placeholder="e.g. Asia/Kathmandu"
      />

      <Pressable
        style={styles.button}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Text style={styles.buttonText}>
          {mutation.isPending ? "Saving..." : "Save"}
        </Text>
      </Pressable>

      {mutation.isSuccess ? <Text style={styles.success}>Saved.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  success: { color: "#16a34a", textAlign: "center", marginTop: 8 },
});
