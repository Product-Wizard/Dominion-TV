import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Switch, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface ProgramSchedule {
  id: string;
  title: string;
  daysOfWeek: number[];
  startHour: number;
  startMinute: number;
}

const PROGRAM_SCHEDULES: ProgramSchedule[] = [
  { id: "1", title: "Daybreak Live", daysOfWeek: [1, 2, 3, 4, 5, 6], startHour: 7, startMinute: 0 },
  { id: "2", title: "Idan Ori Odan", daysOfWeek: [1, 3, 5], startHour: 9, startMinute: 0 },
  { id: "3", title: "The Agenda", daysOfWeek: [2, 4], startHour: 9, startMinute: 0 },
  { id: "4", title: "The Big Conversation", daysOfWeek: [1, 2, 3, 4, 5], startHour: 10, startMinute: 0 },
  { id: "5", title: "Dominion Sports", daysOfWeek: [1, 2, 3, 4, 5], startHour: 11, startMinute: 15 },
  { id: "6", title: "Iroyin Lerefe", daysOfWeek: [1, 2, 3, 4, 5], startHour: 12, startMinute: 0 },
  { id: "7", title: "Dominion TV News", daysOfWeek: [1, 2, 3, 4, 5], startHour: 12, startMinute: 15 },
  { id: "8", title: "E-Plus", daysOfWeek: [1, 3, 5], startHour: 13, startMinute: 0 },
  { id: "9", title: "Lojude", daysOfWeek: [1, 2, 4], startHour: 14, startMinute: 0 },
  { id: "10", title: "Okodoro Oselu", daysOfWeek: [1], startHour: 15, startMinute: 0 },
  { id: "11", title: "Iyo Aye", daysOfWeek: [2], startHour: 15, startMinute: 30 },
  { id: "12", title: "The Policescope", daysOfWeek: [3], startHour: 18, startMinute: 0 },
  { id: "13", title: "Oke Agba", daysOfWeek: [4], startHour: 15, startMinute: 0 },
];

const STORAGE_KEY = "program_notifications";

async function scheduleReminders(program: ProgramSchedule) {
  const now = new Date();

  for (const dayOfWeek of program.daysOfWeek) {
    let reminderMinute = program.startMinute - 15;
    let reminderHour = program.startHour;
    if (reminderMinute < 0) {
      reminderMinute += 60;
      reminderHour -= 1;
    }

    const trigger: Notifications.WeeklyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: dayOfWeek === 0 ? 1 : dayOfWeek + 1,
      hour: reminderHour,
      minute: reminderMinute,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Dominion TV - Coming Up Next",
        body: `${program.title} starts in 15 minutes!`,
        sound: true,
        data: { programId: program.id },
      },
      trigger,
      identifier: `reminder-${program.id}-day-${dayOfWeek}`,
    });
  }
}

async function cancelReminders(programId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(`reminder-${programId}-`)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [enabledPrograms, setEnabledPrograms] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored: string | null) => {
      if (stored) {
        setEnabledPrograms(JSON.parse(stored));
      }
      setLoaded(true);
    });
  }, []);

  const savePreferences = useCallback(async (prefs: Record<string, boolean>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert("Notifications", "Push notifications are available when running the app on your mobile device via Expo Go.");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") return true;

    Alert.alert(
      "Notifications Disabled",
      "To receive program reminders, please enable notifications in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        ...(Platform.OS !== "web"
          ? [{
              text: "Open Settings",
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch {}
              },
            }]
          : []),
      ]
    );
    return false;
  };

  const toggleProgramNotification = async (id: string) => {
    const currentlyEnabled = enabledPrograms[id] || false;
    const program = PROGRAM_SCHEDULES.find((p) => p.id === id);
    if (!program) return;

    if (!currentlyEnabled) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      await scheduleReminders(program);
      const updated = { ...enabledPrograms, [id]: true };
      setEnabledPrograms(updated);
      await savePreferences(updated);
    } else {
      await cancelReminders(id);
      const updated = { ...enabledPrograms, [id]: false };
      setEnabledPrograms(updated);
      await savePreferences(updated);
    }
  };

  if (!loaded) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText
        style={[styles.sectionHeader, { color: theme.textSecondary }]}
      >
        PROGRAM REMINDERS
      </ThemedText>

      <ThemedText
        style={[styles.sectionSubheader, { color: theme.textSecondary }]}
      >
        Get notified 15 minutes before your favorite programs
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        {PROGRAM_SCHEDULES.map((program, index) => (
          <View key={program.id}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Feather
                  name="bell"
                  size={20}
                  color={enabledPrograms[program.id] ? Colors.light.primary : theme.textSecondary}
                  style={styles.settingIcon}
                />
                <ThemedText style={styles.settingLabel} numberOfLines={1}>
                  {program.title}
                </ThemedText>
              </View>
              <Switch
                value={enabledPrograms[program.id] || false}
                onValueChange={() => toggleProgramNotification(program.id)}
                trackColor={{
                  false: theme.backgroundSecondary,
                  true: Colors.light.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
            {index < PROGRAM_SCHEDULES.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            ) : null}
          </View>
        ))}
      </View>

      <ThemedText
        style={[styles.sectionHeader, { color: theme.textSecondary }]}
      >
        ABOUT
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.aboutRow}>
          <View style={styles.settingLeft}>
            <Feather
              name="info"
              size={20}
              color={Colors.light.primary}
              style={styles.settingIcon}
            />
            <ThemedText style={styles.settingLabel}>App Version</ThemedText>
          </View>
          <ThemedText style={[styles.versionText, { color: theme.textSecondary }]}>
            1.0.0
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.aboutRow}>
          <View style={styles.settingLeft}>
            <Feather
              name="tv"
              size={20}
              color={Colors.light.primary}
              style={styles.settingIcon}
            />
            <ThemedText style={styles.settingLabel}>Dominion TV</ThemedText>
          </View>
        </View>
      </View>

      <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
        Your Channel of Choice
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    letterSpacing: 0.5,
  },
  sectionSubheader: {
    fontSize: 12,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    flex: 1,
  },
  versionText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
