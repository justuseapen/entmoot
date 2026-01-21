import { apiFetch } from "./api";

export interface Habit {
  id: number;
  name: string;
  position: number;
  is_active: boolean;
}

export interface CreateHabitData {
  name: string;
}

export interface UpdateHabitData {
  name?: string;
  is_active?: boolean;
}

export interface PositionUpdate {
  id: number;
  position: number;
}

// Habit endpoints
export async function getHabits(
  familyId: number
): Promise<{ habits: Habit[] }> {
  return apiFetch<{ habits: Habit[] }>(`/families/${familyId}/habits`);
}

export async function createHabit(
  familyId: number,
  data: CreateHabitData
): Promise<{ message: string; habit: Habit }> {
  return apiFetch<{ message: string; habit: Habit }>(
    `/families/${familyId}/habits`,
    {
      method: "POST",
      body: JSON.stringify({ habit: data }),
    }
  );
}

export async function updateHabit(
  familyId: number,
  habitId: number,
  data: UpdateHabitData
): Promise<{ message: string; habit: Habit }> {
  return apiFetch<{ message: string; habit: Habit }>(
    `/families/${familyId}/habits/${habitId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ habit: data }),
    }
  );
}

export async function deleteHabit(
  familyId: number,
  habitId: number
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/families/${familyId}/habits/${habitId}`,
    {
      method: "DELETE",
    }
  );
}

export async function updateHabitPositions(
  familyId: number,
  positions: PositionUpdate[]
): Promise<{ message: string; habits: Habit[] }> {
  return apiFetch<{ message: string; habits: Habit[] }>(
    `/families/${familyId}/habits/update_positions`,
    {
      method: "POST",
      body: JSON.stringify({ positions }),
    }
  );
}
