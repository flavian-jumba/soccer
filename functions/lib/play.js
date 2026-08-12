"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionState = getSubscriptionState;
const googleapis_1 = require("googleapis");
/**
 * Google Play Developer API client.
 *
 * Auth comes from Application Default Credentials — the Cloud Function's own
 * runtime service account. That service account's email must be granted
 * access in Play Console → Setup → API access, with the "Manage orders and
 * subscriptions" permission (see functions/README.md). No key file ships with
 * this code.
 */
const auth = new googleapis_1.google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});
let client = null;
function getClient() {
    if (!client) {
        client = googleapis_1.google.androidpublisher({ version: "v3", auth });
    }
    return client;
}
const STATE_MAP = {
    SUBSCRIPTION_STATE_ACTIVE: "active",
    SUBSCRIPTION_STATE_CANCELED: "active", // access continues until expiry
    SUBSCRIPTION_STATE_IN_GRACE_PERIOD: "in-grace-period",
    SUBSCRIPTION_STATE_ON_HOLD: "on-hold",
    SUBSCRIPTION_STATE_PAUSED: "paused",
    SUBSCRIPTION_STATE_PENDING: "pending",
    SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED: "pending",
    SUBSCRIPTION_STATE_EXPIRED: "expired",
};
/**
 * Fetches and normalises one subscription purchase from the Play Developer
 * API. Returns `null` when the token is not recognised or belongs to a
 * different package — callers must treat that as unverifiable, never as
 * "expired" or "active".
 */
async function getSubscriptionState(packageName, purchaseToken) {
    const api = getClient();
    const response = await api.purchases.subscriptionsv2.get({
        packageName,
        token: purchaseToken,
    });
    const data = response.data;
    const rawState = data.subscriptionState ?? null;
    const status = rawState ? STATE_MAP[rawState] ?? null : null;
    if (!status)
        return null;
    // A subscription can carry multiple line items during a plan change; the
    // one still granting access is the one without a replacement already
    // superseding it. Picking the item with the latest expiry keeps this
    // correct across upgrades/downgrades without modelling Play's full state
    // machine here.
    const lineItems = data.lineItems ?? [];
    const latest = lineItems.reduce((best, item) => {
        if (!item.expiryTime)
            return best;
        if (!best || !best.expiryTime)
            return item;
        return new Date(item.expiryTime) > new Date(best.expiryTime) ? item : best;
    }, null);
    const expiresAt = latest?.expiryTime
        ? new Date(latest.expiryTime).getTime()
        : null;
    const autoRenewing = Boolean(latest?.autoRenewingPlan?.autoRenewEnabled);
    const isTrial = latest?.offerDetails?.offerTags?.includes("free-trial") ?? false;
    const basePlanId = latest?.offerDetails?.basePlanId ?? null;
    return {
        status,
        expiresAt,
        autoRenewing,
        isTrial,
        basePlanId,
        obfuscatedExternalAccountId: data.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
        rawState,
    };
}
//# sourceMappingURL=play.js.map