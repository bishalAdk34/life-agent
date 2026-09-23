import { StyleSheet, View, ViewProps } from "react-native";

import { colors, spacing } from "../theme/theme";

export function ScreenContainer({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
});
