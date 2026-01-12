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
import { useSubmitNPS, useNPSFollowUp } from "@/hooks/useFeedback";

interface NPSSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

export function NPSSurvey({ open, onOpenChange, onDismiss }: NPSSurveyProps) {
  const [step, setStep] = useState<"score" | "followup" | "thanks">("score");
  const [score, setScore] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState("");

  const submitNPS = useSubmitNPS();
  const { data: followUpData } = useNPSFollowUp(score);

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep("followup");
  };

  const handleSubmit = async () => {
    if (score === null) return;

    try {
      await submitNPS.mutateAsync({ score, followUp });
      setStep("thanks");
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 2000);
    } catch {
      // Error handling - could show a toast
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
    resetState();
  };

  const handleSkip = () => {
    // Submit without follow-up
    if (score !== null) {
      submitNPS.mutate({ score, followUp: "" });
    }
    onDismiss();
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setStep("score");
    setScore(null);
    setFollowUp("");
  };

  const getScoreColor = (value: number): string => {
    if (value >= 9) return "bg-green-500 hover:bg-green-600 text-white";
    if (value >= 7) return "bg-yellow-500 hover:bg-yellow-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  if (step === "thanks") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 text-4xl">🙏</div>
            <h3 className="text-lg font-semibold">Thank you!</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your feedback helps us make Entmoot better for families
              everywhere.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <button
          onClick={handleDismiss}
          className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <DialogTitle>
            {step === "score"
              ? "How likely are you to recommend Entmoot?"
              : followUpData?.question || "Tell us more"}
          </DialogTitle>
          <DialogDescription>
            {step === "score"
              ? "Help us improve by sharing your honest feedback."
              : "Your thoughts help us understand how to serve families better."}
          </DialogDescription>
        </DialogHeader>

        {step === "score" && (
          <div className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Not at all likely</span>
              <span className="text-xs text-gray-500">Extremely likely</span>
            </div>
            <div className="grid grid-cols-11 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => handleScoreSelect(value)}
                  className={`h-10 w-full rounded-md font-medium transition-all ${
                    score === value
                      ? getScoreColor(value) + " ring-2 ring-offset-2"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Maybe later
              </Button>
            </div>
          </div>
        )}

        {step === "followup" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Your score:</span>
              <span
                className={`rounded px-2 py-1 font-medium ${getScoreColor(score!)}`}
              >
                {score}
              </span>
            </div>

            <Textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Share your thoughts... (optional)"
              rows={4}
              className="resize-none"
            />

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitNPS.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitNPS.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NPSSurvey;
