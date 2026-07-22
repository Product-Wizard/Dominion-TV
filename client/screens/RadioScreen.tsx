import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useRadioPlayer } from "@/providers/RadioPlayerProvider";

const ARTWORK = 200;

export default function RadioScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { radioState, retryAttempt, playPause, retry } = useRadioPlayer();

  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);

  useEffect(() => {
    if (radioState === "playing") {
      pulse1.value = 0;
      pulse1.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      const t1 = setTimeout(() => {
        pulse2.value = 0;
        pulse2.value = withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        );
      }, 700);
      const t2 = setTimeout(() => {
        pulse3.value = 0;
        pulse3.value = withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        );
      }, 1400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    cancelAnimation(pulse1);
    cancelAnimation(pulse2);
    cancelAnimation(pulse3);
    pulse1.value = withTiming(0, { duration: 400 });
    pulse2.value = withTiming(0, { duration: 400 });
    pulse3.value = withTiming(0, { duration: 400 });
    return undefined;
  }, [pulse1, pulse2, pulse3, radioState]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse1.value * 0.35 }],
    opacity: (1 - pulse1.value) * 0.45,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse2.value * 0.6 }],
    opacity: (1 - pulse2.value) * 0.3,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse3.value * 0.9 }],
    opacity: (1 - pulse3.value) * 0.18,
  }));

  const isActive =
    radioState === "playing" ||
    radioState === "buffering" ||
    radioState === "loading";
  const isSpinning =
    radioState === "loading" ||
    radioState === "buffering" ||
    radioState === "reconnecting";

  const getStatusLabel = (): string => {
    switch (radioState) {
      case "idle":
        return "Tap play to tune in";
      case "loading":
        return "Connecting...";
      case "buffering":
        return "Buffering stream...";
      case "playing":
        return "LIVE";
      case "paused":
        return "Paused";
      case "reconnecting":
        return `Reconnecting (attempt ${retryAttempt})`;
      case "error":
        return "Unable to connect. Check your internet.";
      default:
        return "";
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: tabBarHeight, paddingTop: insets.top + Spacing.xl },
      ]}
    >
      <View
        style={[styles.bgAccent, { backgroundColor: Colors.light.primary }]}
      />

      <View style={styles.artworkWrapper}>
        <Animated.View
          style={[
            styles.ring,
            {
              width: ARTWORK + 120,
              height: ARTWORK + 120,
              borderRadius: (ARTWORK + 120) / 2,
              borderColor: Colors.light.primary,
            },
            ring3Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              width: ARTWORK + 70,
              height: ARTWORK + 70,
              borderRadius: (ARTWORK + 70) / 2,
              borderColor: Colors.light.primary,
            },
            ring2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              width: ARTWORK + 30,
              height: ARTWORK + 30,
              borderRadius: (ARTWORK + 30) / 2,
              borderColor: Colors.light.primary,
            },
            ring1Style,
          ]}
        />

        <View
          style={[
            styles.artworkCircle,
            {
              borderColor:
                radioState === "playing" ? Colors.light.primary : "#333",
            },
          ]}
        >
          <Image
            source={require("../../assets/images/favicon.png")}
            style={styles.artworkImage}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={styles.infoBlock}>
        <ThemedText style={styles.stationName}>Dominion Radio</ThemedText>
        <ThemedText style={styles.tagline}>Your Channel of Choice</ThemedText>
      </View>

      <View style={styles.statusRow}>
        {radioState === "playing" ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <ThemedText style={styles.liveLabel}>LIVE</ThemedText>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: "#1C1C1C" }]}>
            {isSpinning ? (
              <ActivityIndicator
                size="small"
                color={Colors.light.primary}
                style={{ marginRight: Spacing.xs }}
              />
            ) : null}
            <ThemedText
              style={[
                styles.statusLabel,
                { color: radioState === "error" ? "#EF5350" : "#888888" },
              ]}
            >
              {getStatusLabel()}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {radioState === "error" ? (
          <Pressable
            onPress={retry}
            style={[styles.retryBtn, { borderColor: Colors.light.primary }]}
          >
            <Feather name="refresh-cw" size={18} color={Colors.light.primary} />
            <ThemedText
              style={[styles.retryLabel, { color: Colors.light.primary }]}
            >
              Try Again
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            onPress={playPause}
            style={({ pressed }) => [
              styles.playBtn,
              { backgroundColor: Colors.light.primary },
              pressed && styles.playBtnPressed,
            ]}
          >
            {isSpinning ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Feather
                name={isActive ? "pause" : "play"}
                size={38}
                color="#FFFFFF"
                style={isActive ? undefined : { marginLeft: 5 }}
              />
            )}
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <Feather name="radio" size={12} color="#444" />
        <ThemedText style={styles.footerLabel}>
          {radioState === "reconnecting"
            ? "Reconnecting automatically..."
            : "Streaming via Zeno.fm"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  bgAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  artworkWrapper: {
    width: ARTWORK + 140,
    height: ARTWORK + 140,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
  artworkCircle: {
    width: ARTWORK,
    height: ARTWORK,
    borderRadius: ARTWORK / 2,
    overflow: "hidden",
    borderWidth: 2,
  },
  artworkImage: {
    width: ARTWORK,
    height: ARTWORK,
  },
  infoBlock: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  stationName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  tagline: {
    fontSize: 14,
    color: "#666666",
    letterSpacing: 0.3,
  },
  statusRow: {
    alignItems: "center",
    minHeight: 36,
    justifyContent: "center",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C62828",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  liveLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  controls: {
    alignItems: "center",
  },
  playBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  playBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerLabel: {
    fontSize: 12,
    color: "#444444",
  },
});
