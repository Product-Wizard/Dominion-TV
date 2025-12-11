import React from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

interface NewsItem {
  id: string;
  title: string;
  timeAgo: string;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: "1",
    title: "Governor Announces New Infrastructure Development Plan",
    timeAgo: "2 hours ago",
  },
  {
    id: "2",
    title: "Local Football Team Secures Championship Victory",
    timeAgo: "4 hours ago",
  },
  {
    id: "3",
    title: "Community Health Initiative Launches Across the State",
    timeAgo: "6 hours ago",
  },
  {
    id: "4",
    title: "Economic Summit Brings International Investors",
    timeAgo: "8 hours ago",
  },
  {
    id: "5",
    title: "Education Reform Bill Passes Legislative Assembly",
    timeAgo: "10 hours ago",
  },
  {
    id: "6",
    title: "Cultural Festival Celebrates Heritage and Diversity",
    timeAgo: "12 hours ago",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NewsCard({ item }: { item: NewsItem }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.newsCard,
        { backgroundColor: theme.cardBackground },
        animatedStyle,
      ]}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="image" size={24} color={theme.textSecondary} />
      </View>
      <View style={styles.newsContent}>
        <ThemedText style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText
          style={[styles.newsTime, { color: theme.textSecondary }]}
        >
          {item.timeAgo}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={NEWS_DATA}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NewsCard item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  newsCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  newsContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  newsTime: {
    fontSize: 13,
  },
});
