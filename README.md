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

### Server Requirements

**Recommended**: Hetzner CX31 (4 vCPU, 8GB RAM) - €8.50/month  
**Minimum**: Hetzner CX21 (2 vCPU, 4GB RAM) - €4.50/month  
**OS**: Ubuntu 24.04 LTS

### Prerequisites

1. VPS with Docker installed
2. Domain name (e.g., `rettstat.at`)
3. GitHub account for container registry
4. SMTP service (optional, for email notifications)

### Step 1: DNS Configuration

Configure your domain's DNS records:

| Type | Host | Value              |
| ---- | ---- | ------------------ |
| A    | @    | `<your-server-ip>` |
| A    | api  | `<your-server-ip>` |
| A    | www  | `<your-server-ip>` |

### Step 2: Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install dependencies
apt install -y git apache2-utils

# Create installation directory
mkdir -p /opt/rettstat
cd /opt/rettstat
```

### Step 3: Clone Repository

```bash
cd /opt/rettstat
git clone https://github.com/YOUR_USERNAME/rettstat.git repo
```

### Step 4: Configure Environment

```bash
cd /opt/rettstat

# Create .env file
cat > .env <<EOF
# Domain Configuration
DOMAIN=rettstat.at
ACME_EMAIL=admin@rettstat.at

# GitHub Container Registry
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_github_token_here

# Basic Auth for Traefik Dashboard
# Generate with: htpasswd -nb admin yourpassword
TRAEFIK_AUTH=admin:\$\$apr1\$\$xyz123
EOF

# Secure the file
chmod 600 .env
```

**Generate TRAEFIK_AUTH:**

```bash
htpasswd -nb admin your_password
```

### Step 5: Copy Docker Compose

```bash
cp repo/docker/docker-compose.prod.yml ./docker-compose.yml
```

### Step 6: Start Services

```bash
docker compose up -d
```

### Step 7: Verify Deployment

Check that all services are running:

```bash
docker compose ps
```

You should see:

- `rettstat-traefik` (running)
- `rettstat-app` (running)
- `rettstat-pocketbase` (running)
- `rettstat-watchtower` (running)

### Step 8: Access Your Application

- **App**: `https://your-domain.com`
- **API**: `https://api.your-domain.com`
- **Traefik Dashboard**: `https://traefik.your-domain.com` (uses TRAEFIK_AUTH)

### Step 9: Configure PocketBase

1. Access PocketBase admin: `https://api.your-domain.com/_/`
2. Create your admin account
3. Import collections (if not auto-created)
4. Create your first users

---

## Backup & Restore

### Backup PocketBase Database

```bash
# Manual backup
docker exec rettstat-pocketbase cp -r /pb/pb_data /pb/pb_backups/backup_$(date +%Y%m%d_%H%M%S)

# Or use docker volume backup
docker run --rm \
  -v rettstat-prod_pb-data:/source:ro \
  -v /opt/rettstat/backups:/backup \
  alpine tar czf /backup/pb_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .
```

### Restore from Backup

```bash
# Stop services
cd /opt/rettstat
docker compose down

# Restore from tar.gz
docker run --rm \
  -v rettstat-prod_pb-data:/target \
  -v /opt/rettstat/backups:/backup \
  alpine sh -c "cd /target && tar xzf /backup/pb_data_YYYYMMDD_HHMMSS.tar.gz"

# Restart services
docker compose up -d
```

### Automated Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * docker run --rm -v rettstat-prod_pb-data:/source:ro -v /opt/rettstat/backups:/backup alpine tar czf /backup/pb_data_\$(date +\%Y\%m\%d_\%H\%M\%S).tar.gz -C /source . && find /opt/rettstat/backups -name "pb_data_*.tar.gz" -mtime +7 -delete
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
