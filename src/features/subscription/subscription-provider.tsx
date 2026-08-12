import { BILLING_ENV } from "@/config/env";
import {
  getConfiguredProductIds,
  getSubscriptionPlans,
  type PlanId,
  type SubscriptionPlan,
} from "@/config/subscription-config";
import { pickDefaultOffer } from "@/domain/billing/offers";
import type { BillingDependencies } from "@/services/billing";
import {
  EMPTY_SNAPSHOT,
  type BillingFailure,
  type EntitlementSnapshot,
  type StorePurchase,
  type StoreSubscription,
} from "@/domain/billing/types";
import {
  getBillingDependencies,
  isSilentFailure,
  toBillingFailure,
} from "@/services/billing";
import { getAppAccountId } from "@/services/billing/app-account";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

/**
 * Owns every piece of subscription state and all the billing side effects.
 *
 * The lifecycle it implements, in order:
 *   1. show the cached snapshot immediately so a paying user is never locked
 *      out while the network is slow;
 *   2. connect to the store and load localized product details;
 *   3. reconcile with the server, which knows about expiries, refunds and
 *      account holds the device has not seen;
 *   4. process any purchase the store is still holding — including ones made
 *      on another device, or left unacknowledged by a previous crash.
 */

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "unavailable";

interface State {
  connection: ConnectionStatus;
  /** Localized store details, keyed by product ID. */
  products: Record<string, StoreSubscription>;
  entitlements: EntitlementSnapshot;
  loadingProducts: boolean;
  restoring: boolean;
  /** Plan whose billing flow is currently open, if any. */
  purchasingPlanId: PlanId | null;
  /** Product IDs the store is holding in a deferred-payment state. */
  pendingProductIds: string[];
  failure: BillingFailure | null;
}

const INITIAL_STATE: State = {
  connection: "idle",
  products: {},
  entitlements: EMPTY_SNAPSHOT,
  loadingProducts: false,
  restoring: false,
  purchasingPlanId: null,
  pendingProductIds: [],
  failure: null,
};

type Action =
  | { type: "connection"; status: ConnectionStatus }
  | { type: "products/loading" }
  | { type: "products/loaded"; products: StoreSubscription[] }
  | { type: "products/failed"; failure: BillingFailure }
  | { type: "entitlements"; snapshot: EntitlementSnapshot }
  | { type: "purchase/start"; planId: PlanId }
  | { type: "purchase/settled" }
  | { type: "restore/start" }
  | { type: "restore/settled" }
  /** Full authoritative list, from a store reconciliation. */
  | { type: "pending/set"; productIds: string[] }
  /** One product's deferred-payment state, leaving the others alone. */
  | { type: "pending/mark"; productId: string; pending: boolean }
  | { type: "failure"; failure: BillingFailure | null };

/**
 * Reports a store error, unless it is one the user caused deliberately.
 * Backing out of the Play sheet is a normal outcome, not something to alarm
 * them about with a banner.
 */
function failureAction(error: unknown): Action {
  const failure = toBillingFailure(error);
  return { type: "failure", failure: isSilentFailure(failure) ? null : failure };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "connection":
      return { ...state, connection: action.status };

    case "products/loading":
      return { ...state, loadingProducts: true };

    case "products/loaded": {
      const products: Record<string, StoreSubscription> = {};
      for (const product of action.products) products[product.productId] = product;
      return { ...state, products, loadingProducts: false };
    }

    case "products/failed":
      return { ...state, loadingProducts: false, failure: action.failure };

    case "entitlements":
      return { ...state, entitlements: action.snapshot };

    case "purchase/start":
      return { ...state, purchasingPlanId: action.planId, failure: null };

    case "purchase/settled":
      return { ...state, purchasingPlanId: null };

    case "restore/start":
      return { ...state, restoring: true, failure: null };

    case "restore/settled":
      return { ...state, restoring: false };

    case "pending/set":
      return { ...state, pendingProductIds: action.productIds };

    case "pending/mark": {
      const others = state.pendingProductIds.filter(
        (productId) => productId !== action.productId,
      );
      return {
        ...state,
        pendingProductIds: action.pending
          ? [...others, action.productId]
          : others,
      };
    }

    case "failure":
      return { ...state, failure: action.failure };

    default:
      return state;
  }
}

