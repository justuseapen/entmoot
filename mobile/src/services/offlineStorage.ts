import { createMMKV, type MMKV } from "react-native-mmkv";

// Initialize MMKV storage instance
export const storage: MMKV = createMMKV({
  id: "entmoot-offline-storage",
});

/**
 * Cache keys for offline data persistence
 */
export const CACHE_KEYS = {
  DAILY_PLAN: "cache:daily_plan",
  HABITS: "cache:habits",
  GOALS: "cache:goals",
  USER_PROFILE: "cache:user_profile",
  WEEKLY_REVIEW: "cache:weekly_review",
  FAMILY_MEMBERS: "cache:family_members",
  NOTIFICATION_PREFERENCES: "cache:notification_preferences",
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

/**
 * Set data in cache with JSON serialization
 * @param key Cache key
 * @param data Data to cache (will be JSON serialized)
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    storage.set(key, serialized);
  } catch (error) {
    console.error(`[offlineStorage] Error setting cache for key "${key}":`, error);
  }
}

/**
 * Get data from cache with JSON deserialization
 * @param key Cache key
 * @returns Cached data or null if not found/invalid
 */
export function getCache<T>(key: string): T | null {
  try {
    const serialized = storage.getString(key);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`[offlineStorage] Error getting cache for key "${key}":`, error);
    return null;
  }
}

/**
 * Clear a specific cache key
 * @param key Cache key to clear
 */
export function clearCache(key: string): void {
  try {
    storage.remove(key);
  } catch (error) {
    console.error(`[offlineStorage] Error clearing cache for key "${key}":`, error);
  }
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  try {
    Object.values(CACHE_KEYS).forEach((key) => {
      storage.remove(key);
    });
  } catch (error) {
    console.error("[offlineStorage] Error clearing all cache:", error);
  }
}

/**
 * Check if a cache key exists
 * @param key Cache key to check
 * @returns True if key exists
 */
export function hasCache(key: string): boolean {
  return storage.contains(key);
}

/**
 * Get cache with timestamp metadata
 */
interface CacheWithTimestamp<T> {
  data: T;
  timestamp: number;
}

/**
 * Set cache with timestamp for staleness checking
 * @param key Cache key
 * @param data Data to cache
 */
export function setCacheWithTimestamp<T>(key: string, data: T): void {
  const cacheData: CacheWithTimestamp<T> = {
    data,
    timestamp: Date.now(),
  };
  setCache(key, cacheData);
}

/**
 * Get cache with timestamp metadata
 * @param key Cache key
 * @returns Cached data with timestamp or null
 */
export function getCacheWithTimestamp<T>(key: string): CacheWithTimestamp<T> | null {
  return getCache<CacheWithTimestamp<T>>(key);
}

/**
 * Check if cached data is stale based on max age
 * @param key Cache key
 * @param maxAgeMs Maximum age in milliseconds
 * @returns True if cache is stale or doesn't exist
 */
export function isCacheStale(key: string, maxAgeMs: number): boolean {
  const cached = getCacheWithTimestamp<unknown>(key);
  if (!cached) {
    return true;
  }
  const age = Date.now() - cached.timestamp;
  return age > maxAgeMs;
}
