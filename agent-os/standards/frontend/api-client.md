# API Client

All API calls go through `apiFetch` which handles auth, errors, and typing.

## Core Pattern

```typescript
// lib/api.ts
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.error, response.status, data.errors, data.suggestion);
  }

  return response.json();
}
```

## Usage in lib/ files

```typescript
// lib/goals.ts
export async function getGoals(familyId: number): Promise<{ goals: Goal[] }> {
  return apiFetch<{ goals: Goal[] }>(`/families/${familyId}/goals`);
}

export async function createGoal(familyId: number, data: CreateGoalData) {
  return apiFetch<CreateGoalResponse>(`/families/${familyId}/goals`, {
    method: "POST",
    body: JSON.stringify({ goal: data }),
  });
}
```

## Error Handling

`ApiError` preserves backend's structured error format:

```typescript
try {
  await createGoal(familyId, data);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.message);     // Main error
    console.log(error.errors);      // Validation details
    console.log(error.suggestion);  // Helpful hint
  }
}
```
