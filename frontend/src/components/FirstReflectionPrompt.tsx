import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useFirstReflectionPromptStatus,
  useDismissFirstReflectionPrompt,
  useSubmitQuickReflection,
} from "@/hooks/useFirstReflectionPrompt";
import {
  getTimePeriodEmoji,
  getTimePeriodGreeting,
} from "@/lib/firstReflectionPrompt";
import { Sparkles, X, Send } from "lucide-react";

interface FirstReflectionPromptProps {
  familyId?: number;
  onComplete?: () => void;
}

export function FirstReflectionPrompt({
  familyId,
  onComplete,
}: FirstReflectionPromptProps) {
  const { data: promptStatus, isLoading } = useFirstReflectionPromptStatus();
  const dismissMutation = useDismissFirstReflectionPrompt();
  const submitMutation = useSubmitQuickReflection();
  const [isOpen, setIsOpen] = useState(true);
  const [response, setResponse] = useState("");

  // Don't show if still loading or shouldn't show
  if (isLoading || !promptStatus?.should_show) {
    return null;
  }

  const timePeriod = promptStatus.time_period;
  const prompt = promptStatus.prompt;

  // Don't show during night time (when prompt is null)
  if (!prompt) {
    return null;
  }

  const handleDismiss = async () => {
    await dismissMutation.mutateAsync();
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!response.trim()) return;

    await submitMutation.mutateAsync({
      response: response.trim(),
      familyId,
    });
    setIsOpen(false);
    onComplete?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-purple-600">
            <span className="text-2xl">{getTimePeriodEmoji(timePeriod)}</span>
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl">
            {getTimePeriodGreeting(timePeriod)}
          </DialogTitle>
          <DialogDescription className="text-base">
            Taking a moment to reflect helps you stay focused and mindful. This
            quick reflection only takes a minute.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="mb-3 block text-lg font-medium text-gray-900">
            {prompt.question}
          </label>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={prompt.placeholder}
            className="min-h-[120px] resize-none text-base"
            autoFocus
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={dismissMutation.isPending || submitMutation.isPending}
            className="text-gray-500"
          >
            <X className="mr-2 h-4 w-4" />
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !response.trim() ||
              submitMutation.isPending ||
              dismissMutation.isPending
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {submitMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        </DialogFooter>

        {submitMutation.isError && (
          <p className="mt-2 text-center text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
