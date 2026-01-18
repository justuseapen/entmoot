import { apiFetch } from "./api";

export interface AssignedGoal {
  id: number;
  title: string;
  status: string;
  progress: number;
  due_date: string | null;
  time_scale: string;
}

export interface AssignedTask {
  id: number;
  title: string;
  completed: boolean;
  daily_plan_date: string;
  owner_name: string;
}

export interface MyDeadlinesResponse {
  goals: AssignedGoal[];
  tasks: AssignedTask[];
}

export async function getMyDeadlines(
  familyId: number
): Promise<MyDeadlinesResponse> {
  return apiFetch<MyDeadlinesResponse>(`/families/${familyId}/my_deadlines`);
}
