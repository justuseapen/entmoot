export interface GoalImportAssignee {
  id: number;
  name: string;
}

export interface ImportedGoal {
  id: number;
  title: string;
  time_scale: string;
  category: string | null;
  assignees: GoalImportAssignee[];
  confidence: number;
}

export interface ImportFailure {
  row: number;
  error: string;
  raw: string;
}

export interface SubGoalMilestone {
  title: string;
  time_scale: string;
  due_offset_days: number;
}

export interface SubGoalWeeklyTask {
  title: string;
  description: string;
  frequency: string;
}

export interface SubGoalSuggestion {
  goal_id: number;
  goal_title: string;
  milestones: SubGoalMilestone[];
  weekly_tasks: SubGoalWeeklyTask[];
}

export interface GoalImportResults {
  created_count: number;
  failed_count: number;
  categories: string[];
  goals: ImportedGoal[];
  failures: ImportFailure[];
  sub_goal_suggestions?: SubGoalSuggestion[];
}

export interface GoalImportResponse {
  status: "completed" | "processing" | "failed";
  results?: GoalImportResults;
  job_id?: string;
  message?: string;
  error?: string;
}

export interface GoalImportStatusResponse {
  status: "completed" | "processing" | "failed";
  results?: GoalImportResults;
  error?: string;
}

export interface ImportGoalsParams {
  familyId: number;
  file?: File;
  csvContent?: string;
  generateSubGoals?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function importGoals({
  familyId,
  file,
  csvContent,
  generateSubGoals = false,
}: ImportGoalsParams): Promise<GoalImportResponse> {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  } else if (csvContent) {
    formData.append("csv_content", csvContent);
  }

  if (generateSubGoals) {
    formData.append("generate_sub_goals", "true");
  }

  const response = await fetch(`${API_BASE}/families/${familyId}/goal_import`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function checkImportStatus(
  familyId: number,
  jobId: string
): Promise<GoalImportStatusResponse> {
  const response = await fetch(
    `${API_BASE}/families/${familyId}/goal_import/status?job_id=${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}
