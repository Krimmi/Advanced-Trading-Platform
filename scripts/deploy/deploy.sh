#!/bin/bash
# Deployment Script for Hedge Fund Trading Application
# This script handles the deployment process for different environments

set -e

# Default values
ENVIRONMENT="development"
SKIP_BUILD=false
SKIP_TESTS=false
SKIP_BACKUP=false
SKIP_CONFIRMATION=false
SKIP_RESTART=false
SKIP_VALIDATION=false
SKIP_NOTIFICATION=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-confirmation)
      SKIP_CONFIRMATION=true
      shift
      ;;
    --skip-restart)
      SKIP_RESTART=true
      shift
      ;;
    --skip-validation)
      SKIP_VALIDATION=true
      shift
      ;;
    --skip-notification)
      SKIP_NOTIFICATION=true
      shift
      ;;
    -h|--help)
      echo "Usage: deploy.sh [options]"
      echo "Options:"
      echo "  -e, --environment     Environment to deploy (development, staging, production)"
      echo "  --skip-build          Skip build step"
      echo "  --skip-tests          Skip tests"
      echo "  --skip-backup         Skip backup step"
      echo "  --skip-confirmation   Skip confirmation prompts"
      echo "  --skip-restart        Skip service restart"
      echo "  --skip-validation     Skip validation steps"
      echo "  --skip-notification   Skip deployment notifications"
      echo "  -h, --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $key"
      exit 1
      ;;
  esac
done

# Validate environment
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo "Error: Environment must be one of: development, staging, production"
  exit 1
fi

# Load environment-specific variables
if [ -f ".env.$ENVIRONMENT" ]; then
  source ".env.$ENVIRONMENT"
fi

# Set deployment variables based on environment
if [ "$ENVIRONMENT" == "development" ]; then
  S3_BUCKET="${DEV_S3_BUCKET:-hedge-fund-dev}"
  CLOUDFRONT_ID="${DEV_CLOUDFRONT_ID}"
  DOMAIN="${DEV_DOMAIN:-dev.hedgefund.example.com}"
  NODE_ENV="development"
elif [ "$ENVIRONMENT" == "staging" ]; then
  S3_BUCKET="${STAGING_S3_BUCKET:-hedge-fund-staging}"
  CLOUDFRONT_ID="${STAGING_CLOUDFRONT_ID}"
  DOMAIN="${STAGING_DOMAIN:-staging.hedgefund.example.com}"
  NODE_ENV="staging"
elif [ "$ENVIRONMENT" == "production" ]; then
  S3_BUCKET="${PROD_S3_BUCKET:-hedge-fund-prod}"
  CLOUDFRONT_ID="${PROD_CLOUDFRONT_ID}"
  DOMAIN="${PROD_DOMAIN:-hedgefund.example.com}"
  NODE_ENV="production"
fi

# Display deployment information
echo "========================================"
echo "Hedge Fund Trading App Deployment"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "S3 Bucket: $S3_BUCKET"
echo "Domain: $DOMAIN"
echo "Node Environment: $NODE_ENV"
echo "========================================"

# Confirm deployment
if [ "$SKIP_CONFIRMATION" = false ]; then
  read -p "Are you sure you want to deploy to $ENVIRONMENT? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
  fi
  
  if [ "$ENVIRONMENT" == "production" ]; then
    read -p "You are deploying to PRODUCTION. Type 'confirm' to proceed: " -r
    echo
    if [[ ! $REPLY == "confirm" ]]; then
      echo "Production deployment cancelled"
      exit 0
    fi
  fi
fi

# Start deployment
echo "Starting deployment to $ENVIRONMENT environment..."
START_TIME=$(date +%s)

# Create deployment directory
DEPLOY_DIR="deployments/$ENVIRONMENT/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Log deployment start
echo "$(date): Starting deployment to $ENVIRONMENT" > "$DEPLOY_DIR/deploy.log"

# Backup current version if needed
if [ "$SKIP_BACKUP" = false ]; then
  echo "Creating backup of current version..."
  
  # Create backup of database
  if [ -f "scripts/rollback/mongodb-rollback.js" ]; then
    echo "Backing up database..."
    BACKUP_ID="pre_deploy_$(date +%Y%m%d_%H%M%S)"
    node scripts/rollback/mongodb-rollback.js --env="$ENVIRONMENT" --backup-create --backup-id="$BACKUP_ID" >> "$DEPLOY_DIR/deploy.log" 2>&1
    echo "Database backup created with ID: $BACKUP_ID"
    echo "BACKUP_ID=$BACKUP_ID" >> "$DEPLOY_DIR/deploy.env"
  fi
  
  # Create backup of configuration
  if [ -f "scripts/config/config-manager.js" ]; then
    echo "Backing up configuration..."
    node scripts/config/config-manager.js backup "$ENVIRONMENT" >> "$DEPLOY_DIR/deploy.log" 2>&1
  fi
  
  # Create backup of current deployment
  if [ -n "$S3_BUCKET" ]; then
    echo "Backing up current deployment from S3..."
    BACKUP_PREFIX="backups/$(date +%Y%m%d_%H%M%S)"
    aws s3 sync "s3://$S3_BUCKET/" "s3://$S3_BUCKET/$BACKUP_PREFIX/" --quiet
    echo "S3_BACKUP_PREFIX=$BACKUP_PREFIX" >> "$DEPLOY_DIR/deploy.env"
  fi
  
  echo "Backup completed"
