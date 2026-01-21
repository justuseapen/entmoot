# Zustand Stores

Client-only state uses Zustand with `persist` middleware for session persistence.

## Pattern

```typescript
// stores/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "entmoot-auth",  // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

## When to Use Zustand vs TanStack Query
- **Zustand** — Client-only state (auth, UI preferences, tour progress)
- **TanStack Query** — Server state (API data with caching/invalidation)

## Conventions
- Store name: `use*Store` (e.g., `useAuthStore`, `useFamilyStore`)
- localStorage key: `entmoot-*` prefix
- Use `partialize` to exclude ephemeral state like `isLoading`
