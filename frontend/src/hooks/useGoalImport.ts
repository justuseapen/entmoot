import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import {
  importGoals,
  checkImportStatus,
  type GoalImportResponse,
  type GoalImportResults,
  type ImportGoalsParams,
} from "@/lib/goalImport";

interface UseGoalImportOptions {
  familyId: number;
  onSuccess?: (results: GoalImportResults) => void;
  onError?: (error: Error) => void;
}

interface UseGoalImportReturn {
  importGoals: (params: Omit<ImportGoalsParams, "familyId">) => void;
  isImporting: boolean;
  isPolling: boolean;
  progress: "idle" | "uploading" | "processing" | "completed" | "failed";
  results: GoalImportResults | null;
  error: Error | null;
  reset: () => void;
}

export function useGoalImport({
  familyId,
  onSuccess,
  onError,
}: UseGoalImportOptions): UseGoalImportReturn {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] =
    useState<UseGoalImportReturn["progress"]>("idle");
  const [results, setResults] = useState<GoalImportResults | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Track if we've already processed a status to avoid duplicate callbacks
  const processedJobRef = useRef<string | null>(null);

  // Handle status query completion
  const handleStatusComplete = useCallback(
    (data: { status: string; results?: GoalImportResults; error?: string }) => {
      // Prevent processing the same job completion twice
      if (processedJobRef.current === jobId) {
        return;
      }

      if (data.status === "completed" && data.results) {
        processedJobRef.current = jobId;
        setJobId(null);
        setProgress("completed");
        setResults(data.results);
        setError(null);
        queryClient.invalidateQueries({ queryKey: ["goals", familyId] });
        onSuccess?.(data.results);
      } else if (data.status === "failed") {
        processedJobRef.current = jobId;
        setJobId(null);
        const err = new Error(data.error || "Import failed");
        setProgress("failed");
        setResults(null);
        setError(err);
        onError?.(err);
      }
    },
    [jobId, familyId, queryClient, onSuccess, onError]
  );

  // Mutation for initial upload
  const importMutation = useMutation({
    mutationFn: (params: Omit<ImportGoalsParams, "familyId">) =>
      importGoals({ ...params, familyId }),
    onMutate: () => {
      setProgress("uploading");
      setResults(null);
      setError(null);
      processedJobRef.current = null;
    },
    onSuccess: (data: GoalImportResponse) => {
      if (data.status === "completed" && data.results) {
        setProgress("completed");
        setResults(data.results);
        queryClient.invalidateQueries({ queryKey: ["goals", familyId] });
        onSuccess?.(data.results);
      } else if (data.status === "processing" && data.job_id) {
        setProgress("processing");
        setJobId(data.job_id);
      } else if (data.status === "failed") {
        const err = new Error(data.error || "Import failed");
        setProgress("failed");
        setError(err);
        onError?.(err);
      }
    },
    onError: (err: Error) => {
      setProgress("failed");
      setError(err);
      onError?.(err);
    },
  });

  // Query for polling status (only enabled when we have a jobId)
  const statusQuery = useQuery({
    queryKey: ["goalImportStatus", familyId, jobId],
    queryFn: async () => {
      const data = await checkImportStatus(familyId, jobId!);
      // Handle completion in the query function itself
      if (data.status === "completed" || data.status === "failed") {
        handleStatusComplete(data);
      }
      return data;
    },
    enabled: !!jobId && progress === "processing",
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  const reset = useCallback(() => {
    setProgress("idle");
    setResults(null);
    setError(null);
    setJobId(null);
    processedJobRef.current = null;
    importMutation.reset();
  }, [importMutation]);

  return {
    importGoals: importMutation.mutate,
    isImporting: importMutation.isPending,
    isPolling: !!jobId && statusQuery.isFetching,
    progress,
    results,
    error,
    reset,
  };
}
