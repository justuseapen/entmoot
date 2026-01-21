# TanStack Query Key Factory

Query keys use a factory pattern for consistency and targeted cache invalidation.

## Pattern

```typescript
export const goalKeys = {
  all: ["goals"] as const,
  lists: () => [...goalKeys.all, "list"] as const,
  list: (familyId: number, filters?: GoalFilters) =>
    [...goalKeys.lists(), familyId, filters] as const,
  details: () => [...goalKeys.all, "detail"] as const,
  detail: (familyId: number, goalId: number) =>
    [...goalKeys.details(), familyId, goalId] as const,
};
```

## Usage

```typescript
// Queries
useQuery({ queryKey: goalKeys.list(familyId, filters), queryFn: ... })
useQuery({ queryKey: goalKeys.detail(familyId, goalId), queryFn: ... })

// Invalidation
queryClient.invalidateQueries({ queryKey: goalKeys.lists() })  // All lists
queryClient.invalidateQueries({ queryKey: goalKeys.detail(familyId, goalId) })  // One detail
```

## Benefits
- **Targeted invalidation** — Invalidate all lists, or just one specific query
- **Type safety** — `as const` ensures array is readonly and typed
- **Consistency** — All hooks use the same key structure

## Naming Convention
- `*Keys` for the factory object
- `all` → `lists()` → `list(params)` hierarchy for collections
- `all` → `details()` → `detail(id)` hierarchy for single items
