import * as SecureStore from "expo-secure-store";

/**
 * Secure storage keys for the Entmoot mobile app
 */
export const STORAGE_KEYS = {
  /** Session token for API authentication */
  SESSION_TOKEN: "session_token",
  /** Cached user data (JSON stringified) */
  USER_DATA: "user_data",
  /** Currently selected family ID */
  FAMILY_ID: "family_id",
  /** Whether biometric auth is enabled (stored as "true" or "false") */
  BIOMETRIC_ENABLED: "biometric_enabled",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Securely stores a value in the device keychain/keystore.
 * Use this for sensitive data like auth tokens.
 *
 * @param key - The storage key (use STORAGE_KEYS constants)
 * @param value - The string value to store
 * @throws Error if storage fails
 */
export async function setItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`[SecureStorage] Failed to set item '${key}':`, error);
    throw new Error(`Failed to save data securely: ${key}`);
  }
}

/**
 * Retrieves a value from secure storage.
 *
 * @param key - The storage key (use STORAGE_KEYS constants)
 * @returns The stored value, or null if not found
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    console.error(`[SecureStorage] Failed to get item '${key}':`, error);
    // Return null instead of throwing - missing data is a valid case
    return null;
  }
}

/**
 * Removes a value from secure storage.
 *
 * @param key - The storage key (use STORAGE_KEYS constants)
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`[SecureStorage] Failed to remove item '${key}':`, error);
    // Don't throw - removing a non-existent key is not an error
  }
}

/**
 * Clears all auth-related secure storage.
 * Call this on logout.
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([
    removeItem(STORAGE_KEYS.SESSION_TOKEN),
    removeItem(STORAGE_KEYS.USER_DATA),
    removeItem(STORAGE_KEYS.FAMILY_ID),
  ]);
}
