import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth";
import { createMockUser } from "@/test/factories";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe("initial state", () => {
    it("starts with no user and not authenticated", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("setAuth", () => {
    it("sets user and tokens correctly", () => {
      const mockUser = createMockUser();
      const token = "jwt-token";
      const refreshToken = "refresh-token";

      useAuthStore.getState().setAuth(mockUser, token, refreshToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(token);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("setTokens", () => {
    it("updates tokens without affecting user", () => {
      const mockUser = createMockUser();

      // First set auth
      useAuthStore
        .getState()
        .setAuth(mockUser, "old-token", "old-refresh-token");

      // Then update tokens
      useAuthStore.getState().setTokens("new-token", "new-refresh-token");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe("new-token");
      expect(state.refreshToken).toBe("new-refresh-token");
    });
  });

  describe("setLoading", () => {
    it("sets loading state correctly", () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears all auth state", () => {
      const mockUser = createMockUser();

      // First set auth
      useAuthStore.getState().setAuth(mockUser, "token", "refresh-token");

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
