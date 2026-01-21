import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import * as googleCalendarApi from "@/lib/googleCalendar";
import {
  useGoogleCalendarStatus,
  useGoogleCalendarAuthUrl,
  useGoogleCalendarsList,
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useSyncGoogleCalendar,
  usePauseGoogleCalendar,
  useResumeGoogleCalendar,
} from "./useGoogleCalendar";

// Mock the googleCalendar API module
vi.mock("@/lib/googleCalendar", () => ({
  getGoogleCalendarStatus: vi.fn(),
  getGoogleCalendarAuthUrl: vi.fn(),
  getGoogleCalendars: vi.fn(),
  connectGoogleCalendar: vi.fn(),
  disconnectGoogleCalendar: vi.fn(),
  syncGoogleCalendar: vi.fn(),
  pauseGoogleCalendar: vi.fn(),
  resumeGoogleCalendar: vi.fn(),
}));

const mockGetGoogleCalendarStatus = vi.mocked(
  googleCalendarApi.getGoogleCalendarStatus
);
const mockGetGoogleCalendarAuthUrl = vi.mocked(
  googleCalendarApi.getGoogleCalendarAuthUrl
);
const mockGetGoogleCalendars = vi.mocked(googleCalendarApi.getGoogleCalendars);
const mockConnectGoogleCalendar = vi.mocked(
  googleCalendarApi.connectGoogleCalendar
);
const mockDisconnectGoogleCalendar = vi.mocked(
  googleCalendarApi.disconnectGoogleCalendar
);
const mockSyncGoogleCalendar = vi.mocked(googleCalendarApi.syncGoogleCalendar);
const mockPauseGoogleCalendar = vi.mocked(
  googleCalendarApi.pauseGoogleCalendar
);
const mockResumeGoogleCalendar = vi.mocked(
  googleCalendarApi.resumeGoogleCalendar
);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useGoogleCalendar hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useGoogleCalendarStatus", () => {
    it("fetches calendar status on mount", async () => {
      const mockStatus = {
        connected: true,
        calendar_id: "primary",
        sync_status: "active" as const,
      };
      mockGetGoogleCalendarStatus.mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useGoogleCalendarStatus(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStatus);
      expect(mockGetGoogleCalendarStatus).toHaveBeenCalledTimes(1);
    });

    it("handles errors", async () => {
      mockGetGoogleCalendarStatus.mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(() => useGoogleCalendarStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useGoogleCalendarAuthUrl", () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { href: "" } as Location;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it("fetches auth URL and redirects on success", async () => {
      const mockAuthUrl = { auth_url: "https://accounts.google.com/oauth" };
      mockGetGoogleCalendarAuthUrl.mockResolvedValueOnce(mockAuthUrl);

      const { result } = renderHook(() => useGoogleCalendarAuthUrl(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(mockGetGoogleCalendarAuthUrl).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(window.location.href).toBe(mockAuthUrl.auth_url);
      });
    });
  });

  describe("useGoogleCalendarsList", () => {
    it("does not fetch automatically (enabled: false)", () => {
      mockGetGoogleCalendars.mockResolvedValueOnce({ calendars: [] });

      const { result } = renderHook(() => useGoogleCalendarsList(), {
        wrapper: createWrapper(),
      });

      // Should not have fetched automatically
      expect(mockGetGoogleCalendars).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it("fetches calendars when refetch is called", async () => {
      const mockCalendars = {
        calendars: [
          {
            id: "primary",
            summary: "My Calendar",
            primary: true,
            access_role: "owner",
          },
        ],
      };
      mockGetGoogleCalendars.mockResolvedValueOnce(mockCalendars);

      const { result } = renderHook(() => useGoogleCalendarsList(), {
        wrapper: createWrapper(),
      });

      // Manually trigger fetch
      result.current.refetch();

      await waitFor(() => {
        expect(mockGetGoogleCalendars).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockCalendars);
      });
    });
  });

  describe("useConnectGoogleCalendar", () => {
    it("connects calendar successfully", async () => {
      const mockResponse = {
        connected: true,
        calendar_id: "primary",
        calendar_name: "My Calendar",
        sync_status: "active",
      };
      mockConnectGoogleCalendar.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useConnectGoogleCalendar(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        calendar_id: "primary",
        calendar_name: "My Calendar",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockConnectGoogleCalendar).toHaveBeenCalledWith({
        calendar_id: "primary",
        calendar_name: "My Calendar",
      });
    });
  });

  describe("useDisconnectGoogleCalendar", () => {
    it("disconnects calendar successfully", async () => {
      mockDisconnectGoogleCalendar.mockResolvedValueOnce({
        disconnected: true,
      });

      const { result } = renderHook(() => useDisconnectGoogleCalendar(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDisconnectGoogleCalendar).toHaveBeenCalled();
    });
  });

  describe("useSyncGoogleCalendar", () => {
    it("triggers sync successfully", async () => {
      mockSyncGoogleCalendar.mockResolvedValueOnce({
        message: "Sync started",
        sync_status: "syncing",
      });

      const { result } = renderHook(() => useSyncGoogleCalendar(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSyncGoogleCalendar).toHaveBeenCalled();
    });
  });

  describe("usePauseGoogleCalendar", () => {
    it("pauses calendar sync successfully", async () => {
      mockPauseGoogleCalendar.mockResolvedValueOnce({ sync_status: "paused" });

      const { result } = renderHook(() => usePauseGoogleCalendar(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPauseGoogleCalendar).toHaveBeenCalled();
    });
  });

  describe("useResumeGoogleCalendar", () => {
    it("resumes calendar sync successfully", async () => {
      mockResumeGoogleCalendar.mockResolvedValueOnce({ sync_status: "active" });

      const { result } = renderHook(() => useResumeGoogleCalendar(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockResumeGoogleCalendar).toHaveBeenCalled();
    });
  });
});
