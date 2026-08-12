import type { PlanId, SubscriptionPlan } from "@/config/subscription-config";
import {
  attentionMessage,
  entitlementForPlan,
  hasAnySubscription,
  hasCategoryAccess,
  hasPlanAccess,
  liveEntitlements,
} from "@/domain/billing/entitlements";
import { pickDefaultOffer } from "@/domain/billing/offers";
import type { Entitlement, StoreOffer } from "@/domain/billing/types";
import { useSubscriptionContext } from "@/features/subscription/subscription-provider";
import { useMemo } from "react";

export { useSubscriptionContext } from "@/features/subscription/subscription-provider";

/**
 * Read-only access checks. This is the hook screens should use to decide
 * whether to show premium content — it never exposes the purchase actions, so a
 * display component cannot accidentally trigger a billing flow.
 */
export function useEntitlements() {
  const { entitlements, restoring } = useSubscriptionContext();

  return useMemo(() => {
    const live = liveEntitlements(entitlements);
    const needsAttention = entitlements.entitlements
      .map((entitlement) => ({
        entitlement,
        message: attentionMessage(entitlement),
      }))
      .find((item) => item.message !== null);

    return {
      snapshot: entitlements,
      live,
      isSubscribed: hasAnySubscription(entitlements),
      /** True when the snapshot could not be confirmed with the server. */
      isStale: entitlements.stale,
      isSyncing: restoring,
      hasPlan: (planId: PlanId) => hasPlanAccess(entitlements, planId),
      hasCategory: (categoryId: string) =>
        hasCategoryAccess(entitlements, categoryId),
      entitlementFor: (planId: PlanId) =>
        entitlementForPlan(entitlements, planId),
      attention: needsAttention
        ? {
            entitlement: needsAttention.entitlement,
            message: needsAttention.message as string,
          }
        : null,
    };
  }, [entitlements, restoring]);
}

/** Whether a single VIP tip category is unlocked. */
export function useCategoryAccess(categoryId: string | null | undefined) {
  const { snapshot } = useEntitlements();
  return useMemo(
    () => (categoryId ? hasCategoryAccess(snapshot, categoryId) : false),
    [snapshot, categoryId],
  );
}

/**
 * A plan joined with its live store pricing and the user's status for it.
 *
 * There is no "this replaces your current plan" state, by design: holding one
 * subscription says nothing about any other, so a plan is only ever owned,
 * pending, or available to buy.
 */
export interface PlanViewModel {
  plan: SubscriptionPlan;
  offer: StoreOffer | null;
  /** True once store details have loaded for this product. */
  hasStoreDetails: boolean;
  isOwned: boolean;
  isPending: boolean;
  entitlement: Entitlement | null;
  isPurchasing: boolean;
}

/**
 * The plans that unlock one market, joined with store pricing and the user's
 * status for each, so the screen stays a presentation component.
 *
 * Which plans unlock a market comes from the plan catalog — a screen must never
 * restate that pairing, because a second copy of it is how a market ends up
 * selling access to another. A null category yields nothing rather than the
 * whole catalog: no screen sells every market at once.
 */
export function useSubscriptionPlans(
  categoryId: string | null | undefined,
): PlanViewModel[] {
  const { plans, products, entitlements, pendingProductIds, purchasingPlanId } =
    useSubscriptionContext();

  return useMemo(() => {
    if (!categoryId) return [];
    const visible = plans.filter((plan) => plan.categoryId === categoryId);

    return visible.map((plan) => {
      const product = products[plan.productId];

      return {
        plan,
        offer: pickDefaultOffer(product),
        hasStoreDetails: product !== undefined,
        isOwned: hasPlanAccess(entitlements, plan.id),
        isPending: pendingProductIds.includes(plan.productId),
        entitlement: entitlementForPlan(entitlements, plan.id),
        isPurchasing: purchasingPlanId === plan.id,
      };
    });
  }, [
    plans,
    categoryId,
    products,
    entitlements,
    pendingProductIds,
    purchasingPlanId,
  ]);
}
