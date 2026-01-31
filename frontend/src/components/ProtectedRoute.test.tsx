import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { ProtectedRoute } from "./ProtectedRoute";
import { createMockUser } from "@/test/factories";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    // Reset auth store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("renders children when user is authenticated", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: createMockUser(),
      token: "token",
      refreshToken: "refresh",
    });

    render(
      <MemoryRouter initialEntries={["/families"]}>
        <Routes>
          <Route
            path="/families"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/families"]}>
        <Routes>
          <Route
            path="/families"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
