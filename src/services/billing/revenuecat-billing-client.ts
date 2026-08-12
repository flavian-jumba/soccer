import { BILLING_ENV } from "@/config/env";
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
import { Linking, Platform } from "react-native";
import type {
  CustomerInfo,
  CustomerInfoUpdateListener,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
} from "react-native-purchases";

let configurationPromise: Promise<typeof import("react-native-purchases").default> | null =
  null;

function debugRevenueCat(message: string, data?: unknown): void {
  if (!__DEV__) return;
  if (data === undefined) {
    console.info(`[RevenueCat:Titan] ${message}`);
    return;
  }
  console.info(`[RevenueCat:Titan] ${message}`, data);
}

function parsePeriod(iso: string | null | undefined): BillingPeriod | null {
  if (!iso) return null;
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(iso);
  if (!match) return null;
  const [, years, months, weeks, days] = match;
  const values: [BillingPeriod["unit"], number][] = [
    ["year", Number(years ?? 0)],
    ["month", Number(months ?? 0)],
    ["week", Number(weeks ?? 0)],
    ["day", Number(days ?? 0)],
  ];
  const present = values.filter(([, value]) => value > 0);
  return present.length === 1 ? { unit: present[0][0], value: present[0][1] } : null;
}

function entitlementToPurchase(entitlement: {
  productIdentifier: string;
  latestPurchaseDateMillis?: number;
  isActive?: boolean;
  willRenew?: boolean;
  billingIssueDetectedAtMillis?: number | null;
  productPlanIdentifier?: string | null;
}): StorePurchase {
  return {
    productId: entitlement.productIdentifier,
    purchaseToken: `revenuecat:${entitlement.productIdentifier}`,
    transactionId: null,
    transactionDate: entitlement.latestPurchaseDateMillis ?? Date.now(),
    state: entitlement.isActive === false ? "unknown" : "purchased",
    isAcknowledged: true,
    isAutoRenewing: entitlement.willRenew !== false,
    isSuspended: entitlement.billingIssueDetectedAtMillis !== null,
    basePlanId: entitlement.productPlanIdentifier ?? null,
    obfuscatedAccountId: null,
  };
}

function customerInfoToPurchases(info: CustomerInfo): StorePurchase[] {
  return Object.values(info.entitlements.active).map(entitlementToPurchase);
}

function productToOffer(pkg: PurchasesPackage): StoreOffer {
  const product = pkg.product as PurchasesStoreProduct;
  const priceAmountMicros = Number.isFinite(product.price)
    ? String(Math.round(product.price * 1_000_000))
    : "0";

  return {
    offerId: pkg.identifier,
    basePlanId: product.defaultOption?.billingPeriod?.iso8601 ?? null,
    offerToken: pkg.identifier,
    displayPrice: product.priceString,
    priceAmountMicros,
    currency: product.currencyCode,
    billingPeriod: parsePeriod(product.subscriptionPeriod),
    freeTrialDays: null,
    introductoryPhase: null,
    tags: [],
  };
}

function packageToSubscription(pkg: PurchasesPackage): StoreSubscription {
  const product = pkg.product as PurchasesStoreProduct;
  return {
    productId: product.identifier,
    title: product.title,
    description: product.description,
    currency: product.currencyCode,
    offers: [productToOffer(pkg)],
  };
}

export class RevenueCatBillingClient implements BillingClient {
  private offering: PurchasesOffering | null = null;
  private packagesByIdentifier = new Map<string, PurchasesPackage>();
  private packagesByProductId = new Map<string, PurchasesPackage>();
  private customerInfoListener: CustomerInfoUpdateListener | null = null;
  private purchaseUpdatedListeners = new Set<(purchase: StorePurchase) => void>();

  get isSupported(): boolean {
    return (
      BILLING_ENV.REVENUECAT_API_KEY_ANDROID.length > 0 &&
      (Platform.OS === "android" || Platform.OS === "ios")
    );
  }

  async connect(): Promise<void> {
    await this.configure();
  }

  async disconnect(): Promise<void> {
    if (!this.customerInfoListener) return;
    const Purchases = await this.configure();
    Purchases.removeCustomerInfoUpdateListener(this.customerInfoListener);
    this.customerInfoListener = null;
  }

