import type { User } from "@/lib/auth";

// Factory function for creating mock users
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
