import React from "react";
import { View, FlatList, StyleSheet, Pressable, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  isBreaking?: boolean;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: "breaking",
    title: "Major Policy Changes Announced Following Summit",
    timeAgo: "Just now",
    isBreaking: true,
  },
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
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function BreakingNewsCard({ item }: { item: NewsItem }) {
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
      style={[styles.breakingCard, animatedStyle]}
    >
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80" }}
        style={styles.breakingImageBg}
        imageStyle={styles.breakingImage}
      >
        <View style={styles.breakingOverlay}>
          <View style={styles.breakingBadge}>
            <ThemedText style={styles.breakingBadgeText}>Breaking News</ThemedText>
          </View>
          <ThemedText style={styles.breakingTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.breakingTime}>{item.timeAgo}</ThemedText>
        </View>
      </ImageBackground>
    </AnimatedPressable>
  );
}

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
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const breakingNews = NEWS_DATA.find((item) => item.isBreaking);
  const regularNews = NEWS_DATA.filter((item) => !item.isBreaking);

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
      data={regularNews}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        breakingNews ? (
          <View style={styles.headerContainer}>
            <BreakingNewsCard item={breakingNews} />
          </View>
        ) : null
      }
      renderItem={({ item }) => <NewsCard item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: Spacing.sm,
  },
  breakingCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    height: 220,
  },
  breakingImageBg: {
    flex: 1,
    justifyContent: "flex-end",
  },
  breakingImage: {
    borderRadius: BorderRadius.md,
  },
  breakingOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  breakingBadge: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  breakingBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  breakingTitle: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  breakingTime: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
  },
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
