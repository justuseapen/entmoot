import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import CalendarSelect from "@/pages/CalendarSelect";
import * as useGoogleCalendarModule from "@/hooks/useGoogleCalendar";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the useGoogleCalendar hooks
vi.mock("@/hooks/useGoogleCalendar", async () => {
  const actual = await vi.importActual("@/hooks/useGoogleCalendar");
  return {
    ...actual,
    useGoogleCalendarsList: vi.fn(),
    useConnectGoogleCalendar: vi.fn(),
  };
});

const mockUseGoogleCalendarsList = vi.mocked(
  useGoogleCalendarModule.useGoogleCalendarsList
);
const mockUseConnectGoogleCalendar = vi.mocked(
  useGoogleCalendarModule.useConnectGoogleCalendar
);

describe("CalendarSelect", () => {
  const mockRefetch = vi.fn();
  const mockMutate = vi.fn();

  const mockCalendars = [
    {
      id: "primary",
      summary: "My Calendar",
      description: "Primary calendar",
      primary: true,
      access_role: "owner",
    },
    {
      id: "work@example.com",
      summary: "Work Calendar",
      description: null,
      primary: false,
      access_role: "owner",
    },
    {
      id: "family@example.com",
      summary: "Family",
      description: "Shared family calendar",
      primary: false,
      access_role: "writer",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseConnectGoogleCalendar.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as ReturnType<typeof useGoogleCalendarModule.useConnectGoogleCalendar>);
  });

  describe("when loading", () => {
    beforeEach(() => {
      mockUseGoogleCalendarsList.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarsList>);
    });

    it("shows loading spinner", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(screen.getByText("Select Calendar")).toBeInTheDocument();
      // Check for animate-spin class on loader
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("when error occurs", () => {
    beforeEach(() => {
      mockUseGoogleCalendarsList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Session expired"),
        refetch: mockRefetch,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarsList>);
    });

    it("shows error message", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(
        screen.getByText(/Failed to load your calendars/)
      ).toBeInTheDocument();
    });

    it("shows go back button", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(
        screen.getByRole("button", { name: /Go Back/i })
      ).toBeInTheDocument();
    });

    it("navigates back when go back is clicked", async () => {
      const user = userEvent.setup();
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      await user.click(screen.getByRole("button", { name: /Go Back/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/settings/notifications");
    });
  });

  describe("when no calendars found", () => {
    beforeEach(() => {
      mockUseGoogleCalendarsList.mockReturnValue({
        data: { calendars: [] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarsList>);
    });

    it("shows no calendars message", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(
        screen.getByText(/No calendars found in your Google account/)
      ).toBeInTheDocument();
    });
  });

  describe("when calendars are available", () => {
    beforeEach(() => {
      mockUseGoogleCalendarsList.mockReturnValue({
        data: { calendars: mockCalendars },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarsList>);
    });

    it("shows calendar selection list", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(screen.getByText("My Calendar")).toBeInTheDocument();
      expect(screen.getByText("Work Calendar")).toBeInTheDocument();
      expect(screen.getByText("Family")).toBeInTheDocument();
    });

    it("shows description for calendars that have one", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(screen.getByText("Primary calendar")).toBeInTheDocument();
      expect(screen.getByText("Shared family calendar")).toBeInTheDocument();
    });

    it("marks primary calendar", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("auto-selects primary calendar by default", async () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      // The primary calendar option should be selected
      await waitFor(() => {
        const primaryOption = screen.getByText("My Calendar").closest("div");
        expect(primaryOption).toHaveClass("border-primary");
      });
    });

    it("shows cancel and connect buttons", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(
        screen.getByRole("button", { name: /Cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Connect Calendar/i })
      ).toBeInTheDocument();
    });

    it("navigates back when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/settings/notifications");
    });

    it("calls connect mutation with correct params when connect is clicked", async () => {
      const user = userEvent.setup();
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      // Wait for auto-selection to happen
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Connect Calendar/i })
        ).not.toBeDisabled();
      });

      await user.click(
        screen.getByRole("button", { name: /Connect Calendar/i })
      );

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          calendar_id: "primary",
          calendar_name: "My Calendar",
          google_email: "primary", // Primary calendar ID is used as email
        }),
        expect.any(Object)
      );
    });

    it("allows selecting a different calendar", async () => {
      const user = userEvent.setup();
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      // Click on the Work Calendar option
      await user.click(screen.getByText("Work Calendar"));

      // Connect
      await user.click(
        screen.getByRole("button", { name: /Connect Calendar/i })
      );

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          calendar_id: "work@example.com",
          calendar_name: "Work Calendar",
        }),
        expect.any(Object)
      );
    });
  });

  describe("when connect is pending", () => {
    beforeEach(() => {
      mockUseGoogleCalendarsList.mockReturnValue({
        data: { calendars: mockCalendars },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarsList>);

      mockUseConnectGoogleCalendar.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        error: null,
      } as ReturnType<typeof useGoogleCalendarModule.useConnectGoogleCalendar>);
    });

    it("shows connecting state", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(screen.getByText(/Connecting/)).toBeInTheDocument();
    });

    it("disables connect button", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(
        screen.getByRole("button", { name: /Connecting/i })
      ).toBeDisabled();
    });
  });

  describe("when connect fails", () => {
    beforeEach(() => {
      mockUseGoogleCalendarsList.mockReturnValue({
        data: { calendars: mockCalendars },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as ReturnType<typeof useGoogleCalendarModule.useGoogleCalendarsList>);

      mockUseConnectGoogleCalendar.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: new Error("Connection failed"),
      } as ReturnType<typeof useGoogleCalendarModule.useConnectGoogleCalendar>);
    });

    it("shows error message", () => {
      render(<CalendarSelect />, {
        providerOptions: { useMemoryRouter: true },
      });

      expect(
        screen.getByText(/Failed to connect calendar/)
      ).toBeInTheDocument();
    });
  });
});
