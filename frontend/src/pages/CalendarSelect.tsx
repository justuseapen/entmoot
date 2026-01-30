import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  useGoogleCalendarsList,
  useConnectGoogleCalendar,
} from "@/hooks/useGoogleCalendar";

export default function CalendarSelect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokens = searchParams.get("tokens");

  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );

  const {
    data: calendarsData,
    isLoading,
    error,
  } = useGoogleCalendarsList(tokens);

  const connectMutation = useConnectGoogleCalendar();

  // Compute the default calendar (primary or first available)
  const defaultCalendarId = useMemo(() => {
    if (!calendarsData?.calendars) return null;
    const primary = calendarsData.calendars.find((cal) => cal.primary);
    if (primary) return primary.id;
    if (calendarsData.calendars.length > 0)
      return calendarsData.calendars[0].id;
    return null;
  }, [calendarsData]);

  // Use selected calendar or fall back to default
  const effectiveCalendarId = selectedCalendarId ?? defaultCalendarId;
  const selectedCalendar = useMemo(() => {
    if (!effectiveCalendarId || !calendarsData?.calendars) return null;
    return (
      calendarsData.calendars.find((cal) => cal.id === effectiveCalendarId) ??
      null
    );
  }, [effectiveCalendarId, calendarsData]);

  const handleConnect = () => {
    if (!selectedCalendar || !tokens) return;

    connectMutation.mutate(
      {
        calendar_id: selectedCalendar.id,
        calendar_name: selectedCalendar.summary,
        // Extract email from primary calendar ID if available
        google_email: selectedCalendar.primary
          ? selectedCalendar.id
          : undefined,
        tokens,
      },
      {
        onSuccess: () => {
          navigate("/settings/notifications", {
            state: { calendarConnected: true },
          });
        },
      }
    );
  };

  const handleCancel = () => {
    navigate("/settings/notifications");
  };

  // No tokens in URL - redirect back
  if (!tokens) {
    return (
      <div className="container max-w-lg py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No authorization data found. Please try connecting again.
              </AlertDescription>
            </Alert>
            <Button onClick={handleCancel} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-lg py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-lg py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load your calendars. Your session may have expired.
                Please try connecting again.
              </AlertDescription>
            </Alert>
            <Button onClick={handleCancel} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calendars = calendarsData?.calendars || [];

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Calendar
          </CardTitle>
          <CardDescription>
            Choose which Google Calendar you want to sync your goals and
            reminders to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {calendars.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No calendars found in your Google account.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup
              value={selectedCalendar?.id}
              onValueChange={(value: string) => {
                setSelectedCalendarId(value);
              }}
              className="space-y-3"
            >
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-colors ${
                    selectedCalendar?.id === calendar.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedCalendarId(calendar.id)}
                >
                  <RadioGroupItem value={calendar.id} id={calendar.id} />
                  <Label
                    htmlFor={calendar.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{calendar.summary}</span>
                      {calendar.primary && (
                        <span className="bg-muted rounded px-2 py-0.5 text-xs">
                          Primary
                        </span>
                      )}
                    </div>
                    {calendar.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {calendar.description}
                      </p>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {connectMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect calendar. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!selectedCalendar || connectMutation.isPending}
              className="flex-1"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Connect Calendar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
