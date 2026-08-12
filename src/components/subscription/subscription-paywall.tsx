import { PlanOption } from "@/components/subscription/plan-option";
import { SubscriptionNotice } from "@/components/subscription/subscription-notice";
import { AnimatedPressableButton } from "@/components/ui/animated-pressable";
import {
  FullScreenModal,
  type FullScreenModalHandle,
} from "@/components/ui/full-screen-modal";
import { BILLING_ENV } from "@/config/env";
import { PremiumColors } from "@/constants/colors";
import { resolveIcon } from "@/constants/icons";
import type { Category } from "@/data/mockData";
import { bestValuePlanId } from "@/domain/billing/offers";
import {
  useEntitlements,
  useSubscriptionContext,
  type PlanViewModel,
} from "@/hooks/use-subscription";
import { Check, RotateCcw, ShieldCheck, X } from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The paywall for one VIP market, presented as a full page.
 *
 * Every market is sold on its own, so this screen only ever shows the plans
 * that unlock the market the user tapped — and buying one leaves every other
 * market exactly as it was.
 */

interface SubscriptionPaywallProps {
  category: Category | null;
  /** Plans that unlock `category`, already joined with store pricing. */
  models: PlanViewModel[];
  /**
   * Runs after the page closes, however it was closed. The screen uses it to
   * stop waiting on a purchase the user has walked away from.
   */
  onDismiss?: () => void;
}

export const SubscriptionPaywall = forwardRef<
  FullScreenModalHandle,
  SubscriptionPaywallProps
