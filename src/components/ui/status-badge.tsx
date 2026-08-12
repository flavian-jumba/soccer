import { resultStatus } from "@/constants/result-status";
import type { MatchStatus } from "@/data/mockData";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: MatchStatus;
  size?: "small" | "medium" | "large";
}

const sizeConfig = {
  small: { paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, icon: 10, gap: 3 },
  medium: { paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, icon: 12, gap: 4 },
  large: { paddingHorizontal: 11, paddingVertical: 5, fontSize: 12, icon: 13, gap: 5 },
};

/**
 * Icon + word, muted surface, no pulse. The state reads the same to someone
 * who cannot distinguish the accent colours.
 */
export function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const config = resultStatus(status);
  const sizeStyle = sizeConfig[size];
  const { Icon } = config;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={config.label}
      style={[
        styles.badge,
        {
          backgroundColor: config.surface,
          borderColor: config.border,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
          gap: sizeStyle.gap,
        },
      ]}
    >
      <Icon size={sizeStyle.icon} strokeWidth={2.4} color={config.color} />
      <Text style={[styles.text, { color: config.color, fontSize: sizeStyle.fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    borderCurve: "continuous",
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

export default StatusBadge;
