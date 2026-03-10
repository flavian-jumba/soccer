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
  type: "new_tips" | "result" | "kickoff" | "vip_promo";
  title: string;
  body: string;
  categoryIds?: string[]; // e.g. ["btts", "over25"] for new_tips
  read: boolean;
  createdAt: Timestamp;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

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
        setNotifications(data);
        setLoading(false);
      },
      (err) => {
        console.error("useNotifications error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  return { notifications, unreadCount, loading, markAllRead };
}
