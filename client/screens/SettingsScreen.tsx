import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather
              name="bell"
              size={22}
              color={Colors.light.primary}
              style={styles.settingIcon}
            />
            <ThemedText style={styles.settingLabel}>
              Push Notifications
            </ThemedText>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{
              false: theme.backgroundSecondary,
              true: Colors.light.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>
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
              size={22}
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
              size={22}
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
    padding: Spacing.lg,
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
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
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
