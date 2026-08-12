/**
 * Store-agnostic billing vocabulary.
 *
 * Nothing in this file imports a billing SDK. Adapters in `src/services/billing`
 * translate Google Play payloads into these shapes, so the rest of the app never
 * depends on a specific billing library.
 */

import type { PlanId } from "@/config/subscription-config";

/** Recurrence of a base plan, normalised from ISO-8601 (`P1M` → 1 month). */
export interface BillingPeriod {
  unit: "day" | "week" | "month" | "year" | "unknown";
  value: number;
}

/** A purchasable offer attached to a subscription product. */
export interface StoreOffer {
  /** Play offer ID. Null for the plain base plan with no offer applied. */
  offerId: string | null;
  basePlanId: string | null;
  /** Opaque token that must be passed back when launching the billing flow. */
  offerToken: string;
  /** Localized recurring price, already formatted by the store. */
  displayPrice: string;
  /** Price in micro-units of `currency`, for comparisons only — never display. */
  priceAmountMicros: string;
  currency: string;
  billingPeriod: BillingPeriod | null;
  /** Free trial length in days, when the offer opens with a free phase. */
  freeTrialDays: number | null;
  /** Discounted introductory phase, when the offer has one. */
  introductoryPhase: {
    displayPrice: string;
    period: BillingPeriod | null;
    cycles: number;
  } | null;
  tags: string[];
}

/** A subscription product as the store describes it, with localized pricing. */
export interface StoreSubscription {
  productId: string;
  title: string;
  description: string;
  currency: string;
  /** Ordered offers; `pickDefaultOffer` chooses the one shown by default. */
  offers: StoreOffer[];
}

/** A purchase record returned by the store, normalised across platforms. */
export interface StorePurchase {
  productId: string;
  /** Play purchase token. The only value the backend needs to verify. */
  purchaseToken: string;
  transactionId: string | null;
  transactionDate: number;
  /** `pending` means the user chose a deferred payment method (e.g. cash). */
  state: "pending" | "purchased" | "unknown";
  isAcknowledged: boolean;
  isAutoRenewing: boolean;
  /** Play Billing 8.1+: payment failed, entitlement must not be granted. */
  isSuspended: boolean;
  basePlanId: string | null;
  obfuscatedAccountId: string | null;
}

/**
 * Lifecycle of a subscription as far as the app is concerned.
 *
 * `in-grace-period` still grants access — Google requires the user keep the
 * service while they fix their payment method. `on-hold`, `paused` and
 * `pending` do not.
 */
export type EntitlementStatus =
  | "active"
  | "in-grace-period"
  | "on-hold"
  | "paused"
  | "pending"
  | "expired"
  | "revoked";

/** Statuses that grant access to premium content. */
export const ACCESS_GRANTING_STATUSES: readonly EntitlementStatus[] = [
  "active",
  "in-grace-period",
];

export interface Entitlement {
  planId: PlanId;
  productId: string;
  status: EntitlementStatus;
  /** Epoch ms when access lapses, when the source can tell us. */
  expiresAt: number | null;
  autoRenewing: boolean;
  isTrial: boolean;
  basePlanId: string | null;
  /**
   * Where this entitlement came from. `server` is authoritative; `store-cache`
   * is a debug-only fallback and is never produced in a release build.
   */
  source: "server" | "store-cache";
}

/** The app's complete picture of what the current user has paid for. */
export interface EntitlementSnapshot {
  entitlements: Entitlement[];
  /** Epoch ms of the last successful read. */
  updatedAt: number;
  /**
   * True when this snapshot came from cache and could not be refreshed. Access
   * is still honoured — a network outage must not lock out a paying user — but
   * the UI says so.
   */
  stale: boolean;
}

export const EMPTY_SNAPSHOT: EntitlementSnapshot = {
  entitlements: [],
  updatedAt: 0,
  stale: false,
};

/** Result of asking the backend to verify one purchase token. */
export interface VerificationResult {
  verified: boolean;
  /** Present when `verified`; describes what the token actually bought. */
  entitlement: Entitlement | null;
  /**
   * Whether the client should finish (acknowledge) the purchase. False when the
   * backend could not reach Google and wants the client to retry later.
   */
  shouldAcknowledge: boolean;
  reason?: string;
}

/** Categories of billing failure, each with a distinct user-facing response. */
export type BillingFailureKind =
  | "cancelled"
  | "already-owned"
  | "unavailable"
  | "network"
  | "pending"
  | "verification-failed"
  | "not-configured"
  | "unknown";

export interface BillingFailure {
  kind: BillingFailureKind;
  /** Message safe to render to the user. */
  message: string;
  /** Raw store code, for logs only. */
  code?: string;
  /** True when retrying the same action could plausibly succeed. */
  recoverable: boolean;
}
