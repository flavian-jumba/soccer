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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenBinding = getTokenBinding;
exports.bindToken = bindToken;
exports.findAccountForToken = findAccountForToken;
exports.upsertEntitlement = upsertEntitlement;
exports.getSnapshot = getSnapshot;
exports.applyStatusByToken = applyStatusByToken;
const admin = __importStar(require("firebase-admin"));
/**
 * Firestore layout:
 *
 *   billingAccounts/{accountId}
 *     entitlements: { [productId]: EntitlementPayload }
 *     updatedAt: number
 *
 *   purchaseTokens/{purchaseToken}
 *     accountId, productId, packageName, updatedAt
 *
 * `purchaseTokens` is the replay ledger: a token is bound to the first
 * account that redeems it and rejected for every other account after that —
 * this is what stops one Play purchase being applied to multiple installs.
 */
function db() {
    return admin.firestore();
}
async function getTokenBinding(purchaseToken) {
    const snap = await db().collection("purchaseTokens").doc(purchaseToken).get();
    if (!snap.exists)
        return null;
    const data = snap.data();
    return { accountId: data.accountId };
}
async function bindToken(purchaseToken, accountId, productId, packageName) {
    await db().collection("purchaseTokens").doc(purchaseToken).set({
        accountId,
        productId,
        packageName,
        updatedAt: Date.now(),
    });
}
/** Maps a purchase token back to the account that redeemed it, for RTDN. */
async function findAccountForToken(purchaseToken) {
    const snap = await db().collection("purchaseTokens").doc(purchaseToken).get();
    if (!snap.exists)
        return null;
    const data = snap.data();
    return { accountId: data.accountId, productId: data.productId };
}
async function upsertEntitlement(accountId, entitlement, purchaseToken, packageName) {
    const ref = db().collection("billingAccounts").doc(accountId);
    const now = Date.now();
    await db().runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        const existing = (doc.data()?.entitlements ?? {});
        existing[entitlement.productId] = {
            accountId,
            productId: entitlement.productId,
            purchaseToken,
            status: entitlement.status,
            expiresAt: entitlement.expiresAt,
            autoRenewing: entitlement.autoRenewing,
            isTrial: entitlement.isTrial,
            basePlanId: entitlement.basePlanId,
            packageName,
            updatedAt: now,
        };
        tx.set(ref, { entitlements: existing, updatedAt: now }, { merge: true });
    });
}
async function getSnapshot(accountId) {
    const snap = await db().collection("billingAccounts").doc(accountId).get();
    const data = snap.data();
    const stored = (data?.entitlements ?? {});
    const entitlements = Object.values(stored).map((e) => ({
        productId: e.productId,
        status: e.status,
        expiresAt: e.expiresAt,
        autoRenewing: e.autoRenewing,
        isTrial: e.isTrial,
        basePlanId: e.basePlanId,
    }));
    return {
        entitlements,
        updatedAt: typeof data?.updatedAt === "number" ? data.updatedAt : 0,
    };
}
/** Applies an RTDN status change (revoke, hold, expiry) to whichever account holds the token. */
async function applyStatusByToken(purchaseToken, status) {
    const binding = await findAccountForToken(purchaseToken);
    if (!binding)
        return; // Token from before this backend existed, or unknown — nothing to update.
    const ref = db().collection("billingAccounts").doc(binding.accountId);
    const now = Date.now();
    await db().runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        const existing = (doc.data()?.entitlements ?? {});
        const current = existing[binding.productId];
        if (!current)
            return;
        existing[binding.productId] = { ...current, status, updatedAt: now };
        tx.set(ref, { entitlements: existing, updatedAt: now }, { merge: true });
    });
}
//# sourceMappingURL=entitlements.js.map