import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type {
  User,
  AuthResponse,
  LoginData,
  RegisterData,
} from "@shared/types";
import * as authApi from "../lib/auth";
import { apiClient } from "../lib/api";
import {
  registerForPushNotifications,
  unregisterFromPushNotifications,
} from "../lib/pushNotifications";

// Storage keys
const TOKEN_KEY = "entmoot_access_token";
const REFRESH_TOKEN_KEY = "entmoot_refresh_token";
const USER_KEY = "entmoot_user";
const FAMILY_ID_KEY = "entmoot_family_id";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  currentFamilyId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentFamily: (familyId: number | null) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

// Helper to save auth data to secure store
async function saveToSecureStore(
  token: string,
  refreshToken: string,
  user: User
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

// Helper to clear auth data from secure store
async function clearSecureStore(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
    SecureStore.deleteItemAsync(FAMILY_ID_KEY),
  ]);
}

// Helper to load auth data from secure store
async function loadFromSecureStore(): Promise<{
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  familyId: number | null;
}> {
  const [token, refreshToken, userJson, familyIdStr] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
    SecureStore.getItemAsync(FAMILY_ID_KEY),
  ]);

  let user: User | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson) as User;
    } catch {
      // Invalid JSON, ignore
    }
  }

  const familyId = familyIdStr ? parseInt(familyIdStr, 10) : null;

  return { token, refreshToken, user, familyId };
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Set up token refresh callback
  apiClient.setOnTokenRefresh(async (newToken, newRefreshToken) => {
    const { user } = get();
    if (user) {
      await saveToSecureStore(newToken, newRefreshToken, user);
      set({ token: newToken, refreshToken: newRefreshToken });
    }
  });

  // Set up auth error callback (for when refresh fails)
  apiClient.setOnAuthError(async () => {
    await clearSecureStore();
    apiClient.setTokens(null, null);
    set({
      user: null,
      token: null,
      refreshToken: null,
      currentFamilyId: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  return {
    user: null,
    token: null,
    refreshToken: null,
    currentFamilyId: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
      try {
        set({ isLoading: true });

        const { token, refreshToken, user, familyId } =
          await loadFromSecureStore();

        if (token && refreshToken && user) {
          // Set tokens in API client
          apiClient.setTokens(token, refreshToken);

          // Try to verify the token by fetching current user
          try {
            const currentUser = await authApi.getCurrentUser(token);
            set({
              user: currentUser,
              token,
              refreshToken,
              currentFamilyId: familyId,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } catch {
            // Token might be expired, try to refresh
            try {
              const refreshResult = await authApi.refreshTokens(refreshToken);
              apiClient.setTokens(
                refreshResult.token,
                refreshResult.refresh_token
              );

              const currentUser = await authApi.getCurrentUser(
                refreshResult.token
              );
              await saveToSecureStore(
                refreshResult.token,
                refreshResult.refresh_token,
                currentUser
              );

              set({
                user: currentUser,
                token: refreshResult.token,
                refreshToken: refreshResult.refresh_token,
                currentFamilyId: familyId,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              });
            } catch {
              // Refresh failed, clear everything
              await clearSecureStore();
              apiClient.setTokens(null, null);
              set({
                user: null,
                token: null,
                refreshToken: null,
                currentFamilyId: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
              });
            }
          }
        } else {
          set({
            isLoading: false,
            isInitialized: true,
          });
        }
      } catch {
        set({
          isLoading: false,
          isInitialized: true,
        });
      }
    },

    login: async (data: LoginData) => {
      set({ isLoading: true });
      try {
        const response: AuthResponse = await authApi.login(data);

        // Save to secure store
        await saveToSecureStore(
          response.token,
          response.refresh_token,
          response.user
        );

        // Set tokens in API client
        apiClient.setTokens(response.token, response.refresh_token);

        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });

        // Register for push notifications after successful login
        // This is done asynchronously and does not block login
        registerForPushNotifications().catch((error) => {
          console.error("Failed to register for push notifications:", error);
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    register: async (data: RegisterData) => {
      set({ isLoading: true });
      try {
        const response: AuthResponse = await authApi.register(data);

        // Save to secure store
        await saveToSecureStore(
          response.token,
          response.refresh_token,
          response.user
        );

        // Set tokens in API client
        apiClient.setTokens(response.token, response.refresh_token);

        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });

        // Register for push notifications after successful registration
        // This is done asynchronously and does not block registration
        registerForPushNotifications().catch((error) => {
          console.error("Failed to register for push notifications:", error);
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      const { token } = get();
      set({ isLoading: true });

      // Unregister from push notifications before logging out
      // This is done first while we still have valid tokens
      await unregisterFromPushNotifications();

      try {
        if (token) {
          await authApi.logout(token);
        }
      } catch {
        // Ignore logout errors - we still want to clear local state
      }

      // Clear secure store and state
      await clearSecureStore();
      apiClient.setTokens(null, null);

      set({
        user: null,
        token: null,
        refreshToken: null,
        currentFamilyId: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    setCurrentFamily: async (familyId: number | null) => {
      if (familyId !== null) {
        await SecureStore.setItemAsync(FAMILY_ID_KEY, familyId.toString());
      } else {
        await SecureStore.deleteItemAsync(FAMILY_ID_KEY);
      }
      set({ currentFamilyId: familyId });
    },

    setLoading: (isLoading: boolean) => set({ isLoading }),
  };
});

/**
 * Alias for useAuthStore - provides authentication state and actions.
 * Returns: { user, isAuthenticated, isLoading, currentFamilyId, login, logout, setCurrentFamily, initialize }
 */
export const useAuth = useAuthStore;