fi

# Run tests if needed
if [ "$SKIP_TESTS" = false ]; then
  echo "Running tests..."
  
  # Run linting
  echo "Running linting..."
  npm run lint >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
    echo "Linting failed. Check $DEPLOY_DIR/deploy.log for details."
    if [ "$SKIP_CONFIRMATION" = false ]; then
      read -p "Continue despite linting errors? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled due to linting errors"
        exit 1
      fi
    else
      echo "Continuing despite linting errors (--skip-confirmation enabled)"
    fi
  }
  
  # Run unit tests
  echo "Running unit tests..."
  npm test >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
    echo "Unit tests failed. Check $DEPLOY_DIR/deploy.log for details."
    if [ "$SKIP_CONFIRMATION" = false ]; then
      read -p "Continue despite test failures? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled due to test failures"
        exit 1
      fi
    else
      echo "Continuing despite test failures (--skip-confirmation enabled)"
    fi
  }
  
  # Run integration tests for staging and production
  if [ "$ENVIRONMENT" == "staging" ] || [ "$ENVIRONMENT" == "production" ]; then
    echo "Running integration tests..."
    npm run test:integration >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
      echo "Integration tests failed. Check $DEPLOY_DIR/deploy.log for details."
      if [ "$SKIP_CONFIRMATION" = false ]; then
        read -p "Continue despite integration test failures? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
          echo "Deployment cancelled due to integration test failures"
          exit 1
        fi
      else
        echo "Continuing despite integration test failures (--skip-confirmation enabled)"
      fi
    }
  fi
  
  echo "Tests completed"
fi

# Build application if needed
if [ "$SKIP_BUILD" = false ]; then
  echo "Building application for $ENVIRONMENT environment..."
  
  # Generate version number
  VERSION=$(date +"%Y.%m.%d")-$(git rev-parse --short HEAD)
  echo "VERSION=$VERSION" >> "$DEPLOY_DIR/deploy.env"
  
  # Update version in package.json
  npm version "$VERSION" --no-git-tag-version >> "$DEPLOY_DIR/deploy.log" 2>&1
  
  # Build application
  NODE_ENV="$NODE_ENV" npm run build >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
    echo "Build failed. Check $DEPLOY_DIR/deploy.log for details."
    exit 1
  }
  
  echo "Build completed (version: $VERSION)"
fi

# Validate build if needed
if [ "$SKIP_VALIDATION" = false ]; then
  echo "Validating build..."
  
  # Check if build directory exists
  if [ ! -d "build" ] && [ ! -d "dist" ]; then
    echo "Error: Build directory not found"
    exit 1
  fi
  
  # Check for required files
  BUILD_DIR="build"
  if [ ! -d "build" ] && [ -d "dist" ]; then
    BUILD_DIR="dist"
  fi
  
  if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "Error: index.html not found in build directory"
    exit 1
  fi
  
  echo "Build validation completed"
fi

# Deploy to S3 if bucket is configured
if [ -n "$S3_BUCKET" ]; then
  echo "Deploying to S3 bucket: $S3_BUCKET..."
  
  # Sync build directory to S3
  aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" --delete >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
    echo "S3 deployment failed. Check $DEPLOY_DIR/deploy.log for details."
    exit 1
  }
  
  # Invalidate CloudFront cache if ID is configured
  if [ -n "$CLOUDFRONT_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*" >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
      echo "CloudFront invalidation failed. Check $DEPLOY_DIR/deploy.log for details."
      # Continue despite CloudFront invalidation failure
    }
  fi
  
  echo "S3 deployment completed"
fi

