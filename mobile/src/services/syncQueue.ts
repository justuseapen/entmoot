import { storage } from "./offlineStorage";
import { apiClient } from "@/lib/api";
import NetInfo from "@react-native-community/netinfo";

/**
 * Sync queue storage key
 */
const SYNC_QUEUE_KEY = "sync:queue";

/**
 * HTTP methods supported by the sync queue
 */
export type SyncMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * A single item in the sync queue
 */
export interface SyncQueueItem {
  /** Unique identifier for this queue item */
  id: string;
  /** Description of the action for logging/debugging */
  action: string;
  /** API endpoint to call */
  endpoint: string;
  /** HTTP method to use */
  method: SyncMethod;
  /** Request payload (for POST, PATCH, PUT) */
  payload?: unknown;
  /** Timestamp when the item was added to the queue */
  timestamp: number;
  /** Number of times this item has been retried */
  retryCount: number;
}

/**
 * Result of processing a queue item
 */
interface ProcessResult {
  success: boolean;
  shouldRemove: boolean;
  error?: string;
}

/**
 * Maximum number of retries before giving up on an item
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (in milliseconds)
 */
const BASE_DELAY_MS = 1000;

/**
 * Flag to prevent concurrent queue processing
 */
let isProcessing = false;

/**
 * Listeners for sync queue events
 */
type SyncQueueListener = (event: "start" | "complete" | "error", item?: SyncQueueItem) => void;
const listeners: Set<SyncQueueListener> = new Set();

/**
 * Generate a unique ID for queue items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get all items from the sync queue
 * @returns Array of sync queue items
 */
export function getQueue(): SyncQueueItem[] {
  try {
    const serialized = storage.getString(SYNC_QUEUE_KEY);
    if (!serialized) {
      return [];
    }
    return JSON.parse(serialized) as SyncQueueItem[];
  } catch (error) {
    console.error("[syncQueue] Error reading queue:", error);
    return [];
  }
}

/**
 * Save the queue to storage
 */
function saveQueue(queue: SyncQueueItem[]): void {
  try {
    storage.set(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("[syncQueue] Error saving queue:", error);
  }
}

/**
 * Add an item to the sync queue
 * @param item Partial item (id, timestamp, retryCount are auto-generated)
 */
export function addToQueue(item: Omit<SyncQueueItem, "id" | "timestamp" | "retryCount">): void {
  const queue = getQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: generateId(),
    timestamp: Date.now(),
    retryCount: 0,
  };
  queue.push(newItem);
  saveQueue(queue);
  console.log(`[syncQueue] Added item: ${newItem.action} (${newItem.id})`);
}

/**
 * Remove an item from the queue by ID
 * @param id ID of the item to remove
 */
export function removeFromQueue(id: string): void {
  const queue = getQueue();
  const filteredQueue = queue.filter((item) => item.id !== id);
  saveQueue(filteredQueue);
  console.log(`[syncQueue] Removed item: ${id}`);
}

/**
 * Update an item in the queue
 */
function updateQueueItem(id: string, updates: Partial<SyncQueueItem>): void {
  const queue = getQueue();
  const index = queue.findIndex((item) => item.id === id);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    saveQueue(queue);
  }
}

/**
 * Clear all items from the queue
 */
export function clearQueue(): void {
  try {
    storage.remove(SYNC_QUEUE_KEY);
    console.log("[syncQueue] Queue cleared");
  } catch (error) {
    console.error("[syncQueue] Error clearing queue:", error);
  }
}

/**
 * Get the number of items in the queue
 */
export function getQueueLength(): number {
  return getQueue().length;
}

/**
 * Check if the queue has pending items
 */
export function hasQueuedItems(): boolean {
  return getQueueLength() > 0;
}

/**
 * Calculate delay for exponential backoff
 * @param retryCount Current retry count
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(retryCount: number): number {
  // 1s, 2s, 4s for retries 0, 1, 2
  return BASE_DELAY_MS * Math.pow(2, retryCount);
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single queue item
 */
