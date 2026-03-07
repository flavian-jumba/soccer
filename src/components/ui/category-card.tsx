import { PremiumColors } from "@/constants/colors";
import type { Category, IconName } from "@/data/mockData";
import {
    Award,
    Crown,
    Flame,
    Goal,
    Lock,
    Percent,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Zap,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressableButton } from "./animated-pressable";
import { GlassCard } from "./glass-card";

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

const iconMap: Record<IconName, React.ComponentType<any>> = {
  Goal,
  TrendingUp,
  Target,
  Trophy,
  Zap,
  Crown,
  Star,
  Flame,
  Award,
  Percent,
};

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon] || Target;
  const isVip = category.isVip;

  return (
    <AnimatedPressableButton onPress={onPress} scaleValue={0.96}>
      <GlassCard
        variant={isVip ? "gold" : "default"}
        style={[styles.card, isVip && styles.vipCard]}
      >
        {/* VIP Lock Overlay */}
        {isVip && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockIconContainer}>
              <Lock
                size={24}
                color={PremiumColors.gold.light}
                strokeWidth={2.5}
              />
            </View>
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, isVip && styles.vipIconContainer]}>
          <IconComponent
            size={28}
            color={
              isVip ? PremiumColors.gold.primary : PremiumColors.accent.primary
            }
            strokeWidth={2}
          />
        </View>

        {/* Title */}
        <Text
          style={[styles.title, isVip && styles.vipTitle]}
          numberOfLines={1}
        >
          {category.title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={1}>
          {category.description}
        </Text>

        {/* Badge */}
        <View
          style={[styles.badge, isVip ? styles.vipBadge : styles.freeBadge]}
        >
          <Text
            style={[
              styles.badgeText,
              isVip ? styles.vipBadgeText : styles.freeBadgeText,
            ]}
          >
            {isVip ? "VIP" : "FREE"}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{category.matchCount} tips</Text>
          <View style={styles.winRateBadge}>
            <Text style={styles.winRateText}>{category.winRate}%</Text>
          </View>
        </View>
      </GlassCard>
    </AnimatedPressableButton>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    padding: 16,
    marginRight: 12,
    position: "relative",
  },
  vipCard: {
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 16,
  },
  lockIconContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 50,
    padding: 12,
    borderWidth: 2,
    borderColor: PremiumColors.gold.primary,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  vipIconContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  vipTitle: {
    color: PremiumColors.gold.light,
  },
  description: {
    fontSize: 12,
    color: PremiumColors.text.tertiary,
    marginBottom: 12,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  vipBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  freeBadgeText: {
    color: PremiumColors.status.won,
  },
  vipBadgeText: {
    color: PremiumColors.gold.primary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  statText: {
    fontSize: 11,
    color: PremiumColors.text.tertiary,
  },
  winRateBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winRateText: {
    fontSize: 10,
    fontWeight: "700",
    color: PremiumColors.status.won,
    fontFamily: "monospace",
  },
});

export default CategoryCard;
