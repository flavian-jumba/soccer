/**
 * Pure entitlement rules. No I/O, no React — every access decision in the app
 * funnels through these functions so "is this unlocked?" has exactly one answer.
 */

import { findPlanById, type PlanId } from "@/config/subscription-config";
import {
  ACCESS_GRANTING_STATUSES,
  type Entitlement,
  type EntitlementSnapshot,
  type EntitlementStatus,
} from "./types";

export function grantsAccess(status: EntitlementStatus): boolean {
  return ACCESS_GRANTING_STATUSES.includes(status);
}

/**
 * An entitlement is live when its status grants access *and* it has not passed
 * its expiry. The expiry check matters because a cached snapshot can outlive the
 * subscription it describes.
 */
export function isLive(entitlement: Entitlement, now = Date.now()): boolean {
  if (!grantsAccess(entitlement.status)) return false;
  if (entitlement.expiresAt === null) return true;
  return entitlement.expiresAt > now;
}

export function liveEntitlements(
  snapshot: EntitlementSnapshot,
  now = Date.now(),
): Entitlement[] {
  return snapshot.entitlements.filter((entitlement) => isLive(entitlement, now));
}

export function hasAnySubscription(
  snapshot: EntitlementSnapshot,
  now = Date.now(),
): boolean {
  return liveEntitlements(snapshot, now).length > 0;
}

export function entitlementForPlan(
  snapshot: EntitlementSnapshot,
  planId: PlanId,
): Entitlement | null {
  return (
    snapshot.entitlements.find(
      (entitlement) => entitlement.planId === planId,
    ) ?? null
  );
}

export function hasPlanAccess(
  snapshot: EntitlementSnapshot,
  planId: PlanId,
  now = Date.now(),
): boolean {
  const entitlement = entitlementForPlan(snapshot, planId);
  return entitlement !== null && isLive(entitlement, now);
}

/**
 * Tip category IDs the user may read.
 *
 * Each live plan contributes its one category and no other. There is
 * deliberately no "unlocks everything" case: a subscription to one market must
 * leave every other market locked, so a plan can only ever add the single
 * category it sells.
 */
export function unlockedCategoryIds(
  snapshot: EntitlementSnapshot,
  now = Date.now(),
): Set<string> {
  const unlocked = new Set<string>();

  for (const entitlement of liveEntitlements(snapshot, now)) {
    const plan = findPlanById(entitlement.planId);
    if (plan) unlocked.add(plan.categoryId);
  }

  return unlocked;
}

/**
 * The access check the UI uses. Free categories are handled by the caller —
 * this answers only "does the user's subscription cover this VIP category?".
 */
export function hasCategoryAccess(
  snapshot: EntitlementSnapshot,
  categoryId: string,
  now = Date.now(),
): boolean {
  return unlockedCategoryIds(snapshot, now).has(categoryId);
}

/** Statuses that should prompt the user to act, with the copy to show. */
export function attentionMessage(entitlement: Entitlement): string | null {
  switch (entitlement.status) {
    case "in-grace-period":
      return "There is a problem with your payment method. Update it to keep your access.";
    case "on-hold":
      return "Your subscription is on hold because a payment failed. Fix your payment method to restore access.";
    case "paused":
      return "Your subscription is paused. Resume it in Google Play to get access back.";
    case "pending":
      return "Your purchase is awaiting payment. Access unlocks as soon as Google Play confirms it.";
    default:
      return null;
  }
}
