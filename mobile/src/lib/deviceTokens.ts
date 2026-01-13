import { authFetch } from "./api";
import type {
  DeviceToken,
  CreateDeviceTokenData,
  DeleteDeviceTokenData,
} from "@shared/types";

/**
 * Register a device token with the backend for push notifications
 */
export async function registerDeviceToken(
  data: CreateDeviceTokenData
): Promise<DeviceToken> {
  return authFetch<DeviceToken>("/device_tokens", {
    method: "POST",
    body: JSON.stringify({ device_token: data }),
  });
}

/**
 * Unregister a device token from the backend
 */
export async function unregisterDeviceToken(
  data: DeleteDeviceTokenData
): Promise<void> {
  await authFetch<void>("/device_tokens/unregister", {
    method: "DELETE",
    body: JSON.stringify({ device_token: data }),
  });
}

/**
 * Unregister a device token by ID
 */
export async function deleteDeviceToken(id: number): Promise<void> {
  await authFetch<void>(`/device_tokens/${id}`, {
    method: "DELETE",
  });
}
