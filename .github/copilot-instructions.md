# Copilot Instructions for RettStat

## Project Overview

RettStat is an EMS (Emergency Medical Services) shift management PWA built with Next.js 14+, Supabase, and TypeScript.

## Technology Stack

- **Runtime**: Bun (NOT npm/yarn/pnpm)
- **Framework**: Next.js 14+ with App Router
- **UI**: Tailwind CSS 4 + Radix UI primitives
- **State**: Zustand (global) + TanStack Query (server state)
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **Offline**: Dexie.js (IndexedDB) + Service Worker
- **i18n**: next-intl (German + English)
- **Testing**: Vitest + React Testing Library + Playwright

## Critical Rules

### Package Management (IMPORTANT FOR ALL AGENTS)

- **ALWAYS use `bun` and `bunx` EXCLUSIVELY** - NEVER npm, yarn, pnpm, or npx
- This applies to ALL agents and sub-agents without exception
- Run `source ~/.bashrc` before bun commands if needed
- Install: `bun add <package>` or `bun add -d <package>`
- Run scripts: `bun run <script>`
- Execute packages: `bunx <package>` (NOT npx)
- If an agent uses npm/yarn/pnpm/npx, stop and correct it immediately

### Git Flow

- **ALWAYS** work on feature branches from `develop`
- Branch naming: `feature/<name>`, `bugfix/<name>`, `hotfix/<name>`
- **NEVER** commit directly to `main` or `develop`
- Use `git flow` commands for branch management
- Create PR for code review before merging

**Git Flow Finish Process (CRITICAL):**

1. First, commit ALL changes on the feature branch
2. Then run `git flow feature finish <name>`
3. If editor opens for merge message, save and exit (`:wq` in vim, `Ctrl+X` then `Y` in nano)
4. Never manually commit to develop - the merge commit is created by git flow
5. If `git flow feature finish` fails, DO NOT commit manually to develop

### Code Style

- TypeScript strict mode - no `any` types without justification
- Functional components with hooks only
- Use `@/` import alias for src directory
- Component files: PascalCase (e.g., `ShiftCard.tsx`)
- Utility files: camelCase (e.g., `formatDate.ts`)
- Always export types/interfaces from dedicated type files

### File Organization

```
src/
├── app/[locale]/          # Next.js pages with i18n
├── components/
│   ├── ui/                # Base UI components (Button, Input, etc.)
│   └── features/          # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, Supabase client, helpers
├── services/              # Business logic services
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
└── i18n/                  # Translations and i18n config
```

### Component Guidelines

- Use Radix UI primitives for accessible components
- Wrap Radix components with styled versions in `components/ui/`
- Use `class-variance-authority` for component variants
- Always include loading and error states

### Styling

- Tailwind CSS 4 with custom theme colors
- Dark/Light mode via CSS variables and `next-themes`
- Use `cn()` utility for conditional classes
- Primary color: `#b70e0c` (Dark Red)

### Database & API

- All database changes via Supabase migrations
- Use Row Level Security (RLS) for all tables
- Real-time subscriptions for live data
- Optimistic updates with rollback on failure

### Offline Support

- Cache critical data in IndexedDB via Dexie
- Queue mutations when offline
- Sync queue when connection restored
- Show offline indicator in UI

### Shell Commands

- **NEVER use pipes (`|`) or `||` fallbacks that hide errors**
- Pipes can mask error messages from the first command
- `|| echo "..."` fallbacks suppress actual error output
- Always run commands directly to see real error messages
- Example: Use `git status` NOT `git status || echo "failed"`

### Testing Requirements

- Unit tests for utilities and hooks
- Component tests for UI components
- E2E tests for critical user flows
- Run tests before committing: `bun test`

### Documentation

- Update PROJECT.md when adding features
- Update this file when learning new patterns
- Comment complex logic only

## Common Patterns

### Creating a new UI component

```typescript
// src/components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // ... more variants
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, className }))} {...props} />;
}
```

### Creating a Zustand store

```typescript
// src/stores/useAuthStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: "auth-storage" }
  )
);
```

### Using TanStack Query with Supabase

```typescript
// src/hooks/useShifts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useShifts() {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shifts").select("*");
      if (error) throw error;
      return data;
    },
  });
}
```

## Mistakes to Avoid

- ❌ Using npm/yarn/pnpm/npx instead of bun/bunx (CRITICAL - applies to all agents)
- ❌ Committing directly to main/develop (use git flow commands!)
- ❌ Manually committing during git flow merge - let git flow handle it
- ❌ Hardcoding user-facing strings instead of using i18n (next-intl)
  - ALWAYS use `useTranslations()` or `getTranslations()` for any text shown to users
  - Add new keys to both `src/i18n/messages/en.json` and `src/i18n/messages/de.json`
  - Only system/debug messages and code identifiers should be hardcoded
- ❌ Using non-canonical Tailwind classes
  - Use `supports-backdrop-filter:` NOT `supports-[backdrop-filter]:`
  - Use `data-disabled:` NOT `data-[disabled]:`
  - Use `min-w-32` NOT `min-w-[8rem]`
  - Use `sm:min-w-75` NOT `sm:min-w-[300px]`
  - Prefer named sizes over arbitrary values when available
- ❌ Using deprecated TypeScript/React APIs
  - Use `React.ComponentRef<T>` NOT `React.ElementRef<T>`
- ❌ Using old role-based permission system
  - Use `usePermissions()` or `useHasPermission()` hooks for permission checks
  - NEVER use the deprecated `hasPermission(role, permission)` function
  - Permission system is now granular and per-unit with inheritance
- ❌ Creating unnecessary code or unused variables
  - Remove unused imports, functions, and variables
  - Keep code minimal and focused
- ❌ Ignoring TypeScript errors
- ❌ Not handling loading/error states
- ❌ Not updating PROJECT.md after changes

## When Uncertain

1. Check PROJECT.md for context
2. Review existing similar code
3. Ask the user for clarification
4. Enter plan mode for complex features

## Sub-Agent Instructions

When delegating work to sub-agents (task tool), always include:

- "Use `bun` and `bunx` exclusively - never npm/yarn/pnpm/npx"
- The working directory: `/home/philipp/rettstat`
- Run `source ~/.bashrc` before bun commands
