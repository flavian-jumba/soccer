/**
 * localNotificationStore
 *
 * Stores FCM push notifications received at runtime (from Firebase Console
 * or Cloud Functions) in AsyncStorage so they appear in the in-app list.
 *
 * Usage:
 *   - Call saveLocalNotification() whenever a push arrives / is tapped
 *   - Subscribe with addChangeListener() to get live updates in hooks
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@titan_local_notifications";
const MAX_STORED = 50; // keep the 50 most recent

export interface LocalNotification {
  id: string;          // uuid-style unique id
  title: string;
  body: string;
  read: boolean;
  receivedAt: number;  // Date.now() ms timestamp
  data?: Record<string, string>;
}

// ── Module-level event bus (no external dependency needed) ────────────────────
type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

export function addChangeListener(fn: ChangeListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getLocalNotifications(): Promise<LocalNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalNotification[]) : [];
  } catch {
    return [];
  }
}

export async function saveLocalNotification(
  notification: Pick<LocalNotification, "title" | "body" | "data">,
): Promise<void> {
  try {
    const existing = await getLocalNotifications();

    // Deduplicate: skip if an identical title+body was received within 5 seconds
    const duplicate = existing.find(
      (n) =>
        n.title === notification.title &&
        n.body === notification.body &&
        Date.now() - n.receivedAt < 5_000,
    );
    if (duplicate) return;

    const newEntry: LocalNotification = {
      id: `fcm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: notification.title,
      body: notification.body,
      read: false,
      receivedAt: Date.now(),
      data: notification.data,
    };

    // Prepend and cap at MAX_STORED
    const updated = [newEntry, ...existing].slice(0, MAX_STORED);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error("[LocalNotifications] save error:", e);
  }
}

export async function markLocalNotificationsRead(
  ids: string[],
): Promise<void> {
  try {
    const existing = await getLocalNotifications();
    const updated = existing.map((n) =>
      ids.includes(n.id) ? { ...n, read: true } : n,
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error("[LocalNotifications] markRead error:", e);
  }
}
