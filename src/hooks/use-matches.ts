import { db } from "@/services/firebase";
import type { Match } from "@/data/mockData";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

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
  const [winRate, setWinRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "matches"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((d) => d.data() as Match);
      const decided = all.filter((m) => m.status !== "pending");
      const won = all.filter((m) => m.status === "won");
      setWonCount(won.length);
      setWinRate(
        decided.length > 0 ? Math.round((won.length / decided.length) * 100) : 0,
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { wonCount, winRate, loading };
}
