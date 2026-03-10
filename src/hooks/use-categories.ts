import { db } from "@/services/firebase";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Category } from "@/data/mockData";

function useCategoriesByTier(isVip: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "categories"),
      where("isVip", "==", isVip),
      orderBy("order", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Category, "id">),
        }));
        setCategories(data);
        setLoading(false);
      },
      (err) => {
        console.error("useCategories error:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isVip]);

  return { categories, loading, error };
}

export function useFreeTips() {
  return useCategoriesByTier(false);
}

export function useVipTips() {
  return useCategoriesByTier(true);
}
