import { PremiumColors } from "@/constants/colors";
import { Link, usePathname } from "expo-router";
import { Crown, Home } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const items = [
  { href: "/home" as const, label: "Home", Icon: Home },
  { href: "/vip" as const, label: "VIP", Icon: Crown },
] as const;

export function AppBottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} asChild>
              <Pressable accessibilityRole="tab" style={styles.item}>
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={
                    active
                      ? label === "VIP"
                        ? PremiumColors.gold.primary
                        : PremiumColors.accent.primaryGlow
                      : PremiumColors.text.tertiary
                  }
                />
                <Text style={[styles.label, active && styles.activeLabel]}>
                  {label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  bar: {
    minHeight: 66,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "rgba(18, 18, 26, 0.96)",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    borderRadius: 28,
    borderCurve: "continuous",
  },
  item: {
    minWidth: 58,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    color: PremiumColors.text.tertiary,
    fontSize: 10,
    fontWeight: "600",
  },
  activeLabel: {
    color: PremiumColors.text.primary,
  },
});
