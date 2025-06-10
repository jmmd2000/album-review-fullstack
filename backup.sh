#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found!"
  exit 1
fi

# Backup directory on the host
BACKUP_DIR="/root/albums/backups"

# Debugging: Print where the backups are being saved
echo "Creating backup directory: $BACKUP_DIR"

# Ensure the backup directory exists
mkdir -p $BACKUP_DIR
if [ $? -ne 0 ]; then
    echo "Error: Failed to create backup directory at $BACKUP_DIR"
    exit 1
fi

# Debugging: Check if directory exists after creation
if [ -d "$BACKUP_DIR" ]; then
    echo "Backup directory exists: $BACKUP_DIR"
else
    echo "Error: Backup directory does not exist!"
    exit 1
fi

# Run pg_dump and save the backup with a timestamp
echo "Starting database backup..."
docker exec album-review-fullstack_db_1 pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > $BACKUP_DIR/album-reviews-$(date +%Y%m%d_%H%M%S).sql

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