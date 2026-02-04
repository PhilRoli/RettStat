# RettStat - EMS Shift Management System

## Project Overview

RettStat is a Progressive Web App (PWA) for Emergency Medical Services (EMS) shift management. It provides scheduling, tour tracking, statistics, and administrative features for EMS organizations.

**Version:** 1.4.0
**Domain:** rettstat.at (prod), dev.rettstat.at (staging)

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **UI:** React 19.2.3
- **Backend:** PocketBase 0.26.8
- **State Management:** Zustand 5.0.11 (client), TanStack Query 5.x (server)
- **Styling:** Tailwind CSS 4.x + Radix UI primitives
- **Forms:** React Hook Form + Zod validation
- **Offline:** Dexie (IndexedDB)
- **i18n:** next-intl (de/en)
- **Runtime:** Bun
- **Testing:** Vitest (unit), Playwright (e2e)

## Critical Rules

### Package Manager

**Use `bun` exclusively. NEVER use npm, yarn, or pnpm.**

```bash
bun install          # Install dependencies
bun add <pkg>        # Add dependency
bun add -D <pkg>     # Add dev dependency
bun run <script>     # Run scripts
bunx <cmd>           # Run package binaries
```

### Git Workflow

- **Branching:** Git Flow (develop → feature branches → main)
- **Main branch:** `main` (production releases)
- **Development branch:** `develop` (integration)
- **Feature branches:** `feature/<name>` from develop
- **Release branches:** `release/<version>` from develop
- **Hotfix branches:** `hotfix/<name>` from main

### Code Quality

- Always use `@/` path aliases (configured in tsconfig.json)
- Add `"use client"` directive at top of client components
- Run `bun run lint` and `bun run type-check` before committing
- Pre-commit hooks enforce linting via Husky + lint-staged

### Agent Workflow

- **Planning:** Use Opus 4.5 model
- **Execution:** Use Sonnet 4.5 model
- **Code Review:** Spawn review agent for significant changes only (new features, refactors, complex fixes)
- **Learning:** Add discoveries to this CLAUDE.md file

## Development Commands

```bash
# Development
bun run dev              # Start dev server (port 3000)
bun run dev:turbo        # Start with Turbopack (faster)
bun run build            # Production build
bun run start            # Start production server

# Code Quality
bun run lint             # ESLint check
bun run lint:fix         # ESLint auto-fix
bun run type-check       # TypeScript check
bun run format           # Prettier format
bun run format:check     # Prettier check

# Testing
bun run test             # Run unit tests
bun run test:watch       # Watch mode
bun run test:coverage    # With coverage
bun run test:e2e         # Playwright e2e tests
bun run test:e2e:ui      # Playwright UI mode

# Database (local PocketBase)
bun run db:start         # Start PocketBase container
bun run db:stop          # Stop PocketBase container
bun run db:reset         # Reset with fresh data

# Analysis
bun run analyze          # Bundle analyzer
```

## Architecture

### Directory Structure

```txt
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Authenticated routes (layout with AppShell)
│   │   ├── page.tsx        # Dashboard/home
│   │   ├── schedule/       # Shift schedule
│   │   ├── shiftplan/      # Shift plan management
│   │   ├── events/         # Events/tours
│   │   ├── statistics/     # Statistics & reports
│   │   ├── settings/       # User settings
│   │   ├── admin/          # Admin panel
│   │   └── reports/        # Reports
│   ├── auth/               # Authentication pages
│   ├── api/                # API routes
│   └── [locale]/           # i18n routes
├── components/
│   ├── ui/                 # Base UI components (shadcn/ui style)
│   ├── features/           # Feature-specific components
│   │   ├── auth/           # Login/register forms
│   │   └── shiftplan/      # Shift plan components
│   ├── layout/             # AppShell, Header, Sidebar, BottomNav
│   ├── admin/              # Admin management components
│   ├── home/               # Dashboard components
│   ├── schedule/           # Schedule components
│   ├── settings/           # Settings components
│   ├── statistics/         # Statistics components
│   └── offline/            # Offline indicator
├── lib/
│   ├── pocketbase/         # PocketBase client & utilities
│   │   ├── client.ts       # Lazy singleton client
│   │   ├── auth.ts         # Auth helpers
│   │   ├── hooks.ts        # React Query hooks
│   │   ├── types.ts        # TypeScript types
│   │   └── schema.ts       # Collection schemas
│   ├── offline/            # Dexie offline database
│   ├── export/             # CSV export utilities
│   └── utils.ts            # Utility functions (cn, etc.)
├── stores/                 # Zustand stores
│   ├── auth-store.ts       # Auth state with SSR-safe persistence
│   └── sync-store.ts       # Sync state
├── i18n/                   # Internationalization
│   ├── messages/           # Translation files (de.json, en.json)
│   ├── routing.ts          # i18n routing config
│   └── request.ts          # Server-side i18n
└── hooks/                  # Custom React hooks
```

## Code Patterns

### Zustand Store with SSR-Safe Persistence

