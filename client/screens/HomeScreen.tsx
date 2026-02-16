import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert, Platform, Image, ImageSourcePropType } from "react-native";
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

const PROGRAM_IMAGES: Record<string, ImageSourcePropType> = {
  "4": require("../../assets/images/the-big-conversation.jpg"),
  "6": require("../../assets/images/news-at-12.png"),
  "7": require("../../assets/images/news-at-12.png"),
  "9": require("../../assets/images/lojude-dominion.jpg"),
  "12": require("../../assets/images/the-poliscope.png"),
};

interface Program {
  id: string;
  title: string;
  days: string;
  daysOfWeek: number[];
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
    title: "Daybreak Live",
    days: "Mon-Sat",
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    startTime: "7:00 AM",
    endTime: "8:50 AM",
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 50,
  },
  {
    id: "2",
    title: "Idan Ori Odan",
    days: "Mon, Wed, Fri",
    daysOfWeek: [1, 3, 5],
    startTime: "9:00 AM",
    endTime: "9:50 AM",
    startHour: 9,
    startMinute: 0,
    endHour: 9,
    endMinute: 50,
  },
  {
    id: "3",
    title: "The Agenda",
    days: "Tue, Thu",
    daysOfWeek: [2, 4],
    startTime: "9:00 AM",
    endTime: "9:50 AM",
    startHour: 9,
    startMinute: 0,
    endHour: 9,
    endMinute: 50,
  },
  {
    id: "4",
    title: "The Big Conversation",
    days: "Mon-Fri",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    startHour: 10,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
  },
  {
    id: "5",
    title: "Dominion Sports",
    days: "Mon-Fri",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "11:15 AM",
    endTime: "11:50 AM",
    startHour: 11,
    startMinute: 15,
    endHour: 11,
    endMinute: 50,
  },
  {
    id: "6",
    title: "Iroyin Lerefe",
    days: "Mon-Fri",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "12:00 PM",
    endTime: "12:15 PM",
    startHour: 12,
    startMinute: 0,
    endHour: 12,
    endMinute: 15,
  },
  {
    id: "7",
    title: "Dominion TV News",
    days: "Mon-Fri",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "12:15 PM",
    endTime: "12:30 PM",
    startHour: 12,
    startMinute: 15,
    endHour: 12,
    endMinute: 30,
  },
  {
    id: "8",
    title: "E-Plus",
    days: "Mon, Wed, Fri",
    daysOfWeek: [1, 3, 5],
    startTime: "1:00 PM",
    endTime: "1:50 PM",
    startHour: 13,
    startMinute: 0,
    endHour: 13,
    endMinute: 50,
  },
  {
    id: "9",
    title: "Lojude",
    days: "Mon, Tue, Thu",
    daysOfWeek: [1, 2, 4],
    startTime: "2:00 PM",
    endTime: "2:50 PM",
    startHour: 14,
    startMinute: 0,
    endHour: 14,
    endMinute: 50,
  },
  {
    id: "10",
    title: "Okodoro Oselu",
    days: "Mon",
    daysOfWeek: [1],
    startTime: "3:00 PM",
    endTime: "3:50 PM",
    startHour: 15,
    startMinute: 0,
    endHour: 15,
    endMinute: 50,
  },
  {
    id: "11",
    title: "Iyo Aye",
    days: "Tue",
    daysOfWeek: [2],
    startTime: "3:30 PM",
    endTime: "4:25 PM",
    startHour: 15,
    startMinute: 30,
    endHour: 16,
    endMinute: 25,
  },
  {
    id: "12",
    title: "The Policescope",
    days: "Wed",
    daysOfWeek: [3],
    startTime: "6:00 PM",
    endTime: "6:50 PM",
    startHour: 18,
    startMinute: 0,
    endHour: 18,
    endMinute: 50,
  },
  {
    id: "13",
    title: "Oke Agba",
    days: "Thu",
    daysOfWeek: [4],
    startTime: "3:00 PM",
    endTime: "3:50 PM",
    startHour: 15,
    startMinute: 0,
    endHour: 15,
    endMinute: 50,
  },
];

function isLive(program: Program): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  if (!program.daysOfWeek.includes(currentDay)) return false;
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
    const searchQuery = encodeURIComponent(`dominionbroadcast ${program.title}`);
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    try {
      await Linking.openURL(youtubeSearchUrl);
    } catch (error) {
      if (Platform.OS === "web") {
        window.open(youtubeSearchUrl, "_blank");
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

      {PROGRAM_IMAGES[program.id] ? (
        <Image source={PROGRAM_IMAGES[program.id]} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="tv" size={28} color={theme.textSecondary} />
        </View>
      )}

      <View style={styles.programInfo}>
        <ThemedText style={styles.programTitle} numberOfLines={1}>
          {program.title}
        </ThemedText>
        <ThemedText style={[styles.hostName, { color: theme.textSecondary }]}>
          {program.days}
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
