/**
 * Ports (in the hexagonal-architecture sense) that the subscription feature
 * depends on. The provider is written against these interfaces only, so the
 * Play Billing adapter, the HTTP backend and the cache can each be swapped or
 * faked without touching feature code.
 */

import type {
  EntitlementSnapshot,
  StorePurchase,
  StoreSubscription,
  VerificationResult,
} from "./types";

export type Unsubscribe = () => void;

/**
 * Everything needed to launch a billing flow for one subscription.
 *
 * There is no "replace an existing subscription" field, and there must not be:
 * Titan sells standalone markets, so every purchase is a new subscription
 * bought alongside whatever the user already holds.
 */
export interface PurchaseRequest {
  productId: string;
  /** Offer token from the `StoreOffer` the user selected. */
  offerToken: string;
  /** Stable pseudonymous account ID, echoed back by Play on the purchase. */
  obfuscatedAccountId: string;
}

/**
 * The store. One implementation wraps Google Play Billing; a no-op
 * implementation stands in wherever billing is unavailable (Expo Go, web).
 */
export interface BillingClient {
  /** True when this build can actually talk to a store. */
  readonly isSupported: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  /** Localized product metadata for the given store IDs. */
  fetchSubscriptions(productIds: string[]): Promise<StoreSubscription[]>;

  /**
   * Launches the billing flow. Store adapters may resolve with a completed
   * purchase when their SDK returns synchronously, or null when the outcome
   * arrives through onPurchaseUpdated.
   */
  requestSubscription(request: PurchaseRequest): Promise<StorePurchase | null>;

  /** Purchases the store currently holds for this user, including unfinished ones. */
  getOwnedPurchases(): Promise<StorePurchase[]>;

  /** Re-queries the store and returns whatever it now reports. */
  restorePurchases(): Promise<StorePurchase[]>;

  /**
   * Finishes a purchase. On Android this acknowledges the token; Google
   * auto-refunds anything left unacknowledged for three days.
   */
  acknowledge(purchase: StorePurchase): Promise<void>;

  /** Opens the platform subscription centre, deep-linked to a product. */
  openSubscriptionCenter(productId?: string): Promise<void>;

  onPurchaseUpdated(listener: (purchase: StorePurchase) => void): Unsubscribe;
  onPurchaseError(listener: (error: unknown) => void): Unsubscribe;
  /** Fires when an active subscription hits a payment problem. */
  onBillingIssue(listener: (purchase: StorePurchase) => void): Unsubscribe;
}

export interface VerifyPurchaseInput {
  productId: string;
  purchaseToken: string;
  accountId: string;
  packageName: string;
}

export interface SyncSubscriptionStatusInput {
  accountId: string;
  /** Everything the store currently reports, so the server can reconcile. */
  purchases: StorePurchase[];
  packageName: string;
}

/**
 * The trusted server. Google Play purchase tokens are only meaningful once
 * checked against the Play Developer API with a service account, which cannot
 * happen on-device — so every method here is a network call and the client
 * treats the response as the only source of truth for entitlements.
 */
export interface SubscriptionBackend {
  /** True when a backend URL is configured. */
  readonly isConfigured: boolean;

  /** Validates one purchase token against the Play Developer API. */
  verifyPurchase(input: VerifyPurchaseInput): Promise<VerificationResult>;

  /**
   * Pushes the device's view of the store up and gets the reconciled
   * entitlement set back. Used after restore and on cold start.
   */
  syncSubscriptionStatus(
    input: SyncSubscriptionStatusInput,
  ): Promise<EntitlementSnapshot>;

  /**
   * Reads the server's current entitlement set without sending store state.
   * Reflects Real-Time Developer Notifications, so it sees expiries, refunds
   * and account holds the device has not noticed yet.
   */
  getUserSubscriptions(accountId: string): Promise<EntitlementSnapshot>;
}

/** Local persistence of the last known entitlement snapshot. */
export interface EntitlementStore {
  read(): Promise<EntitlementSnapshot | null>;
  write(snapshot: EntitlementSnapshot): Promise<void>;
  clear(): Promise<void>;
}
