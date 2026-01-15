import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { InviteMemberModal } from "./InviteMemberModal";
import * as useFamiliesModule from "@/hooks/useFamilies";

// Mock the useSendInvitation hook
vi.mock("@/hooks/useFamilies", async () => {
  const actual = await vi.importActual("@/hooks/useFamilies");
  return {
    ...actual,
    useSendInvitation: vi.fn(),
  };
});

const mockUseSendInvitation = vi.mocked(useFamiliesModule.useSendInvitation);

describe("InviteMemberModal", () => {
  const defaultProps = {
    familyId: 1,
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
  };

  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSendInvitation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as ReturnType<typeof useFamiliesModule.useSendInvitation>);
  });

  it("renders the invite form when open", () => {
    render(<InviteMemberModal {...defaultProps} />);

    expect(screen.getByText("Invite Family Member")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Invitation" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<InviteMemberModal {...defaultProps} open={false} />);

    expect(screen.queryByText("Invite Family Member")).not.toBeInTheDocument();
  });

  it("does not submit with invalid email", async () => {
    const user = userEvent.setup();
    render(<InviteMemberModal {...defaultProps} />);

    const emailInput = screen.getByLabelText("Email Address");
    await user.type(emailInput, "invalid-email");
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    // Give form time to validate
    await waitFor(() => {
      // The form should not have called mutateAsync with invalid email
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  it("submits invitation and shows success state with invitation details", async () => {
    const user = userEvent.setup();
    const mockInvitation = {
      id: 1,
      email: "newmember@example.com",
      role: "adult" as const,
      expires_at: "2026-01-22T00:00:00Z",
      created_at: "2026-01-15T00:00:00Z",
      inviter: { id: 1, name: "Test User" },
    };

    mockMutateAsync.mockResolvedValueOnce({
      message: "Invitation sent",
      invitation: mockInvitation,
    });

    render(<InviteMemberModal {...defaultProps} />);

    // Fill in the form
    await user.type(screen.getByLabelText("Email Address"), "newmember@example.com");
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText("Invitation Sent")).toBeInTheDocument();
    });

    // Check success state content
    expect(screen.getByText("newmember@example.com")).toBeInTheDocument();
    expect(screen.getByText("Adult")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Another" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();

    // Verify onSuccess was called
    expect(defaultProps.onSuccess).toHaveBeenCalled();
  });

  it("'Send Another' button resets to form state", async () => {
    const user = userEvent.setup();
    const mockInvitation = {
      id: 1,
      email: "newmember@example.com",
      role: "adult" as const,
      expires_at: "2026-01-22T00:00:00Z",
      created_at: "2026-01-15T00:00:00Z",
      inviter: { id: 1, name: "Test User" },
    };

    mockMutateAsync.mockResolvedValueOnce({
      message: "Invitation sent",
      invitation: mockInvitation,
    });

    render(<InviteMemberModal {...defaultProps} />);

    // Submit an invitation
    await user.type(screen.getByLabelText("Email Address"), "newmember@example.com");
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText("Invitation Sent")).toBeInTheDocument();
    });

    // Click "Send Another"
    await user.click(screen.getByRole("button", { name: "Send Another" }));

    // Should show form again
    await waitFor(() => {
      expect(screen.getByText("Invite Family Member")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toHaveValue("");
  });

  it("'Done' button closes the modal", async () => {
    const user = userEvent.setup();
    const mockInvitation = {
      id: 1,
      email: "newmember@example.com",
      role: "adult" as const,
      expires_at: "2026-01-22T00:00:00Z",
      created_at: "2026-01-15T00:00:00Z",
      inviter: { id: 1, name: "Test User" },
    };

    mockMutateAsync.mockResolvedValueOnce({
      message: "Invitation sent",
      invitation: mockInvitation,
    });

    render(<InviteMemberModal {...defaultProps} />);

    // Submit an invitation
    await user.type(screen.getByLabelText("Email Address"), "newmember@example.com");
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText("Invitation Sent")).toBeInTheDocument();
    });

    // Click "Done"
    await user.click(screen.getByRole("button", { name: "Done" }));

    // Should call onOpenChange with false
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error when invitation fails", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(new Error("User already a member"));

    render(<InviteMemberModal {...defaultProps} />);

    await user.type(screen.getByLabelText("Email Address"), "existing@example.com");
    await user.click(screen.getByRole("button", { name: "Send Invitation" }));

    await waitFor(() => {
      expect(screen.getByText("User already a member")).toBeInTheDocument();
    });

    // Should stay on form, not show success
    expect(screen.getByText("Invite Family Member")).toBeInTheDocument();
  });

  // Note: Radix UI Select components require complex pointer capture handling that's
  // difficult to test with jsdom. The role selection functionality is covered by
  // the integration tests and the submit tests which use the default "adult" role.
});
