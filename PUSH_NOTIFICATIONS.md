# Push Notifications — Complete Integration Guide

> Written from the VistaSoccer implementation. Use this as a blueprint to integrate the same system in any Expo + Firebase React Native app.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [How The Full Flow Works](#2-how-the-full-flow-works)
3. [Prerequisites](#3-prerequisites)
4. [Part A — Firebase Project Setup](#4-part-a--firebase-project-setup)
5. [Part B — App Dependencies](#5-part-b--app-dependencies)
6. [Part C — Android Native Configuration](#6-part-c--android-native-configuration)
7. [Part D — app.json Configuration](#7-part-d--appjson-configuration)
8. [Part E — Notification Service (Client)](#8-part-e--notification-service-client)
9. [Part F — Bootstrapping in the App Entry Point](#9-part-f--bootstrapping-in-the-app-entry-point)
10. [Part G — Firestore Rules](#10-part-g--firestore-rules)
11. [Part H — Cloud Functions (Server)](#11-part-h--cloud-functions-server)
12. [Part I — Deploying Everything](#12-part-i--deploying-everything)
13. [Current Status (VistaSoccer)](#13-current-status-vistasoccer)
14. [What Still Needs Doing (VistaSoccer)](#14-what-still-needs-doing-vistasoccer)
15. [Testing Notifications Without Cloud Functions](#15-testing-notifications-without-cloud-functions)
16. [Common Errors and Fixes](#16-common-errors-and-fixes)
17. [Reusing This in Another App — Checklist](#17-reusing-this-in-another-app--checklist)

---

## 1. Architecture Overview

This system uses **Firebase Cloud Messaging (FCM)** as the push delivery layer, with **Firestore** as the token registry and **Cloud Functions** as the trigger engine.

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVICE (App)                            │
│                                                                 │
│  expo-notifications  →  requests permission                     │
│                      →  gets FCM device token                   │
│                      →  saves token to Firestore                │
│                      →  listens for incoming notifications      │
└───────────────────────────────┬─────────────────────────────────┘
                                │  token stored in
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIRESTORE (Database)                        │
│                                                                 │
│  Collection: fcmTokens                                          │
│  Document:   {deviceId}                                         │
│  Fields:     token, platform, updatedAt                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │  document creation triggers
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               CLOUD FUNCTIONS (Server-side)                     │
│                                                                 │
│  notifyWelcome       → fires on new fcmTokens doc               │
│  notifyNewTip        → fires on new gameMatches doc             │
│  notifyVipTip        → fires on new VIP gameMatches doc         │
│  notifyMatchWon      → fires when match status → "won"          │
│  notifyNewPromotion  → fires on new promotions doc              │
└───────────────────────────────┬─────────────────────────────────┘
                                │  calls FCM HTTP API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FCM (Google Servers)                        │
│                                                                 │
│  Routes the notification to each device token                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │  delivered to device
                                ▼
                    Notification appears in tray
```

---

## 2. How The Full Flow Works

### First Install
1. User opens the app for the first time
2. App calls `requestNotificationPermissions()` → Android dialog appears
3. User taps Allow
4. App calls `getDevicePushTokenAsync()` → gets a long FCM token string
5. App generates a stable `deviceId` (stored in AsyncStorage)
6. App writes `{ token, platform, updatedAt }` to `Firestore/fcmTokens/{deviceId}`
7. Cloud Function `notifyWelcome` fires automatically on the new document
8. Welcome notification is delivered to the device

### Subsequent Opens
1. App checks if token has changed (`addPushTokenListener`)
2. If changed, updates the Firestore document with `merge: true`
3. Existing Cloud Functions continue to work — they always read the latest token

### Sending a Broadcast (e.g. new tip posted)
1. Admin writes a new document to `Firestore/gameMatches/{matchId}`
2. Cloud Function `notifyNewTip` fires automatically
3. Function reads all tokens from `Firestore/fcmTokens`
4. Function calls FCM API with all tokens (in batches of 500)
5. All devices receive the notification

---

## 3. Prerequisites

| Requirement | Notes |
|---|---|
| Expo SDK 50+ | This guide uses SDK 54 |
| Firebase project | Must be on **Blaze (pay-as-you-go)** plan for Cloud Functions |
| `google-services.json` | Download from Firebase Console → Project Settings → Android |
| Firebase CLI installed | `npm install -g firebase-tools` |
| EAS CLI installed | `npm install -g eas-cli` |
| Android device / emulator | Expo Go does NOT support FCM — requires a dev or preview build |

> **Critical:** Push notifications DO NOT work in Expo Go. You must build with `expo run:android`, `eas build --profile development`, or `eas build --profile preview`.

---

## 4. Part A — Firebase Project Setup

### Step 1 — Create the Firebase project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable **Firestore Database** (Production mode)
4. Enable **Cloud Messaging**: Project Settings → Cloud Messaging → ensure **Firebase Cloud Messaging API (V1)** is **Enabled**

### Step 2 — Register the Android app
1. Firebase Console → Project Settings → Add App → Android
2. Enter your package name (e.g. `com.yourapp.name`) — must match `app.json`
3. Download `google-services.json`
4. Place it at: `android/app/google-services.json` AND the project root

### Step 3 — Upgrade to Blaze plan
Cloud Functions require Blaze. It's pay-as-you-go with a free tier that covers millions of invocations per month.

Firebase Console → Your Project → Usage & Billing → Modify Plan → Blaze

### Step 4 — Log in with Firebase CLI
```bash
firebase login
```

### Step 5 — Link your project
```bash
firebase use --add
# Select your project from the list
```

---

## 5. Part B — App Dependencies

Install the required packages:

```bash
npx expo install expo-notifications
npx expo install @react-native-async-storage/async-storage
npx expo install expo-constants
```

In `package.json` these will resolve to:
```json
"expo-notifications": "~0.32.x",
"@react-native-async-storage/async-storage": "2.x.x",
"expo-constants": "~18.x.x"
```

---

## 6. Part C — Android Native Configuration

### `android/app/src/main/AndroidManifest.xml`

Add these permissions. Without `POST_NOTIFICATIONS` the system will **never show the permission dialog** on Android 13+ (API 33+) — this is the most common reason notifications appear broken.

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          xmlns:tools="http://schemas.android.com/tools">

  <!-- Required for push notifications -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>         <!-- Android 13+ runtime permission -->
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
  <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>   <!-- FCM legacy receive -->

  <!-- ... rest of manifest -->
</manifest>
```

> **Important:** After editing `AndroidManifest.xml` you must do a **full native rebuild** — Metro hot reload does not pick up manifest changes.

---

## 7. Part D — app.json Configuration

```jsonc
{
  "expo": {
    "android": {
      "package": "com.yourapp.name",
      "googleServicesFile": "./google-services.json",   // path to google-services.json
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "com.google.android.c2dm.permission.RECEIVE",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",  // notification icon (must be white + transparent)
          "color": "#000000",                  // icon background colour
          "defaultChannel": "general",         // must match a channel you create in code
          "sounds": []
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR-EAS-PROJECT-ID"     // from: eas init
      }
    },
    "owner": "your-expo-username"              // must match your expo.dev account
  }
}
```

> **owner + projectId must both belong to the same Expo account you are logged into.** If they don't match, EAS builds will fail with `Entity not authorized`. Run `eas init` to generate a fresh project ID under your account.

---

## 8. Part E — Notification Service (Client)

Create `services/notificationService.ts`:

```typescript
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';

// ─── 1. Configure how notifications appear while app is foregrounded ──────────
export function configureNotifications() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

// ─── 2. Request permission ────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[FCM] Notification permission denied');
        return false;
    }

    return true;
}

// ─── 3. Get the raw FCM token ─────────────────────────────────────────────────
export async function getDevicePushToken(): Promise<string | null> {
    try {
        const token = await Notifications.getDevicePushTokenAsync();
        return token.data as string;
    } catch (error) {
        console.error('[FCM] Error getting device token:', error);
        return null;
    }
}

// ─── 4. Save token to Firestore ───────────────────────────────────────────────
export async function registerFCMTokenInFirestore(deviceId: string): Promise<string | null> {
    try {
        const token = await getDevicePushToken();
        if (!token) return null;

        await setDoc(
            doc(firestore, 'fcmTokens', deviceId),
            {
                token,
                platform: Platform.OS,
                updatedAt: serverTimestamp(),
            },
            { merge: true }   // merge:true means this is safe to call on every app open
        );

        console.log('[FCM] Token registered:', token);
        return token;
    } catch (error) {
        console.error('[FCM] Failed to save token:', error);
        return null;
    }
}

// ─── 5. Watch for token rotations ────────────────────────────────────────────
// FCM periodically rotates tokens. This keeps Firestore in sync.
export function watchFCMTokenRefresh(deviceId: string): () => void {
    const subscription = Notifications.addPushTokenListener((newToken) => {
        setDoc(
            doc(firestore, 'fcmTokens', deviceId),
            {
                token: newToken.data,
                platform: Platform.OS,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        ).catch(console.error);
    });
    return () => subscription.remove();
}

// ─── 6. Android notification channels ────────────────────────────────────────
// Channels must be created BEFORE you send any notification to that channel.
// Channel IDs must match exactly what Cloud Functions send in android.notification.channelId
export async function createNotificationChannels() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#3B82F6',
        sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('vip_alerts', {
        name: 'VIP Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FACC15',
        sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('win_notifications', {
        name: 'Win Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#10B981',
        sound: 'default',
    });
}
```

---

## 9. Part F — Bootstrapping in the App Entry Point

In `app/_layout.tsx` (or your root component), initialise everything inside a `useEffect`. All notification code is **dynamically imported** — this prevents `expo-notifications` from crashing at module evaluation time inside Expo Go.

```tsx
import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo Go does not support FCM — skip all notification code inside it
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Generate a stable per-device ID (no auth required)
async function getOrCreateDeviceId(): Promise<string> {
    const KEY = '@app_device_id';
    let id = await AsyncStorage.getItem(KEY);
    if (!id) {
        id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await AsyncStorage.setItem(KEY, id);
    }
    return id;
}

export default function RootLayout() {
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        if (isExpoGo) return;   // ← skip in Expo Go

        (async () => {
            // Dynamic imports prevent native module errors in Expo Go
            const Notifications = await import('expo-notifications');
            const {
                configureNotifications,
                createNotificationChannels,
                requestNotificationPermissions,
                registerFCMTokenInFirestore,
                watchFCMTokenRefresh,
            } = await import('@/services/notificationService');

            // Step 1: Set foreground notification behaviour
            configureNotifications();

            // Step 2: Create Android channels (safe to call repeatedly)
            await createNotificationChannels();

            // Step 3: Ask user for permission
            const granted = await requestNotificationPermissions();
            if (!granted) return;   // User denied — stop here

            // Step 4: Get stable device ID and save token to Firestore
            const deviceId = await getOrCreateDeviceId();
            await registerFCMTokenInFirestore(deviceId);

            // Step 5: Keep token fresh if FCM rotates it
            watchFCMTokenRefresh(deviceId);

            // Step 6: Handle notification arriving while app is open
            notificationListener.current =
                Notifications.addNotificationReceivedListener((notification) => {
                    console.log('[FCM] Foreground notification:', notification);
                    // Optionally show an in-app toast here
                });

            // Step 7: Handle user tapping a notification
            responseListener.current =
                Notifications.addNotificationResponseReceivedListener((response) => {
                    const data = response.notification.request.content.data as Record<string, string>;
                    // Navigate based on the action field from the notification payload
                    if (data?.action === 'subscribe') {
                        // router.push('/vip')
                    } else if (data?.action === 'view_slip') {
                        // router.push('/home')
                    }
                });
        })();

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // ... return your layout
}
```

---

## 10. Part G — Firestore Rules

The app writes to `fcmTokens` **without authentication** (device-level, no login needed). These rules allow that while protecting all reads from the client.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // FCM tokens — any device can register/refresh its own token
    match /fcmTokens/{deviceId} {
      allow read:          if false;          // Only Cloud Functions (Admin SDK) can read
      allow create, update: if true;          // Any device can write its token
      allow delete:        if false;
    }

    // Add your other collections below:
    // match /gameMatches/{doc} { allow read: if true; allow write: if false; }
  }
}
```

Deploy with:
```bash
firebase deploy --only firestore:rules
```

---

## 11. Part H — Cloud Functions (Server)

Cloud Functions live in `functions/src/`. They are the only part that can call the FCM API reliably — they run as a trusted Firebase Admin with full access.

### `functions/src/helpers.ts`

```typescript
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions/v2';

// Fetch all registered tokens from Firestore
export async function getAllTokens(): Promise<string[]> {
    const snap = await getFirestore().collection('fcmTokens').get();
    return snap.docs
        .map((d) => (d.data().token as string | undefined) ?? '')
        .filter((t) => t.length > 0);
}

// Send to all tokens, automatically chunking at 500 (FCM limit)
// Also cleans up stale/invalid tokens automatically
export async function sendMulticast(
    tokens: string[],
    message: Omit<MulticastMessage, 'tokens'>
): Promise<void> {
    if (tokens.length === 0) return;

    const messaging = getMessaging();
    const CHUNK_SIZE = 500;

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const chunk = tokens.slice(i, i + CHUNK_SIZE);
        const result = await messaging.sendEachForMulticast({ ...message, tokens: chunk });

        // Remove tokens that FCM says are invalid or unregistered
        const invalidTokens = result.responses
            .map((r, idx) => (!r.success &&
                (r.error?.code === 'messaging/invalid-registration-token' ||
                 r.error?.code === 'messaging/registration-token-not-registered'))
                ? chunk[idx] : null)
            .filter(Boolean) as string[];

        if (invalidTokens.length > 0) {
            const db = getFirestore();
            const batch = db.batch();
            const stale = await db.collection('fcmTokens')
                .where('token', 'in', invalidTokens).get();
            stale.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
            logger.info(`Cleaned up ${invalidTokens.length} stale tokens`);
        }
    }
}

export const CHANNELS = {
    VIP:     'vip_alerts',
    WIN:     'win_notifications',
    GENERAL: 'general',
} as const;
```

### `functions/src/index.ts`

```typescript
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { getAllTokens, sendMulticast, CHANNELS } from './helpers';

initializeApp();

// ── Trigger 0: Welcome on first install ───────────────────────────────────────
// Fires when a new device saves its FCM token (i.e. first app open after install)
export const notifyWelcome = onDocumentCreated(
    { document: 'fcmTokens/{deviceId}', region: 'us-central1' },
    async (event) => {
        const token = event.data?.data()?.token as string | undefined;
        if (!token) return;

        await getMessaging().send({
            token,
            notification: {
                title: '👋 Welcome!',
                body: 'Thanks for installing. Your first tips are ready.',
            },
            data: { action: 'open_app', type: 'welcome' },
            android: { notification: { channelId: CHANNELS.GENERAL, priority: 'high' } },
            apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
        });
    }
);

// ── Trigger 1: New content posted → broadcast to all users ────────────────────
export const notifyNewContent = onDocumentCreated(
    { document: 'gameMatches/{matchId}', region: 'us-central1' },
    async (event) => {
        const match = event.data?.data();
        if (!match || match.isVip) return;   // VIP handled separately

        const tokens = await getAllTokens();
        await sendMulticast(tokens, {
            notification: {
                title: '⚽ New Prediction!',
                body: `${match.homeTeam} vs ${match.awayTeam} — ${match.prediction} @ ${match.odds}x`,
            },
            data: { action: 'view_slip', matchId: event.params.matchId, type: 'new_tip' },
            android: { notification: { channelId: CHANNELS.GENERAL, priority: 'high' } },
            apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
        });
    }
);

// ── Trigger 2: Status update → notify on "won" ────────────────────────────────
export const notifyMatchWon = onDocumentUpdated(
    { document: 'gameMatches/{matchId}', region: 'us-central1' },
    async (event) => {
        const before = event.data?.before.data();
        const after  = event.data?.after.data();
        if (!before || !after) return;
        if (before.status === after.status || after.status !== 'won') return;

        const tokens = await getAllTokens();
        await sendMulticast(tokens, {
            notification: {
                title: '🎉 Your Slip WON!',
                body: `${after.homeTeam} vs ${after.awayTeam} at ${after.odds}x — WON!`,
            },
            data: { action: 'view_slip', matchId: event.params.matchId, type: 'win_alert' },
            android: { notification: { channelId: CHANNELS.WIN, priority: 'max', color: '#10B981' } },
            apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
        });
    }
);

// ── Trigger 3: Manual broadcast via Firestore Console ─────────────────────────
// Write a doc to `promotions` with { title, body, action?, isVipPromo? }
// and all users instantly receive it. No code deploy needed.
export const notifyNewPromotion = onDocumentCreated(
    { document: 'promotions/{promoId}', region: 'us-central1' },
    async (event) => {
        const promo = event.data?.data();
        if (!promo) return;

        const tokens = await getAllTokens();
        await sendMulticast(tokens, {
            notification: {
                title: promo.title ?? '🔥 Special Offer!',
                body:  promo.body  ?? 'Tap to see the latest update.',
            },
            data: { action: promo.action ?? 'open_app', promoId: event.params.promoId, type: 'promotion' },
            android: { notification: {
                channelId: promo.isVipPromo ? CHANNELS.VIP : CHANNELS.GENERAL,
                priority: 'high',
                color: promo.isVipPromo ? '#FACC15' : '#3B82F6',
            }},
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });
    }
);
```

### `functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

### `functions/package.json` — required dependencies

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "tsc"
  },
  "engines": {
    "node": "20"
  }
}
```

---

## 12. Part I — Deploying Everything

Run these commands once, in this exact order:

```bash
# 1. Log into Firebase CLI
firebase login

# 2. Deploy Firestore security rules
firebase deploy --only firestore:rules

# 3. Build + deploy Cloud Functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions

# 4. Build the native Android app (picks up AndroidManifest changes)
eas build --platform android --profile preview
# OR if building locally:
npx expo run:android
```

> Every time you change Cloud Functions code, re-run steps 3's deploy command.  
> Every time you change AndroidManifest.xml or app.json native config, re-run step 4.  
> JS/TS changes in services/ or contexts/ can be hot-reloaded with Metro (development build only).

---

## 13. Current Status (VistaSoccer)

| Item | Status |
|---|---|
| `expo-notifications` installed | ✅ Done |
| `google-services.json` in place | ✅ Done |
| `POST_NOTIFICATIONS` in AndroidManifest | ✅ Done |
| `app.json` permissions + plugin configured | ✅ Done |
| `app.json` owner + projectId fixed | ✅ Done |
| `notificationService.ts` implemented | ✅ Done |
| `_layout.tsx` bootstraps notifications | ✅ Done |
| Firestore rules deployed | ✅ Deployed |
| FCM token saving to Firestore (verified) | ✅ Working — token logs in Metro |
| Cloud Functions written | ✅ Written |
| Cloud Functions deployed | ❌ Blocked by Spark plan |
| Firebase project on Blaze plan | ❌ Not yet upgraded |

---

## 14. What Still Needs Doing (VistaSoccer)

### Step 1 — Upgrade Firebase to Blaze plan
Visit: https://console.firebase.google.com/project/soccer-vista-scores/usage/details  
Select Blaze → confirm. No cost until you exceed the free tier.

### Step 2 — Deploy Cloud Functions
```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
```

### Step 3 — Verify FCM API is enabled
Firebase Console → Project Settings → Cloud Messaging  
Ensure **Firebase Cloud Messaging API (V1)** is **Enabled**.

### Step 4 — Wire up navigation in `_layout.tsx`
The tap handler already exists. Add the actual navigation calls:
```typescript
if (data?.action === 'subscribe') {
    router.push('/vip');          // navigate to VIP screen
} else if (data?.action === 'view_slip') {
    router.push('/home');         // navigate to tips screen
}
```

---

## 15. Testing Notifications Without Cloud Functions

While you are on the Spark plan (before upgrading), you can send test notifications manually:

### Option A — Firebase Console
1. Firebase Console → **Engage → Messaging → New Campaign**
2. Choose **Firebase Notification messages**
3. Fill in title + body
4. Under **Target** → select your app
5. Send now

### Option B — FCM HTTP API directly (using your token)
Copy the FCM token logged in Metro (`[FCM] Token registered: ...`) and run:

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/YOUR-PROJECT-ID/messages:send \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "YOUR-DEVICE-TOKEN",
      "notification": { "title": "Test", "body": "Hello from FCM" },
      "android": { "notification": { "channelId": "general" } }
    }
  }'
```

---

## 16. Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| Permission dialog never shows | `POST_NOTIFICATIONS` missing from AndroidManifest.xml | Add it, then do a native rebuild |
| `Missing or insufficient permissions` | Firestore rules not deployed | `firebase deploy --only firestore:rules` |
| `Entity not authorized: AppEntity[...]` | `projectId` / `owner` in app.json belongs to a different Expo account | Remove both fields, run `eas init` to re-register |
| `GraphQL request failed` / network timeout | EAS CLI too old or not logged in | `npm install -g eas-cli` then `eas login` |
| `cloudfunctions.googleapis.com can't be enabled` | Firebase project on Spark (free) plan | Upgrade to Blaze plan |
| Notifications work in Expo Go | They won't — FCM is blocked in Expo Go | Use `eas build --profile preview` or `expo run:android` |
| Token registers but notifications never arrive | Cloud Functions not deployed | `firebase deploy --only functions` |
| Old token becoming invalid | FCM rotates tokens periodically | `watchFCMTokenRefresh()` handles this automatically |

---

## 17. Reusing This in Another App — Checklist

Use this checklist when starting fresh on a new app:

```
FIREBASE
[ ] Create Firebase project
[ ] Register Android app, download google-services.json
[ ] Enable Cloud Messaging API V1 in Project Settings
[ ] Upgrade project to Blaze plan
[ ] firebase login

APP CONFIG
[ ] Place google-services.json at android/app/google-services.json and project root
[ ] Add expo-notifications plugin to app.json with icon, color, defaultChannel
[ ] Add POST_NOTIFICATIONS, VIBRATE, RECEIVE_BOOT_COMPLETED to app.json permissions
[ ] Set correct owner (your Expo username) in app.json
[ ] Run eas init to get a projectId under your account

NATIVE ANDROID
[ ] Add POST_NOTIFICATIONS to android/app/src/main/AndroidManifest.xml
[ ] Add RECEIVE_BOOT_COMPLETED to AndroidManifest.xml
[ ] Add com.google.android.c2dm.permission.RECEIVE to AndroidManifest.xml

CLIENT CODE
[ ] Copy services/notificationService.ts — update the Firestore import path
[ ] Add configureNotifications(), createNotificationChannels() calls in _layout.tsx
[ ] Add requestNotificationPermissions() + registerFCMTokenInFirestore() in _layout.tsx
[ ] Add watchFCMTokenRefresh() for token rotation handling
[ ] Add notification tap handler in _layout.tsx with navigation logic
[ ] Wrap everything in isExpoGo check + dynamic imports

FIRESTORE RULES
[ ] Add fcmTokens rule: allow create, update: if true; allow read: if false
[ ] firebase deploy --only firestore:rules

CLOUD FUNCTIONS
[ ] Copy functions/ folder, update package.json with your app name
[ ] Rename notification titles/bodies
[ ] Update Firestore collection names to match your schema
[ ] cd functions && npm install && npm run build && cd ..
[ ] firebase deploy --only functions

BUILD
[ ] eas build --platform android --profile preview
[ ] Install APK on device
[ ] Confirm [FCM] Token registered log appears in Metro
[ ] Send test notification from Firebase Console → Messaging
```
