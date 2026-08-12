import { BILLING_ENV } from "@/config/env";
import { findPlanByProductId, type PlanId } from "@/config/subscription-config";
import type {
  SubscriptionBackend,
  SyncSubscriptionStatusInput,
  VerifyPurchaseInput,
} from "@/domain/billing/ports";
import {
  EMPTY_SNAPSHOT,
  type Entitlement,
  type EntitlementSnapshot,
  type EntitlementStatus,
  type StorePurchase,
  type VerificationResult,
} from "@/domain/billing/types";

/**
 * Server-side verification client.
 *
 * A Google Play purchase token means nothing until it is checked against the
 * Play Developer API with a service account, and that credential can never ship
 * in an APK. So the app treats the server's answer as the only source of truth
 * for entitlements and never derives access from the store payload itself.
 *
 * ── Expected server contract ────────────────────────────────────────────────
 *
 * POST  {base}/billing/verify-purchase
 *   body  { productId, purchaseToken, accountId, packageName }
 *   200   { verified: boolean, shouldAcknowledge: boolean, reason?: string,
 *           entitlement?: EntitlementPayload }
 *   The server calls purchases.subscriptionsv2.get, confirms the token belongs
 *   to `packageName`, binds it to `accountId`, records it, and answers.
 *
 * POST  {base}/billing/sync
 *   body  { accountId, packageName, purchases: StorePurchase[] }
 *   200   { entitlements: EntitlementPayload[], updatedAt?: number }
 *   Reconciles the device's view with the server's, so a reinstall or a device
 *   switch recovers the correct state.
 *
 * GET   {base}/billing/subscriptions?accountId=…
 *   200   { entitlements: EntitlementPayload[], updatedAt?: number }
 *   Reads the server's record, which is kept current by Real-Time Developer
 *   Notifications — it sees expiries, refunds and account holds before the
 *   device does.
 *
 * EntitlementPayload
 *   { productId, status, expiresAt?: number|string|null, autoRenewing?: boolean,
 *     isTrial?: boolean, basePlanId?: string|null }
 *   `status` accepts either this app's vocabulary ("in-grace-period") or the
 *   Play Developer API's ("SUBSCRIPTION_STATE_IN_GRACE_PERIOD").
 * ───────────────────────────────────────────────────────────────────────────
 */

const REQUEST_TIMEOUT_MS = 15_000;

interface EntitlementPayload {
  productId?: string;
  status?: string;
  expiresAt?: number | string | null;
  autoRenewing?: boolean;
  isTrial?: boolean;
  basePlanId?: string | null;
}

/** Accepts both the app's status names and the Play Developer API's. */
function normaliseStatus(raw: string | undefined): EntitlementStatus | null {
  const value = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");
  const stripped = value.replace(/^subscription-state-/, "");

  switch (stripped) {
    case "active":
    // A cancelled subscription keeps access until it expires.
    case "canceled":
    case "cancelled":
      return "active";
    case "in-grace-period":
      return "in-grace-period";
    case "on-hold":
      return "on-hold";
    case "paused":
      return "paused";
    case "pending":
    case "pending-purchase-canceled":
      return "pending";
    case "expired":
      return "expired";
    case "revoked":
    case "refunded":
      return "revoked";
    default:
      return null;
  }
}

