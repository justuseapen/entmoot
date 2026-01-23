import { useEffect, useState, useCallback } from "react";
import NetInfo, { NetInfoState, NetInfoStateType } from "@react-native-community/netinfo";

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Whether the device is connected to the internet */
  isConnected: boolean;
  /** Whether the connection is via WiFi */
  isWifi: boolean;
  /** Whether the connection is via cellular */
  isCellular: boolean;
  /** The type of network connection */
  type: NetInfoStateType;
  /** Whether the network is reachable (can access internet) */
  isInternetReachable: boolean | null;
  /** Whether the initial check is complete */
  isLoading: boolean;
}

/**
 * Hook to monitor network connectivity status
 * @returns Network status information
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isWifi: false,
    isCellular: false,
    type: NetInfoStateType.unknown,
    isInternetReachable: null,
    isLoading: true,
  });

  const handleNetInfoChange = useCallback((state: NetInfoState) => {
    setStatus({
      isConnected: state.isConnected ?? false,
      isWifi: state.type === NetInfoStateType.wifi,
      isCellular: state.type === NetInfoStateType.cellular,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    // Fetch initial network state
    NetInfo.fetch().then(handleNetInfoChange);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleNetInfoChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetInfoChange]);

  return status;
}

/**
 * Hook to get simple online/offline status
 * @returns Whether the device is connected to the internet
 */
export function useIsOnline(): boolean {
  const { isConnected, isLoading } = useNetworkStatus();
  // Assume online while loading to avoid flash of offline state
  return isLoading ? true : isConnected;
}

/**
 * Utility function to check current network status (one-time check)
 * @returns Promise resolving to whether device is connected
 */
export async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}
