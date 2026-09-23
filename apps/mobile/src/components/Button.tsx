import { ActivityIndicator, Pressable, StyleSheet, Text, PressableProps, StyleProp, ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme/theme";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: "primary" | "secondary";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, variant = "primary", loading, disabled, style, ...rest }: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.ink} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },
  textPrimary: {
    color: colors.onPrimary,
  },
  textSecondary: {
    color: colors.ink,
  },
});
