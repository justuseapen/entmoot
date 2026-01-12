import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "inline" | "card" | "full-page";
}

// Map common error messages to user-friendly versions
function getUserFriendlyMessage(message: string): string {
  const errorMappings: Record<string, string> = {
    "Failed to fetch":
      "Unable to connect to the server. Please check your internet connection.",
    "Network Error":
      "Unable to connect to the server. Please check your internet connection.",
    "API error: 401": "Your session has expired. Please log in again.",
    "API error: 403": "You don't have permission to access this resource.",
    "API error: 404": "The requested resource was not found.",
    "API error: 500":
      "Something went wrong on our end. Please try again later.",
    "API error: 502":
      "Our servers are temporarily unavailable. Please try again later.",
    "API error: 503":
      "Our service is temporarily unavailable. Please try again later.",
  };

  for (const [key, value] of Object.entries(errorMappings)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // If it's a technical message, return a generic one
  if (
    message.includes("error") ||
    message.includes("Error") ||
    message.includes("undefined")
  ) {
    return "Something went wrong. Please try again.";
  }

  return message;
}

export function ErrorMessage({
  title = "Error",
  message = "Something went wrong",
  onRetry,
  retryLabel = "Try Again",
  variant = "inline",
}: ErrorMessageProps) {
  const friendlyMessage = getUserFriendlyMessage(message);

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{title}</p>
          <p className="mt-1 text-sm text-red-600">{friendlyMessage}</p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-4 w-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <CardTitle className="text-base text-red-800">{title}</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {friendlyMessage}
          </CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent className="pt-0">
            <Button onClick={onRetry} variant="outline" size="sm">
              {retryLabel}
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  // Full page variant
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-red-600">
            {friendlyMessage}
          </CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent className="flex justify-center">
            <Button onClick={onRetry}>{retryLabel}</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Simple inline error for forms
interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className="mt-1 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

// Query error handler component
interface QueryErrorProps {
  error: Error | null;
  refetch?: () => void;
  variant?: "inline" | "card" | "full-page";
}

export function QueryError({
  error,
  refetch,
  variant = "inline",
}: QueryErrorProps) {
  if (!error) return null;

  return (
    <ErrorMessage
      title="Failed to load data"
      message={error.message}
      onRetry={refetch}
      variant={variant}
    />
  );
}
