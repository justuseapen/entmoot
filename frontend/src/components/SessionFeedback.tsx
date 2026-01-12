import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubmitSessionFeedback } from "@/hooks/useFeedback";
import { SESSION_RATING_EMOJIS, type SessionRating } from "@/lib/feedback";

interface SessionFeedbackProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowType: string;
  flowLabel: string;
  onDismiss?: () => void;
}

export function SessionFeedback({
  open,
  onOpenChange,
  flowType,
  flowLabel,
  onDismiss,
}: SessionFeedbackProps) {
  const [rating, setRating] = useState<SessionRating | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitSessionFeedback = useSubmitSessionFeedback();

  const handleRatingSelect = async (selectedRating: SessionRating) => {
    setRating(selectedRating);

    // For low ratings, prompt for more feedback
    if (selectedRating <= 2) {
      setShowFeedback(true);
    } else {
      // Submit immediately for positive ratings
      try {
        await submitSessionFeedback.mutateAsync({
          flowType,
          rating: selectedRating,
        });
        setSubmitted(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch {
        // Error handling
      }
    }
  };

  const handleSubmitWithFeedback = async () => {
    if (!rating) return;

    try {
      await submitSessionFeedback.mutateAsync({
        flowType,
        rating,
        feedback: feedback.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch {
      // Error handling
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
    onDismiss?.();
  };

  const handleDismiss = () => {
    handleClose();
  };

  const resetState = () => {
    setRating(null);
    setShowFeedback(false);
    setFeedback("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-3 text-4xl">✨</div>
            <p className="text-center text-sm text-gray-600">
              Thanks for your feedback!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-sm">
        <button
          onClick={handleDismiss}
          className="ring-offset-background absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-center">
            How was {flowLabel.toLowerCase()}?
          </DialogTitle>
          <DialogDescription className="text-center">
            Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>

        {!showFeedback ? (
          <div className="py-4">
            <div className="flex justify-center gap-3">
              {([1, 2, 3, 4, 5] as SessionRating[]).map((value) => (
                <button
                  key={value}
                  onClick={() => handleRatingSelect(value)}
                  className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                    rating === value
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "hover:bg-gray-100"
                  }`}
                  aria-label={SESSION_RATING_EMOJIS[value].label}
                >
                  <span className="text-2xl">
                    {SESSION_RATING_EMOJIS[value].emoji}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    {SESSION_RATING_EMOJIS[value].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">
                {rating && SESSION_RATING_EMOJIS[rating].emoji}
              </span>
              <span className="text-sm text-gray-500">
                {rating && SESSION_RATING_EMOJIS[rating].label}
              </span>
            </div>

            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What could we do better?"
              rows={3}
              className="resize-none"
              autoFocus
            />

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Skip
              </Button>
              <Button
                onClick={handleSubmitWithFeedback}
                disabled={submitSessionFeedback.isPending}
                size="sm"
              >
                {submitSessionFeedback.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SessionFeedback;
