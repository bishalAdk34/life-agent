import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError } from "../src/api/client";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { useAuth } from "../src/state/auth";
import { colors, radius, spacing, typography } from "../src/theme/theme";

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (mode === "register" && password !== confirmPassword) {
      setError("Master keys do not match");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function notAvailable() {
    Alert.alert("Not available yet");
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <MaterialIcons name="bolt" size={28} color={colors.accent} />
        </View>
        <Text style={styles.brandTitle}>Life Agent</Text>
        <Text style={styles.brandCaption}>Autonomous personal orchestration</Text>
      </View>

      <View style={styles.switcher}>
        <Pressable
          style={[styles.switchTab, mode === "login" && styles.switchTabActive]}
          onPress={() => setMode("login")}
        >
          <Text style={[styles.switchText, mode === "login" && styles.switchTextActive]}>
            Log In
          </Text>
        </Pressable>
        <Pressable
          style={[styles.switchTab, mode === "register" && styles.switchTabActive]}
          onPress={() => setMode("register")}
        >
          <Text style={[styles.switchText, mode === "register" && styles.switchTextActive]}>
            Register
          </Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Work or Personal Email</Text>
        <Input
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Master Key / Password</Text>
          <Pressable onPress={notAvailable}>
            <Text style={styles.link}>Forgot key?</Text>
          </Pressable>
        </View>
        <View>
          <Input
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.passwordInput}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
          >
            <MaterialIcons
              name={showPassword ? "visibility-off" : "visibility"}
              size={20}
              color={colors.inkMuted}
            />
          </Pressable>
        </View>
      </View>

      {mode === "register" ? (
        <View style={styles.field}>
          <Text style={styles.label}>Confirm Master Key</Text>
          <Input
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={mode === "login" ? "Continue with Life Agent  →" : "Deploy Life Agent Instance  →"}
        onPress={handleSubmit}
        disabled={submitting}
        loading={submitting}
        style={styles.submitButton}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.altRow}>
        <Pressable style={styles.altButton} onPress={notAvailable}>
          <MaterialIcons name="fingerprint" size={20} color={colors.ink} />
          <Text style={styles.altText}>Passkey</Text>
        </Pressable>
        <Pressable style={styles.altButton} onPress={notAvailable}>
          <MaterialIcons name="vpn-key" size={20} color={colors.ink} />
          <Text style={styles.altText}>Hardware Key</Text>
        </Pressable>
      </View>

      <Text style={styles.legal}>
        By continuing you agree to autonomous orchestration of your schedule, tasks, and data.
      </Text>

      <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
        <Text style={styles.switchModeText}>
          {mode === "login"
            ? "Need a Life Agent instance? Register"
            : "Already deployed? Log in"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  brand: {
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.xxs,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  brandTitle: { ...typography.headline, color: colors.ink },
  brandCaption: { ...typography.caption, color: colors.inkMuted },
  switcher: {
    flexDirection: "row",
    backgroundColor: colors.surfaceLowest,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xs,
  },
  switchTab: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  switchTabActive: { backgroundColor: colors.surface3 },
  switchText: { ...typography.button, color: colors.inkMuted },
  switchTextActive: { color: colors.ink },
  field: { gap: spacing.xxs },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: {
    ...typography.caption,
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  link: { ...typography.caption, color: colors.accent },
  passwordInput: { paddingRight: spacing.xl },
  eyeButton: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  error: { color: colors.danger, textAlign: "center", ...typography.bodySm },
  submitButton: { marginTop: spacing.xs },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairlineStrong },
  dividerText: { ...typography.caption, color: colors.inkMuted },
  altRow: { flexDirection: "row", gap: spacing.xs },
  altButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  altText: { ...typography.bodySm, color: colors.ink },
  legal: {
    ...typography.caption,
    color: colors.inkSubtle,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  switchModeText: {
    textAlign: "center",
    color: colors.primary,
    marginTop: spacing.xs,
    ...typography.bodySm,
  },
});
