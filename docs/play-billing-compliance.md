# Google Play Billing — release checklist

Everything below must be true before the AAB from `eas build --platform android
--profile production` is promoted to production.

---

## 1. The backend is not optional

The app **fails closed**. With `expo.extra.billing.verificationBaseUrl` empty, no
purchase is ever acknowledged and no entitlement is ever granted — deliberately,
because a purchase token only means something once checked against the Google Play
Developer API with a service account, and that credential cannot ship in an APK.

Ship the three endpoints below before enabling billing in production.

### `POST /billing/verify-purchase`

```jsonc
// request
{ "productId": "titan_special_vvip", "purchaseToken": "…", "accountId": "device_…", "packageName": "com.titantips.titantips" }

// response
{
  "verified": true,
  "shouldAcknowledge": true,
  "entitlement": {
    "productId": "titan_special_vvip",
    "status": "active",          // or SUBSCRIPTION_STATE_ACTIVE — both accepted
    "expiresAt": 1793404800000,  // epoch ms or ISO-8601, null for unknown
    "autoRenewing": true,
    "isTrial": false,
    "basePlanId": "monthly"
  }
}
```

The server must:

1. call `purchases.subscriptionsv2.get` with the token;
2. confirm the response's package name matches `packageName`;
3. confirm `obfuscatedExternalAccountId` matches `accountId`, and reject the token
   if it is already bound to a different account — this is what stops one
   purchase being replayed across installs;
4. persist the token, product, state and expiry;
5. return `shouldAcknowledge: false` if it could not reach Google, so the client
   retries rather than acknowledging something unverified.

### `POST /billing/sync`

Body `{ accountId, packageName, purchases: StorePurchase[] }`. Reconciles the
device's view with the server's and returns `{ entitlements, updatedAt }`. Called
after Restore purchases and on cold start.

### `GET /billing/subscriptions?accountId=…`

Returns `{ entitlements, updatedAt }` from the server's own record. This is the
one that catches expiries, refunds and account holds the device has not noticed.

### Real-Time Developer Notifications

Configure a Pub/Sub topic in **Play Console → Monetise → Monetisation setup** and
subscribe to it. Without RTDN the server will not learn about `SUBSCRIPTION_ON_HOLD`,
`SUBSCRIPTION_REVOKED` or `SUBSCRIPTION_EXPIRED` until the client next asks, which
means a refunded user keeps access.

**Handle at minimum:** `SUBSCRIPTION_PURCHASED`, `SUBSCRIPTION_RENEWED`,
`SUBSCRIPTION_IN_GRACE_PERIOD`, `SUBSCRIPTION_ON_HOLD`, `SUBSCRIPTION_PAUSED`,
`SUBSCRIPTION_RESTARTED`, `SUBSCRIPTION_CANCELED`, `SUBSCRIPTION_EXPIRED`,
`SUBSCRIPTION_REVOKED`, `SUBSCRIPTION_DEFERRED`.

---

## 2. Play Console setup

- [ ] **Subscriptions created** — one per plan, with the product IDs from
      `app.json → expo.extra.billing.productIds`:
      `titan_special_vvip`, `titan_correct_scores`, `titan_htft_vip`,
      `titan_ovun_sure_tips`, `titan_10_plus_odds`,
      `titan_fixed_special_draws`, `titan_special_combo`.
      A mismatch here silently hides the plan in the app.
- [ ] **Base plan per subscription**, auto-renewing, with a billing period set.
- [ ] **Prices set for every target country.** The app never computes a price —
      it renders `formattedPrice` from Play, so an unpriced country shows
      "Price unavailable" rather than a wrong number.
- [ ] **Offers** (free trial / intro price) activated if used. The plan card
      picks the best eligible offer automatically and states its terms.
- [ ] All subscriptions and base plans **activated**, not left in draft.
- [ ] **Licence testers** added under Setup → Licence testing, so test purchases
      are free and renew on the accelerated schedule.

## 3. App content declarations

- [ ] **Data safety** — declare the app installation ID and FCM push token as
      collected; declare purchase history as collected (via Google Play), and
      that data is encrypted in transit. Declare **no** payment information is
      collected by the app: Google Play handles it.
- [ ] **Privacy policy URL** set in the store listing and reachable — must match
      `expo.extra.billing.privacyUrl`.
- [ ] **Content rating** questionnaire completed, including the gambling-themed
      content questions.
