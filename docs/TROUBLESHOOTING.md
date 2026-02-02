# Deployment Troubleshooting Guide

## Docker Compose Not Reading Environment Variables

**Problem:**
Docker Compose shows it's using placeholder values like `YOUR_GITHUB_USERNAME` instead of your actual values.

**Cause:**
Docker Compose looks for `.env` file by default, not `.env.production`.

**Solution:**

Create a symlink from `.env` to `.env.production`:

```bash
cd /opt/rettstat
ln -s .env.production .env
docker compose up -d
```

Or use the `--env-file` flag:

```bash
docker compose --env-file .env.production up -d
```

The deploy script now automatically creates this symlink.

## "Variable is not set" Warnings

**Problem:**

```
WARN[0000] The "POSTGRES_PASSWORD" variable is not set. Defaulting to a blank string.
WARN[0000] The "JWT_SECRET" variable is not set. Defaulting to a blank string.
...
```

**Solution:**

1. **Make sure `.env.production` exists and is properly configured:**

   ```bash
   cd /opt/rettstat
   ls -la .env.production
   ```

2. **Verify environment variables are set:**

   ```bash
   source .env.production
   echo $DOMAIN
   echo $POSTGRES_PASSWORD
   ```

3. **If running manually, load the environment file first:**

   ```bash
   set -a
   source .env.production
   set +a
   docker compose up -d
   ```

4. **If using systemd, the service automatically loads the file:**
   ```bash
   systemctl restart rettstat
   ```

## "Invalid reference format" Error

**Problem:**

```
invalid reference format
```

or

```
Image ghcr.io//rettstat:latest
```

**Cause:** `GITHUB_USERNAME` environment variable is not set, resulting in `ghcr.io//rettstat:latest` (double slash).

**Solution:**

Edit `.env.production` and set your GitHub username:

```bash
GITHUB_USERNAME=YourGitHubUsername
GITHUB_TOKEN=ghp_your_token_here
```

## JWT Token Generation Issues

**Problem:**

```
Error: unknown command "keys" for "gotrue"
```

**Solution:**

Use the provided script instead:

```bash
cd /path/to/rettstat
bun scripts/generate-jwt.js "YOUR_JWT_SECRET"
```

Copy the generated `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` to `.env.production`.

## Services Won't Start

**Check logs:**

```bash
cd /opt/rettstat
docker compose logs -f
```

**Check specific service:**

```bash
docker compose logs -f postgres
docker compose logs -f kong
docker compose logs -f app
```

**Check service status:**

```bash
docker compose ps
```

**Restart services:**

```bash
docker compose down
docker compose up -d
```

## SSL Certificate Issues

**Problem:** Traefik can't get SSL certificate

**Check:**

1. DNS is properly configured and propagated
2. Ports 80 and 443 are open
3. Email in `.env.production` is valid

**View Traefik logs:**

```bash
docker compose logs -f traefik
```

## Database Connection Issues

**Reset database:**

```bash
docker compose down
docker volume rm rettstat_postgres_data
docker compose up -d
```

**Run migrations manually:**

```bash
docker compose exec postgres psql -U postgres -d rettstat -f /docker-entrypoint-initdb.d/migrations.sql
```

## Permission Denied Errors

**Fix file permissions:**

```bash
cd /opt/rettstat
chown -R root:root .
chmod 600 .env.production
```

## Container Can't Pull Image

**Login to GitHub Container Registry:**

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

**Manually pull image:**

```bash
docker pull ghcr.io/YOUR_USERNAME/rettstat:latest
```

## Out of Disk Space

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

## Need to Reconfigure

**Stop services:**

```bash
cd /opt/rettstat
docker compose down
```

**Edit configuration:**

```bash
nano .env.production
```

**Restart:**

```bash
docker compose up -d
```

## Complete Reset

**Warning: This deletes all data!**

```bash
cd /opt/rettstat
docker compose down -v
rm -rf postgres_data storage_data
docker compose up -d
```

## Getting Help

**Check all logs:**

```bash
docker compose logs --tail=100
```

**Export logs for debugging:**

```bash
docker compose logs > /tmp/rettstat-logs.txt
```

**Check system resources:**

```bash
htop
docker stats
```
