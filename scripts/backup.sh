#!/bin/bash
# Database Backup Script for RettStat
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="/opt/rettstat/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="rettstat_backup_${TIMESTAMP}.sql.gz"

echo "Starting database backup..."
echo "Backup file: $BACKUP_FILE"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Run pg_dump inside the database container and compress
docker exec rettstat-db pg_dump -U postgres postgres | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
  echo "✓ Backup completed successfully"
  echo "  File: ${BACKUP_FILE}"
  echo "  Size: ${SIZE}"
  
  # Keep only last 7 backups
  cd $BACKUP_DIR
  ls -t rettstat_backup_*.sql.gz | tail -n +8 | xargs -r rm
  echo "✓ Old backups cleaned up (keeping last 7)"
else
  echo "✗ Backup failed!"
  exit 1
fi
