/**
 * Custom error class for structured API errors.
 * Holds the structured error data from backend responses.
 */
export class ApiError extends Error {
  readonly errors: string[];
  readonly suggestion: string | undefined;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    errors: string[] = [],
    suggestion?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.suggestion = suggestion;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    const ErrorWithCapture = Error as ErrorConstructor & {
      captureStackTrace?: (target: object, constructor?: Function) => void;
    };
    if (typeof ErrorWithCapture.captureStackTrace === "function") {
      ErrorWithCapture.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Result type for getErrorMessage helper.
 */
export interface ErrorMessageResult {
  message: string;
  suggestion?: string;
}

/**
 * Extracts a user-friendly error message from any error type.
 * Handles ApiError, network errors, and unknown errors gracefully.
 */
export function getErrorMessage(error: unknown): ErrorMessageResult {
  // Handle ApiError with structured data
  if (error instanceof ApiError) {
    return {
      message: error.message,
      suggestion: error.suggestion,
    };
  }

  // Handle network errors (fetch failures)
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return {
      message: "Unable to connect. Please check your internet connection.",
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network-related error messages
    if (
      error.message.includes("network") ||
      error.message.includes("Network") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ERR_NETWORK")
    ) {
      return {
        message: "Unable to connect. Please check your internet connection.",
      };
    }
    return {
      message: error.message,
    };
  }

  // Handle unknown error types
  return {
    message: "Something went wrong. Please try again.",
  };
}
