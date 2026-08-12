import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PremiumColors } from "@/constants/colors";

interface LoadingOverlayProps {
  isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(isLoading);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isLoading) {
      setMounted(true);
      opacity.value = withTiming(1, { duration: 120 });
    } else {
      opacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [isLoading, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading tips"
      style={[styles.container, animatedStyle]}
    >
      <ActivityIndicator size="large" color={PremiumColors.accent.primary} />
      <Text style={styles.label}>Loading tips…</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F19",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  label: {
    color: PremiumColors.text.tertiary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
