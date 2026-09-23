import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { profileApi } from "../../src/api/profile";
import { Card } from "../../src/components/Card";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useAuth } from "../../src/state/auth";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const NAV_ITEMS: {
  href: "/chat" | "/profile" | "/interests" | "/goals" | "/tasks" | "/routines" | "/activities" | "/expenses";
  label: string;
  hint: string;
  icon: MaterialIconName;
}[] = [
  { href: "/chat", label: "Chat", hint: "Talk to your agent", icon: "chat-bubble" },
  { href: "/tasks", label: "Tasks", hint: "Scheduled to-dos", icon: "check-circle" },
  { href: "/goals", label: "Goals", hint: "Long-term targets", icon: "flag" },
  { href: "/routines", label: "Routines", hint: "Recurring habits", icon: "schedule" },
  { href: "/activities", label: "Activities", hint: "Logged moments", icon: "favorite-border" },
  { href: "/expenses", label: "Expenses", hint: "Spending & budgets", icon: "account-balance-wallet" },
  { href: "/interests", label: "Interests", hint: "Things you like", icon: "star-border" },
  { href: "/profile", label: "Profile", hint: "Name & timezone", icon: "sync" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { token, logout } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(token as string),
    enabled: !!token,
  });

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}, {profile?.display_name ?? "there"}
            </Text>
            <View style={styles.statusStrip}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Agent active • Syncing background streams</Text>
            </View>
          </View>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </View>

        <View style={styles.latencyRow}>
          <Text style={styles.latencyText}>0.12s latency</Text>
        </View>

        <View style={styles.list}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <Pressable>
                <Card style={styles.row}>
                  <View style={styles.iconSwatch}>
                    <MaterialIcons name={item.icon} size={20} color={colors.accent} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowHint}>{item.hint}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.inkTertiary} />
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>

        <Card style={styles.telemetryCard}>
          <Text style={styles.telemetryTitle}>Telemetry Snapshot</Text>
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryValue}>14.2 GB</Text>
              <Text style={styles.telemetryLabel}>Memory Store</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryValue}>Peer-to-Peer</Text>
              <Text style={styles.telemetryLabel}>Sync Mode</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryValue}>99.98%</Text>
              <Text style={styles.telemetryLabel}>Uptime</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      <Text style={styles.version}>Life Agent v1.0.0</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  scroll: { gap: spacing.sm, paddingBottom: spacing.md },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { ...typography.cardTitle, color: colors.ink },
  statusStrip: { flexDirection: "row", alignItems: "center", gap: spacing.xxs, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { ...typography.caption, color: colors.inkMuted },
  activePill: {
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  activePillText: { ...typography.caption, color: colors.accent },
  latencyRow: { marginTop: -spacing.xxs },
  latencyText: { ...typography.caption, color: colors.inkSubtle },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  iconSwatch: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.ink,
  },
  rowHint: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  telemetryCard: { backgroundColor: colors.surface2, gap: spacing.xs },
  telemetryTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  telemetryRow: { flexDirection: "row", justifyContent: "space-between" },
  telemetryItem: { alignItems: "center", gap: 2 },
  telemetryValue: { ...typography.body, fontWeight: "600", color: colors.tertiary },
  telemetryLabel: { ...typography.caption, color: colors.inkMuted },
  logout: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    ...typography.body,
  },
  version: {
    textAlign: "center",
    color: colors.inkSubtle,
    ...typography.caption,
    paddingBottom: spacing.xs,
  },
});
