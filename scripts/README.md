# Scripts Directory

Utility scripts for RettStat deployment and maintenance.

## generate-jwt.js

Generates Supabase JWT tokens for authentication.

**Usage:**

```bash
bun scripts/generate-jwt.js <JWT_SECRET>
```

**Example:**

```bash
# Use your actual JWT_SECRET from .env.production
bun scripts/generate-jwt.js "your-super-secret-jwt-key-here"
```

**Output:**

The script generates two JWT tokens:

- **ANON_KEY**: Public key for client-side requests (safe to expose)
- **SERVICE_ROLE_KEY**: Private key with admin access (NEVER expose publicly)

Both tokens expire in 2032 (timestamp: 1983812996).

**Why this script?**

The official `gotrue keys generate` command was removed in newer GoTrue versions. This script provides the same functionality using standard JWT generation with HMAC-SHA256.

## deploy.sh

Automated deployment script for production servers.

**Usage:**

```bash
./scripts/deploy.sh
```

Requires:

- Docker and Docker Compose installed
- `.env.production` file configured
- SSH access to production server

## backup.sh

Database backup script.

**Usage:**

```bash
./scripts/backup.sh
```

Creates timestamped backups in `/backups` directory.

## restore.sh

Database restore script.

**Usage:**

```bash
./scripts/restore.sh <backup-file>
```

Restores database from a backup file.
