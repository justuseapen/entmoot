# Hooks + Lib Separation

API functions live in `lib/`, TanStack Query hooks live in `hooks/`.

## Structure

```
src/
├── lib/
│   ├── goals.ts      # Types + API functions + helpers
│   └── families.ts
└── hooks/
    ├── useGoals.ts   # TanStack Query hooks only
    └── useFamilies.ts
```

## lib/ files contain:

```typescript
// lib/goals.ts
export interface Goal { ... }
export type GoalStatus = "not_started" | "in_progress" | ...

export async function getGoals(familyId: number) { ... }
export async function createGoal(familyId: number, data: CreateGoalData) { ... }

export const statusOptions = [...]  // UI constants
export function getStatusColor(status: GoalStatus) { ... }  // Helpers
```

## hooks/ files contain:

```typescript
// hooks/useGoals.ts
import { getGoals, createGoal } from "@/lib/goals";

export const goalKeys = { ... }  // Query key factory

export function useGoals(familyId: number) {
  return useQuery({ queryKey: goalKeys.list(familyId), queryFn: () => getGoals(familyId) });
}

export function useCreateGoal(familyId: number) {
  return useMutation({ mutationFn: (data) => createGoal(familyId, data), onSuccess: ... });
}
```

## Why This Separation
- **lib/** is framework-agnostic, can be used anywhere
- **hooks/** encapsulates React Query logic (caching, invalidation)
- Easier testing — mock `lib/` functions to test hooks
