import { SubscriptionPaywall } from "@/components/subscription/subscription-paywall";
import { MatchDetailModal } from "@/components/match-detail-modal";
import { AppBottomNav } from "@/components/ui/app-bottom-nav";
import { CategoryCard } from "@/components/ui/category-card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { FullScreenModalHandle } from "@/components/ui/full-screen-modal";
import { PremiumColors } from "@/constants/colors";
import { resolveCatalog, VIP_TIP_CATALOG } from "@/data/category-catalog";
import type { Category } from "@/data/mockData";
import { useVipTips } from "@/hooks/use-categories";
import { useMatchesByCategory } from "@/hooks/use-matches";
import { useEntitlements, useSubscriptionPlans } from "@/hooks/use-subscription";
import { Crown, Sparkles } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VipScreen() {
  const insets = useSafeAreaInsets();
  const { categories, loading } = useVipTips();
  const { hasCategory } = useEntitlements();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubscriptionCategory, setSelectedSubscriptionCategory] =
    useState<Category | null>(null);
  // Only the plans that unlock the tapped market. Which plans those are comes
  // from the plan catalog, so this screen never restates the pairing.
  const selectedPlanModels = useSubscriptionPlans(
    selectedSubscriptionCategory?.id,
  );
  const { matches, loading: matchesLoading } = useMatchesByCategory(
    selectedCategory?.id ?? null,
  );
  const matchDetailRef = useRef<FullScreenModalHandle>(null);
  const subscriptionRef = useRef<FullScreenModalHandle>(null);
  // Whether the paywall is on screen right now. A purchase that is confirmed
  // after the user has already closed it must not pull them back into a modal.
  const [paywallOpen, setPaywallOpen] = useState(false);
  const markets = useMemo(
    () => resolveCatalog(VIP_TIP_CATALOG, categories),
    [categories],
  );
  const combined = markets[0];
  const singleMarkets = markets.slice(1);

  /**
   * Locked categories still open, but in preview mode: picks and odds stay
   * hidden until the match is settled, and the sheet offers a way to subscribe.
   * Access is decided by the verified entitlement snapshot, never by the card.
   */
  const [previewLocked, setPreviewLocked] = useState(false);

  const openCategory = useCallback(
    (category: Category) => {
      const locked = !hasCategory(category.id);
      if (locked) {
        if (__DEV__) {
          console.info("[billing:vip] Opening subscription popup.", {
            categoryId: category.id,
            categoryTitle: category.title,
          });
        }
        setSelectedSubscriptionCategory(category);
        setPaywallOpen(true);
        subscriptionRef.current?.present();
        return;
      }

      setSelectedCategory(category);
      setPreviewLocked(false);
      matchDetailRef.current?.present();
    },
    [hasCategory],
  );

  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const openSelectedSubscription = useCallback(() => {
    matchDetailRef.current?.dismiss();
    if (!selectedCategory) return;
    setSelectedSubscriptionCategory(selectedCategory);
    setPaywallOpen(true);
    // Let the matches page finish leaving before the paywall arrives — two
    // native modals transitioning in the same frame can drop the second.
    requestAnimationFrame(() => subscriptionRef.current?.present());
  }, [selectedCategory]);

  /**
   * The moment a purchase is verified, the paywall has nothing left to sell.
   *
   * Entitlement arrives asynchronously — Play returns, the server verifies, and
   * only then does the snapshot update — so the transition is driven by access
   * actually being granted rather than by the purchase call returning. That
   * also covers Restore purchases and a subscription bought on another device.
   */
  useEffect(() => {
    if (!paywallOpen) return;
    const unlocked = selectedSubscriptionCategory;
    if (!unlocked || !hasCategory(unlocked.id)) return;

    subscriptionRef.current?.dismiss();
    setSelectedCategory(unlocked);
    setPreviewLocked(false);
    // Same one-frame gap as above: the paywall has to finish leaving before the
    // predictions page is presented, or the second modal never appears.
    requestAnimationFrame(() => matchDetailRef.current?.present());
  }, [paywallOpen, selectedSubscriptionCategory, hasCategory]);

  return (
    <View style={styles.screen}>
      <LoadingOverlay isLoading={loading} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 28 },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>VIP Predictions</Text>
            <Text style={styles.subtitle}>Premium predictions, grouped by market</Text>
          </View>
          <View style={styles.crown}>
            <Crown size={22} color={PremiumColors.gold.light} />
          </View>
        </View>

        {combined && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <CategoryCard
              category={combined}
              featured
              mode="vip"
              locked={!hasCategory(combined.id)}
              onPress={() => openCategory(combined)}
            />
          </Animated.View>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <View style={styles.marketLabel}>
            <Sparkles size={12} color={PremiumColors.text.tertiary} />
            <Text style={styles.marketLabelText}>OR PICK A SINGLE MARKET</Text>
          </View>
          <View style={styles.divider} />
        </View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.grid}>
          {singleMarkets.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              mode="vip"
              locked={!hasCategory(category.id)}
              onPress={() => openCategory(category)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      <AppBottomNav />
      <MatchDetailModal
        ref={matchDetailRef}
        category={selectedCategory}
        matches={matches}
        loading={matchesLoading}
        lockUntilSettled={previewLocked}
        onUnlock={openSelectedSubscription}
      />
      <SubscriptionPaywall
        ref={subscriptionRef}
        category={selectedSubscriptionCategory}
        models={selectedPlanModels}
        onDismiss={closePaywall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PremiumColors.background.primary },
  content: { paddingHorizontal: 18, gap: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 2,
  },
  title: {
    color: PremiumColors.text.primary,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  subtitle: { color: PremiumColors.text.tertiary, fontSize: 12, paddingTop: 3 },
  crown: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.2)",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  divider: { flex: 1, height: 1, backgroundColor: PremiumColors.glass.border },
  marketLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  marketLabelText: {
    color: PremiumColors.text.tertiary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
});
