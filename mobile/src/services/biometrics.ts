import * as LocalAuthentication from "expo-local-authentication";

import { getItem, setItem, STORAGE_KEYS } from "./secureStorage";

/**
 * Biometric authentication service for Face ID / Touch ID support.
 * Provides methods to check availability, authenticate, and manage preferences.
 */

/**
 * Checks if biometric authentication is available on the device.
 * Returns true if the device has enrolled biometrics (Face ID or Touch ID).
 *
 * @returns Promise<boolean> - true if biometrics are available and enrolled
 */
export async function isAvailable(): Promise<boolean> {
  try {
    // Check if hardware supports biometrics
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return false;
    }

    // Check if user has enrolled biometrics
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return false;
    }

    // Check security level - ensure we have biometric-capable hardware
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
    return (
      securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG ||
      securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
    );
  } catch (error) {
    console.error("[Biometrics] Failed to check availability:", error);
    return false;
  }
}

/**
 * Gets the type of biometric authentication available on the device.
 *
 * @returns Promise<string> - "Face ID", "Touch ID", or "Biometric" (generic)
 */
export async function getBiometricType(): Promise<string> {
  try {
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      )
    ) {
      return "Face ID";
    }
    if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT
      )
    ) {
      return "Touch ID";
    }
    return "Biometric";
  } catch (error) {
    console.error("[Biometrics] Failed to get biometric type:", error);
    return "Biometric";
  }
}

/**
 * Prompts the user for biometric authentication.
 * Shows the native Face ID / Touch ID prompt.
 *
 * @returns Promise<boolean> - true if authentication succeeded, false otherwise
 */
export async function authenticate(): Promise<boolean> {
  try {
    const biometricType = await getBiometricType();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Unlock Entmoot with ${biometricType}`,
      cancelLabel: "Use Password",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return true;
    }

    // Log the failure reason for debugging
    if (result.error) {
      console.log("[Biometrics] Authentication failed:", result.error);
    }

    return false;
  } catch (error) {
    console.error("[Biometrics] Authentication error:", error);
    return false;
  }
}

/**
 * Checks if the user has enabled biometric authentication in the app.
 *
 * @returns Promise<boolean> - true if biometric preference is enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled === "true";
  } catch (error) {
    console.error("[Biometrics] Failed to get preference:", error);
    return false;
  }
}

/**
 * Sets the user's biometric authentication preference.
 *
 * @param enabled - Whether to enable biometric authentication
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? "true" : "false");
  } catch (error) {
    console.error("[Biometrics] Failed to set preference:", error);
    throw error;
  }
}

/**
 * Checks if biometrics should be prompted on app foreground.
 * Returns true if:
 * 1. Biometric preference is enabled
 * 2. Device has biometric capability
 * 3. User has a stored session
 *
 * @param hasStoredSession - Whether user has a stored session token
 * @returns Promise<boolean> - true if biometric prompt should be shown
 */
export async function shouldPromptBiometric(
  hasStoredSession: boolean
): Promise<boolean> {
  if (!hasStoredSession) {
    return false;
  }

  const available = await isAvailable();
  if (!available) {
    return false;
  }

  const enabled = await isBiometricEnabled();
  return enabled;
}
