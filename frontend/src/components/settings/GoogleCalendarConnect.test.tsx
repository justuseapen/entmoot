import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";
import * as useGoogleCalendarModule from "@/hooks/useGoogleCalendar";

// Mock the useGoogleCalendar hooks
vi.mock("@/hooks/useGoogleCalendar", async () => {
  const actual = await vi.importActual("@/hooks/useGoogleCalendar");
  return {
    ...actual,
    useGoogleCalendarStatus: vi.fn(),
    useGoogleCalendarAuthUrl: vi.fn(),
    useDisconnectGoogleCalendar: vi.fn(),
    useSyncGoogleCalendar: vi.fn(),
    usePauseGoogleCalendar: vi.fn(),
    useResumeGoogleCalendar: vi.fn(),
  };
});

const mockUseGoogleCalendarStatus = vi.mocked(
  useGoogleCalendarModule.useGoogleCalendarStatus
);
const mockUseGoogleCalendarAuthUrl = vi.mocked(
  useGoogleCalendarModule.useGoogleCalendarAuthUrl
);
const mockUseDisconnectGoogleCalendar = vi.mocked(
  useGoogleCalendarModule.useDisconnectGoogleCalendar
);
const mockUseSyncGoogleCalendar = vi.mocked(
  useGoogleCalendarModule.useSyncGoogleCalendar
);
const mockUsePauseGoogleCalendar = vi.mocked(
  useGoogleCalendarModule.usePauseGoogleCalendar
);
const mockUseResumeGoogleCalendar = vi.mocked(
  useGoogleCalendarModule.useResumeGoogleCalendar
);

