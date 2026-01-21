import { useState } from "react";
import { Calendar, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TreeAnimation } from "../TreeAnimation";
import { OnboardingStep } from "../OnboardingStep";
import { OnboardingProgress } from "../OnboardingProgress";
import {
  useGoogleCalendarAuthUrl,
  useGoogleCalendarStatus,
} from "@/hooks/useGoogleCalendar";
import { useCalendarWaitlist } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

// Calendar provider icons
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

interface CalendarConnectStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function CalendarConnectStep({
  onNext,
  onBack,
  onSkip,
}: CalendarConnectStepProps) {
  const { data: calendarStatus } = useGoogleCalendarStatus();
  const authUrlMutation = useGoogleCalendarAuthUrl();
  const waitlistMutation = useCalendarWaitlist();
  const [waitlistJoined, setWaitlistJoined] = useState<Record<string, boolean>>(
    {}
  );

  const handleConnectGoogle = () => {
    authUrlMutation.mutate();
  };

  const handleJoinWaitlist = async (provider: "apple" | "microsoft") => {
    try {
      await waitlistMutation.mutateAsync(provider);
      setWaitlistJoined((prev) => ({ ...prev, [provider]: true }));
    } catch {
      // Error handled by mutation
    }
  };

  const isGoogleConnected = calendarStatus?.connected;

  return (
    <OnboardingStep>
      <div className="mx-auto flex max-w-lg flex-col px-4 py-6">
        {/* Progress bar */}
        <OnboardingProgress currentStep="calendar" className="mb-8" />

        <div className="flex flex-col items-center">
          {/* Tree animation - stage 4 */}
          <div className="mb-6 h-28 w-28">
            <TreeAnimation stage={4} />
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Sync your family&apos;s calendars
          </h1>

          <p className="mb-6 text-center text-gray-600">
            Keep everyone on the same page by connecting your calendar.
          </p>

          {/* Calendar options */}
          <div className="w-full space-y-3">
            {/* Google Calendar */}
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border p-4",
                isGoogleConnected
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <GoogleIcon className="h-6 w-6" />
                <div>
                  <p className="font-medium text-gray-900">Google Calendar</p>
                  {isGoogleConnected && calendarStatus?.google_email && (
                    <p className="text-sm text-gray-500">
                      {calendarStatus.google_email}
                    </p>
                  )}
                </div>
              </div>
              {isGoogleConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  disabled={authUrlMutation.isPending}
                  size="sm"
                >
                  {authUrlMutation.isPending ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Apple Calendar */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 opacity-75">
              <div className="flex items-center gap-3">
                <AppleIcon className="h-6 w-6 text-gray-800" />
                <div>
                  <p className="font-medium text-gray-900">Apple Calendar</p>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
              </div>
              {waitlistJoined.apple ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">We&apos;ll notify you</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleJoinWaitlist("apple")}
                  disabled={waitlistMutation.isPending}
                >
                  Notify Me
                </Button>
              )}
            </div>

            {/* Microsoft Outlook */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 opacity-75">
              <div className="flex items-center gap-3">
                <MicrosoftIcon className="h-6 w-6" />
                <div>
                  <p className="font-medium text-gray-900">Microsoft Outlook</p>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
              </div>
              {waitlistJoined.microsoft ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">We&apos;ll notify you</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleJoinWaitlist("microsoft")}
                  disabled={waitlistMutation.isPending}
                >
                  Notify Me
                </Button>
              )}
            </div>
          </div>

          {/* Helper text */}
          <p className="mt-6 text-center text-sm text-gray-500">
            <Calendar className="mr-1 inline h-4 w-4" />
            You can always connect calendars later in Settings.
          </p>

          {/* Navigation buttons */}
          <div className="mt-8 flex w-full gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button
              type="button"
              onClick={isGoogleConnected ? onNext : onSkip}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isGoogleConnected ? "Continue →" : "Skip for now"}
            </Button>
          </div>
        </div>
      </div>
    </OnboardingStep>
  );
}
