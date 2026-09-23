import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Switch, Text, View } from "react-native";

import { profileApi } from "../src/api/profile";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Input } from "../src/components/Input";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useAuth } from "../src/state/auth";
import { colors, radius, spacing, typography } from "../src/theme/theme";

// These permission toggles have no backing field on the Profile model or any
// API endpoint. They're kept as local, non-persisted UI state to match the
// design's visual layout without pretending the backend enforces them.
const PERMISSIONS = [
  { key: "reschedule", label: "Calendar Re-scheduling", hint: "Let the agent move routine tasks automatically" },
  { key: "reconcile", label: "Auto-reconcile expenses", hint: "Auto-categorize small transactions" },
  { key: "biometric", label: "Biometric & health telemetry sync", hint: "Pull data from connected wearables" },
  { key: "passkey", label: "Strict passkey verification", hint: "Require hardware key for sensitive actions" },
] as const;

export default function ProfileScreen() {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(token as string),
    enabled: !!token,
  });

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    reschedule: true,
    reconcile: false,
    biometric: false,
    passkey: true,
  });

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

  async function handleExport() {
    if (!data) return;
    await Share.share({
      message: JSON.stringify(data, null, 2),
      title: "profile.json",
    });
  }

  if (isLoading) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <MaterialIcons name="account-circle" size={48} color={colors.accent} />
        </View>
        <Text style={styles.name}>{displayName || "Unnamed"}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <MaterialIcons name="verified-user" size={12} color={colors.success} />
            <Text style={styles.badgeText}>Session Active</Text>
          </View>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.label}>Display name</Text>
        <Input value={displayName} onChangeText={setDisplayName} placeholder="Your name" />

        <Text style={styles.label}>System timezone</Text>
        <Input value={timezone} onChangeText={setTimezone} placeholder="e.g. Asia/Kathmandu" />

        <Button
          title={mutation.isPending ? "Saving..." : "Save preferences"}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={styles.button}
        />
        {mutation.isSuccess ? <Text style={styles.success}>Saved.</Text> : null}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Autonomous Agent Permissions</Text>
        <Text style={styles.sectionCaption}>
          Preview only — not yet wired to the backend, changes here aren&apos;t saved.
        </Text>
        {PERMISSIONS.map((p) => (
          <View key={p.key} style={styles.permissionRow}>
            <View style={styles.permissionBody}>
              <Text style={styles.permissionLabel}>{p.label}</Text>
              <Text style={styles.permissionHint}>{p.hint}</Text>
            </View>
            <Switch
              value={permissions[p.key]}
              onValueChange={(v) => setPermissions((prev) => ({ ...prev, [p.key]: v }))}
              trackColor={{ true: colors.primary, false: colors.surface3 }}
              thumbColor={colors.onPrimary}
            />
          </View>
        ))}
      </Card>

      <Button title="Export local vault (JSON)" onPress={handleExport} variant="secondary" />
      <Button title="Log out all active agent sessions" onPress={() => logout()} variant="secondary" />

      <Text style={styles.footer}>Zero-Knowledge Enclave · Relay: Online</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  center: { alignItems: "center", justifyContent: "center" },
  headerCard: { alignItems: "center", gap: spacing.xxs, paddingVertical: spacing.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { ...typography.cardTitle, color: colors.ink },
  badgeRow: { flexDirection: "row", gap: spacing.xxs },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, color: colors.inkMuted },
  section: { backgroundColor: colors.surface2, padding: spacing.md, gap: spacing.xs },
  sectionTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  sectionCaption: { ...typography.caption, color: colors.inkSubtle },
  label: { ...typography.caption, fontWeight: "600", color: colors.inkMuted, marginTop: spacing.xs },
  button: { marginTop: spacing.sm },
  success: { color: colors.success, textAlign: "center", marginTop: spacing.xs },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  permissionBody: { flex: 1 },
  permissionLabel: { ...typography.body, color: colors.ink },
  permissionHint: { ...typography.caption, color: colors.inkSubtle, marginTop: 2 },
  footer: { textAlign: "center", color: colors.inkSubtle, ...typography.caption, marginTop: spacing.xs },
});
