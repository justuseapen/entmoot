import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateFeedback } from "@/hooks/useFeedback";
import { useAuthStore } from "@/stores/auth";
import {
  captureContext,
  type ReportType,
  type Severity,
  SEVERITY_LABELS,
} from "@/lib/feedback";

// Form-specific report types (subset of all report types)
type FormReportType = "bug" | "feature_request" | "feedback";

const feedbackSchema = z.object({
  report_type: z.enum(["bug", "feature_request", "feedback"]),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  severity: z.enum(["blocker", "major", "minor", "cosmetic"]).optional(),
  allow_contact: z.boolean(),
  contact_email: z
    .union([z.string().email("Invalid email"), z.literal("")])
    .optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackReporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: FormReportType;
}

const REPORT_TYPE_OPTIONS = [
  { value: "bug", label: "Report a Bug", icon: Bug, color: "text-red-600" },
  {
    value: "feature_request",
    label: "Feature Request",
    icon: Lightbulb,
    color: "text-yellow-600",
  },
  {
    value: "feedback",
    label: "General Feedback",
    icon: MessageSquare,
    color: "text-blue-600",
  },
] as const;

export function FeedbackReporter({
  open,
  onOpenChange,
  defaultType = "bug",
}: FeedbackReporterProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();
  const createFeedback = useCreateFeedback();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      report_type: defaultType,
      title: "",
      description: "",
      severity: undefined,
      allow_contact: false,
      contact_email: "",
    },
  });

  const reportType = watch("report_type");
  const allowContact = watch("allow_contact");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      reset({
        report_type: defaultType,
        title: "",
        description: "",
        severity: undefined,
        allow_contact: false,
        contact_email: user?.email || "",
      });
    }
  }, [open, reset, defaultType, user?.email]);

  const onSubmit = async (data: FeedbackFormData) => {
    setError(null);

    // Validate description is present for bugs
    if (data.report_type === "bug" && !data.description?.trim()) {
      setError("Please describe the bug you encountered");
      return;
    }

    try {
      const contextData = captureContext();

      await createFeedback.mutateAsync({
        report_type: data.report_type as ReportType,
        title: data.title,
        description: data.description || undefined,
        severity: data.severity as Severity | undefined,
        allow_contact: data.allow_contact,
        contact_email: data.allow_contact ? data.contact_email : undefined,
        context_data: contextData,
      });

      setSuccess(true);

      // Close modal after showing success message
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Thank you!</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've received your feedback and will review it soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Entmoot by reporting bugs, requesting features, or
            sharing your thoughts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Report Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {REPORT_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = reportType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue("report_type", option.value, {
                      shouldValidate: true,
                    })
                  }
                  className={`flex flex-col items-center rounded-lg border-2 p-3 transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isSelected ? option.color : "text-gray-500"}`}
                  />
                  <span
                    className={`mt-1 text-xs font-medium ${isSelected ? "text-blue-700" : "text-gray-600"}`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">
              {reportType === "bug" ? "What went wrong?" : "Title"}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={
                reportType === "bug"
                  ? "e.g., Button not working on Goals page"
                  : reportType === "feature_request"
                    ? "e.g., Add dark mode"
                    : "e.g., Love the weekly review feature!"
              }
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Severity (for bugs only) */}
          {reportType === "bug" && (
            <div>
              <Label htmlFor="severity">How severe is this issue?</Label>
              <Select
                value={watch("severity") || ""}
                onValueChange={(value) =>
                  setValue("severity", value as Severity, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(SEVERITY_LABELS) as [Severity, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description">
              {reportType === "bug" ? (
                <>
                  What happened?<span className="text-red-500">*</span>
                </>
              ) : (
                "Tell us more (optional)"
              )}
            </Label>
            <Textarea
              id="description"
              rows={4}
              placeholder={
                reportType === "bug"
                  ? "Please describe what you were doing and what happened..."
                  : "Share any additional details..."
              }
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Contact Preference */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow_contact"
                checked={allowContact}
                onCheckedChange={(checked) =>
                  setValue("allow_contact", !!checked)
                }
              />
              <Label htmlFor="allow_contact" className="cursor-pointer">
                May we follow up with you about this?
              </Label>
            </div>
            {allowContact && (
              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("contact_email")}
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Context disclosure */}
          <p className="text-xs text-gray-500">
            We automatically include: current page, browser, and screen size to
            help us understand the issue.
          </p>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Floating feedback button component
interface FeedbackButtonProps {
  onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none md:right-6 md:bottom-6"
      aria-label="Send feedback"
    >
      <MessageSquare className="h-5 w-5" />
    </button>
  );
}
