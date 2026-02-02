#!/bin/bash
# Database Restore Script for RettStat
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh /opt/rettstat/backups/
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Stopping services..."
docker compose stop app auth rest realtime storage

echo "Restoring database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i rettstat-db psql -U postgres postgres

echo "Starting services..."
docker compose start app auth rest realtime storage

echo "✓ Database restored successfully!"
