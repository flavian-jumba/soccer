import { PremiumColors } from "@/constants/colors";
import { GlassView } from "expo-glass-effect";
import { cssInterop } from "nativewind";
import React from "react";
import { Platform, StyleSheet, View, ViewProps } from "react-native";

cssInterop(GlassView, { className: "style" });

export type GlassCardVariant = "default" | "gold" | "success" | "elevated";

interface GlassCardProps extends ViewProps {
  variant?: GlassCardVariant;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    backgroundColor: PremiumColors.glass.background,
    borderColor: PremiumColors.glass.border,
  },
  gold: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  success: {
    backgroundColor: PremiumColors.status.wonBackground,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  elevated: {
    backgroundColor: PremiumColors.glass.backgroundLight,
    borderColor: PremiumColors.glass.borderLight,
  },
};

export function GlassCard({
  variant = "default",
  children,
  style,
  className,
  ...props
}: GlassCardProps) {
  const variantStyle = variantStyles[variant];

  // Use native GlassView on iOS if available
  if (Platform.OS === "ios") {
    return (
      <GlassView
        glassEffectStyle="clear"
        className={className}
        style={[
          styles.base,
          {
            borderColor: variantStyle.borderColor,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback for web and Android - semi-transparent with border
  return (
    <View
      className={className}
      style={[styles.base, variantStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default GlassCard;
