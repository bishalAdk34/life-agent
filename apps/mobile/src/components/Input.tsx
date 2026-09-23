import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { colors, radius, spacing, typography } from "../theme/theme";

export function Input(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={colors.inkSubtle}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        styles.input,
        focused && styles.inputFocused,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceLowest,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...typography.body,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
});
