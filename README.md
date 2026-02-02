# RettStat

**EMS Shift Management System** - A Progressive Web Application for Emergency Medical Services organizations to manage shift plans, view statistics, and coordinate event services.

## Quick Start

```bash
# Prerequisites: Bun (https://bun.sh) and Docker
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Start local PocketBase
bun run db:start

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

PocketBase Admin UI: [http://localhost:8090/\_/](http://localhost:8090/_/)

## Available Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `bun dev`            | Start development server   |
| `bun build`          | Build for production       |
| `bun start`          | Start production server    |
| `bun run test`       | Run unit tests (vitest)    |
| `bun test:e2e`       | Run E2E tests (playwright) |
| `bun lint`           | Run ESLint                 |
| `bun run type-check` | Run TypeScript checks      |
| `bun format`         | Format code with Prettier  |
| `bun db:start`       | Start local PocketBase     |
| `bun db:stop`        | Stop local PocketBase      |

## Documentation

- [PROJECT.md](./PROJECT.md) - Detailed project documentation
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - AI assistant guidelines

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Runtime**: Bun
- **UI**: Tailwind CSS 4 + Radix UI
- **State**: Zustand + TanStack Query
- **Backend**: PocketBase (SQLite + Realtime + Auth + Storage)
- **Offline**: IndexedDB via Dexie.js
- **i18n**: next-intl (DE/EN)

## Deployment

See `docker/docker-compose.prod.yml` for production deployment with:

- Traefik reverse proxy with automatic Let's Encrypt
- PocketBase backend (API + DB + Storage)
- Watchtower for automatic updates

```bash
# Production deployment
cd docker
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
```

## License

Private - All rights reserved
