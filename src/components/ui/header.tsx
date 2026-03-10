import { PremiumColors } from "@/constants/colors";
import { Bell, Info } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressableButton } from "./animated-pressable";

interface HeaderProps {
  title?: string;
  showNotification?: boolean;
  onInfoPress?: () => void;
  onNotificationPress?: () => void;
  unreadCount?: number;
}

export function Header({
  showNotification = true,
  onInfoPress,
  onNotificationPress,
  unreadCount = 0,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.content}>
        {/* Text Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoTitan}>Titan </Text>
          <Text style={styles.logoRest}>Football Tips</Text>
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
            <AnimatedPressableButton onPress={onNotificationPress}>
              <View style={styles.iconButton}>
                <Bell
                  size={20}
                  color={
                    unreadCount > 0
                      ? PremiumColors.text.primary
                      : PremiumColors.text.secondary
                  }
                />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
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
    paddingLeft: 8,
    paddingRight: 20,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoTitan: {
    fontSize: 24,
    fontWeight: "900",
    color: PremiumColors.gold.primary,
    letterSpacing: -0.5,
  },
  logoRest: {
    fontSize: 24,
    fontWeight: "900",
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
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PremiumColors.status.lost,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PremiumColors.background.primary,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: PremiumColors.text.primary,
    lineHeight: 11,
  },
});

export default Header;
