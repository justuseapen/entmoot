# Frontend Agent Guidelines

## Tech Stack
- **React 18** with TypeScript
- **Vite** v7 for bundling and dev server
- **Tailwind CSS** v4 for styling
- **shadcn/ui** for component primitives
- **React Router** v6 for routing
- **TanStack Query** for server state
- **Zustand** for client state

## Commands
```bash
# Always prefix with PATH to use correct Node version
PATH="$HOME/.asdf/shims:$PATH" npm run dev    # Start dev server (port 5173)
PATH="$HOME/.asdf/shims:$PATH" npm run build  # TypeScript check + production build
PATH="$HOME/.asdf/shims:$PATH" npm run lint   # ESLint check
PATH="$HOME/.asdf/shims:$PATH" npm run lint -- --fix  # Auto-fix lint issues
```

## Important Patterns

### Path Aliases
Use `@/` for imports from `src/`:
```typescript
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
```

### Adding shadcn/ui Components
```bash
PATH="$HOME/.asdf/shims:$PATH" npx shadcn@latest add <component-name>
```
Components are placed in `src/components/ui/`.

### API Proxy
The dev server proxies `/api` requests to `http://localhost:3000` (Rails backend).

### State Management
- **Server state** (API data): Use TanStack Query
- **Client state** (UI state, auth): Use Zustand stores in `src/stores/`

### ESLint Notes
- shadcn/ui components may export non-component items (like `buttonVariants`)
- Add `// eslint-disable-next-line react-refresh/only-export-components` when needed
- Prettier auto-formats on lint fix, including Tailwind class sorting
