import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

interface BillingExtra {
  /** Play Console subscription IDs, keyed by internal plan id. */
  productIds?: Record<string, string>;
  /** Base URL of the server that owns Play Developer API verification. */
  verificationBaseUrl?: string;
  /** Optional shared key sent as `x-api-key` to the verification service. */
  verificationApiKey?: string;
  /** RevenueCat public Android SDK key. When set, Titan uses RevenueCat purchases. */
  revenueCatApiKey?: string;
  /** Links that must be reachable before a purchase, per Play policy. */
  termsUrl?: string;
  privacyUrl?: string;
  supportEmail?: string;
  /**
   * Debug-only escape hatch: grant entitlements straight from the store payload
   * when no verification backend is reachable. Never honoured in a release build.
   */
  trustClientWhenUnverified?: boolean;
}

const billing = (extra.billing ?? {}) as BillingExtra;

export const ENV = {
  BILLING_ENABLED: extra.billingEnabled === true,
  COMMUNITY_URL:
    typeof extra.communityUrl === "string"
      ? extra.communityUrl
      : "https://t.me/titanfootballtips",
  IS_EXPO_GO: Constants.executionEnvironment === "storeClient",
  IS_DEV: __DEV__,
} as const;

/**
 * Billing configuration. Every value is data, not code — product IDs and the
 * verification endpoint are supplied through `app.json → expo.extra.billing`,
 * so renaming a Play Console product never requires a source change.
 */
export const BILLING_ENV = {
  ENABLED: ENV.BILLING_ENABLED,
  PRODUCT_IDS: billing.productIds ?? {},
  VERIFICATION_BASE_URL: (billing.verificationBaseUrl ?? "").replace(/\/+$/, ""),
  VERIFICATION_API_KEY: billing.verificationApiKey ?? "",
  REVENUECAT_API_KEY_ANDROID: billing.revenueCatApiKey ?? "",
  ANDROID_PACKAGE_NAME:
    Constants.expoConfig?.android?.package ?? "com.titantips.titantips",
  TERMS_URL:
    billing.termsUrl ?? "https://titan-tips-privacy-policy.lovable.app/terms",
  PRIVACY_URL:
    billing.privacyUrl ??
    "https://titan-tips-privacy-policy.lovable.app/privacy",
  SUPPORT_EMAIL: billing.supportEmail ?? "support@titanfootballtips.com",
  TRUST_CLIENT_WHEN_UNVERIFIED:
    __DEV__ && billing.trustClientWhenUnverified === true,
} as const;
