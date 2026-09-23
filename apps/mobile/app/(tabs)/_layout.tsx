import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../src/state/auth";
import { colors, radius, spacing, typography } from "../../src/theme/theme";

function LogoWordmark() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <MaterialIcons name="bolt" size={18} color={colors.accent} />
      </View>
      <Text style={styles.logoText}>Life Agent</Text>
    </View>
  );
}

function ProfileButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/profile")} hitSlop={8}>
      <MaterialIcons name="account-circle" size={26} color={colors.ink} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerLeft: () => <LogoWordmark />,
        headerRight: () => <ProfileButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopColor: colors.hairlineStrong,
          height: 58,
          paddingTop: 6,
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MaterialIcons name="chat-bubble" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <MaterialIcons name="check-circle" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => <MaterialIcons name="flag" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Routines",
          tabBarIcon: ({ color }) => <MaterialIcons name="schedule" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-balance-wallet" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    ...typography.bodySm,
    fontWeight: "600",
    color: colors.ink,
  },
});
