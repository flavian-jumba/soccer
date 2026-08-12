import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "@titan_device_id";

/** Play rejects obfuscated account IDs longer than this. */
const MAX_ACCOUNT_ID_LENGTH = 64;

let cached: string | null = null;
let inFlight: Promise<string> | null = null;

/**
 * Native modules can be temporarily absent when Metro connects to an older
 * development-client binary after dependencies change. Lazy loading prevents a
 * missing optional native module from crashing Expo Router before it can
 * register any route. Production builds include both modules through CNG.
 */
async function secureGet(): Promise<string | null> {
  try {
    const SecureStore = await import("expo-secure-store");
    return await SecureStore.getItemAsync(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

async function secureSet(id: string): Promise<boolean> {
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
}

async function createCryptographicId(): Promise<string> {
  try {
    const Crypto = await import("expo-crypto");
    return Crypto.randomUUID().replace(/-/g, "");
  } catch {
    // Hermes exposes the Web Crypto API in current React Native versions. Keep
    // this fallback so an outdated dev client can still boot before it is rebuilt.
    const webCrypto = globalThis.crypto;
    if (typeof webCrypto?.randomUUID === "function") {
      return webCrypto.randomUUID().replace(/-/g, "");
    }
    if (typeof webCrypto?.getRandomValues === "function") {
      const bytes = webCrypto.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
      );
    }
    throw new Error(
      "No cryptographically secure random generator is available on this device.",
    );
  }
}

/**
 * A stable, random, non-PII installation identifier.
 *
 * The same value already backs push-token registration, so a purchase and a
 * device's notifications resolve to one identity without the app ever
 * collecting a name, email or phone number. It is passed to Play as the
 * obfuscated account ID, which lets the backend attribute a Real-Time Developer
 * Notification to the installation that bought the subscription.
 */
export async function getAppAccountId(): Promise<string> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    let id = await secureGet();
    if (!id) {
      // Preserve the identifier of an existing installation during the
      // AsyncStorage -> encrypted platform storage migration.
      id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    }
    if (!id) {
      id = `device_${await createCryptographicId()}`;
    }
    const secured = await secureSet(id);
    if (secured) {
      await AsyncStorage.removeItem(DEVICE_ID_KEY);
    } else {
      // Compatibility only for a stale development client. Release builds have
      // SecureStore and migrate this value into encrypted storage on next boot.
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    cached = id.slice(0, MAX_ACCOUNT_ID_LENGTH);
    return cached;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/** Reads the identifier without creating one. */
export async function peekAppAccountId(): Promise<string | null> {
  if (cached) return cached;
  return (
    (await secureGet()) ?? (await AsyncStorage.getItem(DEVICE_ID_KEY))
  );
}
