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

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Runtime**: Bun
- **UI**: Tailwind CSS 4 + Radix UI
- **State**: Zustand + TanStack Query
- **Backend**: PocketBase (SQLite + Realtime + Auth + Storage)
- **Offline**: IndexedDB via Dexie.js
- **i18n**: next-intl (DE/EN)

## Documentation

- [PROJECT.md](./PROJECT.md) - Detailed project documentation
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - AI assistant guidelines

---

## Production Deployment

### 🚀 One-Command Setup

The easiest way to deploy RettStat is using the automated setup script:

```bash
# Clone repository
git clone https://github.com/PhilRoli/rettstat.git
cd rettstat

# Run setup script
./scripts/setup.sh
```

The script will:

1. ✅ Check system requirements (Ubuntu/Debian)
2. ✅ Install Docker if needed
3. ✅ Configure firewall (SSH, HTTP, HTTPS)
4. ✅ Prompt for configuration (domain, GitHub, SMTP, dev environment)
5. ✅ Generate secure passwords
6. ✅ Create systemd service
7. ✅ Setup cron jobs (backups, database sync)
8. ✅ Start all services
9. ✅ Display URLs and DNS records

### Server Requirements

**Recommended**: Hetzner CX31 (4 vCPU, 8GB RAM) - €8.50/month  
**Minimum**: Hetzner CX21 (2 vCPU, 4GB RAM) - €4.50/month  
**OS**: Ubuntu 24.04 LTS

### Prerequisites

1. Fresh Ubuntu/Debian VPS
2. Domain name (e.g., `rettstat.at`)
3. GitHub account with Personal Access Token (for container registry)
4. SMTP service (optional, for email notifications)

### DNS Configuration

Before running the setup, configure these DNS records:

**Production Only:**
| Type | Host | Value |
| ---- | ------- | ------------------ |
| A | @ | `<your-server-ip>` |
| A | api | `<your-server-ip>` |
| A | www | `<your-server-ip>` |
| A | traefik | `<your-server-ip>` |

**With Dev Environment:**
| Type | Host | Value |
| ---- | ------- | ------------------ |
| A | @ | `<your-server-ip>` |
| A | api | `<your-server-ip>` |
| A | www | `<your-server-ip>` |
| A | traefik | `<your-server-ip>` |
| A | dev | `<your-server-ip>` |
| A | api-dev | `<your-server-ip>` |

### What Gets Deployed

**Production Environment:**

- `https://rettstat.at` - Main application
- `https://api.rettstat.at` - PocketBase API
- `https://api.rettstat.at/_/` - PocketBase Admin UI
- `https://traefik.rettstat.at` - Traefik Dashboard

**Development Environment (Optional):**

- `https://dev.rettstat.at` - Dev application (uses `develop` branch)
- `https://api-dev.rettstat.at` - Dev PocketBase API
- Hourly database sync from production
- Access controlled via `profiles.dev_access` field

### Post-Setup Steps

After the setup script completes:

1. **Wait for SSL certificates** (2-5 minutes)
2. **Access PocketBase Admin UI**: `https://api.your-domain.com/_/`
3. **Create your admin account** (first user becomes admin)
4. **Test the application**: `https://your-domain.com`

### Granting Dev Access (if dev environment enabled)

To allow users to access the development environment:

1. Access **production** PocketBase admin: `https://api.your-domain.com/_/`
2. Navigate to **Collections** → **profiles**
3. Find the user's profile record
4. Set `dev_access` field to `true`
5. User can now access `https://dev.your-domain.com`

The dev environment syncs hourly from production, so dev_access changes are automatically propagated.

---

## Backup & Restore

Backups are automated via cron jobs (set up by setup.sh).

### Automated Backups

- **Daily backups** at 2:00 AM (keeps last 30 days)
- Stored in `/opt/rettstat/backups/`
- Format: `pb_data_YYYYMMDD_HHMMSS.tar.gz`

### Manual Backup

```bash
# Run backup script
/opt/rettstat/scripts/backup.sh

# Or directly with docker
docker run --rm \
  -v rettstat-prod_pb-data:/source:ro \
  -v /opt/rettstat/backups:/backup \
  alpine tar czf /backup/pb_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .
```

### Restore from Backup

```bash
# Stop PocketBase
cd /opt/rettstat
docker compose stop pocketbase

# Restore from backup
docker run --rm \
  -v rettstat-prod_pb-data:/target \
  -v /opt/rettstat/backups:/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/pb_data_YYYYMMDD_HHMMSS.tar.gz -C /target"

# Restart PocketBase
docker compose start pocketbase
```

---

## Useful Commands

```bash
# View logs
cd /opt/rettstat && docker compose logs -f

# Restart services
sudo systemctl restart rettstat

# Check service status
docker compose ps

# Update to latest version (main branch)
cd /opt/rettstat && docker compose pull && docker compose up -d

# Access PocketBase container
docker exec -it rettstat-pocketbase sh

# Manual database sync (dev environment)
/opt/rettstat/scripts/sync-db.sh
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**

```bash
docker compose logs -f
```

**Check specific service:**

```bash
docker compose logs -f app
docker compose logs -f pocketbase
```

**Restart services:**

```bash
docker compose down
docker compose up -d
```

### SSL Certificate Issues

**Problem:** Traefik can't get SSL certificate

**Solutions:**

1. Verify DNS is properly configured: `dig your-domain.com`
2. Ensure ports 80 and 443 are open: `ufw allow 80/tcp && ufw allow 443/tcp`
3. Check Traefik logs: `docker compose logs traefik | grep acme`
4. Verify email in `.env` is valid

### Container Can't Pull Image

**Login to GitHub Container Registry:**

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

**Manually pull image:**

```bash
docker pull ghcr.io/YOUR_USERNAME/rettstat:latest
```

### Out of Disk Space

**Check disk usage:**

```bash
df -h
docker system df
```

**Clean up:**

```bash
docker system prune -a
docker volume prune
```

### PocketBase Admin Password Reset

If you forget your PocketBase admin password:

```bash
# Access PocketBase container
docker exec -it rettstat-pocketbase sh

# Reset admin password (requires manual steps in PocketBase)
# Or delete pb_data and reinitialize
```

### Update Application

Watchtower automatically checks for updates every 5 minutes. To manually update:

```bash
docker pull ghcr.io/YOUR_USERNAME/rettstat:latest
docker compose up -d
```

### View All Logs

```bash
# Last 100 lines
docker compose logs --tail=100

# Follow logs in real-time
docker compose logs -f

# Export logs for debugging
docker compose logs > /tmp/rettstat-logs.txt
```

### Complete Reset (⚠️ Deletes All Data)

```bash
cd /opt/rettstat
docker compose down -v
docker compose up -d
```

---

## Monitoring

### Check Service Health

```bash
# Service status
docker compose ps

# Resource usage
docker stats

# PocketBase health endpoint
curl https://api.your-domain.com/api/health
```

### Configure Firewall

```bash
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

---

## Environment Variables

### Development (.env.local)

```bash
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
```

### Production (.env)

```bash
DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_github_token
TRAEFIK_AUTH=admin:$apr1$xyz123
```

---

## License

Private - All rights reserved
