import { BILLING_ENV, ENV } from "@/config/env";
import type {
  BillingClient,
  EntitlementStore,
  SubscriptionBackend,
} from "@/domain/billing/ports";
import { AsyncStorageEntitlementStore } from "./entitlement-cache";
import {
  PlayBillingClient,
  UnavailableBillingClient,
} from "./play-billing-client";
import { RevenueCatBillingClient } from "./revenuecat-billing-client";
import {
  HttpSubscriptionBackend,
  StoreSubscriptionBackend,
} from "./subscription-backend";

/**
 * Composition root for billing.
 *
 * Picking implementations happens here and nowhere else, so the provider and
 * the UI depend only on the port interfaces and can be exercised with fakes.
 */

export interface BillingDependencies {
  client: BillingClient;
  backend: SubscriptionBackend;
  cache: EntitlementStore;
}

function createBillingClient(): BillingClient {
  // Expo Go has no billing native module, and web has no store at all.
  if (!BILLING_ENV.ENABLED || ENV.IS_EXPO_GO) {
    return new UnavailableBillingClient();
  }
  if (BILLING_ENV.REVENUECAT_API_KEY_ANDROID) {
    return new RevenueCatBillingClient();
  }
  return new PlayBillingClient();
}

function createBackend(): SubscriptionBackend {
  if (BILLING_ENV.VERIFICATION_BASE_URL) {
    return new HttpSubscriptionBackend();
  }

  return new StoreSubscriptionBackend();
}

let singleton: BillingDependencies | null = null;

export function getBillingDependencies(): BillingDependencies {
  if (!singleton) {
    singleton = {
      client: createBillingClient(),
      backend: createBackend(),
      cache: new AsyncStorageEntitlementStore(),
    };
  }
  return singleton;
}

/** Test seam: replaces the wired dependencies with fakes. */
export function __setBillingDependencies(
  dependencies: BillingDependencies | null,
): void {
  singleton = dependencies;
}

export { AsyncStorageEntitlementStore } from "./entitlement-cache";
export { isSilentFailure, toBillingFailure } from "./billing-errors";
export {
  PlayBillingClient,
  UnavailableBillingClient,
} from "./play-billing-client";
export { RevenueCatBillingClient } from "./revenuecat-billing-client";
export {
  HttpSubscriptionBackend,
  StoreSubscriptionBackend,
} from "./subscription-backend";
