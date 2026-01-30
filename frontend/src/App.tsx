import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "./lib/api";
import { LandingPage } from "./pages/LandingPage";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Roadmap } from "./pages/Roadmap";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Families } from "./pages/Families";
import { FamilySettings } from "./pages/FamilySettings";
import { DailyPlanner } from "./pages/DailyPlanner";
import { AcceptInvitation } from "./pages/AcceptInvitation";
import { UserProfile } from "./pages/UserProfile";
import { NotFound } from "./pages/NotFound";
import { ServerError } from "./pages/ServerError";
import { BlogIndex, BlogPost } from "./pages/blog";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalLoadingIndicator } from "./components/LoadingIndicator";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useAuthStore } from "./stores/auth";

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/families" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary fallback={<ServerError />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
          <GlobalLoadingIndicator />
          <OfflineIndicator />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
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
              path="/forgot-password"
              element={
                <AuthenticatedRedirect>
                  <ForgotPassword />
                </AuthenticatedRedirect>
              }
            />
            <Route
              path="/reset-password"
              element={
                <AuthenticatedRedirect>
                  <ResetPassword />
                </AuthenticatedRedirect>
              }
            />
            <Route
              path="/families"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Families />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FamilySettings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id/planner"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DailyPlanner />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserProfile />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/invitations/:token" element={<AcceptInvitation />} />
            <Route path="/error" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
