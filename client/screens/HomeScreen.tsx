import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

interface Program {
  id: string;
  title: string;
  host: string;
  startTime: string;
  endTime: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

const SCHEDULE: Program[] = [
  {
    id: "1",
    title: "DAYBREAK LIVE",
    host: "Morning Team",
    startTime: "07:00",
    endTime: "08:50",
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 50,
  },
  {
    id: "2",
    title: "AGENDA",
    host: "News Desk",
    startTime: "09:00",
    endTime: "09:50",
    startHour: 9,
    startMinute: 0,
    endHour: 9,
    endMinute: 50,
  },
  {
    id: "3",
    title: "The Big Conversation",
    host: "Discussion Panel",
    startTime: "10:00",
    endTime: "10:50",
    startHour: 10,
    startMinute: 0,
    endHour: 10,
    endMinute: 50,
  },
  {
    id: "4",
    title: "Dominion Sport",
    host: "Sports Desk",
    startTime: "11:00",
    endTime: "11:55",
    startHour: 11,
    startMinute: 0,
    endHour: 11,
    endMinute: 55,
  },
  {
    id: "5",
    title: "NEWS at 12 noon",
    host: "News Anchors",
    startTime: "12:00",
    endTime: "13:50",
    startHour: 12,
    startMinute: 0,
    endHour: 13,
    endMinute: 50,
  },
  {
    id: "6",
    title: "E-Plus",
    host: "Entertainment Team",
    startTime: "13:00",
    endTime: "13:50",
    startHour: 13,
    startMinute: 0,
    endHour: 13,
    endMinute: 50,
  },
  {
    id: "7",
    title: "LOJUDE DOMINION",
    host: "Cultural Team",
    startTime: "14:00",
    endTime: "14:50",
    startHour: 14,
    startMinute: 0,
    endHour: 14,
    endMinute: 50,
  },
  {
    id: "8",
    title: "IYO AYE",
    host: "Lifestyle Team",
    startTime: "15:30",
    endTime: "16:30",
    startHour: 15,
    startMinute: 30,
    endHour: 16,
    endMinute: 30,
  },
  {
    id: "9",
    title: "The POLISCOPE",
    host: "Political Analysts",
    startTime: "18:00",
    endTime: "19:00",
    startHour: 18,
    startMinute: 0,
    endHour: 19,
    endMinute: 0,
  },
];

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@DominionTV";

function isLive(program: Program): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTotalMinutes = program.startHour * 60 + program.startMinute;
  const endTotalMinutes = program.endHour * 60 + program.endMinute;

  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ProgramCard({ program }: { program: Program }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const live = isLive(program);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePlay = async () => {
    try {
      if (live) {
        await Linking.openURL(YOUTUBE_CHANNEL_URL);
      } else {
        const searchQuery = encodeURIComponent(`Dominion TV ${program.title}`);
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        await Linking.openURL(youtubeSearchUrl);
      }
    } catch (error) {
      if (Platform.OS === "web") {
        window.open(
          live
            ? YOUTUBE_CHANNEL_URL
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(`Dominion TV ${program.title}`)}`,
          "_blank"
        );
      } else {
        Alert.alert("Error", "Could not open YouTube");
      }
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.programCard,
        {
          backgroundColor: theme.cardBackground,
          borderWidth: live ? 2 : 0,
          borderColor: live ? Colors.light.accent : "transparent",
        },
        animatedStyle,
      ]}
    >
      {live ? (
        <View style={styles.liveBadge}>
          <ThemedText style={styles.liveBadgeText}>LIVE</ThemedText>
        </View>
      ) : null}

      <View style={[styles.thumbnail, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="tv" size={28} color={theme.textSecondary} />
      </View>

      <View style={styles.programInfo}>
        <ThemedText style={styles.programTitle} numberOfLines={1}>
          {program.title}
        </ThemedText>
        <ThemedText style={[styles.hostName, { color: theme.textSecondary }]}>
          {program.host}
        </ThemedText>
        <ThemedText style={[styles.timeSlot, { color: Colors.light.primary }]}>
          {program.startTime} - {program.endTime}
        </ThemedText>
      </View>

      <Pressable
        onPress={handlePlay}
        style={({ pressed }) => [
          styles.playButton,
          { backgroundColor: Colors.light.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Feather name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
      </Pressable>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={SCHEDULE}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProgramCard program={item} />}
    />
  );
}

const styles = StyleSheet.create({
  programCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    position: "relative",
  },
  liveBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    zIndex: 1,
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  programInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  hostName: {
    fontSize: 13,
    marginBottom: 2,
  },
  timeSlot: {
    fontSize: 13,
    fontWeight: "500",
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