  async fetchSubscriptions(productIds: string[]): Promise<StoreSubscription[]> {
    const Purchases = await this.configure();
    const offerings = await Purchases.getOfferings();
    this.offering = offerings.current;

    if (!this.offering) {
      throw new Error(
        "RevenueCat has no current offering. Set a current offering in the RevenueCat dashboard.",
      );
    }

    this.rememberPackages(this.offering.availablePackages);
    const subscriptions = this.offering.availablePackages
      .map(packageToSubscription)
      .filter((subscription) => productIds.includes(subscription.productId));
    const returnedIds = new Set(subscriptions.map((item) => item.productId));

    debugRevenueCat("Fetched offering packages.", {
      offering: this.offering.identifier,
      requestedProductIds: productIds,
      loadedProductIds: [...returnedIds],
      missingProductIds: productIds.filter((productId) => !returnedIds.has(productId)),
      packages: this.offering.availablePackages.map((pkg) => ({
        packageId: pkg.identifier,
        productId: pkg.product.identifier,
        price: pkg.product.priceString,
      })),
    });

    return subscriptions;
  }

  async requestSubscription(request: PurchaseRequest): Promise<StorePurchase | null> {
    const Purchases = await this.configure();
    const pkg =
      this.packagesByIdentifier.get(request.offerToken) ??
      this.packagesByProductId.get(request.productId);

    if (!pkg) {
      throw new Error(
        `RevenueCat package for product "${request.productId}" was not found in the current offering.`,
      );
    }

    debugRevenueCat("Purchase started.", {
      packageId: pkg.identifier,
      productId: pkg.product.identifier,
      price: pkg.product.priceString,
    });

    const result = await Purchases.purchasePackage(pkg);
    const purchase =
      customerInfoToPurchases(result.customerInfo).find(
        (item) => item.productId === result.productIdentifier,
      ) ?? entitlementToPurchase({
        productIdentifier: result.productIdentifier,
        latestPurchaseDateMillis: Date.now(),
        isActive: true,
      });

    debugRevenueCat("Purchase completed.", {
      productId: result.productIdentifier,
      activeEntitlements: Object.keys(result.customerInfo.entitlements.active),
    });

    this.emitPurchaseUpdated(purchase);
    return purchase;
  }

  async getOwnedPurchases(): Promise<StorePurchase[]> {
    const Purchases = await this.configure();
    const info = await Purchases.getCustomerInfo();
    return customerInfoToPurchases(info);
  }

  async restorePurchases(): Promise<StorePurchase[]> {
    const Purchases = await this.configure();
    const info = await Purchases.restorePurchases();
    return customerInfoToPurchases(info);
  }

  async acknowledge(): Promise<void> {
    // RevenueCat completes/acknowledges purchases internally.
  }

  async openSubscriptionCenter(productId?: string): Promise<void> {
    const Purchases = await this.configure();
    const info = await Purchases.getCustomerInfo();
    if (info.managementURL) {
      await Linking.openURL(info.managementURL);
      return;
    }
    if (productId) {
      await Linking.openURL(
        `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(
          productId,
        )}&package=${encodeURIComponent(BILLING_ENV.ANDROID_PACKAGE_NAME)}`,
      );
    }
  }

  onPurchaseUpdated(listener: (purchase: StorePurchase) => void): Unsubscribe {
    this.purchaseUpdatedListeners.add(listener);
    return () => this.purchaseUpdatedListeners.delete(listener);
  }

  onPurchaseError(): Unsubscribe {
    return () => {};
  }

  onBillingIssue(): Unsubscribe {
    return () => {};
  }

  private async configure(): Promise<typeof import("react-native-purchases").default> {
    if (!configurationPromise) {
      configurationPromise = (async () => {
        const { default: Purchases, LOG_LEVEL } = await import("react-native-purchases");
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
        Purchases.configure({ apiKey: BILLING_ENV.REVENUECAT_API_KEY_ANDROID });
        debugRevenueCat("SDK configured for anonymous purchases.");

        if (!this.customerInfoListener) {
          this.customerInfoListener = (info) => {
            debugRevenueCat("Customer info updated.", {
              activeEntitlements: Object.keys(info.entitlements.active),
            });
          };
          Purchases.addCustomerInfoUpdateListener(this.customerInfoListener);
        }

        return Purchases;
      })().catch((error) => {
        configurationPromise = null;
        throw error;
      });
    }

    return configurationPromise;
  }

  private rememberPackages(packages: PurchasesPackage[]): void {
    this.packagesByIdentifier.clear();
    this.packagesByProductId.clear();
    for (const pkg of packages) {
      this.packagesByIdentifier.set(pkg.identifier, pkg);
      this.packagesByProductId.set(pkg.product.identifier, pkg);
    }
  }

  private emitPurchaseUpdated(purchase: StorePurchase): void {
    for (const listener of this.purchaseUpdatedListeners) listener(purchase);
  }
}