describe("GoogleCalendarConnect", () => {
  const mockAuthMutate = vi.fn();
  const mockDisconnectMutate = vi.fn();
  const mockSyncMutate = vi.fn();
  const mockPauseMutate = vi.fn();
  const mockResumeMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseGoogleCalendarAuthUrl.mockReturnValue({
      mutate: mockAuthMutate,
      isPending: false,
    } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarAuthUrl>);

    mockUseDisconnectGoogleCalendar.mockReturnValue({
      mutate: mockDisconnectMutate,
      isPending: false,
    } as ReturnType<
      typeof useGoogleCalendarModule.useDisconnectGoogleCalendar
    >);

    mockUseSyncGoogleCalendar.mockReturnValue({
      mutate: mockSyncMutate,
      isPending: false,
    } as ReturnType<typeof useGoogleCalendarModule.useSyncGoogleCalendar>);

    mockUsePauseGoogleCalendar.mockReturnValue({
      mutate: mockPauseMutate,
      isPending: false,
    } as ReturnType<typeof useGoogleCalendarModule.usePauseGoogleCalendar>);

    mockUseResumeGoogleCalendar.mockReturnValue({
      mutate: mockResumeMutate,
      isPending: false,
    } as ReturnType<typeof useGoogleCalendarModule.useResumeGoogleCalendar>);
  });

  describe("when loading", () => {
    beforeEach(() => {
      mockUseGoogleCalendarStatus.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarStatus>);
    });

    it("shows loading skeleton", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText("Google Calendar")).toBeInTheDocument();
      // Check for animate-pulse class on skeleton
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("when error occurs", () => {
    beforeEach(() => {
      mockUseGoogleCalendarStatus.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load"),
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarStatus>);
    });

    it("shows error alert", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText("Google Calendar")).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to load Google Calendar status/)
      ).toBeInTheDocument();
    });
  });

  describe("when not connected", () => {
    beforeEach(() => {
      mockUseGoogleCalendarStatus.mockReturnValue({
        data: { connected: false },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarStatus>);
    });

    it("shows connect button", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText("Google Calendar")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Connect Google Calendar/i })
      ).toBeInTheDocument();
    });

    it("shows description text", () => {
      render(<GoogleCalendarConnect />);

      expect(
        screen.getByText(/Connect your Google Calendar to sync goals/)
      ).toBeInTheDocument();
    });

    it("calls authUrl mutation when connect is clicked", async () => {
      const user = userEvent.setup();
      render(<GoogleCalendarConnect />);

      await user.click(
        screen.getByRole("button", { name: /Connect Google Calendar/i })
      );

      expect(mockAuthMutate).toHaveBeenCalled();
    });

    it("shows connecting state when auth is pending", () => {
      mockUseGoogleCalendarAuthUrl.mockReturnValue({
        mutate: mockAuthMutate,
        isPending: true,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarAuthUrl>);

      render(<GoogleCalendarConnect />);

      expect(screen.getByText(/Connecting/)).toBeInTheDocument();
    });
  });

  describe("when connected with active status", () => {
    beforeEach(() => {
      mockUseGoogleCalendarStatus.mockReturnValue({
        data: {
          connected: true,
          calendar_id: "primary",
          calendar_name: "My Calendar",
          google_email: "user@example.com",
          sync_status: "active",
          last_sync_at: new Date().toISOString(),
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarStatus>);
    });

    it("shows connected state with user info", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText("Google Calendar")).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/My Calendar/)).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows last sync time", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText(/Last synced/)).toBeInTheDocument();
    });

    it("shows sync, pause, and disconnect buttons", () => {
      render(<GoogleCalendarConnect />);

      expect(
        screen.getByRole("button", { name: /Sync Now/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Pause Sync/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Disconnect/i })
      ).toBeInTheDocument();
    });

    it("calls sync mutation when sync button is clicked", async () => {
      const user = userEvent.setup();
      render(<GoogleCalendarConnect />);

      await user.click(screen.getByRole("button", { name: /Sync Now/i }));

      expect(mockSyncMutate).toHaveBeenCalled();
    });

    it("calls pause mutation when pause button is clicked", async () => {
      const user = userEvent.setup();
      render(<GoogleCalendarConnect />);

      await user.click(screen.getByRole("button", { name: /Pause Sync/i }));

      expect(mockPauseMutate).toHaveBeenCalled();
    });

    it("shows confirm dialog before disconnect", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<GoogleCalendarConnect />);

      await user.click(screen.getByRole("button", { name: /Disconnect/i }));

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining("Are you sure")
      );
      expect(mockDisconnectMutate).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it("does not disconnect if confirm is cancelled", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<GoogleCalendarConnect />);

      await user.click(screen.getByRole("button", { name: /Disconnect/i }));

      expect(mockDisconnectMutate).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe("when connected with paused status", () => {
    beforeEach(() => {
      mockUseGoogleCalendarStatus.mockReturnValue({
        data: {
          connected: true,
          calendar_id: "primary",
          sync_status: "paused",
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarStatus>);
    });

    it("shows paused badge", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText("Paused")).toBeInTheDocument();
    });

    it("shows resume button instead of sync/pause", () => {
      render(<GoogleCalendarConnect />);

      expect(
        screen.getByRole("button", { name: /Resume Sync/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Sync Now/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Pause Sync/i })
      ).not.toBeInTheDocument();
    });

    it("calls resume mutation when resume button is clicked", async () => {
      const user = userEvent.setup();
      render(<GoogleCalendarConnect />);

      await user.click(screen.getByRole("button", { name: /Resume Sync/i }));

      expect(mockResumeMutate).toHaveBeenCalled();
    });
  });

  describe("when connected with error status", () => {
    beforeEach(() => {
      mockUseGoogleCalendarStatus.mockReturnValue({
        data: {
          connected: true,
          calendar_id: "primary",
          sync_status: "error",
          last_error: "Token refresh failed",
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarStatus>);
    });

    it("shows error badge", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("shows error message", () => {
      render(<GoogleCalendarConnect />);

      expect(screen.getByText(/Token refresh failed/)).toBeInTheDocument();
    });

    it("shows retry button", () => {
      render(<GoogleCalendarConnect />);

      expect(
        screen.getByRole("button", { name: /Retry Connection/i })
      ).toBeInTheDocument();
    });
  });
});
