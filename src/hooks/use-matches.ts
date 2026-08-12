import type { Match } from "@/data/mockData";
import { db } from "@/services/firebase";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Returns today's date as a YYYY-MM-DD string in the device's local timezone.
 */
function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useMatchesByCategory(categoryId: string | null) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setMatches([]);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "matches"),
      where("categoryId", "==", categoryId),
      orderBy("date", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Match[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Match, "id">),
        }));
        setMatches(data);
        setLoading(false);
      },
      (err) => {
        console.error("useMatchesByCategory error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [categoryId]);

  return { matches, loading };
}

export function useMatchStats() {
  const [wonCount, setWonCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "matches"), where("status", "==", "won"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWonCount(snapshot.size);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { wonCount, loading };
}

/**
 * Returns a live count of all tips scheduled for today.
 * Uses the `date` field (YYYY-MM-DD string) on each match document.
 * This is a real, non-fabricated metric safe for Play Store compliance.
 */
export function useTodayTipsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getTodayDateString();
    const q = query(collection(db, "matches"), where("date", "==", today));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (err) => {
        console.error("useTodayTipsCount error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { count, loading };
}
