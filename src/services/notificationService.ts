import { db } from "@/services/firebase";
import * as Notifications from "expo-notifications";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

// ─── 1. Configure foreground notification behaviour ───────────────────────────
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

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[FCM] Notification permission denied");
    return false;
  }

  return true;
}

// ─── 3. Get the raw FCM device token ─────────────────────────────────────────
export async function getDevicePushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data as string;
  } catch (error) {
    console.error("[FCM] Error getting device token:", error);
    return null;
  }
}

// ─── 4. Save token to Firestore ───────────────────────────────────────────────
// PRIVACY: The FCM device token is stored in Firestore under a random device ID.
// It is used exclusively for delivering push notifications and contains no PII.
export async function registerFCMTokenInFirestore(
  deviceId: string,
): Promise<string | null> {
  try {
    const token = await getDevicePushToken();
    if (!token) return null;

    await setDoc(
      doc(db, "fcmTokens", deviceId),
      {
        token,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true }, // safe to call on every app open
    );

    // Privacy: do not log the raw FCM token in production builds
    if (__DEV__) {
      console.log("[FCM] Token registered:", token);
    }
    return token;
  } catch (error) {
    console.error("[FCM] Failed to save token:", error);
    return null;
  }
}

/** Remove a token registration when the user revokes notification access. */
export async function unregisterFCMToken(deviceId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "fcmTokens", deviceId));
  } catch (error) {
    // Best effort: a transient failure must not block app startup.
    console.error("[FCM] Failed to remove device token:", error);
  }
}

// ─── 5. Watch for FCM token rotations ────────────────────────────────────────
// FCM periodically issues new tokens. This keeps Firestore in sync.
export function watchFCMTokenRefresh(deviceId: string): () => void {
  const subscription = Notifications.addPushTokenListener((newToken) => {
    setDoc(
      doc(db, "fcmTokens", deviceId),
      {
        token: newToken.data,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(console.error);
  });
  return () => subscription.remove();
}

// ─── 6. Android notification channels ────────────────────────────────────────
export async function createNotificationChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("general", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: "#3B82F6",
  });

  await Notifications.setNotificationChannelAsync("vip_alerts", {
    name: "VIP Alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FACC15",
  });

  await Notifications.setNotificationChannelAsync("win_notifications", {
    name: "Win Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: "#10B981",
  });
}
