import { Link, Redirect } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../src/state/auth";

export default function Home() {
  const { token, isLoading, logout } = useAuth();

  if (isLoading) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Life Agent</Text>

      <Link href="/chat" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Chat</Text>
        </Pressable>
      </Link>
      <Link href="/profile" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Profile</Text>
        </Pressable>
      </Link>
      <Link href="/interests" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Interests</Text>
        </Pressable>
      </Link>
      <Link href="/goals" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Goals</Text>
        </Pressable>
      </Link>
      <Link href="/tasks" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Tasks</Text>
        </Pressable>
      </Link>
      <Link href="/routines" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Routines</Text>
        </Pressable>
      </Link>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  link: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    width: "100%",
    alignItems: "center",
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  logout: {
    marginTop: 24,
  },
  logoutText: {
    color: "#dc2626",
  },
});