async function processItem(item: SyncQueueItem): Promise<ProcessResult> {
  try {
    console.log(`[syncQueue] Processing: ${item.action} (attempt ${item.retryCount + 1}/${MAX_RETRIES + 1})`);

    // Execute the API call based on method
    const options: { method: string; body?: string } = { method: item.method };
    if (item.payload && ["POST", "PATCH", "PUT"].includes(item.method)) {
      options.body = JSON.stringify(item.payload);
    }

    await apiClient.fetch(item.endpoint, options);

    console.log(`[syncQueue] Success: ${item.action}`);
    return { success: true, shouldRemove: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[syncQueue] Error processing ${item.action}:`, errorMessage);

    // Check for 409 Conflict - server has newer data, remove from queue
    if (errorMessage.includes("409") || errorMessage.toLowerCase().includes("conflict")) {
      console.log(`[syncQueue] Conflict detected for ${item.action}, removing from queue`);
      return { success: false, shouldRemove: true, error: "Conflict - server has newer data" };
    }

    // Check if we should retry
    if (item.retryCount < MAX_RETRIES) {
      // Update retry count
      updateQueueItem(item.id, { retryCount: item.retryCount + 1 });
      return { success: false, shouldRemove: false, error: errorMessage };
    }

    // Max retries reached, remove from queue
    console.log(`[syncQueue] Max retries reached for ${item.action}, removing from queue`);
    return { success: false, shouldRemove: true, error: `Max retries reached: ${errorMessage}` };
  }
}

/**
 * Process all items in the sync queue sequentially
 * Implements exponential backoff for retries
 */
export async function processQueue(): Promise<void> {
  // Prevent concurrent processing
  if (isProcessing) {
    console.log("[syncQueue] Queue processing already in progress");
    return;
  }

  // Check network connectivity first
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    console.log("[syncQueue] No network connection, skipping queue processing");
    return;
  }

  const queue = getQueue();
  if (queue.length === 0) {
    console.log("[syncQueue] Queue is empty");
    return;
  }

  isProcessing = true;
  notifyListeners("start");
  console.log(`[syncQueue] Starting queue processing (${queue.length} items)`);

  try {
    // Process items sequentially
    for (const item of queue) {
      // Re-check network before each item
      const currentNetState = await NetInfo.fetch();
      if (!currentNetState.isConnected) {
        console.log("[syncQueue] Lost network connection, pausing queue processing");
        break;
      }

      // Apply backoff delay if this is a retry
      if (item.retryCount > 0) {
        const delay = calculateBackoffDelay(item.retryCount - 1);
        console.log(`[syncQueue] Waiting ${delay}ms before retry`);
        await sleep(delay);
      }

      notifyListeners("start", item);
      const result = await processItem(item);

      if (result.shouldRemove) {
        removeFromQueue(item.id);
        if (result.success) {
          notifyListeners("complete", item);
        } else {
          notifyListeners("error", item);
        }
      }
    }

    console.log("[syncQueue] Queue processing complete");
  } finally {
    isProcessing = false;
    notifyListeners("complete");
  }
}

/**
 * Check if queue is currently being processed
 */
export function isQueueProcessing(): boolean {
  return isProcessing;
}

/**
 * Add a listener for sync queue events
 */
export function addSyncQueueListener(listener: SyncQueueListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all listeners of an event
 */
function notifyListeners(event: "start" | "complete" | "error", item?: SyncQueueItem): void {
  listeners.forEach((listener) => {
    try {
      listener(event, item);
    } catch (error) {
      console.error("[syncQueue] Listener error:", error);
    }
  });
}

/**
 * Network change unsubscribe function holder
 */
let networkUnsubscribe: (() => void) | null = null;

/**
 * Start listening for network changes to trigger queue processing
 */
export function startNetworkListener(): void {
  if (networkUnsubscribe) {
    console.log("[syncQueue] Network listener already active");
    return;
  }

  console.log("[syncQueue] Starting network listener");

  let wasOffline = false;

  networkUnsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected ?? false;

    if (isOnline && wasOffline) {
      console.log("[syncQueue] Network restored, processing queue");
      // Small delay to ensure connection is stable
      setTimeout(() => {
        processQueue();
      }, 1000);
    }

    wasOffline = !isOnline;
  });

  // Check initial state
  NetInfo.fetch().then((state) => {
    wasOffline = !(state.isConnected ?? false);
  });
}

/**
 * Stop listening for network changes
 */
export function stopNetworkListener(): void {
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
    console.log("[syncQueue] Network listener stopped");
  }
}
