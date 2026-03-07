import { PremiumColors } from "@/constants/colors";
import type { MatchStatus } from "@/data/mockData";
import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

interface StatusBadgeProps {
  status: MatchStatus;
  size?: "small" | "medium" | "large";
}

const statusConfig = {
  won: {
    label: "WON",
    backgroundColor: PremiumColors.status.wonBackground,
    textColor: PremiumColors.status.won,
    borderColor: PremiumColors.status.won,
    glowColor: PremiumColors.status.wonGlow,
  },
  lost: {
    label: "LOST",
    backgroundColor: PremiumColors.status.lostBackground,
    textColor: PremiumColors.status.lost,
    borderColor: PremiumColors.status.lost,
    glowColor: PremiumColors.status.lostGlow,
  },
  pending: {
    label: "PENDING",
    backgroundColor: PremiumColors.status.pendingBackground,
    textColor: PremiumColors.status.pending,
    borderColor: PremiumColors.status.pending,
    glowColor: PremiumColors.status.pendingGlow,
  },
};

const sizeConfig = {
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    borderRadius: 4,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    borderRadius: 6,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    borderRadius: 8,
  },
};

export function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];
  const opacity = useSharedValue(1);

  // Pulse animation for pending status
  React.useEffect(() => {
    if (status === "pending") {
      opacity.value = withRepeat(
        withSequence(
          withDelay(0, withTiming(0.5, { duration: 1000 })),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
  }, [status, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
          borderRadius: sizeStyle.borderRadius,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
