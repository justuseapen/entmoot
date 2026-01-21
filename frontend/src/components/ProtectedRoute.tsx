import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({
  children,
  skipOnboardingCheck = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs to complete onboarding
  // Skip this check for the onboarding page itself and invitation acceptance
  const isOnboardingPage = location.pathname.startsWith("/onboarding");
  const isInvitationPage = location.pathname.startsWith("/invitations");

  if (
    !skipOnboardingCheck &&
    !isOnboardingPage &&
    !isInvitationPage &&
    user &&
    !user.onboarding_wizard_completed_at
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
