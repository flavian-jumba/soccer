import { PremiumColors } from "@/constants/colors";
import { resolveIcon } from "@/constants/icons";
import type { Category } from "@/data/mockData";
import { ChevronRight, Lock } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressableButton } from "./animated-pressable";

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  mode?: "home" | "vip";
  featured?: boolean;
  /** VIP category the user has no active subscription for. */
  locked?: boolean;
  /** Hide the "Tap to unlock" status row for locked cards. */
  hideLockedStatus?: boolean;
}

export function CategoryCard({
  category,
  onPress,
  mode = "home",
  featured = false,
  locked = false,
  hideLockedStatus = false,
}: CategoryCardProps) {
  const Icon = resolveIcon(category.icon);
  const isVip = category.isVip;

  return (
    <AnimatedPressableButton
      onPress={onPress}
      scaleValue={0.975}
      style={[
        styles.card,
        mode === "home" ? styles.homeCard : styles.vipCard,
        featured && styles.featuredCard,
        isVip && styles.goldEdge,
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.icon,
            isVip ? styles.goldIcon : styles.blueIcon,
            mode === "vip" && !featured && styles.greenIcon,
          ]}
        >
          <Icon
            size={22}
            color={
              isVip
                ? featured
                  ? PremiumColors.gold.light
                  : PremiumColors.status.wonGlow
                : PremiumColors.accent.primaryGlow
            }
          />
        </View>
        <View style={[styles.badge, isVip ? styles.vipBadge : styles.freeBadge]}>
          <Text style={[styles.badgeText, isVip && styles.vipBadgeText]}>
            {isVip ? "♛ VIP" : "FREE"}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {category.title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {category.description}
      </Text>

      <View style={styles.footer}>
        {locked && hideLockedStatus ? (
          <View />
        ) : (
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isVip ? PremiumColors.gold.light : "#4CC9FF" },
              ]}
            />
            <Text style={[styles.status, isVip && styles.goldStatus]}>
              {locked
                ? "Tap to unlock"
                : mode === "vip"
                  ? "Unlocked"
                  : category.matchCount > 0
                    ? `${category.matchCount} active`
                    : "Active"}
            </Text>
          </View>
        )}
        {locked ? (
          <Lock size={15} color={PremiumColors.text.muted} strokeWidth={2.2} />
        ) : (
          <ChevronRight size={16} color={PremiumColors.text.muted} />
        )}
      </View>
    </AnimatedPressableButton>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#171720",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    borderRadius: 18,
    borderCurve: "continuous",
    padding: 14,
    minHeight: 158,
  },
  homeCard: {
    flex: 1,
  },
  vipCard: {
    width: "48.2%",
    minHeight: 168,
  },
  featuredCard: {
    width: "100%",
    minHeight: 176,
    borderColor: "rgba(251, 191, 36, 0.7)",
    backgroundColor: "#151A21",
  },
  goldEdge: {
    borderBottomColor: "rgba(251, 191, 36, 0.55)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  blueIcon: {
    backgroundColor: "rgba(59, 130, 246, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.24)",
  },
  goldIcon: {
    backgroundColor: "rgba(245, 158, 11, 0.13)",
  },
  greenIcon: {
    backgroundColor: "rgba(16, 185, 129, 0.14)",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  freeBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderColor: "rgba(96, 165, 250, 0.25)",
  },
  vipBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(251, 191, 36, 0.26)",
  },
  badgeText: {
    color: PremiumColors.accent.primaryGlow,
    fontSize: 9,
    fontWeight: "800",
  },
  vipBadgeText: {
    color: PremiumColors.gold.light,
  },
  title: {
    color: PremiumColors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    paddingTop: 12,
  },
  description: {
    color: PremiumColors.text.tertiary,
    fontSize: 11,
    lineHeight: 16,
    paddingTop: 4,
    flexGrow: 1,
  },
  footer: {
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  status: {
    color: "#4CC9FF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  goldStatus: {
    color: PremiumColors.gold.light,
  },
});

export default CategoryCard;
