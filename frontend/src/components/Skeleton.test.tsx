import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  GoalCardSkeleton,
  DashboardSkeleton,
  ProfileSkeleton,
} from "./Skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-label", "Loading");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("applies custom className", () => {
    render(<Skeleton className="h-10 w-full" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("h-10", "w-full");
  });
});

describe("CardSkeleton", () => {
  it("renders a card skeleton", () => {
    const { container } = render(<CardSkeleton />);
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("ListSkeleton", () => {
  it("renders with default 3 rows", () => {
    const { container } = render(<ListSkeleton />);
    const rows = container.querySelectorAll(".flex.items-center.gap-3");
    expect(rows).toHaveLength(3);
  });

  it("renders custom number of rows", () => {
    const { container } = render(<ListSkeleton rows={5} />);
    const rows = container.querySelectorAll(".flex.items-center.gap-3");
    expect(rows).toHaveLength(5);
  });
});

describe("TableSkeleton", () => {
  it("renders with default 5 rows and 4 cols", () => {
    const { container } = render(<TableSkeleton />);
    // 1 header + 5 data rows = 6 total rows
    const allRows = container.querySelectorAll(".flex.gap-4");
    expect(allRows).toHaveLength(6);

    // Each row should have 4 columns
    const headerCols = allRows[0].querySelectorAll('[role="status"]');
    expect(headerCols).toHaveLength(4);
  });

  it("renders custom number of rows and columns", () => {
    const { container } = render(<TableSkeleton rows={3} cols={2} />);
    const allRows = container.querySelectorAll(".flex.gap-4");
    expect(allRows).toHaveLength(4); // 1 header + 3 data rows

    const headerCols = allRows[0].querySelectorAll('[role="status"]');
    expect(headerCols).toHaveLength(2);
  });
});

describe("GoalCardSkeleton", () => {
  it("renders a goal card skeleton", () => {
    const { container } = render(<GoalCardSkeleton />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("DashboardSkeleton", () => {
  it("renders dashboard skeleton with multiple cards", () => {
    const { container } = render(<DashboardSkeleton />);
    // Should have multiple skeleton elements for the dashboard layout
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("ProfileSkeleton", () => {
  it("renders profile skeleton with avatar and cards", () => {
    const { container } = render(<ProfileSkeleton />);
    // Should have avatar skeleton (rounded-full) and card skeletons
    const roundedFullSkeletons = container.querySelectorAll(
      '[role="status"].rounded-full'
    );
    expect(roundedFullSkeletons.length).toBeGreaterThan(0);
  });
});
