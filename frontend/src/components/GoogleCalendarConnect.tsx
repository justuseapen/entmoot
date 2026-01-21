import {
  Calendar,
  RefreshCw,
  Pause,
  Play,
  Unlink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  useGoogleCalendarStatus,
  useGoogleCalendarAuthUrl,
  useDisconnectGoogleCalendar,
  useSyncGoogleCalendar,
  usePauseGoogleCalendar,
  useResumeGoogleCalendar,
} from "@/hooks/useGoogleCalendar";
import { formatDistanceToNow } from "date-fns";

export function GoogleCalendarConnect() {
  const { data: status, isLoading, error } = useGoogleCalendarStatus();
  const authUrlMutation = useGoogleCalendarAuthUrl();
  const disconnectMutation = useDisconnectGoogleCalendar();
  const syncMutation = useSyncGoogleCalendar();
  const pauseMutation = usePauseGoogleCalendar();
  const resumeMutation = useResumeGoogleCalendar();

  const handleConnect = () => {
    authUrlMutation.mutate();
  };

  const handleDisconnect = () => {
    if (
      window.confirm(
        "Are you sure you want to disconnect Google Calendar? Your synced events will remain in your calendar but will no longer be updated."
      )
    ) {
      disconnectMutation.mutate();
    }
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handlePause = () => {
    pauseMutation.mutate();
  };

  const handleResume = () => {
    resumeMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-10 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Google Calendar status. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to sync goals and review reminders as
            calendar events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnect}
            disabled={authUrlMutation.isPending}
            className="w-full sm:w-auto"
          >
            {authUrlMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Connect Google Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <StatusBadge status={status.sync_status} />
        </div>
        <CardDescription>
          {status.google_email && (
            <span className="block">Connected as {status.google_email}</span>
          )}
          {status.calendar_name && (
            <span className="block">Calendar: {status.calendar_name}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.sync_status === "error" && status.last_error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Sync error: {status.last_error}</AlertDescription>
          </Alert>
        )}

        {status.last_sync_at && (
          <p className="text-muted-foreground text-sm">
            Last synced{" "}
            {formatDistanceToNow(new Date(status.last_sync_at), {
              addSuffix: true,
            })}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {status.sync_status === "active" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={pauseMutation.isPending}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Sync
              </Button>
            </>
          )}

          {status.sync_status === "paused" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={resumeMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              Resume Sync
            </Button>
          )}

          {status.sync_status === "error" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={resumeMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Unlink className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-500">
          Active
        </Badge>
      );
    case "paused":
      return <Badge variant="secondary">Paused</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return null;
  }
}
