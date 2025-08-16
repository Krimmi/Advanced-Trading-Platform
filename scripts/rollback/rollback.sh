#!/bin/bash
# Rollback Script for Hedge Fund Trading Application
# This script provides rollback capabilities for application, database, and configuration

set -e

# Default values
ENVIRONMENT="development"
ROLLBACK_TYPE="application"
VERSION=""
CONFIG_FILE=""
DB_BACKUP_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -t|--type)
      ROLLBACK_TYPE="$2"
      shift
      shift
      ;;
    -v|--version)
      VERSION="$2"
      shift
      shift
      ;;
    -c|--config)
      CONFIG_FILE="$2"
      shift
      shift
      ;;
    -d|--database)
      DB_BACKUP_FILE="$2"
      shift
      shift
      ;;
    -h|--help)
      echo "Usage: rollback.sh [options]"
      echo "Options:"
      echo "  -e, --environment   Environment to rollback (development, staging, production)"
      echo "  -t, --type          Type of rollback (application, database, config, all)"
      echo "  -v, --version       Version to rollback to (for application rollback)"
      echo "  -c, --config        Config file to restore (for config rollback)"
      echo "  -d, --database      Database backup file to restore (for database rollback)"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $key"
      exit 1
      ;;
  esac
done

# Validate inputs
if [ -z "$ENVIRONMENT" ]; then
  echo "Error: Environment is required"
  exit 1
fi

if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo "Error: Environment must be one of: development, staging, production"
  exit 1
fi

if [ -z "$ROLLBACK_TYPE" ]; then
  echo "Error: Rollback type is required"
  exit 1
fi

if [ "$ROLLBACK_TYPE" != "application" ] && [ "$ROLLBACK_TYPE" != "database" ] && [ "$ROLLBACK_TYPE" != "config" ] && [ "$ROLLBACK_TYPE" != "all" ]; then
  echo "Error: Rollback type must be one of: application, database, config, all"
  exit 1
fi

# Load environment-specific variables
if [ "$ENVIRONMENT" == "development" ]; then
  S3_BUCKET="${DEV_S3_BUCKET}"
  BACKUP_BUCKET="${DEV_BACKUP_BUCKET}"
  CLOUDFRONT_ID="${DEV_CLOUDFRONT_ID}"
  DB_HOST="${DEV_DB_HOST}"
  DB_NAME="${DEV_DB_NAME}"
  DB_USER="${DEV_DB_USER}"
  DB_PASSWORD="${DEV_DB_PASSWORD}"
  CONFIG_PATH="${DEV_CONFIG_PATH}"
elif [ "$ENVIRONMENT" == "staging" ]; then
  S3_BUCKET="${STAGING_S3_BUCKET}"
  BACKUP_BUCKET="${STAGING_BACKUP_BUCKET}"
  CLOUDFRONT_ID="${STAGING_CLOUDFRONT_ID}"
  DB_HOST="${STAGING_DB_HOST}"
  DB_NAME="${STAGING_DB_NAME}"
  DB_USER="${STAGING_DB_USER}"
  DB_PASSWORD="${STAGING_DB_PASSWORD}"
  CONFIG_PATH="${STAGING_CONFIG_PATH}"
elif [ "$ENVIRONMENT" == "production" ]; then
  S3_BUCKET="${PROD_S3_BUCKET}"
  BACKUP_BUCKET="${PROD_BACKUP_BUCKET}"
  CLOUDFRONT_ID="${PROD_CLOUDFRONT_ID}"
  DB_HOST="${PROD_DB_HOST}"
  DB_NAME="${PROD_DB_NAME}"
  DB_USER="${PROD_DB_USER}"
  DB_PASSWORD="${PROD_DB_PASSWORD}"
  CONFIG_PATH="${PROD_CONFIG_PATH}"
fi

# Function to rollback application
rollback_application() {
  echo "Rolling back application to version $VERSION in $ENVIRONMENT environment..."
  
  if [ -z "$VERSION" ]; then
    echo "Error: Version is required for application rollback"
    exit 1
  fi
  
  # Check if backup exists
  aws s3 ls "s3://${BACKUP_BUCKET}/${VERSION}/" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "Error: Backup for version $VERSION not found"
    exit 1
  fi
  
  # Create a backup of current deployment before rollback
  CURRENT_VERSION=$(date +'%Y.%m.%d')-rollback-$(date +'%H%M%S')
  echo "Creating backup of current deployment as $CURRENT_VERSION..."
  aws s3 sync "s3://${S3_BUCKET}" "s3://${BACKUP_BUCKET}/${CURRENT_VERSION}/" --delete
  
  # Restore from backup
  echo "Restoring from backup version $VERSION..."
  aws s3 sync "s3://${BACKUP_BUCKET}/${VERSION}/" "s3://${S3_BUCKET}" --delete
  
  # Invalidate CloudFront cache
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_ID}" --paths "/*"
  
  echo "Application rollback to version $VERSION completed successfully"
}

# Function to rollback database
rollback_database() {
  echo "Rolling back database in $ENVIRONMENT environment..."
  
  if [ -z "$DB_BACKUP_FILE" ]; then
    echo "Error: Database backup file is required for database rollback"
    exit 1
  fi
  
  # Check if backup file exists
  if [ ! -f "$DB_BACKUP_FILE" ]; then
    echo "Error: Database backup file $DB_BACKUP_FILE not found"
    exit 1
  fi
  
  # Create a backup of current database before rollback
  CURRENT_DB_BACKUP="/tmp/db_backup_$(date +'%Y%m%d%H%M%S').sql"
  echo "Creating backup of current database as $CURRENT_DB_BACKUP..."
  PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$CURRENT_DB_BACKUP"
  
  # Restore from backup
  echo "Restoring database from backup $DB_BACKUP_FILE..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$DB_BACKUP_FILE"
  
  echo "Database rollback completed successfully"
}

# Function to rollback configuration
rollback_config() {
  echo "Rolling back configuration in $ENVIRONMENT environment..."
  
  if [ -z "$CONFIG_FILE" ]; then
    echo "Error: Config file is required for config rollback"
    exit 1
  fi
  
  # Check if config file exists
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file $CONFIG_FILE not found"
    exit 1
  fi
  
  # Create a backup of current config before rollback
  CURRENT_CONFIG_BACKUP="/tmp/config_backup_$(date +'%Y%m%d%H%M%S').json"
  echo "Creating backup of current config as $CURRENT_CONFIG_BACKUP..."
  cp "$CONFIG_PATH" "$CURRENT_CONFIG_BACKUP"
  
  # Restore from backup
  echo "Restoring config from backup $CONFIG_FILE..."
  cp "$CONFIG_FILE" "$CONFIG_PATH"
  
  echo "Configuration rollback completed successfully"
}

# Execute rollback based on type
if [ "$ROLLBACK_TYPE" == "application" ] || [ "$ROLLBACK_TYPE" == "all" ]; then
  rollback_application
fi

if [ "$ROLLBACK_TYPE" == "database" ] || [ "$ROLLBACK_TYPE" == "all" ]; then
  rollback_database
fi

if [ "$ROLLBACK_TYPE" == "config" ] || [ "$ROLLBACK_TYPE" == "all" ]; then
  rollback_config
fi

echo "Rollback process completed successfully"