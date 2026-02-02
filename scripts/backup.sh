#!/bin/bash
# PocketBase Backup Script
# Creates compressed backups of PocketBase data
# Run via cron: 0 2 * * * /opt/rettstat/scripts/backup.sh

set -e

BACKUP_DIR="/opt/rettstat/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pb_data_${TIMESTAMP}.tar.gz"
LOG_FILE="/opt/rettstat/logs/backup.log"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== Starting backup =========="
log "Backup file: $BACKUP_FILE"

# Create backup from production PocketBase
docker run --rm \
  -v rettstat-prod_pb-data:/source:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/$BACKUP_FILE" -C /source . >> "$LOG_FILE" 2>&1

# Verify backup was created
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "✓ Backup completed successfully"
    log "  File: ${BACKUP_FILE}"
    log "  Size: ${SIZE}"
    
    # Keep only last 30 backups
    cd "$BACKUP_DIR"
    ls -t pb_data_*.tar.gz 2>/dev/null | tail -n +31 | xargs -r rm
    KEPT=$(ls -1 pb_data_*.tar.gz 2>/dev/null | wc -l)
    log "  Kept: ${KEPT} backups (last 30 days)"
else
    log "✗ Backup failed!"
    exit 1
fi

log "========== Backup complete =========="
