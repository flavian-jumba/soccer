import {
  addChangeListener,
  getLocalNotifications,
  markLocalNotificationsRead,
} from "@/services/localNotificationStore";
import { db } from "@/services/firebase";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export interface AppNotification {
  id: string;
  type: "new_tips" | "result" | "kickoff" | "vip_promo" | "broadcast";
  title: string;
  body: string;
  categoryIds?: string[];
  read: boolean;
  createdAt: Timestamp;
  /** true when this came from a device FCM push (not Firestore) */
  isLocal?: boolean;
}

export function useNotifications() {
  const [firestoreNotifs, setFirestoreNotifs] = useState<AppNotification[]>([]);
  const [localNotifs, setLocalNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Firestore subscription ────────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: AppNotification[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppNotification, "id">),
        }));
        setFirestoreNotifs(data);
        setLoading(false);
      },
      (err) => {
        console.error("useNotifications error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ── Local (FCM push) notifications ───────────────────────────────────────
  const refreshLocal = async () => {
    const raw = await getLocalNotifications();
    const mapped: AppNotification[] = raw.map((n) => ({
      id: n.id,
      type: "broadcast" as const,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: Timestamp.fromMillis(n.receivedAt),
      isLocal: true,
    }));
    setLocalNotifs(mapped);
  };

  useEffect(() => {
    refreshLocal();
    // Re-read whenever _layout.tsx saves a new notification
    const unsubscribe = addChangeListener(refreshLocal);
    return unsubscribe;
  }, []);

  // ── Merge + sort by time ──────────────────────────────────────────────────
  // Deduplicate across sources using the id
  const seen = new Set<string>();
  const merged: AppNotification[] = [...firestoreNotifs, ...localNotifs]
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  const unreadCount = merged.filter((n) => !n.read).length;

  const markAllRead = async () => {
    // Mark Firestore notifications
    const unreadFirestore = firestoreNotifs.filter((n) => !n.read);
    if (unreadFirestore.length > 0) {
      const batch = writeBatch(db);
      unreadFirestore.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    }

    // Mark local notifications
    const unreadLocalIds = localNotifs.filter((n) => !n.read).map((n) => n.id);
    if (unreadLocalIds.length > 0) {
      await markLocalNotificationsRead(unreadLocalIds);
    }
  };

  return { notifications: merged, unreadCount, loading, markAllRead };
}
