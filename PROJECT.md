# RettStat - EMS Shift Management System

## Project Status: 🚧 In Development

## Overview

RettStat is a Progressive Web Application (PWA) for Emergency Medical Services (EMS) organizations to manage shift plans, view statistics, and coordinate event services.

## Quick Start

```bash
# Prerequisites: Bun installed (https://bun.sh) and Docker

# Install dependencies
bun install

# Start development server
bun dev

# Start PocketBase (requires Docker)
cd docker && docker compose up -d

# Run tests
bun run test

# Build for production
bun run build
```

## Technology Stack

| Category        | Technology              | Version |
| --------------- | ----------------------- | ------- |
| Runtime         | Bun                     | 1.3+    |
| Framework       | Next.js                 | 16.1+   |
| UI Library      | React                   | 19+     |
| Styling         | Tailwind CSS            | 4+      |
| Components      | Radix UI                | Latest  |
| State (Global)  | Zustand                 | 5+      |
| State (Server)  | TanStack Query          | 5+      |
| Backend         | PocketBase              | 0.35+   |
| Offline Storage | Dexie.js (IndexedDB)    | 4+      |
| i18n            | next-intl               | 4+      |
| Forms           | React Hook Form + Zod   | Latest  |
| Testing         | Vitest, RTL, Playwright | Latest  |

## Project Structure

```
rettstat/
├── .github/
│   ├── copilot-instructions.md   # AI assistant guidelines
│   └── workflows/                 # CI/CD pipelines
├── docker/
│   ├── docker-compose.yml        # Local PocketBase
│   └── docker-compose.prod.yml   # Production config
├── pocketbase/
│   └── pb_migrations/            # PocketBase migrations
├── public/                        # Static assets, PWA manifest
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/             # i18n routing (de/en)
│   │   │   ├── (app)/            # Authenticated routes
│   │   │   │   ├── page.tsx      # Home
│   │   │   │   ├── statistics/   # Statistics
│   │   │   │   ├── events/       # Events
│   │   │   │   ├── schedule/     # Personal schedule
│   │   │   │   ├── reports/      # Export reports
│   │   │   │   ├── shiftplan/    # Shift planning
│   │   │   │   ├── settings/     # User settings
│   │   │   │   └── admin/        # Admin panel
│   │   │   └── auth/             # Auth pages (login, register, verify)
│   │   ├── api/                  # API routes
│   ├── components/
│   │   ├── ui/                   # Base UI (shadcn style)
│   │   ├── features/             # Feature components
│   │   ├── admin/                # Admin management
│   │   ├── layout/               # AppShell, Header, Sidebar
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   ├── pocketbase/          # PocketBase client & types
│   │   ├── offline/             # Dexie offline storage
│   │   └── export/              # CSV export utilities
│   ├── stores/                   # Zustand stores
│   └── i18n/                     # Translations
├── PROJECT.md                    # This file
└── package.json
```

## Features

### Implemented ✅

- [x] Project setup and configuration
- [x] Phase 1: Project Foundation
- [x] Phase 2: Design System & Core Architecture
- [x] Phase 3: Authentication & Authorization
  - [x] PocketBase Auth integration
  - [x] Login, Register, Verify Email pages
  - [x] Granular permissions system
  - [x] Protected routes with middleware

- [x] Phase 4: Database Schema
  - [x] 29 PocketBase collections
  - [x] Core: profiles, units (hierarchical)
  - [x] Categories: assignments, qualifications, vehicles, absences, events
  - [x] Shiftplans with tours
  - [x] Events with positions, registrations, groups
  - [x] Permissions system (user_permissions, assignment_default_permissions)

- [x] Phase 5: Feature Implementation
  - [x] Home Page with news feed, next shifts
  - [x] Shift Plan Page with calendar view
  - [x] Admin Pages (units, users, vehicles, qualifications, absences, assignments, news)
  - [x] Settings (profile, notifications)

### In Progress 🔄

(None - all planned features implemented)

### Recently Completed ✅

- [x] Statistics Page (charts, heatmap, summaries)
- [x] Events Page (list view, detail view, positions, registrations)
- [x] Schedule Page (calendar, upcoming shifts, absences, iCal export)
- [x] Reports Page (CSV export for shifts and statistics)

### Planned 📋

- [ ] Phase 6: Testing & QA
- [ ] Phase 7: PWA Features (offline, push notifications)
- [ ] Phase 8: Production Deployment

## Design System

### Colors

#### Primary

