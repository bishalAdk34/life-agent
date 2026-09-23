import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { budgetsApi } from "../../src/api/budgets";
import { expensesApi } from "../../src/api/expenses";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useAuth } from "../../src/state/auth";
import type { Budget, BudgetPeriod, Expense } from "../../src/types";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

const CATEGORIES = ["Equipment", "Cloud Services", "Travel", "Dining"];
const PERIODS: BudgetPeriod[] = ["daily", "weekly", "monthly"];

function sumInRange(expenses: Expense[], from: Date, to: Date, category?: string) {
  return expenses
    .filter((e) => {
      const d = new Date(e.occurred_at);
      if (d < from || d >= to) return false;
      if (category && e.category !== category) return false;
      return true;
    })
    .reduce((acc, e) => acc + Number(e.amount), 0);
}

export default function ExpensesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("monthly");
  const [budgetLimit, setBudgetLimit] = useState("");

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.list(token as string),
    enabled: !!token,
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.list(token as string),
    enabled: !!token,
  });

  const createExpenseMutation = useMutation({
    mutationFn: () =>
      expensesApi.create(token as string, {
        amount: Number(amount),
        category,
        description: description.trim() || undefined,
        occurred_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const setBudgetMutation = useMutation({
    mutationFn: () =>
      budgetsApi.set(token as string, {
        category: budgetCategory.trim() || undefined,
        period: budgetPeriod,
        amount_limit: Number(budgetLimit),
      }),
    onSuccess: () => {
      setBudgetCategory("");
      setBudgetLimit("");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const expenses = expensesQuery.data ?? [];
  const budgets = budgetsQuery.data ?? [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const monthlySpent = sumInRange(expenses, monthStart, nextMonthStart);
  const prevMonthSpent = sumInRange(expenses, prevMonthStart, monthStart);
  const percentChange =
    prevMonthSpent > 0 ? ((monthlySpent - prevMonthSpent) / prevMonthSpent) * 100 : null;

  const overallBudget = budgets.find((b) => !b.category && b.period === "monthly");
  const available = overallBudget ? Number(overallBudget.amount_limit) - monthlySpent : null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(0, Math.ceil((nextMonthStart.getTime() - now.getTime()) / msPerDay));

  const categoryBudgets = budgets.filter((b): b is Budget & { category: string } => !!b.category);

  async function handleExport() {
    const header = "date,amount,currency,category,description";
    const rows = expenses.map(
      (e) =>
        `${e.occurred_at},${e.amount},${e.currency},${e.category},${(e.description ?? "").replace(/,/g, ";")}`
    );
    const csv = [header, ...rows].join("\n");
    await Share.share({ message: csv, title: "expenses.csv" });
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <View style={styles.itemBody}>
              <Text style={styles.itemText}>{item.category}</Text>
              {item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}
              <Text style={styles.itemDate}>{new Date(item.occurred_at).toLocaleString()}</Text>
            </View>
            <Text style={styles.itemAmount}>
              {item.currency} {item.amount}
            </Text>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListHeaderComponent={
          <View style={styles.forms}>
            <View style={styles.header}>
              <Text style={styles.title}>Monthly Cadence</Text>
              {overallBudget ? (
                <Text style={styles.subtitle}>
                  {overallBudget.amount_limit
                    ? `${monthlySpent.toFixed(2)} / ${Number(overallBudget.amount_limit).toFixed(2)} target`
                    : ""}
                </Text>
              ) : (
                <Text style={styles.subtitle}>{monthlySpent.toFixed(2)} spent this month</Text>
              )}
              <View style={styles.metaRow}>
                {percentChange !== null ? (
                  <Text style={[styles.trend, percentChange > 0 ? styles.trendUp : styles.trendDown]}>
                    {percentChange > 0 ? "+" : ""}
                    {percentChange.toFixed(1)}% vs last month
                  </Text>
                ) : null}
                {available !== null ? (
                  <Text style={styles.metaText}>Available: {available.toFixed(2)}</Text>
                ) : null}
                {overallBudget ? (
                  <Text style={styles.metaText}>{daysRemaining} days remaining</Text>
                ) : null}
              </View>
            </View>

            <Card style={styles.quickCreate}>
              <Text style={styles.quickCreateTitle}>Quick Log</Text>
              <Input value={amount} onChangeText={setAmount} placeholder="Amount" keyboardType="numeric" />
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
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Note (optional)"
              />
              <View style={styles.rowButtons}>
                <Button
                  title="+ Add Expense"
                  onPress={() => amount.trim() && createExpenseMutation.mutate()}
                  loading={createExpenseMutation.isPending}
                  style={styles.flex1}
                />
                <Pressable
                  style={styles.budgetToggle}
                  onPress={() => setShowBudgetForm((v) => !v)}
                >
                  <MaterialIcons name="tune" size={18} color={colors.inkMuted} />
                </Pressable>
              </View>
            </Card>

            {showBudgetForm ? (
              <Card style={styles.quickCreate}>
                <Text style={styles.quickCreateTitle}>Budget Limits</Text>
                <Input
                  value={budgetCategory}
                  onChangeText={setBudgetCategory}
                  placeholder="Category (blank = overall)"
                  autoCapitalize="none"
                />
                <View style={styles.categoryRow}>
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p}
                      style={[styles.categoryChip, budgetPeriod === p && styles.categoryChipActive]}
                      onPress={() => setBudgetPeriod(p)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          budgetPeriod === p && styles.categoryChipTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Input
                  value={budgetLimit}
                  onChangeText={setBudgetLimit}
                  placeholder="Limit amount"
                  keyboardType="numeric"
                />
                <Button
                  title="Save budget"
                  onPress={() => budgetLimit.trim() && setBudgetMutation.mutate()}
                  loading={setBudgetMutation.isPending}
                />
              </Card>
            ) : null}

            {categoryBudgets.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Allocations</Text>
                {categoryBudgets.map((b) => {
                  const spent = sumInRange(expenses, monthStart, nextMonthStart, b.category as string);
                  const limit = Number(b.amount_limit);
                  const pct = limit > 0 ? Math.min(1, spent / limit) : 0;
                  const nearLimit = limit > 0 && spent / limit >= 0.9;
                  return (
                    <Card key={b.id} style={styles.budgetRow}>
                      <View style={styles.budgetHeaderRow}>
                        <Text style={styles.itemText}>{b.category}</Text>
                        {nearLimit ? (
                          <View style={styles.nearLimitBadge}>
                            <Text style={styles.nearLimitText}>Near Limit</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${pct * 100}%`, backgroundColor: nearLimit ? colors.danger : colors.primary },
                          ]}
                        />
                      </View>
                      <Text style={styles.itemMeta}>
                        {spent.toFixed(2)} / {limit.toFixed(2)} · {b.period}
                      </Text>
                    </Card>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <Pressable style={styles.exportButton} onPress={handleExport}>
                <MaterialIcons name="ios-share" size={14} color={colors.accent} />
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </Pressable>
            </View>
            {expensesQuery.isLoading ? <ActivityIndicator /> : null}
          </View>
        }
        ListEmptyComponent={
          !expensesQuery.isLoading ? <Text style={styles.empty}>No expenses yet.</Text> : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0 },
  list: { padding: spacing.lg, gap: spacing.xs },
  forms: { gap: spacing.sm, marginBottom: spacing.xs },
  header: { gap: 2 },
  title: { ...typography.cardTitle, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkMuted },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 2 },
  trend: { ...typography.caption, fontWeight: "600" },
  trendUp: { color: colors.danger },
  trendDown: { color: colors.success },
  metaText: { ...typography.caption, color: colors.inkMuted },
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
  rowButtons: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  flex1: { flex: 1 },
  budgetToggle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { gap: spacing.xs },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { ...typography.bodySm, fontWeight: "600", color: colors.ink },
  exportButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  exportButtonText: { ...typography.caption, color: colors.accent },
  budgetRow: { gap: 6 },
  budgetHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nearLimitBadge: {
    backgroundColor: "rgba(220,38,38,0.15)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  nearLimitText: { ...typography.caption, color: colors.danger, fontWeight: "600" },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLowest,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: radius.pill },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemBody: { flex: 1 },
  itemText: { ...typography.body, fontWeight: "600", color: colors.ink },
  itemDescription: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  itemMeta: { ...typography.caption, color: colors.inkSubtle, marginTop: 2 },
  itemDate: { ...typography.caption, color: colors.inkSubtle, marginTop: 2 },
  itemAmount: { ...typography.body, fontWeight: "600", color: colors.ink },
  empty: { textAlign: "center", color: colors.inkSubtle, marginTop: spacing.lg },
});
