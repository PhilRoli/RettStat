# RettStat - EMS Shift Management System

## Project Status: 🚧 In Development

## Overview

RettStat is a Progressive Web Application (PWA) for Emergency Medical Services (EMS) organizations to manage shift plans, view statistics, and coordinate event services.

## Quick Start

```bash
# Prerequisites: Bun installed (https://bun.sh)

# Install dependencies
bun install

# Start development server
bun dev

# Start Supabase (requires Docker)
cd docker && docker compose up -d

# Run tests
bun test

# Build for production
bun run build
```

## Technology Stack

| Category        | Technology              | Version |
| --------------- | ----------------------- | ------- |
| Runtime         | Bun                     | 1.3+    |
| Framework       | Next.js                 | 14+     |
| UI Library      | React                   | 19+     |
| Styling         | Tailwind CSS            | 4+      |
| Components      | Radix UI                | Latest  |
| State (Global)  | Zustand                 | 5+      |
| State (Server)  | TanStack Query          | 5+      |
| Database        | Supabase (PostgreSQL)   | Latest  |
| Auth            | Supabase Auth           | Latest  |
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
│   ├── docker-compose.yml        # Local Supabase
│   └── docker-compose.prod.yml   # Production config
├── public/                        # Static assets, PWA manifest
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/             # i18n routing
│   │   │   ├── (auth)/           # Auth pages (login, register)
│   │   │   ├── (dashboard)/      # Main app pages
│   │   │   └── layout.tsx
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   └── features/             # Feature components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities, clients
│   ├── services/                 # Business logic
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript definitions
│   └── i18n/                     # Translations
├── supabase/
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge functions
├── PROJECT.md                    # This file
└── package.json
```

## Features

### Implemented ✅

- [x] Project setup and configuration
- [x] Phase 1: Project Foundation
- [x] Phase 2: Design System & Core Architecture
- [x] Phase 3: Authentication & Authorization
  - [x] Supabase Auth integration
  - [x] Login, Register, Verify Email pages
  - [x] Role-based access control (Admin, Manager, Member)
  - [x] Granular permissions system
  - [x] Protected routes with middleware
  - [x] Session management and persistence

- [x] Phase 3.5: Bug Fixes & Improvements
  - [x] i18n enforcement (all strings translated)
  - [x] Middleware → Proxy migration (Next.js 15+)
  - [x] Next.js config fixes (allowedDevOrigins)
  - [x] Layout and responsive fixes
  - [x] Theme toggle synchronization
  - [x] TypeScript deprecations removed
  - [x] Tailwind canonical classes
  - [x] Code quality guidelines
- [x] Phase 4: Database Schema & API
  - [x] PostgreSQL schema design (12 tables)
  - [x] Row Level Security (RLS) policies
  - [x] Database functions and triggers
  - [x] TypeScript types generation
  - [x] Migration files created

### In Progress 🔄

- [ ] Phase 4: Complete Supabase Setup (migrations need to be applied)
  - [x] Schema designed and migrations created
  - [ ] Supabase local instance configured
  - [ ] Migrations applied and tested
  - [ ] Real-time subscriptions implemented
  - [ ] Seed data created for testing
- [ ] Phase 5: Feature Implementation (NEXT)

### Planned 📋

- [ ] Phase 4: Database Schema & API
- [ ] Phase 5: Feature Implementation
  - [ ] Home Page
  - [ ] Shift Plan Page
  - [ ] Statistics Page
  - [ ] Events Page
  - [ ] Admin Pages
- [ ] Phase 6: Testing & QA
- [ ] Phase 7: Deployment

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

## User Roles

| Role    | Description        | Permissions            |
| ------- | ------------------ | ---------------------- |
| Admin   | Full system access | All permissions        |
| Manager | Team management    | View all, manage team  |
| Member  | Standard user      | View own data, sign up |

## Pages

### Home (`/`)

- Quick overview dashboard
- Next shift display
- News/announcements feed

### Shift Plan (`/shifts`)

- Calendar view of shifts
- Shift details
- Admin: Add/edit shifts

### Statistics (`/statistics`)

- Personal shift statistics
- Admin: Unit statistics
- Charts and visualizations

### Events (`/events`)

- Events list and calendar
- Event details with positions
- Admin: Create/manage events

### Admin (`/admin`)

- User management
- Qualifications management
- Assignments management
- System settings

## Database Schema

### Tables (12)

1. **profiles** - User profiles extending auth.users
   - Personal information, role (admin/manager/member), contact details
2. **qualifications** - Types of qualifications (certifications, licenses)
   - Name, description, renewal requirements
3. **user_qualifications** - User qualifications with expiration tracking
   - Obtained date, expiration date, certificate number
4. **assignments** - Assignments (stations, vehicles, teams)
   - Name, type (station/vehicle/team/other), description
5. **user_assignments** - User assignment history
   - Assigned date, end date, primary assignment flag
6. **shift_types** - Shift type templates
   - Name, default times, duration, color coding
7. **shifts** - Individual shift records
   - User, type, assignment, times, status (scheduled/confirmed/completed/cancelled/no_show)
8. **events** - Event management
   - Name, type (emergency/training/community/competition/other), location, times, status
9. **event_positions** - Positions within events
   - Name, required qualifications, quantity needed/filled
10. **event_registrations** - User event registrations
    - Position, status (registered/confirmed/attended/cancelled/no_show)
11. **news** - Announcements and news
    - Title, content, category, priority, publishing dates
12. **monthly_statistics** - Pre-computed statistics cache
    - User, year, month, total shifts/hours/events

### Row Level Security (RLS)

- All tables have RLS enabled
- Role-based policies (admin, manager, member)
- Users can view all data, edit their own data
- Admins/managers can manage shifts, events, qualifications
- Helper functions: `is_admin()`, `is_admin_or_manager()`, `get_user_role()`

### Database Functions

- `auto_create_profile()` - Trigger to create profile on user signup
- `auto_update_event_position_counts()` - Trigger to update position fills
- `calculate_monthly_stats()` - Trigger to update statistics on shift changes
- `get_user_statistics(user_id, start_date, end_date)` - Query user stats
- `get_unit_statistics(start_date, end_date)` - Query organization-wide stats
- `check_expiring_qualifications(days_ahead)` - Find qualifications expiring soon

### Migrations

Migrations are located in `supabase/migrations/`:

- `20260202_initial_schema.sql` - Complete database schema
- `20260202_rls_policies.sql` - Row Level Security policies
- `20260202_functions_triggers.sql` - Functions and triggers

**Note:** Migrations need to be applied using the Supabase CLI:

```bash
supabase start      # Start local Supabase instance
supabase db reset   # Apply all migrations
```

## API Endpoints

_To be documented in Phase 4_

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## Development Guidelines

1. **Git Flow**: Always work on feature branches from `develop`
2. **Package Manager**: Use `bun` exclusively
3. **Code Review**: All changes require agent review before merge
4. **Testing**: Write tests for new features
5. **Documentation**: Update PROJECT.md with changes

## Changelog

### [Unreleased]

- Initial project setup
- Next.js 14+ with App Router
- Tailwind CSS 4 configuration
- Core dependencies installed

---

_Last updated: 2026-02-01_
