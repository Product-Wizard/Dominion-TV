import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

interface ProgramNotification {
  id: string;
  title: string;
  enabled: boolean;
}

const PROGRAMS: ProgramNotification[] = [
  { id: "1", title: "DAYBREAK LIVE", enabled: false },
  { id: "2", title: "AGENDA", enabled: false },
  { id: "3", title: "The Big Conversation", enabled: false },
  { id: "4", title: "Dominion Sport", enabled: false },
  { id: "5", title: "NEWS at 12 noon", enabled: false },
  { id: "6", title: "E-Plus", enabled: false },
  { id: "7", title: "LOJUDE DOMINION", enabled: false },
  { id: "8", title: "IYO AYE", enabled: false },
  { id: "9", title: "The POLISCOPE", enabled: false },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [programNotifications, setProgramNotifications] = useState<ProgramNotification[]>(PROGRAMS);

  const toggleProgramNotification = (id: string) => {
    setProgramNotifications((prev) =>
      prev.map((program) =>
        program.id === id ? { ...program, enabled: !program.enabled } : program
      )
    );
  };

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
        PROGRAM NOTIFICATIONS
      </ThemedText>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        {programNotifications.map((program, index) => (
          <View key={program.id}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Feather
                  name="tv"
                  size={20}
                  color={Colors.light.primary}
                  style={styles.settingIcon}
                />
                <ThemedText style={styles.settingLabel} numberOfLines={1}>
                  {program.title}
                </ThemedText>
              </View>
              <Switch
                value={program.enabled}
                onValueChange={() => toggleProgramNotification(program.id)}
                trackColor={{
                  false: theme.backgroundSecondary,
                  true: Colors.light.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
            {index < programNotifications.length - 1 ? (
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
        Your trusted source for news and entertainment
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
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    letterSpacing: 0.5,
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
