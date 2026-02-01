# RettStat

**EMS Shift Management System** - A Progressive Web Application for Emergency Medical Services organizations to manage shift plans, view statistics, and coordinate event services.

## Quick Start

```bash
# Prerequisites: Bun (https://bun.sh)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Start local Supabase (requires Docker)
bun run db:start

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun test` | Run unit tests |
| `bun test:e2e` | Run E2E tests |
| `bun lint` | Run ESLint |
| `bun format` | Format code with Prettier |
| `bun db:start` | Start local Supabase |
| `bun db:stop` | Stop local Supabase |

## Documentation

- [PROJECT.md](./PROJECT.md) - Detailed project documentation
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - AI assistant guidelines

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + Radix UI
- **State**: Zustand + TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Offline**: IndexedDB via Dexie.js
- **i18n**: next-intl (DE/EN)

## License

Private - All rights reserved
