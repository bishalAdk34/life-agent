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

import { budgetsApi } from "../src/api/budgets";
import { expensesApi } from "../src/api/expenses";
import { useAuth } from "../src/state/auth";
import type { BudgetPeriod } from "../src/types";

export default function ExpensesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("daily");
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
        occurred_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      setAmount("");
      setCategory("");
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

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={expensesQuery.data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.itemText}>
            {item.currency} {item.amount} — {item.category}
          </Text>
          <Text style={styles.itemDate}>
            {new Date(item.occurred_at).toLocaleString()}
          </Text>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.forms}>
          <Text style={styles.sectionTitle}>Log expense</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Category (e.g. food)"
            autoCapitalize="none"
          />
          <Pressable
            style={styles.addButton}
            onPress={() =>
              amount.trim() && category.trim() && createExpenseMutation.mutate()
            }
          >
            <Text style={styles.addButtonText}>Add expense</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Set budget</Text>
          <TextInput
            style={styles.input}
            value={budgetCategory}
            onChangeText={setBudgetCategory}
            placeholder="Category (blank = overall)"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={budgetPeriod}
            onChangeText={(v) => setBudgetPeriod(v as BudgetPeriod)}
            placeholder="Period (daily/weekly/monthly)"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={budgetLimit}
            onChangeText={setBudgetLimit}
            placeholder="Limit amount"
            keyboardType="numeric"
          />
          <Pressable
            style={styles.addButton}
            onPress={() => budgetLimit.trim() && setBudgetMutation.mutate()}
          >
            <Text style={styles.addButtonText}>Save budget</Text>
          </Pressable>

          {(budgetsQuery.data ?? []).map((b) => (
            <View key={b.id} style={styles.budgetRow}>
              <Text style={styles.itemText}>
                {b.category ?? "overall"} · {b.period}
              </Text>
              <Text style={styles.itemMeta}>limit {b.amount_limit}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Recent expenses</Text>
          {expensesQuery.isLoading ? <ActivityIndicator /> : null}
        </View>
      }
      ListEmptyComponent={
        !expensesQuery.isLoading ? (
          <Text style={styles.empty}>No expenses yet.</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 8 },
  forms: { gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
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
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 16 },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  itemDate: { fontSize: 12, color: "#888" },
  budgetRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f3",
  },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
});
