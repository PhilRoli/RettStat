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

- [x] Phase 4: Database Schema v1 (DEPRECATED)
  - [x] Initial 12-table schema design
  - [x] Replaced by v2 schema in Phase 4.5

- [x] Phase 4.5: Database Schema v2 (Complete Redesign)
  - [x] 24-table schema design
  - [x] Core tables: profiles (simplified), units (hierarchical)
  - [x] Category tables: 6 new category tables for master data
  - [x] Entity tables: assignments, qualifications, vehicles, absences, event_groups
  - [x] User relationships: qualifications (no expiration), assignments (with units, no end date), absences (new)
  - [x] Shiftplans: New structure with shiftplans + tours (replaces shifts)
  - [x] Events: Enhanced with categories, groups, admin_events
  - [x] Row Level Security policies for all tables
  - [x] Database functions and triggers (validation, statistics, auto-updates)
  - [x] Complete TypeScript types (1,021 lines)
  - [x] Comprehensive documentation

### In Progress 🔄

- [ ] Phase 4.5: Supabase Deployment & Testing
  - [x] Schema designed and migrations created
  - [ ] Supabase local instance configured
  - [ ] Migrations applied and tested
  - [ ] Real-time subscriptions tested
  - [ ] Seed data created for testing

### Planned 📋

- [ ] Phase 5: Feature Implementation (NEXT)
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

## Database Schema (Version 2)

**Last Updated:** 2026-02-02  
**Total Tables:** 24

### Core Tables

1. **profiles** - User profiles extending auth.users
   - Fields: first_name, last_name, email, service_id, role, avatar_url, phone, is_active
   - Removed: DOB, address data, emergency contacts (privacy simplification)

2. **units** - Organizational hierarchy (NEW)
   - Self-referential structure for organizational units (station → district → region)

### Category Tables (Master Data)

3. **assignment_categories** - Categories for assignments (NEW)
4. **qualification_categories** - Categories for qualifications (NEW)
5. **vehicle_types** - Types of vehicles (NEW)
6. **absence_categories** - Categories for absences (NEW)
7. **tour_types** - Types of tours (NEW, replaces shift_types)
8. **event_categories** - Event categories with custom ordering (NEW)

### Entity Tables

9. **assignments** - Assignments (stations, vehicles, teams)
   - Added: category_id, icon

10. **qualifications** - Qualifications/certifications
    - Added: category_id, level, icon
    - Removed: renewal tracking (simplified)

11. **vehicles** - Individual vehicles (NEW)
    - Fields: vehicle_type, call_sign, primary_unit, secondary_unit

12. **absences** - Types of absences (NEW, master data)

13. **event_groups** - Event position groups (NEW)
    - Supports admin groups and break groups

### User Relationship Tables

14. **user_qualifications** - User qualifications
    - Removed: expiration_date (no end date tracking)
    - Keep: obtained_date (start date)

15. **user_assignments** - User assignments
    - Added: unit_id (required)
    - Removed: end_date (ongoing assignments)

16. **user_absences** - User absence instances (NEW)
    - Linked to assignments with date validation
    - Must fall within assignment period

### Shiftplan Tables (Redesigned)

17. **shiftplans** - Shift containers (NEW, replaces shifts)
    - Container for full shift (unit, lead, times)
    - Typically contains 11-14 tours

18. **tours** - Individual tours within shiftplans (NEW)
    - Fields: vehicle, tour_type, name, times
    - Crew: driver_id, lead_id, student_id (all user references)

### Event Tables

19. **events** - Events
    - Added: category_id, start_time, end_time
    - Removed: event_type enum, max_participants

20. **event_positions** - Positions within events
    - Added: icon, minimum_qualification_ids (array), is_group_lead, group_id
    - Supports multiple qualification requirements

21. **event_registrations** - User event registrations (unchanged)

22. **admin_events** - Admin notes about events (NEW)
    - Track incidents, issues, observations during events

### News & Statistics

23. **news** - Announcements and news (unchanged)

24. **monthly_statistics** - Pre-computed statistics (unchanged)
    - To be updated for new shiftplan structure

### Row Level Security (RLS)

- All tables have RLS enabled
- **Role-based policies:**
  - **Admin**: Full access to all tables
  - **Manager**: Can create/edit shiftplans, events, news
  - **Member**: Can view all data, edit own registrations and absences
- **Helper functions:** `is_admin()`, `is_admin_or_manager()`, `get_user_role()`

### Database Functions & Triggers

**Triggers:**

- `auto_create_profile()` - Create profile on user signup
- `validate_absence_dates()` - Ensure absence dates within assignment period
- `update_event_position_counts()` - Auto-update position filled counts
- `trigger_update_monthly_stats()` - Recalculate stats on tour changes
- `update_updated_at_column()` - Auto-update updated_at timestamps

**Query Functions:**

- `get_user_statistics(user_id, start_date, end_date)` - User statistics for date range
- `get_unit_statistics(start_date, end_date)` - Organization-wide statistics
- `check_expiring_qualifications(days_ahead)` - List qualifications by obtained date

### Migrations

**Current Migrations (v2):**

- `20260202_v2_complete_schema.sql` - All 24 tables with constraints and indexes
- `20260202_v2_rls_policies.sql` - Row Level Security policies
- `20260202_v2_functions_triggers.sql` - Functions and triggers

**Apply migrations using Supabase CLI:**

```bash
supabase start      # Start local Supabase instance
supabase db reset   # Apply all migrations
```

### Key Design Decisions

1. **No End Dates**: User qualifications and assignments don't expire (ongoing)
2. **Shiftplan Structure**: Shiftplans contain multiple tours; each tour has vehicle and crew
3. **Absences**: Linked to assignments, dates validated within assignment period
4. **Events**: Category → Group → Position hierarchy with custom ordering
5. **Icon Support**: Most entities support icon field for visual identification
6. **Arrays**: Event positions support multiple required qualifications (UUID[])

## API Endpoints

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
