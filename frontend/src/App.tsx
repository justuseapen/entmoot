import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/api";
import { Home } from "./pages/Home";
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
import { Leaderboard } from "./pages/Leaderboard";
import { NotificationSettings } from "./pages/NotificationSettings";
import { NotificationsPage } from "./pages/Notifications";
import { PointsHistory } from "./pages/PointsHistory";
import { AcceptInvitation } from "./pages/AcceptInvitation";
import { UserProfile } from "./pages/UserProfile";
import { AdminFeedback } from "./pages/AdminFeedback";
import { NotFound } from "./pages/NotFound";
import { ServerError } from "./pages/ServerError";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalLoadingIndicator } from "./components/LoadingIndicator";
import { OfflineIndicator } from "./components/OfflineIndicator";
import {
  CelebrationProvider,
  useCelebrationListener,
} from "./components/CelebrationToast";
import { useAuthStore } from "./stores/auth";
import { useNotificationWebSocket } from "./hooks/useNotificationWebSocket";

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

function App() {
  return (
    <ErrorBoundary fallback={<ServerError />}>
      <QueryClientProvider client={queryClient}>
        <CelebrationProvider>
          <BrowserRouter>
            <GlobalLoadingIndicator />
            <OfflineIndicator />
            <NotificationWebSocketInitializer />
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
