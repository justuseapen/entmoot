import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoalImport } from "@/hooks/useGoalImport";
import type { GoalImportResults, SubGoalSuggestion } from "@/lib/goalImport";

interface GoalImportModalProps {
  familyId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (results: GoalImportResults) => void;
}

export function GoalImportModal({
  familyId,
  open,
  onOpenChange,
  onComplete,
}: GoalImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [generateSubGoals, setGenerateSubGoals] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const { importGoals, isImporting, progress, results, error, reset } =
    useGoalImport({
      familyId,
      onSuccess: (results) => {
        onComplete?.(results);
      },
    });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    []
  );

  const handleImport = useCallback(() => {
    if (!file) return;
    importGoals({ file, generateSubGoals });
  }, [file, generateSubGoals, importGoals]);

  const handleClose = useCallback(() => {
    setFile(null);
    setGenerateSubGoals(true);
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : file
              ? "border-green-500 bg-green-50"
              : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        {file ? (
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <p className="font-medium">{file.name}</p>
            <p className="text-muted-foreground text-sm">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📄</div>
            <p className="font-medium">Drop your CSV file here</p>
            <p className="text-muted-foreground text-sm">or</p>
            <label>
              <Button type="button" variant="secondary" size="sm" asChild>
                <span>Browse Files</span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="generateSubGoals"
          checked={generateSubGoals}
          onCheckedChange={(checked) => setGenerateSubGoals(checked === true)}
        />
        <Label htmlFor="generateSubGoals" className="cursor-pointer text-sm">
          Generate AI sub-goal suggestions for annual/quarterly goals
        </Label>
      </div>

      {/* File Format Info */}
      <div className="text-muted-foreground bg-muted/50 rounded-lg p-4 text-sm">
        <p className="mb-2 font-medium">Expected CSV format:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Column A: Category (e.g., "Spiritual", "Financial")</li>
          <li>Column B: Goal title</li>
          <li>
            Columns C-G: SMART criteria (Specific, Measurable, Achievable,
            Relevant, Time-bound)
          </li>
        </ul>
        <p className="mt-2">
          The AI will automatically infer time scales and match assignee names
          to family members.
        </p>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto w-fit animate-spin text-4xl">⏳</div>
      <p className="font-medium">
        {progress === "uploading"
          ? "Uploading file..."
          : "Processing goals with AI..."}
      </p>
      <p className="text-muted-foreground text-sm">
        {progress === "processing"
          ? "This may take a moment while we analyze each goal..."
          : "Please wait..."}
      </p>
    </div>
  );

  const renderResultsStep = () => {
    if (!results) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {results.created_count}
            </div>
            <div className="text-sm text-green-700">Goals Created</div>
          </div>
          {results.failed_count > 0 && (
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {results.failed_count}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
          )}
        </div>

        {/* Categories */}
        {results.categories.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium">Categories Detected</h4>
            <div className="flex flex-wrap gap-2">
              {results.categories.map((cat) => (
                <span
                  key={cat}
                  className="bg-muted rounded-md px-2 py-1 text-sm"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Created Goals */}
        {results.goals.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium">Created Goals</h4>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {results.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-muted/50 flex items-center justify-between rounded-md p-2"
                >
                  <div>
                    <span className="font-medium">{goal.title}</span>
                    {goal.category && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {goal.category}
                      </span>
                    )}
                  </div>
                  <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">
                    {goal.time_scale}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failures */}
        {results.failures.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-red-600">Import Failures</h4>
            <div className="max-h-32 space-y-2 overflow-y-auto">
              {results.failures.map((failure, i) => (
                <div key={i} className="rounded-md bg-red-50 p-2 text-sm">
                  <span className="font-medium">Row {failure.row}:</span>{" "}
                  {failure.error}
                  {failure.raw && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({failure.raw})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-goal Suggestions */}
        {results.sub_goal_suggestions &&
          results.sub_goal_suggestions.length > 0 && (
            <SubGoalSuggestionsPanel
              suggestions={results.sub_goal_suggestions}
            />
          )}
      </div>
    );
  };

  const renderErrorStep = () => (
    <div className="space-y-4 py-8 text-center">
      <div className="text-4xl">❌</div>
      <p className="font-medium text-red-600">Import Failed</p>
      <p className="text-muted-foreground text-sm">
        {error?.message || "An unexpected error occurred"}
      </p>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Goals from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your goals. The AI will parse categories,
            infer time scales, and match assignee names to family members.
          </DialogDescription>
        </DialogHeader>

        {progress === "idle" && renderUploadStep()}
        {(progress === "uploading" || progress === "processing") &&
          renderProcessingStep()}
        {progress === "completed" && renderResultsStep()}
        {progress === "failed" && renderErrorStep()}

        <DialogFooter>
          {progress === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isImporting}>
                {isImporting ? "Importing..." : "Import Goals"}
              </Button>
            </>
          )}
          {progress === "completed" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubGoalSuggestionsPanel({
  suggestions,
}: {
  suggestions: SubGoalSuggestion[];
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3 rounded-lg bg-purple-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">✨</span>
        <h4 className="font-medium text-purple-900">AI Sub-Goal Suggestions</h4>
      </div>
      <p className="text-sm text-purple-700">
        Based on your annual goals, here are suggested milestones and tasks:
      </p>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.goal_id}
            className="rounded-md border border-purple-200 bg-white"
          >
            <button
              type="button"
              onClick={() =>
                setExpanded(
                  expanded === suggestion.goal_id ? null : suggestion.goal_id
                )
              }
              className="flex w-full items-center justify-between p-3 text-left"
            >
              <span className="font-medium">{suggestion.goal_title}</span>
              <span className="text-muted-foreground">
                {expanded === suggestion.goal_id ? "−" : "+"}
              </span>
            </button>
            {expanded === suggestion.goal_id && (
              <div className="space-y-3 px-3 pb-3">
                {suggestion.milestones.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-purple-800">
                      Milestones:
                    </p>
                    <ul className="space-y-1 text-sm">
                      {suggestion.milestones.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-500">•</span>
                          <span>
                            {m.title}{" "}
                            <span className="text-muted-foreground">
                              ({m.time_scale})
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestion.weekly_tasks.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-purple-800">
                      Weekly Tasks:
                    </p>
                    <ul className="space-y-1 text-sm">
                      {suggestion.weekly_tasks.map((t, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-500">•</span>
                          <span>
                            {t.title}
                            {t.description && (
                              <span className="text-muted-foreground">
                                {" "}
                                - {t.description}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
