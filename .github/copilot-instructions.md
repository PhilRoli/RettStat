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

### Package Management
- **ALWAYS use `bun`** - never npm, yarn, or pnpm
- Run `source ~/.bashrc` before bun commands if needed
- Install: `bun add <package>` or `bun add -d <package>`
- Run scripts: `bun run <script>`

### Git Flow
- **ALWAYS** work on feature branches from `develop`
- Branch naming: `feature/<name>`, `bugfix/<name>`, `hotfix/<name>`
- Never commit directly to `main` or `develop`
- Create PR for code review before merging

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
- ❌ Using npm/yarn/pnpm instead of bun
- ❌ Committing directly to main/develop
- ❌ Hardcoding strings instead of using i18n
- ❌ Ignoring TypeScript errors
- ❌ Not handling loading/error states
- ❌ Not updating PROJECT.md after changes

## When Uncertain
1. Check PROJECT.md for context
2. Review existing similar code
3. Ask the user for clarification
4. Enter plan mode for complex features
