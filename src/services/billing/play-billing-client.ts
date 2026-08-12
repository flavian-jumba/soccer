import { periodInDays } from "@/domain/billing/offers";
import type {
  BillingClient,
  PurchaseRequest,
  Unsubscribe,
} from "@/domain/billing/ports";
import type {
  BillingPeriod,
  StoreOffer,
  StorePurchase,
  StoreSubscription,
} from "@/domain/billing/types";
import {
  deepLinkToSubscriptions,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  subscriptionBillingIssueListener,
  type ProductSubscription,
  type Purchase,
  type PurchaseAndroid,
  type SubscriptionOffer,
} from "expo-iap";
import { Platform } from "react-native";

/**
 * Google Play Billing adapter.
 *
 * The only file in the app that knows expo-iap exists. Everything it returns is
 * a domain type from `@/domain/billing/types`, so replacing the billing library
 * is a change confined to this file.
 */

/** Play's `RecurrenceMode.INFINITE_RECURRING`. */
const INFINITE_RECURRING = 1;

const ISO_PERIOD = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/;

function isMissingNativeModuleError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Cannot find native module 'ExpoIap'")
  );
}

function debugBilling(message: string, data?: unknown): void {
  if (!__DEV__) return;
  if (data === undefined) {
    console.info(`[billing:store] ${message}`);
    return;
  }
  console.info(`[billing:store] ${message}`, data);
}

/** Parses an ISO-8601 recurrence such as `P1M` or `P7D`. */
export function parseBillingPeriod(iso: string | null | undefined): BillingPeriod | null {
  if (!iso) return null;
  const match = ISO_PERIOD.exec(iso.trim());
  if (!match) return null;

  const [, years, months, weeks, days] = match;
  const parts: [BillingPeriod["unit"], number][] = [
    ["year", Number(years ?? 0)],
    ["month", Number(months ?? 0)],
    ["week", Number(weeks ?? 0)],
    ["day", Number(days ?? 0)],
  ];

  const present = parts.filter(([, value]) => value > 0);
  // A compound period (P1M15D) has no single-unit label worth showing.
  if (present.length !== 1) return null;

  const [unit, value] = present[0];
  return { unit, value };
}

function isFreePhase(priceAmountMicros: string): boolean {
  return Number(priceAmountMicros) === 0;
}

/**
 * Flattens Play's pricing phases into the three facts the UI needs: the
 * recurring price, the free trial, and any discounted introductory period.
 */
function mapOffer(offer: SubscriptionOffer, fallbackCurrency: string): StoreOffer | null {
  const offerToken = offer.offerTokenAndroid;
  // Without a token the offer cannot be launched, so it is not purchasable.
  if (!offerToken) return null;

  const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
  const recurring =
    phases.find((phase) => phase.recurrenceMode === INFINITE_RECURRING) ??
    phases[phases.length - 1] ??
    null;

  const trialPhase = phases.find((phase) => isFreePhase(phase.priceAmountMicros));
  const introPhase = phases.find(
    (phase) =>
      phase !== recurring &&
      phase !== trialPhase &&
      !isFreePhase(phase.priceAmountMicros),
  );

  const introPeriod = parseBillingPeriod(introPhase?.billingPeriod);

  return {
    offerId: offer.id || null,
    basePlanId: offer.basePlanIdAndroid ?? null,
    offerToken,
    displayPrice: recurring?.formattedPrice ?? offer.displayPrice,
    priceAmountMicros: recurring?.priceAmountMicros ?? String(offer.price ?? 0),
    currency: recurring?.priceCurrencyCode ?? offer.currency ?? fallbackCurrency,
    billingPeriod:
      parseBillingPeriod(recurring?.billingPeriod) ??
      (offer.period
        ? { unit: offer.period.unit, value: offer.period.value }
        : null),
    freeTrialDays: periodInDays(parseBillingPeriod(trialPhase?.billingPeriod)),
    introductoryPhase: introPhase
      ? {
          displayPrice: introPhase.formattedPrice,
          period: introPeriod,
          cycles: introPhase.billingCycleCount,
        }
      : null,
    tags: offer.offerTagsAndroid ?? [],
  };
}

