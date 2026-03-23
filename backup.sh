#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found!"
  exit 1
fi

# Backup directory on the host
BACKUP_DIR="${HOME}/backups/${APP_NAME}"

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Run pg_dump and save the backup with a timestamp
# APP_NAME is loaded from .env and set by jenkinsfile (e.g album-reviews-staging or album-reviews-production)
DB_CONTAINER="${APP_NAME}-db-1"

echo "Starting database backup for ${DB_CONTAINER}..."
docker exec "$DB_CONTAINER" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > "$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).sql"

# Check if backup file was created
if [ $? -eq 0 ]; then
    echo "Database backup completed successfully."
else
    echo "Error: pg_dump failed!"
    exit 1
fi

# Clean up backups older than 90 days
find $BACKUP_DIR -name "*.sql" -type f -mtime +90 -exec rm -f {} \;

# Log the action
echo "Backup created at $(date), Old backups cleaned." >> $BACKUP_DIR/backup.log