function toEpochMs(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Drops anything the app does not sell — a stale server row cannot grant access. */
function toEntitlement(payload: EntitlementPayload): Entitlement | null {
  const productId = payload.productId;
  if (!productId) return null;

  const plan = findPlanByProductId(productId);
  if (!plan) return null;

  const status = normaliseStatus(payload.status);
  if (!status) return null;

  return {
    planId: plan.id as PlanId,
    productId,
    status,
    expiresAt: toEpochMs(payload.expiresAt),
    autoRenewing: payload.autoRenewing === true,
    isTrial: payload.isTrial === true,
    basePlanId: payload.basePlanId ?? null,
    source: "server",
  };
}

function toSnapshot(body: {
  entitlements?: EntitlementPayload[];
  updatedAt?: number;
}): EntitlementSnapshot {
  const entitlements = (body.entitlements ?? [])
    .map(toEntitlement)
    .filter((entitlement): entitlement is Entitlement => entitlement !== null);

  return {
    entitlements,
    updatedAt: typeof body.updatedAt === "number" ? body.updatedAt : Date.now(),
    stale: false,
  };
}

export class HttpSubscriptionBackend implements SubscriptionBackend {
  constructor(
    private readonly baseUrl: string = BILLING_ENV.VERIFICATION_BASE_URL,
    private readonly apiKey: string = BILLING_ENV.VERIFICATION_API_KEY,
  ) {}

  get isConfigured(): boolean {
    return this.baseUrl.length > 0;
  }

  async verifyPurchase(input: VerifyPurchaseInput): Promise<VerificationResult> {
    const body = await this.post<{
      verified?: boolean;
      shouldAcknowledge?: boolean;
      reason?: string;
      entitlement?: EntitlementPayload;
    }>("/billing/verify-purchase", input);

    const entitlement = body.entitlement ? toEntitlement(body.entitlement) : null;
    const verified = body.verified === true && entitlement !== null;

    return {
      verified,
      entitlement: verified ? entitlement : null,
      // Only acknowledge what the server confirmed. Acknowledging an unverified
      // token would tell Google the entitlement was granted when it was not.
      shouldAcknowledge: verified && body.shouldAcknowledge !== false,
      reason: body.reason,
    };
  }

  async syncSubscriptionStatus(
    input: SyncSubscriptionStatusInput,
  ): Promise<EntitlementSnapshot> {
    const body = await this.post<{
      entitlements?: EntitlementPayload[];
      updatedAt?: number;
    }>("/billing/sync", input);
    return toSnapshot(body);
  }

  async getUserSubscriptions(accountId: string): Promise<EntitlementSnapshot> {
    const body = await this.get<{
      entitlements?: EntitlementPayload[];
      updatedAt?: number;
    }>(`/billing/subscriptions?accountId=${encodeURIComponent(accountId)}`);
    return toSnapshot(body);
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };
    if (this.apiKey) headers["x-api-key"] = this.apiKey;
    return headers;
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET", headers: this.headers() });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    if (!this.isConfigured) {
      throw new Error("No verification backend configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Verification request failed (${response.status} ${response.statusText}).`,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Store-backed entitlement manager used when Titan does not provide its own
 * verification endpoint. This mirrors the simple Legend Tips setup: Google Play
 * completes the billing flow, the app grants access for products it sells, and
 * restore/startup reads the store again to rebuild the entitlement snapshot.
 */
export class StoreSubscriptionBackend implements SubscriptionBackend {
  readonly isConfigured = true;
  private snapshot: EntitlementSnapshot = EMPTY_SNAPSHOT;

  async verifyPurchase(input: VerifyPurchaseInput): Promise<VerificationResult> {
    const plan = findPlanByProductId(input.productId);
    if (!plan) {
      return {
        verified: false,
        entitlement: null,
        shouldAcknowledge: false,
        reason: "Unknown product.",
      };
    }

    const entitlement: Entitlement = {
      planId: plan.id,
      productId: plan.productId,
      status: "active",
      expiresAt: null,
      autoRenewing: true,
      isTrial: false,
      basePlanId: null,
      source: "store-cache",
    };

    this.snapshot = {
      entitlements: this.upsertEntitlement(entitlement),
      updatedAt: Date.now(),
      stale: false,
    };

    return {
      verified: true,
      shouldAcknowledge: true,
      entitlement,
    };
  }

  async syncSubscriptionStatus(
    input: SyncSubscriptionStatusInput,
  ): Promise<EntitlementSnapshot> {
    this.snapshot = {
      entitlements: input.purchases
        .map((purchase) => this.fromPurchase(purchase))
        .filter((entitlement): entitlement is Entitlement => entitlement !== null),
      updatedAt: Date.now(),
      stale: false,
    };
    return this.snapshot;
  }

  async getUserSubscriptions(): Promise<EntitlementSnapshot> {
    return this.snapshot;
  }

  private fromPurchase(purchase: StorePurchase): Entitlement | null {
    const plan = findPlanByProductId(purchase.productId);
    if (!plan) return null;

    const status: EntitlementStatus = purchase.isSuspended
      ? "on-hold"
      : purchase.state === "pending"
        ? "pending"
        : "active";

    return {
      planId: plan.id,
      productId: purchase.productId,
      status,
      expiresAt: null,
      autoRenewing: purchase.isAutoRenewing,
      isTrial: false,
      basePlanId: purchase.basePlanId,
      source: "store-cache",
    };
  }

  private upsertEntitlement(entitlement: Entitlement): Entitlement[] {
    return [
      ...this.snapshot.entitlements.filter(
        (item) => item.productId !== entitlement.productId,
      ),
      entitlement,
    ];
  }
}
