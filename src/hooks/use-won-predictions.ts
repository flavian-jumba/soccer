import { db } from "@/services/firebase";
import type { WonPrediction } from "@/data/mockData";
import {
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useWonPredictions(maxItems = 20) {
  const [predictions, setPredictions] = useState<WonPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "wonPredictions"),
      orderBy("wonAt", "desc"),
      limit(maxItems),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: WonPrediction[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<WonPrediction, "id">),
        }));
        setPredictions(data);
        setLoading(false);
      },
      (err) => {
        console.error("useWonPredictions error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [maxItems]);

  return { predictions, loading };
}
