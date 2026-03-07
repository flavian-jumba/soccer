import { PremiumColors } from "@/constants/colors";
import { Bell, Info, Sparkles } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressableButton } from "./animated-pressable";

interface HeaderProps {
  title?: string;
  showNotification?: boolean;
  onInfoPress?: () => void;
}

export function Header({
  title = "VistaScores",
  showNotification = true,
  onInfoPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.content}>
        {/* Logo & Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Sparkles size={20} color={PremiumColors.accent.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {onInfoPress && (
            <AnimatedPressableButton onPress={onInfoPress}>
              <View style={styles.iconButton}>
                <Info size={20} color={PremiumColors.text.secondary} />
              </View>
            </AnimatedPressableButton>
          )}
          {showNotification && (
            <AnimatedPressableButton onPress={() => {}}>
              <View style={styles.iconButton}>
                <Bell size={20} color={PremiumColors.text.secondary} />
                <View style={styles.notificationBadge} />
              </View>
            </AnimatedPressableButton>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(11, 15, 25, 0.92)",
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: PremiumColors.text.primary,
    letterSpacing: -0.5,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PremiumColors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PremiumColors.status.lost,
  },
});

export default Header;
