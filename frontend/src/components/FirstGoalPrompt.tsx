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
import { Card, CardContent } from "@/components/ui/card";
import {
  useFirstGoalPromptStatus,
  useDismissFirstGoalPrompt,
} from "@/hooks/useFirstGoalPrompt";
import type { GoalSuggestion } from "@/lib/firstGoalPrompt";
import type { TimeScale } from "@/lib/goals";
import { Target, Sparkles, X } from "lucide-react";

interface FirstGoalPromptProps {
  onSelectSuggestion: (suggestion: GoalSuggestion) => void;
  onCreateOwn: () => void;
}

const timeScaleColors: Record<TimeScale, string> = {
  daily: "bg-purple-100 text-purple-700",
  weekly: "bg-blue-100 text-blue-700",
  monthly: "bg-green-100 text-green-700",
  quarterly: "bg-amber-100 text-amber-700",
  annual: "bg-rose-100 text-rose-700",
};

export function FirstGoalPrompt({
  onSelectSuggestion,
  onCreateOwn,
}: FirstGoalPromptProps) {
  const { data: promptStatus, isLoading } = useFirstGoalPromptStatus();
  const dismissMutation = useDismissFirstGoalPrompt();
  const [isOpen, setIsOpen] = useState(true);

  // Don't show if still loading or shouldn't show
  if (isLoading || !promptStatus?.should_show) {
    return null;
  }

  const handleDismiss = async () => {
    await dismissMutation.mutateAsync();
    setIsOpen(false);
  };

  const handleSelectSuggestion = (suggestion: GoalSuggestion) => {
    setIsOpen(false);
    onSelectSuggestion(suggestion);
  };

  const handleCreateOwn = () => {
    setIsOpen(false);
    onCreateOwn();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600">
            <Target className="h-6 w-6" />
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl">
            What's one thing you'd like to accomplish this week?
          </DialogTitle>
          <DialogDescription className="text-base">
            Setting your first goal is the beginning of a great journey. Here
            are some ideas to get you started, or create your own!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {promptStatus.suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {suggestion.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${timeScaleColors[suggestion.time_scale]}`}
                      >
                        {suggestion.time_scale}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {suggestion.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={dismissMutation.isPending}
            className="text-gray-500"
          >
            <X className="mr-2 h-4 w-4" />
            Maybe later
          </Button>
          <Button
            onClick={handleCreateOwn}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Create your own
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
