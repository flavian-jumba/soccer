import { AnimatedPressableButton } from "@/components/ui/animated-pressable";
import type { PlanCadence } from "@/config/subscription-config";
import { PremiumColors } from "@/constants/colors";
import { describeOfferTerms, formatPrice } from "@/domain/billing/offers";
import type { PlanViewModel } from "@/hooks/use-subscription";
import { Check } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * One tappable price option on the paywall.
 *
 * The whole card is the purchase control — there is no separate button, so the
 * price the user reads and the thing they press are the same object. Markets are
 * sold standalone, so a card never offers to switch or replace another plan.
 */

interface PlanOptionProps {
  model: PlanViewModel;
  /** Applies the gold "best value" treatment. At most one option per market. */
  highlighted: boolean;
  /** False when the store is unreachable or verification is not configured. */
  canPurchase: boolean;
  onPurchase(): void;
  onManage(): void;
}

const CADENCE_LABEL: Record<PlanCadence, string> = {
  weekly: "Week",
  monthly: "Month",
};

/** The sub-label under the cadence, which doubles as the option's status. */
function statusLabel(model: PlanViewModel): string {
  if (model.isOwned) return "Subscribed - tap to manage";
  if (model.isPending) return "Awaiting payment";
  if (!model.hasStoreDetails) return "Price unavailable";
  return "Auto-renewing subscription";
}

export function PlanOption({
  model,
  highlighted,
  canPurchase,
  onPurchase,
  onManage,
}: PlanOptionProps) {
  const { plan, offer, isOwned, isPending, isPurchasing, hasStoreDetails } = model;
  const terms = describeOfferTerms(offer);
  const gold = highlighted && !isOwned;
  const disabled =
    isPurchasing || isPending || !hasStoreDetails || (!canPurchase && !isOwned);

  return (
    <AnimatedPressableButton
      accessibilityRole="button"
      accessibilityLabel={`${
        isOwned ? "Manage" : "Subscribe"
      } ${plan.title}, ${CADENCE_LABEL[plan.cadence]}, ${formatPrice(offer)}`}
      accessibilityState={{ disabled, selected: isOwned }}
      disabled={disabled}
      onPress={isOwned ? onManage : onPurchase}
      style={[
        styles.card,
        gold && styles.cardGold,
        isOwned && styles.cardOwned,
        disabled && !isPurchasing && styles.cardDisabled,
      ]}
    >
      {highlighted && !isOwned && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BEST VALUE</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.labels}>
          <Text style={[styles.cadence, gold && styles.textOnGold]}>
            {CADENCE_LABEL[plan.cadence]}
          </Text>
          <View style={styles.statusRow}>
            {isOwned && (
              <Check size={13} color={PremiumColors.result.won} strokeWidth={3} />
            )}
            <Text
              style={[
                styles.status,
                gold && styles.statusOnGold,
                isOwned && styles.statusOwned,
              ]}
            >
              {statusLabel(model)}
            </Text>
          </View>
        </View>

        {isPurchasing ? (
          <ActivityIndicator
            color={gold ? "#1A1206" : PremiumColors.gold.light}
          />
        ) : (
          <Text style={[styles.price, gold && styles.textOnGold]}>
            {formatPrice(offer)}
          </Text>
        )}
      </View>

      {/* Play policy: any trial or intro phase, and what it converts to, must be
          readable before the billing flow opens. */}
      {terms && (
        <Text style={[styles.terms, gold && styles.statusOnGold]}>{terms}</Text>
      )}
    </AnimatedPressableButton>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    backgroundColor: PremiumColors.background.elevated,
  },
  cardGold: {
    backgroundColor: PremiumColors.gold.light,
    borderColor: PremiumColors.gold.light,
  },
  cardOwned: {
    backgroundColor: PremiumColors.result.wonSurface,
    borderColor: PremiumColors.result.wonBorder,
  },
  cardDisabled: { opacity: 0.5 },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
    borderCurve: "continuous",
    backgroundColor: "#1A1206",
  },
  badgeText: {
    color: PremiumColors.gold.light,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  labels: { flex: 1, gap: 4 },
  cadence: {
    color: PremiumColors.text.primary,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  status: {
    flexShrink: 1,
    color: PremiumColors.text.tertiary,
    fontSize: 12.5,
  },
  statusOwned: { color: PremiumColors.result.won, fontWeight: "700" },
  statusOnGold: { color: "rgba(26, 18, 6, 0.72)" },
  price: {
    color: PremiumColors.text.primary,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "right",
  },
  textOnGold: { color: "#1A1206" },
  terms: {
    color: PremiumColors.text.tertiary,
    fontSize: 11.5,
    lineHeight: 16,
  },
});

export default PlanOption;