function mapSubscription(product: ProductSubscription): StoreSubscription {
  const offers = (product.subscriptionOffers ?? [])
    .map((offer) => mapOffer(offer, product.currency))
    .filter((offer): offer is StoreOffer => offer !== null);

  return {
    productId: product.id,
    title: product.title,
    description: product.description,
    currency: product.currency,
    offers,
  };
}

function mapPurchase(purchase: Purchase): StorePurchase | null {
  // Only Play purchases carry a token we can send for server verification.
  if (!purchase.purchaseToken) return null;
  const android = purchase as PurchaseAndroid;

  return {
    productId: purchase.productId,
    purchaseToken: purchase.purchaseToken,
    transactionId: android.transactionId ?? purchase.id ?? null,
    transactionDate: purchase.transactionDate,
    state: purchase.purchaseState,
    isAcknowledged: android.isAcknowledgedAndroid === true,
    isAutoRenewing: purchase.isAutoRenewing,
    isSuspended: android.isSuspendedAndroid === true,
    basePlanId: purchase.currentPlanId ?? null,
    obfuscatedAccountId: android.obfuscatedAccountIdAndroid ?? null,
  };
}

/**
 * Play's `finishTransaction` needs the SDK's own purchase object, but the rest
 * of the app only ever sees the normalised `StorePurchase`. Raw purchases are
 * held here, keyed by token, so acknowledgement stays an implementation detail.
 */
class RawPurchaseRegistry {
  private readonly byToken = new Map<string, Purchase>();

  remember(purchase: Purchase): void {
    if (purchase.purchaseToken) this.byToken.set(purchase.purchaseToken, purchase);
  }

  take(token: string): Purchase | null {
    return this.byToken.get(token) ?? null;
  }

  forget(token: string): void {
    this.byToken.delete(token);
  }
}

export class PlayBillingClient implements BillingClient {
  private nativeModuleMissing = false;

  get isSupported(): boolean {
    return (
      !this.nativeModuleMissing &&
      (Platform.OS === "android" || Platform.OS === "ios")
    );
  }