- [ ] **Target audience** set to 18+. This app must not be in a families programme.
- [ ] **Ads** declaration: none.
- [ ] **Real-money gambling / games declaration** — Titan sells predictions, not
      betting. Do not link to, embed, or take a commission from any bookmaker;
      doing so moves the app into the gambling policy and requires a separate
      country-by-country licence application.

## 4. Policy compliance in the app

Already implemented — verify each still holds after any copy edit:

- [ ] **Google Play Billing only.** No alternative payment path, no external
      purchase link, no "pay by M-Pesa / bank transfer" instructions anywhere in
      the app or its store listing.
- [ ] **Terms stated before purchase.** `PlanCard` renders the recurring price,
      the billing period, any trial or intro phase and what it converts to, plus
      "Renews automatically until cancelled" — all before the button.
- [ ] **Standalone products, no plan changes.** Every market is sold on its own
      and unlocks only its own category. Purchases never carry Play replacement
      parameters, so buying one market never alters or cancels another, and a
      user may hold any combination of markets and cadences at once.
- [ ] **Cancellation explained**, with the Google Play route, in
      `SubscriptionLegal` and in the in-app Legal & Support sheet.
- [ ] **Privacy Policy and Terms links** present on the subscription screen.
- [ ] **No guaranteed-win claims.** Search the user-visible app copy and store
      listing for "guaranteed", "sure win", "fixed", and "100%". Legacy product
      IDs may retain those words, but no customer-facing title or description may.
- [ ] **Responsible gaming disclaimer** — 18+, stake only what you can afford,
      begambleaware.org link. In `SubscriptionLegal` and the Legal sheet.
- [ ] **Restore purchases** available without an account, on the Plans screen.

## 5. Build and release

- [ ] `npx expo prebuild --clean` after adding `expo-iap` (config plugin adds
      `com.android.vending.BILLING` to the manifest).
- [ ] `expo.extra.billingEnabled` is `true`.
- [ ] `expo.extra.billing.verificationBaseUrl` points at production.
- [ ] `expo.extra.billing.trustClientWhenUnverified` is `false` — it is already
      inert in release builds, but leave no doubt.
- [ ] `android.versionCode` incremented (currently `1` — bump before upload).
- [ ] Build an **AAB**, not an APK.
- [ ] Upload to **internal testing first**. Billing cannot be tested from a local
      debug build: the app must be installed from a Play track, signed with the
      upload key Play knows.

## 6. Test matrix

Run each on a licence-tester account against an internal-testing build:

| Scenario | Expected |
|---|---|
| Buy a plan | Card flips to Subscribed; only the matching VIP category unlocks |
| Cancel mid-cycle | Access continues until expiry, then locks |
| Reinstall the app | Restore purchases recovers access |
| Buy on device A, open device B | Same Google account sees the subscription |
| Buy Special VVIP | Only the Special VVIP category unlocks; every other stays locked |
| Buy a second market while holding one | Normal Subscribe flow, no "change plan" prompt; both stay active |
| Buy weekly and monthly of one market | Both purchase; neither replaces the other |
| Test card "always declines" | Grace-period banner, access retained |
| Let grace period lapse | Account-hold banner, access revoked |
| Slow/deferred payment | "Pending" state, no access until settled |
| Kill the app mid-purchase | Purchase is verified and acknowledged on next launch |
| Airplane mode with an active sub | Cached access works, "last confirmed" banner shows |
| Refund from Play Console | Access revoked after RTDN, within one refresh |

**The unacknowledged-purchase test matters most:** Google auto-refunds anything
left unacknowledged for three days. Verify by killing the app between the Play
purchase confirmation and the app returning to the foreground, then relaunching —
`reconcileOwnedPurchases` should verify and acknowledge it.

---

## Architecture notes

```
src/config/subscription-config.ts     plan catalog; product IDs injected from app.json
src/domain/billing/types.ts           store-agnostic vocabulary
src/domain/billing/ports.ts           BillingClient · SubscriptionBackend · EntitlementStore
src/domain/billing/entitlements.ts    pure access rules (no I/O, no React)
src/domain/billing/offers.ts          price/term formatting
src/services/billing/                 adapters — the only code that imports expo-iap
src/features/subscription/            provider: state machine + side effects
src/hooks/use-subscription.ts         read-only hooks for screens
src/app/subscriptions.tsx             the screen
```

Access is decided in exactly one place — `hasCategoryAccess` in
`domain/billing/entitlements.ts` — reading a snapshot that only the backend can
produce. To add a plan, add a definition to `subscription-config.ts` and its
product ID to `app.json`; nothing else changes.
