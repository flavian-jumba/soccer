import { PremiumColors } from "@/constants/colors";
import { cssInterop } from "nativewind";
import React from "react";
import { Platform, StyleSheet, View, ViewProps } from "react-native";

// Try to use expo-glass-effect on supported platforms
let GlassViewComponent: React.ComponentType<any> | null = null;
try {
  if (Platform.OS === "ios") {
    const { GlassView } = require("expo-glass-effect");
    GlassViewComponent = GlassView;
    cssInterop(GlassView, { className: "style" });
  }
} catch {
  // expo-glass-effect not available
}

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
  if (GlassViewComponent && Platform.OS === "ios") {
    return (
      <GlassViewComponent
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
      </GlassViewComponent>
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
