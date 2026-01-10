import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/api";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Families } from "./pages/Families";
import { FamilySettings } from "./pages/FamilySettings";
import { AcceptInvitation } from "./pages/AcceptInvitation";
import { NotFound } from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./stores/auth";

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <AuthenticatedRedirect>
                <Login />
              </AuthenticatedRedirect>
            }
          />
          <Route
            path="/register"
            element={
              <AuthenticatedRedirect>
                <Register />
              </AuthenticatedRedirect>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families"
            element={
              <ProtectedRoute>
                <Families />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/:id"
            element={
              <ProtectedRoute>
                <FamilySettings />
              </ProtectedRoute>
            }
          />
          <Route path="/invitations/:token" element={<AcceptInvitation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
