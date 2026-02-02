#!/bin/bash
# Database Sync Script - Production to Development
# Syncs PocketBase data from production to development environment
# Run via cron: 0 * * * * /opt/rettstat/scripts/sync-db.sh

set -e

COMPOSE_FILE="/opt/rettstat/docker-compose.yml"
LOG_FILE="/opt/rettstat/logs/sync-db.log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== Starting database sync =========="

# Check if dev environment is enabled (containers exist)
if ! docker ps -a --format '{{.Names}}' | grep -q "rettstat-pocketbase-dev"; then
    log "Dev environment not found - skipping sync"
    exit 0
fi

log "Stopping dev PocketBase..."
docker stop rettstat-pocketbase-dev >> "$LOG_FILE" 2>&1

log "Copying database from prod to dev..."
docker run --rm \
  -v rettstat-prod_pb-data:/source:ro \
  -v rettstat-prod_pb-data-dev:/target \
  alpine sh -c "rm -rf /target/* && cp -a /source/. /target/" >> "$LOG_FILE" 2>&1

log "Starting dev PocketBase..."
docker start rettstat-pocketbase-dev >> "$LOG_FILE" 2>&1

# Wait for health check
log "Waiting for dev PocketBase to be healthy..."
sleep 5

if docker ps --filter "name=rettstat-pocketbase-dev" --filter "health=healthy" | grep -q "rettstat-pocketbase-dev"; then
    log "✓ Sync completed successfully"
else
    log "⚠ Warning: Dev PocketBase may not be healthy yet"
fi

log "========== Sync complete =========="