# Deploy server if needed
if [ -f "server.js" ] || [ -f "dist/server.js" ]; then
  echo "Deploying server application..."
  
  # Copy server files to deployment directory
  mkdir -p "$DEPLOY_DIR/server"
  if [ -f "server.js" ]; then
    cp server.js "$DEPLOY_DIR/server/"
  fi
  if [ -d "dist" ]; then
    cp -r dist/* "$DEPLOY_DIR/server/"
  fi
  
  # Copy configuration files
  mkdir -p "$DEPLOY_DIR/server/config"
  cp -r config/* "$DEPLOY_DIR/server/config/"
  
  # Create deployment package
  DEPLOY_PACKAGE="$DEPLOY_DIR/server-deploy.tar.gz"
  tar -czf "$DEPLOY_PACKAGE" -C "$DEPLOY_DIR/server" .
  
  # Deploy to server if environment variables are set
  if [ -n "$SERVER_HOST" ] && [ -n "$SERVER_USER" ]; then
    echo "Deploying to server: $SERVER_HOST..."
    
    # Copy deployment package to server
    scp "$DEPLOY_PACKAGE" "$SERVER_USER@$SERVER_HOST:/tmp/" >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
      echo "Failed to copy deployment package to server. Check $DEPLOY_DIR/deploy.log for details."
      exit 1
    }
    
    # Extract and deploy on server
    ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p ~/app-$ENVIRONMENT && \
      tar -xzf /tmp/server-deploy.tar.gz -C ~/app-$ENVIRONMENT && \
      cd ~/app-$ENVIRONMENT && \
      npm ci --production" >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
      echo "Server deployment failed. Check $DEPLOY_DIR/deploy.log for details."
      exit 1
    }
    
    # Restart service if needed
    if [ "$SKIP_RESTART" = false ]; then
      echo "Restarting server application..."
      ssh "$SERVER_USER@$SERVER_HOST" "cd ~/app-$ENVIRONMENT && \
        pm2 reload ecosystem.config.js --env $ENVIRONMENT || \
        pm2 start ecosystem.config.js --env $ENVIRONMENT" >> "$DEPLOY_DIR/deploy.log" 2>&1 || {
        echo "Service restart failed. Check $DEPLOY_DIR/deploy.log for details."
        exit 1
      }
    fi
    
    echo "Server deployment completed"
  else
    echo "Skipping server deployment (SERVER_HOST or SERVER_USER not set)"
  fi
fi

# Record deployment information
DEPLOY_END_TIME=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END_TIME - START_TIME))
echo "Deployment completed in $DEPLOY_DURATION seconds"

# Create deployment record
cat > "$DEPLOY_DIR/deployment.json" << EOF
{
  "environment": "$ENVIRONMENT",
  "version": "$VERSION",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "duration": $DEPLOY_DURATION,
  "git": {
    "branch": "$(git rev-parse --abbrev-ref HEAD)",
    "commit": "$(git rev-parse HEAD)",
    "commitMessage": "$(git log -1 --pretty=%B)"
  },
  "deployer": "$(whoami)@$(hostname)",
  "status": "success"
}
EOF

# Send notification if needed
if [ "$SKIP_NOTIFICATION" = false ]; then
  echo "Sending deployment notification..."
  
  # Send Slack notification if webhook is configured
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -s -X POST -H 'Content-type: application/json' --data @- "$SLACK_WEBHOOK_URL" << EOF >> "$DEPLOY_DIR/deploy.log" 2>&1
{
  "text": "Deployment to $ENVIRONMENT completed",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Deployment Completed",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Environment:*\n$ENVIRONMENT"
        },
        {
          "type": "mrkdwn",
          "text": "*Version:*\n$VERSION"
        },
        {
          "type": "mrkdwn",
          "text": "*Deployed by:*\n$(whoami)"
        },
        {
          "type": "mrkdwn",
          "text": "*Duration:*\n${DEPLOY_DURATION}s"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Commit:*\n$(git log -1 --pretty=%B | head -n 1)"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Application",
            "emoji": true
          },
          "url": "https://$DOMAIN"
        }
      ]
    }
  ]
}
EOF
  fi
  
  # Send email notification if configured
  if [ -n "$NOTIFICATION_EMAIL" ]; then
    mail -s "Deployment to $ENVIRONMENT completed" "$NOTIFICATION_EMAIL" << EOF
Deployment to $ENVIRONMENT environment completed successfully.

Environment: $ENVIRONMENT
Version: $VERSION
Timestamp: $(date)
Duration: $DEPLOY_DURATION seconds
Deployed by: $(whoami)@$(hostname)

Commit: $(git rev-parse HEAD)
Commit message: $(git log -1 --pretty=%B)

Application URL: https://$DOMAIN
EOF
  fi
  
  echo "Notifications sent"
fi

echo "========================================"
echo "Deployment to $ENVIRONMENT completed successfully!"
echo "Version: $VERSION"
echo "Deployment record: $DEPLOY_DIR/deployment.json"
echo "Application URL: https://$DOMAIN"
echo "========================================"