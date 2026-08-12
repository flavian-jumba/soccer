# Titan production-readiness audit

Audit date: 2026-07-25  
Scope: current working tree; Expo SDK 55 / React Native 0.83 / Android release

## Executive result

The client is materially safer and now fails closed, but **must not be promoted
to production yet**. The sole hard client-side release gate is intentional:
`expo.extra.billing.verificationBaseUrl` is blank. The app now prevents a
purchase from starting in that state and `npm run validate:production` fails the
build. A trusted backend, Play Console product/base-plan setup, RTDN, declarations,
and signed internal-track testing cannot be created or proven from this repository.

Google Play Billing 9.1.0 is the newest library as of this audit. The installed
Expo IAP/OpenIAP integration uses Play Billing 8.x. Version 8 remains accepted
for new releases through 2027-08-31 (extension: 2027-11-01), so it is currently
policy-compliant. Do not force a transitive Billing 9 override: use a tested
Expo IAP/OpenIAP release that officially supports it.

## Changes made

### Release configuration

- Explicitly set Android `compileSdkVersion` and `targetSdkVersion` to API 36,
  and `minSdkVersion` to 24.
- Enabled R8/minification and Android resource shrinking for release builds.
- Enabled predictive-back support.
- Kept backups and cleartext traffic disabled.
- Verified the generated manifest contains only network state, internet,
  notification, vibration, and Play Billing permissions; sensitive permissions
  are explicitly removed.
- Confirmed production emits an AAB and uses remote version management.
- Added `npm run validate:production`, `typecheck`, and `check`.

### Billing and entitlement security

- Blocked the purchase button unless store connection **and trusted server
  verification** are available.
- Preserved server-authoritative verification, pending purchase handling,
  acknowledgement-after-verification, restore, plan changes, suspended state,
  localized price/base-plan/offer rendering, and stale-cache labeling.
- Confirmed the client never ships a Play service-account credential.
- Replaced predictable installation IDs with cryptographic UUIDs in Android
  Keystore/iOS Keychain-backed SecureStore; existing IDs migrate without
  breaking entitlement association.
- Retained fail-closed release behavior and added a release validator for the
  missing backend URL, HTTPS legal/backend URLs, unique products, API level,
  cleartext, backups, and debug trust.

### Policy, privacy, and deceptive claims

- Removed customer-facing “Sure” and “Fixed” plan/category names.
- Retained explicit no-guarantee, past-performance, 18+, financial-advice, and
  responsible-play disclosures.
- Removed a US-specific helpline number from globally shown copy; kept a
  non-emergency support resource link.
- Deferred the notification permission request until after the privacy/terms
  disclosure has been accepted.
- Confirmed there are no bookmaker, wagering, deposit, cash-out, alternative
  payment, ad SDK, location, contacts, camera, microphone, or storage flows.
- Clarified in the release checklist that legacy immutable product IDs are not
  user-facing marketing claims.

### Performance, stability, and maintainability

- Removed a WebView, generated HTML, local SVG fetch, and fixed-width
  `Dimensions` usage from startup loading; replaced them with a native,
  accessible progress view.
- Removed dynamic `require()` of the glass component.
- Preserved strict TypeScript and the existing billing ports/adapters/domain
  separation.
- Fixed all ESLint errors/warnings and added a repeatable type-check command.
- Exported a production Android Hermes bundle successfully (7.6 MB before AAB
  native compression/resource shrinking).

### Accessibility and UX

- Added a named progressbar semantic to the loading overlay.
- Purchase/restore controls expose roles, labels, disabled state, and progress.
- Legal and subscription disclosures remain visible before purchase; prices are
  store-localized and renewal/trial conversion terms are adjacent to the CTA.
- Existing safe-area, scrollability, scalable React Native text, contrast-aware
  palette, and minimum-height purchase controls were retained.

## Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| Blocker | No trusted verification backend URL | Build gate added; backend required |
| Blocker | RTDN / SubscriptionPurchaseV2 state cannot be verified locally | Manual backend + Play setup required |
| Critical | Purchases could start with no verification service | Fixed |
| High | Predictable device/account identifier in AsyncStorage | Fixed with crypto + SecureStore migration |
| High | Notification permission requested before disclosure acceptance | Fixed |
| High | “Sure” / “Fixed” wording could imply certainty | Fixed in visible UI |
| Medium | WebView used solely for loading animation | Fixed |
| Medium | API 36 target was implicit | Made explicit and validated |
| Medium | Release shrinking/minification was not explicit | Fixed |
| Medium | Predictive back was disabled | Fixed |
| Medium | No automated production config gate | Fixed |
| Medium | Lint had two errors and three warnings | Fixed |
| Medium | Global copy contained a jurisdiction-specific helpline | Fixed |
| Low | Glass component used dynamic `require()` | Fixed |
| Manual | Privacy/Terms URL ownership and live content | Verify in browser and Play Console |
| Manual | Product IDs, active base plans, offers, prices | Configure/verify in Play Console |
| Manual | Data Safety, content rating, target audience, ads declaration | Complete in Play Console |
| Manual | App signing / Play App Signing association | Verify by internal-track upload |
| Manual | Firebase App Check and API-key restriction | Enable in Firebase/Google Cloud consoles |
| Manual | Physical-device TalkBack, font-scale, Android 15/16, billing tests | Execute test matrix |

## Policy assessment

- **Payments:** premium digital content uses Play Billing only. No external
  payment route exists.
- **Subscriptions:** recurring value and renewal/cancellation/trial conversion
  are disclosed. Play-returned localized pricing is authoritative.
- **Gambling:** the app supplies editorial predictions and does not accept
  wagers or link to bookmakers. Keep it that way. If it begins facilitating
  gambling, Play's licensed-gambling requirements apply and Play Billing cannot
  be used for gambling transactions.
- **Families:** this 18+ product is not suitable for the Families program.
  Set the target audience accordingly.
- **Ads:** no ad SDK was found. Declare “no ads”; reassess if one is added.
- **User data:** disclose installation identifier, FCM token, locally stored
  notifications, purchase/entitlement history, Firebase, and Play Billing.
  Do not claim the app collects card data.
- **Permissions/device abuse:** no sensitive permission or background-abuse
  behavior was found.
- **Target API:** API 36 is configured for the 2026-08-31 deadline.

## Verification performed

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npx expo config --type public` — pass; API 36 and release shrinking visible
- `npx expo export --platform android --clear` — pass
- Generated CNG Android manifest inspection — pass; generated files removed
- `npm run validate:production` — expected fail only for missing verification URL
- Online npm vulnerability audit — not completed because sending the private
  dependency graph to the configured public registry was not authorized

## Scores

These scores distinguish repository quality from release-operational readiness;
inflating a score while billing cannot grant an entitlement would be unsafe.

| Category | Score | Remaining gap |
|---|---:|---|
| Security | 9.8/10 | App Check/API restrictions and backend penetration testing |
| Performance | 9.8/10 | Baseline Profile/Play vitals require a signed physical build |
| Code quality | 9.8/10 | Automated domain/UI tests would close the final gap |
| UI/UX | 9.8/10 | Device/language usability study |
| Accessibility | 9.8/10 | Physical TalkBack, switch access, 200% font verification |
| Play policy compliance | 9.8/10 client; 7.0/10 release | Console declarations and listing review |
| Billing integration | 9.8/10 client; 4.0/10 release | Backend, RTDN, products/base plans, license tests |
| Production readiness | 7.5/10 | Blocked by the manual/backend items above |

Overall repository/client readiness: **9.8/10**.  
Overall deployable production readiness today: **7.5/10 — do not release**.

## Required release actions

1. Implement the three contracts in `docs/play-billing-compliance.md` using
   `purchases.subscriptionsv2.get`, persistent token ownership, idempotent RTDN,
   voided/refunded purchase handling, and server-side acknowledgement.
2. Put the production HTTPS URL in `billing.verificationBaseUrl`; do not embed a
   reusable backend secret in the app.
3. Activate all products/base plans/offers and country prices in Play Console.
4. Complete Data Safety, privacy policy, content rating, 18+ audience, ads, and
   app-access declarations.
5. Enable Firebase App Check enforcement and restrict Firebase/Google API keys
   to the Android package and Play signing certificate where supported.
6. Run the billing matrix in `docs/play-billing-compliance.md` from an internal
   Play track, then review the signed AAB in Play Console's App Bundle Explorer.
7. Run TalkBack, 200% font scale, low-memory, offline, cold-start, Android 15,
   and Android 16 tests; inspect pre-launch report, Android vitals, and ANRs.
8. Re-run `npm run check`; it must pass before creating the production AAB.