- **Dark Red**: `#b70e0c` - Main brand color

#### Accent Colors

| Name      | Hex       | CSS Variable         |
| --------- | --------- | -------------------- |
| Cyan      | `#00acc1` | `--accent-cyan`      |
| Blue      | `#0065a0` | `--accent-blue`      |
| Purple    | `#6f69a3` | `--accent-purple`    |
| Magenta   | `#a66da7` | `--accent-magenta`   |
| Orange    | `#f29400` | `--accent-orange`    |
| Yellow    | `#ebbd00` | `--accent-yellow`    |
| Green     | `#9ab86a` | `--accent-green`     |
| Teal      | `#86c4b7` | `--accent-teal`      |
| Dark Teal | `#0d968e` | `--accent-dark-teal` |
| Forest    | `#2c9155` | `--accent-forest`    |

### Theme

- Light and Dark mode support
- System preference detection
- Manual toggle option

## PocketBase Collections

**Total Collections:** 29

### Core

1. **profiles** - User profiles (extends PocketBase users)
2. **units** - Organizational hierarchy (self-referential)

### Permissions

3. **permissions** - Available permission definitions
4. **user_permissions** - Per-unit permission grants
5. **assignment_default_permissions** - Default permissions by assignment

### Categories (Master Data)

6. **assignment_categories**
7. **qualification_categories**
8. **vehicle_types** (with color)
9. **absence_categories**
10. **tour_types**
11. **event_categories**

### Entities

12. **assignments** - Roles/positions
13. **qualifications** - Certifications
14. **vehicles** - Fleet management
15. **absences** - Absence definitions

### User Relations

16. **user_qualifications**
17. **user_assignments**
18. **user_absences**

### Shiftplans

19. **shiftplans** - Shift containers
20. **tours** - Individual tours within shiftplans

### Events

21. **events**
22. **event_groups**
23. **event_positions**
24. **event_registrations**

### Other

25. **news** - Announcements
26. **news_attachments** - File attachments for news
27. **news_read_status** - Read tracking per user
28. **quick_links** - Home page quick links
29. **push_subscriptions** - PWA push notifications

## Environment Variables

```env
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Guidelines

1. **Git Flow**: Always work on feature branches from `develop`
2. **Package Manager**: Use `bun` and `bunx` exclusively (NEVER npm/yarn/pnpm)
3. **Pre-commit**: Run `bun run lint && bun run type-check && bun run test`
4. **Testing**: Write tests for new features
5. **Documentation**: Update PROJECT.md with changes

## Deployment

### Production Stack

- **Traefik**: Reverse proxy with Let's Encrypt SSL
- **Next.js App**: Container from GitHub Container Registry
- **PocketBase**: Backend (API + SQLite + Storage)
- **WUD (What's Up Docker)**: Automatic container updates

```bash
# Deploy with docker-compose
cd docker
docker compose -f docker-compose.prod.yml up -d
```

### Required Environment Variables

```env
DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com
GITHUB_USERNAME=your-username
GITHUB_TOKEN=ghcr-token
TRAEFIK_AUTH=user:password-hash
```

## Changelog

### [0.3.0] - Multi-Issue Fix

- Fixed auth token refresh: users no longer get kicked to login on every navigation
- Restructured routes under `[locale]` with next-intl middleware for proper i18n support
- Default locale changed from English to German (Austrian EMS context)
- Added locale-aware navigation (`Link`, `useRouter`, `usePathname` from next-intl)
- Fixed duplicate JSON key bug causing translation keys to render literally
- Added locale-aware date formatting (de-AT / en-US) across schedule, events, and news
- Added Next.js rewrites proxy (`/pb/:path*`) to hide PocketBase API URLs from browser
- Fixed PWA manifest/SW errors via middleware matcher exclusions and font `display: swap`
- Fixed quick_links field mismatches (`is_active` -> `is_enabled`, `sort_order` -> `order`)
- Added missing PocketBase collections: push_subscriptions, event_categories, event_groups, events, event_positions, event_registrations
- Updated PocketBase version reference from 0.26+ to 0.35+
- Total collections: 29

### [0.2.0] - PocketBase Migration

- Migrated from Supabase to PocketBase
- Simplified deployment (single container for backend)
- All collections defined with types
- Native PocketBase authentication
- Realtime subscriptions support
- File storage via PocketBase

### [0.1.0] - Initial Setup

- Next.js 14+ with App Router
- Tailwind CSS 4 configuration
- Core dependencies installed

---

_Last updated: 2026-02-06_
