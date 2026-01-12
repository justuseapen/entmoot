import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  GlobalLoadingIndicator,
  PageLoading,
  LoadingSpinner,
} from "./LoadingIndicator";

// Mock TanStack Query hooks
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useIsFetching: vi.fn(),
    useIsMutating: vi.fn(),
  };
});

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

describe("GlobalLoadingIndicator", () => {
  const queryClient = new QueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.mocked(useIsFetching).mockReturnValue(0);
    vi.mocked(useIsMutating).mockReturnValue(0);
  });

  it("renders nothing when not loading", () => {
    const { container } = render(<GlobalLoadingIndicator />, { wrapper });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders loading bar when fetching", () => {
    vi.mocked(useIsFetching).mockReturnValue(1);
    const { container } = render(<GlobalLoadingIndicator />, { wrapper });
    expect(container.querySelector(".animate-loading-bar")).toBeInTheDocument();
  });

  it("renders loading bar when mutating", () => {
    vi.mocked(useIsMutating).mockReturnValue(1);
    const { container } = render(<GlobalLoadingIndicator />, { wrapper });
    expect(container.querySelector(".animate-loading-bar")).toBeInTheDocument();
  });
});

describe("PageLoading", () => {
  it("renders default loading message", () => {
    render(<PageLoading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders custom loading message", () => {
    render(<PageLoading message="Fetching data..." />);
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
  });

  it("renders loading spinner", () => {
    const { container } = render(<PageLoading />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

describe("LoadingSpinner", () => {
  it("renders with default size", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-8", "w-8");
  });

  it("renders small size", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-4", "w-4");
  });

  it("renders large size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-12", "w-12");
  });

  it("applies custom className", () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("custom-class");
  });
});
