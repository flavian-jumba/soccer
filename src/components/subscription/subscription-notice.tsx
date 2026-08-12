import { PremiumColors } from "@/constants/colors";
import { AlertTriangle, CloudOff, Info } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type NoticeTone = "info" | "warning" | "offline";

interface SubscriptionNoticeProps {
  tone: NoticeTone;
  message: string;
  /** Optional inline action, e.g. "Fix payment method". */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

const TONES: Record<NoticeTone, { color: string; surface: string; border: string }> =
  {
    info: {
      color: PremiumColors.accent.primaryGlow,
      surface: "rgba(59, 130, 246, 0.10)",
      border: "rgba(96, 165, 250, 0.24)",
    },
    warning: {
      color: PremiumColors.gold.light,
      surface: "rgba(245, 158, 11, 0.10)",
      border: "rgba(251, 191, 36, 0.26)",
    },
    offline: {
      color: PremiumColors.text.secondary,
      surface: PremiumColors.glass.background,
      border: PremiumColors.glass.border,
    },
  };

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  offline: CloudOff,
} as const;

/** One banner shape for every subscription-state message the app shows. */
export function SubscriptionNotice({
  tone,
  message,
  actionLabel,
  onAction,
  onDismiss,
}: SubscriptionNoticeProps) {
  const palette = TONES[tone];
  const Icon = ICONS[tone];

  return (
    <View
      accessible
      accessibilityRole="alert"
      style={[
        styles.wrap,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Icon size={15} color={palette.color} strokeWidth={2.2} />
      <View style={styles.copy}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Pressable accessibilityRole="button" onPress={onAction}>
              <Text style={[styles.action, { color: palette.color }]}>
                {actionLabel}
              </Text>
            </Pressable>
          )}
          {onDismiss && (
            <Pressable accessibilityRole="button" onPress={onDismiss}>
              <Text style={styles.dismiss}>Dismiss</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 10,
    padding: 13,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  copy: { flex: 1, gap: 7 },
  message: {
    color: PremiumColors.text.secondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  actions: { flexDirection: "row", gap: 18 },
  action: { fontSize: 12, fontWeight: "700" },
  dismiss: {
    color: PremiumColors.text.muted,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default SubscriptionNotice;
