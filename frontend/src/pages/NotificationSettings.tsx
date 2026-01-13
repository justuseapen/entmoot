import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { useFamilyStore } from "@/stores/family";
import {
  DAYS_OF_WEEK,
  generateTimeOptions,
  getSchedulePreview,
  INACTIVITY_THRESHOLD_OPTIONS,
  type UpdateNotificationPreferencesData,
} from "@/lib/notificationPreferences";

const TIME_OPTIONS = generateTimeOptions();

export function NotificationSettings() {
  const { currentFamily } = useFamilyStore();
  const { data, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [success, setSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const prefs = data?.notification_preferences;

  const handleUpdate = async (updates: UpdateNotificationPreferencesData) => {
    setSuccess(null);
    setUpdateError(null);
    try {
      await updatePreferences.mutateAsync(updates);
      setSuccess("Preferences saved");
      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update preferences"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">
            Loading notification settings...
          </p>
        </div>
      </div>
    );
  }

  if (error || !prefs) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load notification settings"}
              </p>
              <Button asChild className="mt-4">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const schedulePreview = getSchedulePreview(prefs, currentFamily?.timezone);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground">
              Configure when and how you receive notifications
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Feedback messages */}
        {success && (
          <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800">
            {success}
          </div>
        )}
        {updateError && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
            {updateError}
          </div>
        )}

        <div className="space-y-6">
          {/* Channel Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="in-app">In-App Notifications</Label>
                  <p className="text-muted-foreground text-sm">
                    Show notifications within the app
                  </p>
                </div>
                <Switch
                  id="in-app"
                  checked={prefs.channels.in_app}
                  onCheckedChange={(checked) =>
                    handleUpdate({ in_app: checked })
                  }
                  disabled={updatePreferences.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email Notifications</Label>
                  <p className="text-muted-foreground text-sm">
                    Receive reminders via email
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={prefs.channels.email}
                  onCheckedChange={(checked) =>
                    handleUpdate({ email: checked })
                  }
                  disabled={updatePreferences.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push">Push Notifications</Label>
                  <p className="text-muted-foreground text-sm">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  id="push"
                  checked={prefs.channels.push}
                  onCheckedChange={(checked) => handleUpdate({ push: checked })}
                  disabled={updatePreferences.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reminder Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reminders</CardTitle>
              <CardDescription>
                Set up reminders to help you stay on track
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Morning Planning */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="morning-planning">Morning Planning</Label>
                    <p className="text-muted-foreground text-sm">
                      Daily reminder to plan your day
                    </p>
                  </div>
                  <Switch
                    id="morning-planning"
                    checked={prefs.reminders.morning_planning.enabled}
                    onCheckedChange={(checked) =>
                      handleUpdate({ morning_planning: checked })
                    }
                    disabled={updatePreferences.isPending}
                  />
                </div>
                {prefs.reminders.morning_planning.enabled && (
                  <div className="flex items-center gap-2 pl-4">
                    <Label
                      htmlFor="morning-planning-time"
                      className="text-muted-foreground text-sm"
                    >
                      Time:
                    </Label>
                    <Select
                      value={prefs.reminders.morning_planning.time}
                      onValueChange={(value) =>
                        handleUpdate({ morning_planning_time: value })
                      }
                      disabled={updatePreferences.isPending}
                    >
                      <SelectTrigger
                        id="morning-planning-time"
                        className="w-32"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Evening Reflection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="evening-reflection">
                      Evening Reflection
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Daily reminder to reflect on your day
                    </p>
                  </div>
                  <Switch
                    id="evening-reflection"
                    checked={prefs.reminders.evening_reflection.enabled}
                    onCheckedChange={(checked) =>
                      handleUpdate({ evening_reflection: checked })
                    }
                    disabled={updatePreferences.isPending}
                  />
                </div>
                {prefs.reminders.evening_reflection.enabled && (
                  <div className="flex items-center gap-2 pl-4">
                    <Label
                      htmlFor="evening-reflection-time"
                      className="text-muted-foreground text-sm"
                    >
                      Time:
                    </Label>
                    <Select
                      value={prefs.reminders.evening_reflection.time}
                      onValueChange={(value) =>
                        handleUpdate({ evening_reflection_time: value })
                      }
                      disabled={updatePreferences.isPending}
                    >
                      <SelectTrigger
                        id="evening-reflection-time"
                        className="w-32"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Weekly Review */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-review">Weekly Review</Label>
                    <p className="text-muted-foreground text-sm">
                      Weekly reminder to review your progress
                    </p>
                  </div>
                  <Switch
                    id="weekly-review"
                    checked={prefs.reminders.weekly_review.enabled}
                    onCheckedChange={(checked) =>
                      handleUpdate({ weekly_review: checked })
                    }
                    disabled={updatePreferences.isPending}
                  />
                </div>
                {prefs.reminders.weekly_review.enabled && (
                  <div className="flex flex-wrap items-center gap-2 pl-4">
                    <Label
                      htmlFor="weekly-review-day"
                      className="text-muted-foreground text-sm"
                    >
                      Day:
                    </Label>
                    <Select
                      value={prefs.reminders.weekly_review.day.toString()}
                      onValueChange={(value) =>
                        handleUpdate({ weekly_review_day: parseInt(value, 10) })
                      }
                      disabled={updatePreferences.isPending}
                    >
                      <SelectTrigger id="weekly-review-day" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem
                            key={day.value}
                            value={day.value.toString()}
                          >
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label
                      htmlFor="weekly-review-time"
                      className="text-muted-foreground text-sm"
                    >
                      at
                    </Label>
                    <Select
                      value={prefs.reminders.weekly_review.time}
                      onValueChange={(value) =>
                        handleUpdate({ weekly_review_time: value })
                      }
                      disabled={updatePreferences.isPending}
                    >
                      <SelectTrigger id="weekly-review-time" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiet Hours</CardTitle>
              <CardDescription>
                Set times when you don&apos;t want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor="quiet-hours-start"
                  className="text-muted-foreground text-sm"
                >
                  From:
                </Label>
                <Select
                  value={prefs.quiet_hours.start}
                  onValueChange={(value) =>
                    handleUpdate({ quiet_hours_start: value })
                  }
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger id="quiet-hours-start" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label
                  htmlFor="quiet-hours-end"
                  className="text-muted-foreground text-sm"
                >
                  to
                </Label>
                <Select
                  value={prefs.quiet_hours.end}
                  onValueChange={(value) =>
                    handleUpdate({ quiet_hours_end: value })
                  }
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger id="quiet-hours-end" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-muted-foreground text-sm">
                Notifications will be silenced during this time period.
              </p>
            </CardContent>
          </Card>

          {/* In-App Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">In-App Tips</CardTitle>
              <CardDescription>
                Contextual tips to help you get the most out of Entmoot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tips">Show Helpful Tips</Label>
                  <p className="text-muted-foreground text-sm">
                    Display contextual tips as you use the app
                  </p>
                </div>
                <Switch
                  id="tips"
                  checked={prefs.tips?.enabled ?? true}
                  onCheckedChange={(checked) =>
                    handleUpdate({ tips_enabled: checked })
                  }
                  disabled={updatePreferences.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Re-engagement Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Re-engagement Reminders</CardTitle>
              <CardDescription>
                Get helpful nudges when you miss a check-in or become inactive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reengagement">
                    Enable Re-engagement Reminders
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Master toggle for all re-engagement notifications
                  </p>
                </div>
                <Switch
                  id="reengagement"
                  checked={prefs.reengagement?.enabled ?? true}
                  onCheckedChange={(checked) =>
                    handleUpdate({ reengagement_enabled: checked })
                  }
                  disabled={updatePreferences.isPending}
                />
              </div>

              {prefs.reengagement?.enabled !== false && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="missed-checkin">
                        Missed Check-in Reminders
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Get reminded if you miss morning planning or evening
                        reflection
                      </p>
                    </div>
                    <Switch
                      id="missed-checkin"
                      checked={
                        prefs.reengagement?.missed_checkin_reminder ?? true
                      }
                      onCheckedChange={(checked) =>
                        handleUpdate({ missed_checkin_reminder: checked })
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inactivity">Inactivity Reminders</Label>
                      <p className="text-muted-foreground text-sm">
                        Get reminded if you haven&apos;t used Entmoot in a while
                      </p>
                    </div>
                    <Switch
                      id="inactivity"
                      checked={prefs.reengagement?.inactivity_reminder ?? true}
                      onCheckedChange={(checked) =>
                        handleUpdate({ inactivity_reminder: checked })
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  {prefs.reengagement?.inactivity_reminder !== false && (
                    <div className="flex items-center gap-2 pl-4">
                      <Label
                        htmlFor="inactivity-threshold"
                        className="text-muted-foreground text-sm"
                      >
                        Remind me after:
                      </Label>
                      <Select
                        value={(
                          prefs.reengagement?.inactivity_threshold_days ?? 7
                        ).toString()}
                        onValueChange={(value) =>
                          handleUpdate({
                            inactivity_threshold_days: parseInt(value, 10),
                          })
                        }
                        disabled={updatePreferences.isPending}
                      >
                        <SelectTrigger
                          id="inactivity-threshold"
                          className="w-32"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INACTIVITY_THRESHOLD_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value.toString()}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-sm">
                        of inactivity
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Schedule Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Schedule</CardTitle>
              <CardDescription>
                Preview of your notification schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {schedulePreview.map((item, index) => (
                  <li key={index} className="text-sm">
                    {index === schedulePreview.length - 1 ? (
                      <span className="text-muted-foreground italic">
                        {item}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        {item}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
