import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50">
      <div className="h-1 w-full overflow-hidden bg-blue-100">
        <div className="animate-loading-bar h-full bg-blue-500"></div>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500"></div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`animate-spin rounded-full border-blue-200 border-t-blue-500 ${sizeClasses[size]} ${className}`}
    ></div>
  );
}