>(({ category, models, onDismiss }, ref) => {
  const insets = useSafeAreaInsets();
  const { attention, isStale, isSubscribed } = useEntitlements();
  const {
    connection,
    loadingProducts,
    restoring,
    failure,
    billingAvailable,
    verificationConfigured,
    purchase,
    restore,
    openSubscriptionCenter,
    dismissFailure,
  } = useSubscriptionContext();

  const canPurchase =
    billingAvailable && verificationConfigured && connection === "connected";

  // Every plan for a market shares its copy, so the feature list belongs to the
  // market and is shown once rather than repeated on each price card.
  const [feature] = models;
  const Icon = resolveIcon(feature?.plan.icon ?? "Crown");

  const bestValue = useMemo(
    () =>
      bestValuePlanId(
        models.map((model) => ({ planId: model.plan.id, offer: model.offer })),
      ),
    [models],
  );

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => {});
  }, []);

  return (
    <FullScreenModal ref={ref} onDismiss={onDismiss}>
      {(close) => (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.closeRow}>
            <AnimatedPressableButton
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              style={styles.close}
            >
              <X size={22} color={PremiumColors.text.secondary} />
            </AnimatedPressableButton>
          </View>

          <View style={styles.hero}>
            <View style={styles.medallion}>
              <Icon size={38} color={PremiumColors.gold.light} />
            </View>
            <Text style={styles.eyebrow}>VIP ACCESS</Text>
            <Text style={styles.title}>{category?.title ?? "VIP Access"}</Text>
            {category?.description && (
              <Text style={styles.subtitle}>{category.description}</Text>
            )}
          </View>

          {feature && (
            <View style={styles.featureCard}>
              {feature.plan.features.map((item) => (
                <View key={item} style={styles.featureRow}>
                  <View style={styles.featureCheck}>
                    <Check size={14} color="#1A1206" strokeWidth={3.2} />
                  </View>
                  <Text style={styles.featureText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {attention && (
            <SubscriptionNotice
              tone="warning"
              message={attention.message}
              actionLabel="Open Google Play"
              onAction={() =>
                void openSubscriptionCenter(attention.entitlement.productId)
              }
            />
          )}

          {failure && (
            <SubscriptionNotice
              tone="warning"
              message={failure.message}
              onDismiss={dismissFailure}
            />
          )}

          {!billingAvailable && (
            <SubscriptionNotice
              tone="info"
              message="Subscriptions are not available in this build. Install the app from Google Play to subscribe."
            />
          )}

          {billingAvailable && connection === "unavailable" && (
            <SubscriptionNotice
              tone="offline"
              message="Could not reach Google Play billing. Check your connection and that the Play Store is up to date."
            />
          )}

          {billingAvailable && !verificationConfigured && (
            <SubscriptionNotice
              tone="warning"
              message="Purchase verification is not configured for this build, so subscriptions cannot be activated."
            />
          )}

          {isSubscribed && isStale && (
            <SubscriptionNotice
              tone="offline"
              message="Showing your last confirmed subscription status - we could not reach the server."
            />
          )}

          {loadingProducts && (
            <View style={styles.loading}>
              <ActivityIndicator color={PremiumColors.gold.light} />
              <Text style={styles.loadingText}>Loading prices...</Text>
            </View>
          )}

          {!loadingProducts && models.length === 0 && (
            <SubscriptionNotice
              tone="info"
              message="No subscription options are configured for this VIP market yet."
            />
          )}

          <View style={styles.plans}>
            {models.map((model) => (
              <PlanOption
                key={model.plan.id}
                model={model}
                highlighted={model.plan.id === bestValue}
                canPurchase={canPurchase}
                onPurchase={() => void purchase(model.plan.id)}
                onManage={() => void openSubscriptionCenter(model.plan.productId)}
              />
            ))}
          </View>

          <View style={styles.secureRow}>
            <ShieldCheck size={16} color={PremiumColors.result.won} />
            <Text style={styles.secureText}>
              Secure checkout through Google Play
            </Text>
          </View>

          <Text style={styles.legal}>
            Payment is charged to your Google Play account. Each market is billed
            separately and renews automatically at the displayed price and billing
            period unless you cancel in Google Play before the renewal date.
            Subscribing to one market does not unlock any other. Manage or cancel
            any time in Google Play &rsaquo; Subscriptions.
          </Text>

          <AnimatedPressableButton
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
            accessibilityState={{ disabled: !billingAvailable || restoring }}
            disabled={!billingAvailable || restoring}
            onPress={() => void restore()}
            style={[
              styles.restore,
              (!billingAvailable || restoring) && styles.restoreDisabled,
            ]}
          >
            {restoring ? (
              <ActivityIndicator
                size="small"
                color={PremiumColors.text.secondary}
              />
            ) : (
              <>
                <RotateCcw size={15} color={PremiumColors.text.secondary} />
                <Text style={styles.restoreText}>Restore purchases</Text>
              </>
            )}
          </AnimatedPressableButton>

          <View style={styles.links}>
            <Text
              accessibilityRole="link"
              style={styles.link}
              onPress={() => openLink(BILLING_ENV.TERMS_URL)}
            >
              Terms of Service
            </Text>
            <Text style={styles.linkDivider}>·</Text>
            <Text
              accessibilityRole="link"
              style={styles.link}
              onPress={() => openLink(BILLING_ENV.PRIVACY_URL)}
            >
              Privacy Policy
            </Text>
          </View>
        </ScrollView>
      )}
    </FullScreenModal>
  );
});

SubscriptionPaywall.displayName = "SubscriptionPaywall";

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 16 },
  closeRow: { alignItems: "flex-end" },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PremiumColors.glass.background,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  hero: { alignItems: "center", gap: 10, paddingTop: 12, paddingBottom: 6 },
  medallion: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.24)",
    marginBottom: 4,
  },
  eyebrow: {
    color: PremiumColors.gold.light,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.4,
  },
  title: {
    color: PremiumColors.text.primary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    color: PremiumColors.text.tertiary,
    fontSize: 14,
    textAlign: "center",
  },
  featureCard: {
    gap: 16,
    padding: 20,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    backgroundColor: PremiumColors.background.tertiary,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  featureCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PremiumColors.gold.light,
  },
  featureText: {
    flex: 1,
    color: PremiumColors.text.primary,
    fontSize: 14.5,
    fontWeight: "700",
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  loadingText: { color: PremiumColors.text.tertiary, fontSize: 12.5 },
  plans: { gap: 12 },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 4,
  },
  secureText: {
    color: PremiumColors.result.won,
    fontSize: 14,
    fontWeight: "700",
  },
  legal: {
    color: PremiumColors.text.muted,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
  },
  restore: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: PremiumColors.glass.borderLight,
    backgroundColor: PremiumColors.glass.background,
  },
  restoreDisabled: { opacity: 0.45 },
  restoreText: {
    color: PremiumColors.text.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  links: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  link: {
    color: PremiumColors.text.tertiary,
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  linkDivider: { color: PremiumColors.text.muted, fontSize: 12 },
});

export default SubscriptionPaywall;
