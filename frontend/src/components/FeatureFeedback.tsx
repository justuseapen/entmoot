import { useState } from "react";
import { ThumbsUp, ThumbsDown, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useSubmitFeatureFeedback,
  useFeatureFeedbackState,
} from "@/hooks/useFeedback";

interface FeatureFeedbackProps {
  feature: string;
  featureLabel: string;
  onClose?: () => void;
  inline?: boolean;
}

export function FeatureFeedback({
  feature,
  featureLabel,
  onClose,
  inline = false,
}: FeatureFeedbackProps) {
  const [rating, setRating] = useState<"positive" | "negative" | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeatureFeedback = useSubmitFeatureFeedback();
  const { isFeatureRated, markFeatureRated } = useFeatureFeedbackState(feature);

  // Don't render if already rated
  if (isFeatureRated && !submitted) {
    return null;
  }

  const handleRating = async (selectedRating: "positive" | "negative") => {
    setRating(selectedRating);

    // If they just clicked thumbs up/down, submit immediately
    // They can optionally expand to add more feedback
    if (!showExpanded) {
      try {
        await submitFeatureFeedback.mutateAsync({
          feature,
          rating: selectedRating,
        });
        markFeatureRated();
        setSubmitted(true);
        setTimeout(() => {
          onClose?.();
        }, 1500);
      } catch {
        // Error handling
      }
    }
  };

  const handleSubmitWithFeedback = async () => {
    if (!rating) return;

    try {
      await submitFeatureFeedback.mutateAsync({
        feature,
        rating,
        feedback: feedback.trim() || undefined,
      });
      markFeatureRated();
      setSubmitted(true);
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch {
      // Error handling
    }
  };

  const handleDismiss = () => {
    markFeatureRated();
    onClose?.();
  };

  if (submitted) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-green-600 ${inline ? "" : "rounded-lg bg-green-50 p-3"}`}
      >
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  const containerClass = inline
    ? "flex items-center gap-3 text-sm"
    : "p-4 bg-gray-50 rounded-lg border";

  return (
    <div className={containerClass}>
      <div className="flex flex-1 items-center gap-3">
        <span className="text-sm text-gray-600">
          How was {featureLabel.toLowerCase()}?
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleRating("positive")}
            className={`rounded-full p-2 transition-colors ${
              rating === "positive"
                ? "bg-green-100 text-green-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label="Thumbs up"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRating("negative")}
            className={`rounded-full p-2 transition-colors ${
              rating === "negative"
                ? "bg-red-100 text-red-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label="Thumbs down"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>

        {rating && !inline && (
          <button
            onClick={() => setShowExpanded(!showExpanded)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            {showExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Tell us more
              </>
            )}
          </button>
        )}

        {!inline && (
          <button
            onClick={handleDismiss}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showExpanded && rating && !inline && (
        <div className="mt-3 space-y-3">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What could we improve?"
            rows={2}
            className="resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpanded(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitWithFeedback}
              disabled={submitFeatureFeedback.isPending}
            >
              {submitFeatureFeedback.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Floating feature feedback that appears after first use
interface FeatureFeedbackToastProps {
  feature: string;
  featureLabel: string;
  show: boolean;
  onClose: () => void;
}

export function FeatureFeedbackToast({
  feature,
  featureLabel,
  show,
  onClose,
}: FeatureFeedbackToastProps) {
  if (!show) return null;

  return (
    <div className="animate-in slide-in-from-bottom-5 fade-in fixed right-4 bottom-20 z-40 duration-300">
      <FeatureFeedback
        feature={feature}
        featureLabel={featureLabel}
        onClose={onClose}
      />
    </div>
  );
}

export default FeatureFeedback;
