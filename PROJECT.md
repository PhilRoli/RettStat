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

### In Progress 🔄

- [ ] Phase 3: Authentication & Authorization

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

_To be documented in Phase 4_

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
