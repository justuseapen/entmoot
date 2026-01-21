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
import { Dashboard } from "./pages/Dashboard";
import { Families } from "./pages/Families";
import { FamilySettings } from "./pages/FamilySettings";
import { Goals } from "./pages/Goals";
import { GoalTree } from "./pages/GoalTree";
import { DailyPlanner } from "./pages/DailyPlanner";
import { EveningReflection } from "./pages/EveningReflection";
import { WeeklyReview } from "./pages/WeeklyReview";
import { MonthlyReview } from "./pages/MonthlyReview";
import { QuarterlyReview } from "./pages/QuarterlyReview";
import { AnnualReview } from "./pages/AnnualReview";
import { Leaderboard } from "./pages/Leaderboard";
import { NotificationSettings } from "./pages/NotificationSettings";
import { NotificationsPage } from "./pages/Notifications";
import CalendarSelect from "./pages/CalendarSelect";
import { PointsHistory } from "./pages/PointsHistory";
import { AcceptInvitation } from "./pages/AcceptInvitation";
import { UserProfile } from "./pages/UserProfile";
import { AdminFeedback } from "./pages/AdminFeedback";
import { NotFound } from "./pages/NotFound";
import { ServerError } from "./pages/ServerError";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import { OnboardingWizard } from "./components/onboarding";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalLoadingIndicator } from "./components/LoadingIndicator";
import { OfflineIndicator } from "./components/OfflineIndicator";
import {
  CelebrationProvider,
  useCelebrationListener,
} from "./components/CelebrationToast";
import { useAuthStore } from "./stores/auth";
import { useNotificationWebSocket } from "./hooks/useNotificationWebSocket";
import { initHeyDev } from "./lib/heydev";

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Component that initializes WebSocket connection for authenticated users
function NotificationWebSocketInitializer() {
  const { handleNotification } = useCelebrationListener();
  useNotificationWebSocket(handleNotification);
  return null;
}

// Component that initializes HeyDev with user context for feedback tracking
function HeyDevInitializer() {
  const { user, isAuthenticated } = useAuthStore();

  // Initialize HeyDev whenever auth state changes
  React.useEffect(() => {
    initHeyDev(isAuthenticated && user ? user : null);
  }, [user, isAuthenticated]);

  return null;
}

function App() {
  return (
    <ErrorBoundary fallback={<ServerError />}>
      <QueryClientProvider client={queryClient}>
        <CelebrationProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
            <GlobalLoadingIndicator />
            <OfflineIndicator />
            <NotificationWebSocketInitializer />
            <HeyDevInitializer />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/roadmap" element={<Roadmap />} />
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
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
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
                path="/families/:id/goals"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Goals />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/families/:id/goals/tree"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <GoalTree />
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
                path="/families/:id/reflection"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EveningReflection />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/families/:id/weekly-review"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <WeeklyReview />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/families/:id/monthly-review"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MonthlyReview />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/families/:id/quarterly-review"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <QuarterlyReview />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/families/:id/annual-review"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AnnualReview />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/families/:id/leaderboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Leaderboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/notifications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NotificationSettings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/calendar/select"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CalendarSelect />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NotificationsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/points"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PointsHistory />
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
              <Route
                path="/admin/feedback"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminFeedback />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invitations/:token"
                element={<AcceptInvitation />}
              />
              <Route path="/error" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CelebrationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
