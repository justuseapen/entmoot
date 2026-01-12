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
import { NotFound } from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
    <QueryClientProvider client={queryClient}>
      <CelebrationProvider>
        <BrowserRouter>
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
            <Route
              path="/families/:id/goals"
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id/goals/tree"
              element={
                <ProtectedRoute>
                  <GoalTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id/planner"
              element={
                <ProtectedRoute>
                  <DailyPlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id/reflection"
              element={
                <ProtectedRoute>
                  <EveningReflection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id/weekly-review"
              element={
                <ProtectedRoute>
                  <WeeklyReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/families/:id/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/points"
              element={
                <ProtectedRoute>
                  <PointsHistory />
                </ProtectedRoute>
              }
            />
            <Route path="/invitations/:token" element={<AcceptInvitation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CelebrationProvider>
    </QueryClientProvider>
  );
}

export default App;
