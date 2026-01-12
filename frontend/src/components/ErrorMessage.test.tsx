import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ErrorMessage, FormError, QueryError } from "./ErrorMessage";

describe("ErrorMessage", () => {
  describe("inline variant (default)", () => {
    it("renders with default props", () => {
      render(<ErrorMessage />);
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("renders custom title and message", () => {
      render(<ErrorMessage title="Custom Error" message="Custom message" />);
      expect(screen.getByText("Custom Error")).toBeInTheDocument();
      expect(screen.getByText("Custom message")).toBeInTheDocument();
    });

    it("renders retry button when onRetry is provided", async () => {
      const handleRetry = vi.fn();
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();

      render(<ErrorMessage onRetry={handleRetry} />);
      const retryButton = screen.getByRole("button", { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it("renders custom retry label", () => {
      render(<ErrorMessage onRetry={() => {}} retryLabel="Retry Now" />);
      expect(
        screen.getByRole("button", { name: /retry now/i })
      ).toBeInTheDocument();
    });

    it("does not render retry button when onRetry is not provided", () => {
      render(<ErrorMessage />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("card variant", () => {
    it("renders in card variant", () => {
      render(<ErrorMessage variant="card" title="Card Error" />);
      expect(screen.getByText("Card Error")).toBeInTheDocument();
    });

    it("renders retry button in card variant", () => {
      render(<ErrorMessage variant="card" onRetry={() => {}} />);
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  describe("full-page variant", () => {
    it("renders in full-page variant", () => {
      render(<ErrorMessage variant="full-page" title="Full Page Error" />);
      expect(screen.getByText("Full Page Error")).toBeInTheDocument();
    });

    it("renders retry button in full-page variant", () => {
      render(<ErrorMessage variant="full-page" onRetry={() => {}} />);
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  describe("user-friendly message mapping", () => {
    it("maps 'Failed to fetch' to user-friendly message", () => {
      render(<ErrorMessage message="Failed to fetch" />);
      expect(
        screen.getByText(
          "Unable to connect to the server. Please check your internet connection."
        )
      ).toBeInTheDocument();
    });

    it("maps API 401 error to user-friendly message", () => {
      render(<ErrorMessage message="API error: 401" />);
      expect(
        screen.getByText("Your session has expired. Please log in again.")
      ).toBeInTheDocument();
    });

    it("maps API 403 error to user-friendly message", () => {
      render(<ErrorMessage message="API error: 403" />);
      expect(
        screen.getByText("You don't have permission to access this resource.")
      ).toBeInTheDocument();
    });

    it("maps API 500 error to user-friendly message", () => {
      render(<ErrorMessage message="API error: 500" />);
      expect(
        screen.getByText(
          "Something went wrong on our end. Please try again later."
        )
      ).toBeInTheDocument();
    });

    it("maps generic error messages to friendly message", () => {
      render(<ErrorMessage message="undefined is not an object" />);
      expect(
        screen.getByText("Something went wrong. Please try again.")
      ).toBeInTheDocument();
    });

    it("passes through non-technical messages", () => {
      render(<ErrorMessage message="Please enter a valid email address" />);
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
  });
});

describe("FormError", () => {
  it("renders nothing when no message", () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders error message when provided", () => {
    render(<FormError message="This field is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This field is required"
    );
  });

  it("has alert role for accessibility", () => {
    render(<FormError message="Error message" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("QueryError", () => {
  it("renders nothing when error is null", () => {
    const { container } = render(<QueryError error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders error message when error is provided", () => {
    const error = new Error("Network error");
    render(<QueryError error={error} />);
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });

  it("renders retry button when refetch is provided", () => {
    const error = new Error("Network error");
    render(<QueryError error={error} refetch={() => {}} />);
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("uses specified variant", () => {
    const error = new Error("Network error");
    render(<QueryError error={error} variant="card" />);
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });
});
