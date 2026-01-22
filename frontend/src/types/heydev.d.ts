/**
 * HeyDev Feedback Widget TypeScript Declarations
 * @see https://heydev.io
 */

interface HeyDevError {
  message?: string;
  stack?: string;
}

interface HeyDevWidget {
  /** Widget version */
  version: string;

  /** Open the feedback panel */
  open(): void;

  /** Close the feedback panel */
  close(): void;

  /** Check if the feedback panel is open */
  isOpen(): boolean;

  /** Remove the widget from the DOM */
  destroy(): void;

  /** Manually capture and report an error */
  captureError(error: HeyDevError): void;
}

declare global {
  interface Window {
    /**
     * HeyDev feedback widget instance.
     * Available after the HeyDev script loads (if VITE_HEYDEV_API_KEY is configured).
     */
    HeyDev?: HeyDevWidget;
  }
}

export type { HeyDevWidget, HeyDevError };
