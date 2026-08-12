"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRtdn = exports.billing = void 0;
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const https_1 = require("firebase-functions/v2/https");
const pubsub_1 = require("firebase-functions/v2/pubsub");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const play_1 = require("./play");
const entitlements_1 = require("./entitlements");
admin.initializeApp();
/**
 * Optional shared secret checked against the `x-api-key` header. Set with
 * `firebase functions:secrets:set BILLING_API_KEY` and mirror the same value
 * into `app.json → expo.extra.billing.verificationApiKey`. See
 * functions/README.md.
 */
const billingApiKey = (0, params_1.defineSecret)("BILLING_API_KEY");
/** Must match `app.json → expo.android.package`. */
const PACKAGE_NAME = "com.titantips.titantips";
const app = (0, express_1.default)();
app.use(express_1.default.json());
function checkApiKey(req, res) {
    const expected = billingApiKey.value();
    if (!expected)
        return true; // No secret configured — key check disabled.
    if (req.header("x-api-key") === expected)
        return true;
    res.status(401).json({ error: "Invalid or missing x-api-key." });
    return false;
}
function checkPackageName(packageName, res) {
    if (packageName === PACKAGE_NAME)
        return true;
    res.status(400).json({ error: "Unknown packageName." });
    return false;
}
app.post("/billing/verify-purchase", async (req, res) => {
    if (!checkApiKey(req, res))
        return;
    const body = req.body;
    const { productId, purchaseToken, accountId, packageName } = body;
    if (!productId || !purchaseToken || !accountId || !packageName) {
        res.status(400).json({ error: "Missing required fields." });
        return;
    }
    if (!checkPackageName(packageName, res))
        return;
    // A token already redeemed by a different account is a replay attempt —
    // reject it before ever calling Google.
    const binding = await (0, entitlements_1.getTokenBinding)(purchaseToken);
    if (binding && binding.accountId !== accountId) {
        const response = {
            verified: false,
            shouldAcknowledge: false,
            reason: "This purchase is already bound to a different account.",
        };
        res.status(200).json(response);
        return;
    }
    let state;
    try {
        state = await (0, play_1.getSubscriptionState)(packageName, purchaseToken);
    }
    catch (error) {
        firebase_functions_1.logger.error("Play Developer API call failed", error);
        const response = {
            verified: false,
            // Google was unreachable, not wrong — let the client retry rather than
            // acknowledging (and thereby finishing) an unverified purchase.
            shouldAcknowledge: false,
            reason: "Could not reach Google Play. Try again shortly.",
        };
        res.status(200).json(response);
        return;
    }
    if (!state) {
        const response = {
            verified: false,
            shouldAcknowledge: false,
            reason: "Google Play did not recognise this purchase token.",
        };
        res.status(200).json(response);
        return;
    }
    if (state.obfuscatedExternalAccountId &&
        state.obfuscatedExternalAccountId !== accountId) {
        const response = {
            verified: false,
            shouldAcknowledge: false,
            reason: "Purchase account does not match the requesting device.",
        };
        res.status(200).json(response);
        return;
    }
    const entitlement = {
        productId,
        status: state.status,
        expiresAt: state.expiresAt,
        autoRenewing: state.autoRenewing,
        isTrial: state.isTrial,
        basePlanId: state.basePlanId,
    };
    await (0, entitlements_1.bindToken)(purchaseToken, accountId, productId, packageName);
    await (0, entitlements_1.upsertEntitlement)(accountId, entitlement, purchaseToken, packageName);
    const response = {
        verified: true,
        shouldAcknowledge: true,
        entitlement,
    };
    res.status(200).json(response);
});
app.post("/billing/sync", async (req, res) => {
    if (!checkApiKey(req, res))
        return;
    const body = req.body;
    const { accountId, packageName, purchases } = body;
    if (!accountId || !packageName || !Array.isArray(purchases)) {
        res.status(400).json({ error: "Missing required fields." });
        return;
    }
    if (!checkPackageName(packageName, res))
        return;
    for (const purchase of purchases) {
        const binding = await (0, entitlements_1.getTokenBinding)(purchase.purchaseToken);
        if (binding && binding.accountId !== accountId)
            continue; // Not this account's purchase.
        let state;
        try {
            state = await (0, play_1.getSubscriptionState)(packageName, purchase.purchaseToken);
        }
        catch (error) {
            firebase_functions_1.logger.error("Play Developer API call failed during sync", error);
            continue; // Leave the server's existing record as-is; the client keeps its cache.
        }
        if (!state)
            continue;
        await (0, entitlements_1.bindToken)(purchase.purchaseToken, accountId, purchase.productId, packageName);
        await (0, entitlements_1.upsertEntitlement)(accountId, {
            productId: purchase.productId,
            status: state.status,
            expiresAt: state.expiresAt,
            autoRenewing: state.autoRenewing,
            isTrial: state.isTrial,
            basePlanId: state.basePlanId,
        }, purchase.purchaseToken, packageName);
    }
    const snapshot = await (0, entitlements_1.getSnapshot)(accountId);
    res.status(200).json(snapshot);
});
app.get("/billing/subscriptions", async (req, res) => {
    if (!checkApiKey(req, res))
        return;
    const accountId = req.query.accountId;
    if (typeof accountId !== "string" || accountId.length === 0) {
        res.status(400).json({ error: "Missing accountId query parameter." });
        return;
    }
    const snapshot = await (0, entitlements_1.getSnapshot)(accountId);
    res.status(200).json(snapshot);
});
exports.billing = (0, https_1.onRequest)({ secrets: [billingApiKey] }, app);
/**
 * Real-Time Developer Notifications.
 *
 * Configure the Pub/Sub topic in Play Console → Monetise → Monetisation setup
 * and point it at this function's topic (see functions/README.md). Handles
 * the subset of states that change access; anything else is logged and
 * ignored.
 */
// Notification type 4 (SUBSCRIPTION_PURCHASED) is deliberately absent: the
// client's own verify-purchase call is what binds a token to an account, and
// this handler cannot safely create that binding from an RTDN alone.
const RTDN_STATUS_MAP = {
    1: "active", // SUBSCRIPTION_RECOVERED
    2: "active", // SUBSCRIPTION_RENEWED
    3: "active", // SUBSCRIPTION_CANCELED — access continues until expiry
    5: "on-hold", // SUBSCRIPTION_ON_HOLD
    6: "in-grace-period", // SUBSCRIPTION_IN_GRACE_PERIOD
    7: "active", // SUBSCRIPTION_RESTARTED
    10: "paused", // SUBSCRIPTION_PAUSED
    12: "revoked", // SUBSCRIPTION_REVOKED
    13: "expired", // SUBSCRIPTION_EXPIRED
};
exports.billingRtdn = (0, pubsub_1.onMessagePublished)("play-billing-rtdn", async (event) => {
    const raw = event.data.message.json;
    const notification = raw?.subscriptionNotification;
    if (!notification)
        return; // Test notifications and other event types: nothing to do.
    const status = RTDN_STATUS_MAP[notification.notificationType];
    if (!status) {
        firebase_functions_1.logger.info("Ignoring RTDN notification type", {
            type: notification.notificationType,
        });
        return;
    }
    await (0, entitlements_1.applyStatusByToken)(notification.purchaseToken, status);
});
//# sourceMappingURL=index.js.map