  private readonly raw = new RawPurchaseRegistry();
  private connecting: Promise<void> | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      try {
        debugBilling("Connecting to native IAP module.");
        await initConnection();
        this.connected = true;
        debugBilling("Connected to native IAP module.");
      } catch (error) {
        if (isMissingNativeModuleError(error)) {
          this.nativeModuleMissing = true;
          debugBilling("Native ExpoIap module is missing in this build.");
        }
        throw error;
      }
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    await endConnection();
  }

  async fetchSubscriptions(productIds: string[]): Promise<StoreSubscription[]> {
    if (productIds.length === 0) return [];

    debugBilling("Fetching subscription products.", { productIds });
    const result = await fetchProducts({ skus: productIds, type: "subs" });
    const products = (result ?? []) as ProductSubscription[];
    const mapped = products
      .filter((product) => product?.type === "subs")
      .map(mapSubscription);
    const returnedIds = new Set(mapped.map((product) => product.productId));
    const missingIds = productIds.filter((productId) => !returnedIds.has(productId));

    debugBilling("Fetched subscription products.", {
      requestedCount: productIds.length,
      returnedCount: mapped.length,
      returnedProducts: mapped.map((product) => ({
        productId: product.productId,
        title: product.title,
        currency: product.currency,
        offers: product.offers.map((offer) => ({
          basePlanId: offer.basePlanId,
          offerId: offer.offerId,
          displayPrice: offer.displayPrice,
          billingPeriod: offer.billingPeriod,
          hasOfferToken: offer.offerToken.length > 0,
        })),
      })),
      missingIds,
    });

    return mapped;
  }

  async requestSubscription(request: PurchaseRequest): Promise<StorePurchase | null> {
    // No `purchaseToken` and no `subscriptionProductReplacementParams`: those
    // ask Play to swap one subscription for another, which would cancel a market
    // the user is still paying for. They also require the SUBSCRIPTIONS_UPDATE
    // feature, which older Play Store builds report as unavailable — the source
    // of the "Google Play billing is not available on this device" error users
    // hit when buying their second market.
    await requestPurchase({
      type: "subs",
      request: {
        google: {
          skus: [request.productId],
          subscriptionOffers: [
            { sku: request.productId, offerToken: request.offerToken },
          ],
          obfuscatedAccountId: request.obfuscatedAccountId,
        },
        apple: { sku: request.productId },
      },
    });
    return null;
  }

  async getOwnedPurchases(): Promise<StorePurchase[]> {
    // Suspended subscriptions are included deliberately: the app must be able to
    // tell the user their payment failed rather than silently showing nothing.
    const purchases = await getAvailablePurchases({
      includeSuspendedAndroid: true,
    });
    return this.normalise(purchases);
  }

  async restorePurchases(): Promise<StorePurchase[]> {
    await restorePurchases();
    return this.getOwnedPurchases();
  }

  async acknowledge(purchase: StorePurchase): Promise<void> {
    const original = this.raw.take(purchase.purchaseToken);
    if (!original) {
      // The raw object is gone (e.g. app restarted). Re-query to find it.
      const owned = await getAvailablePurchases({ includeSuspendedAndroid: true });
      const match = owned.find(
        (item) => item.purchaseToken === purchase.purchaseToken,
      );
      if (!match) return;
      await finishTransaction({ purchase: match, isConsumable: false });
      return;
    }

    await finishTransaction({ purchase: original, isConsumable: false });
    this.raw.forget(purchase.purchaseToken);
  }

  async openSubscriptionCenter(productId?: string): Promise<void> {
    await deepLinkToSubscriptions({
      skuAndroid: productId ?? null,
      packageNameAndroid: null,
    });
  }

  onPurchaseUpdated(listener: (purchase: StorePurchase) => void): Unsubscribe {
    try {
      const subscription = purchaseUpdatedListener((purchase) => {
        this.raw.remember(purchase);
        const mapped = mapPurchase(purchase);
        if (mapped) listener(mapped);
      });
      return () => subscription.remove();
    } catch (error) {
      if (!isMissingNativeModuleError(error)) throw error;
      this.nativeModuleMissing = true;
      return () => {};
    }
  }

  onPurchaseError(listener: (error: unknown) => void): Unsubscribe {
    try {
      const subscription = purchaseErrorListener(listener);
      return () => subscription.remove();
    } catch (error) {
      if (!isMissingNativeModuleError(error)) throw error;
      this.nativeModuleMissing = true;
      return () => {};
    }
  }

  onBillingIssue(listener: (purchase: StorePurchase) => void): Unsubscribe {
    try {
      const subscription = subscriptionBillingIssueListener((purchase) => {
        const mapped = mapPurchase(purchase);
        if (mapped) listener(mapped);
      });
      return () => subscription.remove();
    } catch (error) {
      if (!isMissingNativeModuleError(error)) throw error;
      this.nativeModuleMissing = true;
      return () => {};
    }
  }

  private normalise(purchases: Purchase[]): StorePurchase[] {
    const mapped: StorePurchase[] = [];
    for (const purchase of purchases) {
      this.raw.remember(purchase);
      const item = mapPurchase(purchase);
      if (item) mapped.push(item);
    }
    return mapped;
  }
}

/**
 * Stand-in used where no store exists — Expo Go, web, or a build with billing
 * switched off. Every read succeeds and returns nothing; every write refuses,
 * so callers never need a platform check.
 */
export class UnavailableBillingClient implements BillingClient {
  readonly isSupported = false;

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async fetchSubscriptions(): Promise<StoreSubscription[]> {
    return [];
  }
  async requestSubscription(): Promise<StorePurchase | null> {
    throw new Error("Billing is not available in this build.");
  }
  async getOwnedPurchases(): Promise<StorePurchase[]> {
    return [];
  }
  async restorePurchases(): Promise<StorePurchase[]> {
    return [];
  }
  async acknowledge(): Promise<void> {}
  async openSubscriptionCenter(): Promise<void> {}
  onPurchaseUpdated(): Unsubscribe {
    return () => {};
  }
  onPurchaseError(): Unsubscribe {
    return () => {};
  }
  onBillingIssue(): Unsubscribe {
    return () => {};
  }
}
