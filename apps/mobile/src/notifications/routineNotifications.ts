import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type { WeeklyTriggerInput } from "expo-notifications";

import type { Routine } from "../types";

const CHANNEL_ID = "routines";
const IDENTIFIER_PREFIX = "routine-";

// expo-notifications throws on import inside Expo Go as of SDK 53+ (remote
// push support was pulled out; the module itself refuses to load there).
// Load it lazily, only outside Expo Go, and no-op everywhere else so the app
// doesn't crash when running in Expo Go for local testing.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// eslint-disable-next-line @typescript-eslint/no-var-requires
type NotificationsModule = typeof import("expo-notifications");
const Notifications: NotificationsModule | null = isExpoGo
  ? null
  : (require("expo-notifications") as NotificationsModule);

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function setupNotificationChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Routines",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** project convention: 0=Mon..6=Sun -> expo-notifications: 1=Sun..7=Sat */
export function toExpoWeekday(day: number): number {
  return ((day + 1) % 7) + 1;
}

export function parseScheduledTime(scheduledTime: string): {
  hour: number;
  minute: number;
} {
  const [hour, minute] = scheduledTime.split(":").map(Number);
  return { hour, minute };
}

interface RoutineNotificationRequest {
  identifier: string;
  content: { title: string; body: string };
  trigger: WeeklyTriggerInput;
}

export function buildNotificationRequests(
  routines: Routine[]
): RoutineNotificationRequest[] {
  if (!Notifications) return [];

  return routines
    .filter((r) => r.is_active)
    .flatMap((routine) => {
      const { hour, minute } = parseScheduledTime(routine.scheduled_time);
      return routine.days_of_week.map((day) => ({
        identifier: `${IDENTIFIER_PREFIX}${routine.id}-${day}`,
        content: {
          title: routine.title,
          body: routine.description || "Time for your routine.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: CHANNEL_ID,
          weekday: toExpoWeekday(day),
          hour,
          minute,
        },
      }));
    });
}

export async function syncRoutineNotifications(
  routines: Routine[]
): Promise<void> {
  if (!Notifications) return; // no-op in Expo Go (SDK 53+ dropped support)

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await setupNotificationChannel();

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(IDENTIFIER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  const requests = buildNotificationRequests(routines);
  await Promise.all(
    requests.map((r) =>
      Notifications!.scheduleNotificationAsync({
        identifier: r.identifier,
        content: r.content,
        trigger: r.trigger,
      })
    )
  );
}