export interface SubscriptionContextValue extends State {
  /** Plans that have a configured product ID, in display order. */
  plans: SubscriptionPlan[];
  /** True when this build can reach a store at all. */
  billingAvailable: boolean;
  /** True when purchases are checked by a trusted server. */
  verificationConfigured: boolean;
  purchase(planId: PlanId, offerToken?: string): Promise<void>;
  restore(): Promise<void>;
  refresh(): Promise<void>;
  openSubscriptionCenter(productId?: string): Promise<void>;
  dismissFailure(): void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscriptionContext(): SubscriptionContextValue {
  const value = React.useContext(SubscriptionContext);
  if (!value) {
    throw new Error(
      "useSubscriptionContext must be used inside <SubscriptionProvider>.",
    );
  }
  return value;
}

interface ProviderProps {
  children: React.ReactNode;
  /** Injectable for tests; defaults to the wired implementations. */
  dependencies?: BillingDependencies;
}

export function SubscriptionProvider({ children, dependencies }: ProviderProps) {
  const deps = useMemo(
    () => dependencies ?? getBillingDependencies(),
    [dependencies],
  );
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const plans = useMemo(() => getSubscriptionPlans(), []);
  const mounted = useRef(true);
  const entitlementsRef = useRef(state.entitlements);
  entitlementsRef.current = state.entitlements;

  /** Persists and publishes a snapshot in one step so the two never diverge. */
  const commitSnapshot = useCallback(
    async (snapshot: EntitlementSnapshot) => {
      if (!mounted.current) return;
      dispatch({ type: "entitlements", snapshot });
      await deps.cache.write(snapshot);
    },
    [deps],
  );

  /**
   * Verifies one purchase with the server and, only if the server confirms it,
   * acknowledges it with Play. Order matters: acknowledging first would tell
   * Google the entitlement was granted before we knew it was real.
   */
  const processPurchase = useCallback(
    async (purchase: StorePurchase): Promise<boolean> => {
      // A deferred payment (e.g. cash at a store) has not completed. Show it as
      // pending and wait — the listener fires again when Google settles it.
      // Only this product is marked: another market's state is not ours to touch.
      if (purchase.state === "pending") {
        dispatch({
          type: "pending/mark",
          productId: purchase.productId,
          pending: true,
        });
        return false;
      }

      const accountId = await getAppAccountId();

      try {
        const result = await deps.backend.verifyPurchase({
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken,
          accountId,
          packageName: BILLING_ENV.ANDROID_PACKAGE_NAME,
        });

        if (result.shouldAcknowledge && !purchase.isAcknowledged) {
          await deps.client.acknowledge(purchase);
        }

        if (!result.verified) {
          dispatch({
            type: "failure",
            failure: {
              kind: "verification-failed",
              recoverable: true,
              message:
                result.reason ??
                "We could not verify this purchase. If you were charged, tap Restore purchases.",
            },
          });
          return false;
        }

        // A deferred payment that has now settled is no longer pending.
        dispatch({
          type: "pending/mark",
          productId: purchase.productId,
          pending: false,
        });

        if (result.entitlement) {
          await commitSnapshot({
            entitlements: [
              ...entitlementsRef.current.entitlements.filter(
                (entitlement) =>
                  entitlement.productId !== result.entitlement?.productId,
              ),
              result.entitlement,
            ],
            updatedAt: Date.now(),
            stale: false,
          });
        }

        return true;
      } catch (error) {
        if (__DEV__) console.warn("[billing] verification failed:", error);
        // Leave the purchase unacknowledged. It is re-processed on next launch,
        // and Google refunds it if we never succeed — which is the correct
        // outcome for a purchase we could never confirm.
        dispatch(failureAction(error));
        return false;
      }
    },
    [commitSnapshot, deps],
  );

  /** Asks the server what this installation is entitled to. */
  const refresh = useCallback(async () => {
    const accountId = await getAppAccountId();
    try {
      const snapshot = await deps.backend.getUserSubscriptions(accountId);
      await commitSnapshot(snapshot);
    } catch (error) {
      if (__DEV__) console.warn("[billing] entitlement refresh failed:", error);
      // Keep whatever we had, but tell the UI it could not be confirmed.
      const current = entitlementsRef.current;
      if (current.entitlements.length > 0) {
        dispatch({ type: "entitlements", snapshot: { ...current, stale: true } });
      }
    }
  }, [commitSnapshot, deps]);

  /** Pushes the store's view up to the server and takes its answer. */
  const syncWithStore = useCallback(
    async (purchases: StorePurchase[]) => {
      const accountId = await getAppAccountId();
      try {
        const snapshot = await deps.backend.syncSubscriptionStatus({
          accountId,
          purchases,
          packageName: BILLING_ENV.ANDROID_PACKAGE_NAME,
        });
        await commitSnapshot(snapshot);
      } catch (error) {
        if (__DEV__) console.warn("[billing] sync failed:", error);
        await refresh();
      }
    },
    [commitSnapshot, deps, refresh],
  );

  /**
   * Handles everything the store is currently holding: unacknowledged
   * purchases from a previous session, purchases made on another device, and
   * deferred payments that have since settled.
   */
  const reconcileOwnedPurchases = useCallback(async () => {
    const owned = await deps.client.getOwnedPurchases();

    dispatch({
      type: "pending/set",
      productIds: owned
        .filter((purchase) => purchase.state === "pending")
        .map((purchase) => purchase.productId),
    });

    const unfinished = owned.filter(
      (purchase) => purchase.state === "purchased" && !purchase.isAcknowledged,
    );
    for (const purchase of unfinished) {
      await processPurchase(purchase);
    }

    await syncWithStore(owned);
  }, [deps, processPurchase, syncWithStore]);

  // ── Startup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true;

    (async () => {
      // Cached first: a paying user must not see a paywall while we reconnect.
      const cached = await deps.cache.read();
      if (cached && mounted.current) {
        dispatch({ type: "entitlements", snapshot: cached });
      }

      if (!deps.client.isSupported || !BILLING_ENV.ENABLED) {
        if (mounted.current) dispatch({ type: "connection", status: "unavailable" });
        return;
      }

      dispatch({ type: "connection", status: "connecting" });

      try {
        await deps.client.connect();
        if (!mounted.current) return;
        dispatch({ type: "connection", status: "connected" });
      } catch (error) {
        if (!mounted.current) return;
        dispatch({ type: "connection", status: "unavailable" });
        dispatch(failureAction(error));
        return;
      }

      dispatch({ type: "products/loading" });
      try {
        const configuredProductIds = getConfiguredProductIds();
        if (__DEV__) {
          console.info("[billing] Requesting configured subscription IDs.", {
            productIds: configuredProductIds,
          });
        }

        const products = await deps.client.fetchSubscriptions(configuredProductIds);
        if (__DEV__) {
          const loadedProductIds = products.map((product) => product.productId);
          console.info("[billing] Loaded subscription products.", {
            loadedProductIds,
            missingProductIds: configuredProductIds.filter(
              (productId) => !loadedProductIds.includes(productId),
            ),
          });
        }
        if (mounted.current) dispatch({ type: "products/loaded", products });
      } catch (error) {
        if (__DEV__) console.warn("[billing] Failed to fetch products.", error);
        if (mounted.current) {
          dispatch({ type: "products/failed", failure: toBillingFailure(error) });
        }
      }

      try {
        await reconcileOwnedPurchases();
      } catch (error) {
        if (__DEV__) console.warn("[billing] reconciliation failed:", error);
      }
    })();

    return () => {
      mounted.current = false;
      void deps.client.disconnect();
    };
  }, [deps, reconcileOwnedPurchases]);

  // ── Store listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!deps.client.isSupported) return;

    const unsubscribeUpdated = deps.client.onPurchaseUpdated((purchase) => {
      void (async () => {
        const verified = await processPurchase(purchase);
        if (verified) await refresh();
        if (mounted.current) dispatch({ type: "purchase/settled" });
      })();
    });

    const unsubscribeError = deps.client.onPurchaseError((error) => {
      if (!mounted.current) return;
      dispatch({ type: "purchase/settled" });
      dispatch(failureAction(error));
    });

    // Play Billing 8.1+: the user's payment method failed on a live
    // subscription. Re-read from the server rather than guessing the new state.
    const unsubscribeIssue = deps.client.onBillingIssue(() => {
      void refresh();
    });

    return () => {
      unsubscribeUpdated();
      unsubscribeError();
      unsubscribeIssue();
    };
  }, [deps, processPurchase, refresh]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const purchase = useCallback(
    async (planId: PlanId, offerToken?: string) => {
      const plan = plans.find((candidate) => candidate.id === planId);
      if (!plan) return;

      const product = state.products[plan.productId];
      const offer = pickDefaultOffer(product);
      const token = offerToken ?? offer?.offerToken;

      if (!token) {
        dispatch({
          type: "failure",
          failure: {
            kind: "not-configured",
            recoverable: false,
            message:
              "This plan has no available offer right now. Please try again later.",
          },
        });
        return;
      }

      dispatch({ type: "purchase/start", planId });

      try {
        const accountId = await getAppAccountId();

        if (__DEV__) {
          console.info("[billing] Purchase started.", {
            planId: plan.id,
            productId: plan.productId,
            offerToken: token,
          });
        }

        // Always a plain new subscription. Every market is sold on its own, so a
        // purchase never touches — and never cancels — one the user already has.
        const completedPurchase = await deps.client.requestSubscription({
          productId: plan.productId,
          offerToken: token,
          obfuscatedAccountId: accountId,
        });
        if (completedPurchase) {
          await processPurchase(completedPurchase);
          await refresh();
          if (mounted.current) dispatch({ type: "purchase/settled" });
        }
        // The outcome arrives on the purchase-updated listener, which clears
        // `purchasingPlanId`. Errors clear it via the error listener.
      } catch (error) {
        if (__DEV__) console.error("[billing] Purchase failed.", error);
        if (!mounted.current) return;
        dispatch({ type: "purchase/settled" });
        dispatch(failureAction(error));
      }
    },
    [deps, plans, processPurchase, refresh, state.products],
  );

  const restore = useCallback(async () => {
    dispatch({ type: "restore/start" });
    try {
      const purchases = await deps.client.restorePurchases();

      const unfinished = purchases.filter(
        (item) => item.state === "purchased" && !item.isAcknowledged,
      );
      for (const item of unfinished) await processPurchase(item);

      await syncWithStore(purchases);
    } catch (error) {
      if (mounted.current) {
        dispatch(failureAction(error));
      }
    } finally {
      if (mounted.current) dispatch({ type: "restore/settled" });
    }
  }, [deps, processPurchase, syncWithStore]);

  const openSubscriptionCenter = useCallback(
    async (productId?: string) => {
      try {
        await deps.client.openSubscriptionCenter(productId);
      } catch (error) {
        if (__DEV__) console.warn("[billing] deep link failed:", error);
      }
    },
    [deps],
  );

  const dismissFailure = useCallback(() => {
    dispatch({ type: "failure", failure: null });
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      ...state,
      plans,
      billingAvailable: deps.client.isSupported && BILLING_ENV.ENABLED,
      verificationConfigured: deps.backend.isConfigured,
      purchase,
      restore,
      refresh,
      openSubscriptionCenter,
      dismissFailure,
    }),
    [
      state,
      plans,
      deps,
      purchase,
      restore,
      refresh,
      openSubscriptionCenter,
      dismissFailure,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