```typescript
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// SSR-safe storage
const getStorage = () => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return localStorage;
};

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      /* state and actions */
    }),
    {
      name: "rettstat-mystore",
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        /* persisted fields only */
      }),
    }
  )
);
```

### PocketBase Lazy Singleton

```typescript
import { getPb, collections } from "@/lib/pocketbase/client";

// Get client (lazy-initialized)
const pb = getPb();

// Type-safe collection access
const users = await pb.collection(collections.users).getFullList();
```

### TanStack Query Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPb, collections } from "@/lib/pocketbase/client";

// Query
const { data, isLoading } = useQuery({
  queryKey: ["tours", shiftplanId],
  queryFn: async () => {
    const pb = getPb();
    return pb.collection(collections.tours).getFullList({
      filter: `shiftplan = "${shiftplanId}"`,
      expand: "vehicle,assignments",
    });
  },
});

// Mutation with cache invalidation
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async (data) => {
    const pb = getPb();
    return pb.collection(collections.tours).create(data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tours"] });
  },
});
```

### Component with "use client"

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MyComponent() {
  const [state, setState] = useState(false);
  return <Button onClick={() => setState(!state)}>Toggle</Button>;
}
```

## PocketBase Integration

### API URL Resolution

- **Local:** `http://127.0.0.1:8090`
- **Dev:** `https://api-dev.rettstat.at`
- **Production:** `https://api.rettstat.at`

URL is derived automatically from `window.location.hostname` on client-side.

### Collections

```typescript
const collections = {
  users: "users",
  profiles: "profiles",
  units: "units",
  shiftplans: "shiftplans",
  tours: "tours",
  vehicles: "vehicles",
  vehicleTypes: "vehicle_types",
  assignments: "assignments",
  assignmentCategories: "assignment_categories",
  qualifications: "qualifications",
  qualificationCategories: "qualification_categories",
  absences: "absences",
  absenceCategories: "absence_categories",
  tourTypes: "tour_types",
  userAssignments: "user_assignments",
  userQualifications: "user_qualifications",
  userAbsences: "user_absences",
  permissions: "permissions",
  userPermissions: "user_permissions",
  news: "news",
  newsAttachments: "news_attachments",
  newsReadStatus: "news_read_status",
  quickLinks: "quick_links",
};
```

### Auth Pattern

```typescript
import { getPb } from "@/lib/pocketbase/client";

// Login
const pb = getPb();
await pb.collection("users").authWithPassword(email, password);

// Check auth
if (pb.authStore.isValid) {
  const user = pb.authStore.record;
}

// Logout
pb.authStore.clear();
```

## Testing

### Unit Tests (Vitest)

- Location: Co-located with source files or in `__tests__` directories
- Run: `bun run test`
- Config: `vitest.config.ts`

### E2E Tests (Playwright)

- Location: `e2e/` directory
- Run: `bun run test:e2e`
- Config: `playwright.config.ts`

```typescript
// e2e/example.spec.ts
import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading")).toBeVisible();
});
```

## Deployment

### Docker Stack

- **Traefik:** Reverse proxy with Let's Encrypt SSL
- **Next.js App:** `ghcr.io/<username>/rettstat:latest`
- **PocketBase:** `ghcr.io/muchobien/pocketbase:latest`
- **WUD:** Automatic container updates

### CI/CD Pipeline (GitHub Actions)

1. **Lint:** ESLint + TypeScript check
2. **Test:** Unit tests with Vitest
3. **Build:** Next.js production build
4. **E2E:** Playwright tests
5. **Deploy:** Docker image push to GHCR

### Environment Variables

```bash
# Required for build
NEXT_PUBLIC_POCKETBASE_URL=https://api.rettstat.at

# Production deployment
DOMAIN=rettstat.at
ACME_EMAIL=admin@rettstat.at
GITHUB_USERNAME=<github-user>
GITHUB_TOKEN=<ghcr-token>
PB_ADMIN_EMAIL=admin@rettstat.at
PB_ADMIN_PASSWORD=<secure-password>
TRAEFIK_AUTH=<htpasswd-string>
```

## Common Patterns & Gotchas

### Imports

```typescript
// Always use path aliases
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { getPb } from "@/lib/pocketbase/client";

// Never use relative imports for src/ files
// Bad: import { Button } from "../../../components/ui/button";
```

### Barrel Exports

Most component directories have `index.ts` barrel files:

```typescript
// Import from barrel
import { AppShell, Header, Sidebar } from "@/components/layout";
```

### Date Handling

Use `date-fns` for date manipulation:

```typescript
import { format, addDays, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";

format(new Date(), "PPP", { locale: de });
```

### Styling

Use `cn()` utility for conditional classes:

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class")} />
```

## Quick Reference

| Task             | Command              |
| ---------------- | -------------------- |
| Start dev server | `bun run dev`        |
| Run tests        | `bun run test`       |
| Type check       | `bun run type-check` |
| Lint & fix       | `bun run lint:fix`   |
| Start local DB   | `bun run db:start`   |
| Build production | `bun run build`      |
