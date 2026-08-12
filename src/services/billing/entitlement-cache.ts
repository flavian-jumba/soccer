import type { EntitlementStore } from "@/domain/billing/ports";
import type { EntitlementSnapshot } from "@/domain/billing/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@titan_entitlements_v1";

/**
 * Last known entitlement snapshot, persisted locally.
 *
 * This is a availability cushion, not an authority: it keeps a paying user's
 * access working through a cold start or an offline launch while the server is
 * re-queried. Anything read back is marked `stale`, and expiry is still checked
 * against the clock, so a cached snapshot cannot outlive the subscription.
 */
export class AsyncStorageEntitlementStore implements EntitlementStore {
  async read(): Promise<EntitlementSnapshot | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as EntitlementSnapshot;
      if (!Array.isArray(parsed?.entitlements)) return null;

      return { ...parsed, stale: true };
    } catch (error) {
      if (__DEV__) console.warn("[billing] entitlement cache read failed:", error);
      return null;
    }
  }

  async write(snapshot: EntitlementSnapshot): Promise<void> {
    try {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({ ...snapshot, stale: false }),
      );
    } catch (error) {
      if (__DEV__) console.warn("[billing] entitlement cache write failed:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // A failed cache clear is not worth surfacing; the next write overwrites it.
    }
  }
}
