# Hedge Fund Trading Application - Deployment Pipeline

This document provides an overview of the deployment pipeline implemented for the Hedge Fund Trading Application.

## Table of Contents
1. [Overview](#overview)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Environment Management](#environment-management)
4. [Rollback Procedures](#rollback-procedures)
5. [Deployment Automation](#deployment-automation)
6. [Usage Guide](#usage-guide)

## Overview

The deployment pipeline provides a robust, automated process for deploying the Hedge Fund Trading Application across different environments (development, staging, and production). It includes comprehensive testing, environment-specific configurations, automated deployment, and rollback procedures to ensure reliable and consistent deployments.

### Key Features

- Automated CI/CD pipeline using GitHub Actions
- Environment-specific configurations for development, staging, and production
- Comprehensive testing before deployment
- Automated deployment to AWS infrastructure
- Backup procedures before deployment
- Rollback capabilities for database, application code, and configuration
- Deployment notifications via Slack and email

## CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions and is defined in `.github/workflows/ci-cd.yml`. The pipeline includes the following stages:

1. **Lint**: Runs ESLint to ensure code quality
2. **Unit Tests**: Runs Jest unit tests with code coverage reporting
3. **E2E Tests**: Runs Cypress end-to-end tests
4. **Build**: Builds the application with environment-specific configurations
5. **Deploy to Development**: Deploys to the development environment when pushing to the develop branch
6. **Deploy to Staging**: Deploys to the staging environment when pushing to the main branch
7. **Deploy to Production**: Deploys to the production environment after successful staging deployment

### Pipeline Features

- **Automated Testing**: Runs linting, unit tests, and end-to-end tests before deployment
- **Build Automation**: Generates versioned builds with environment-specific configurations
- **Deployment Automation**: Automatically deploys to the appropriate environment based on the branch
- **Backup Procedures**: Creates backups of the current deployment before deploying new versions
- **Notifications**: Sends notifications via Slack after deployments

## Environment Management

Environment management is handled through environment-specific configuration files and a configuration manager script.

### Environment Configuration Files

- `config/environments/development.js`: Configuration for the development environment
- `config/environments/staging.js`: Configuration for the staging environment
- `config/environments/production.js`: Configuration for the production environment

These files define environment-specific settings for:

- Server configuration
- Database connections
- API service endpoints and keys
- Authentication settings
- Logging configuration
- Caching strategies
- WebSocket settings
- Feature flags
- Monitoring settings
- Deployment configuration

### Configuration Manager

The `scripts/config/config-manager.js` script provides tools for managing environment configurations:

- **List Environments**: View available environment configurations
- **Use Environment**: Switch to a specific environment
- **Validate Environment**: Validate configuration for an environment
- **Generate Environment Files**: Generate environment-specific configuration files
- **Show Environment**: Display configuration for an environment
- **Diff Environments**: Compare configurations between environments
- **Backup Environment**: Create a backup of environment configuration
- **Restore Environment**: Restore configuration from a backup

## Rollback Procedures

The deployment pipeline includes comprehensive rollback procedures for database, application code, and configuration.

### General Rollback Script

The `scripts/rollback/rollback.sh` script provides a general rollback capability that can handle:

- Application rollback to a previous version
- Database rollback to a previous state
- Configuration rollback to a previous state

### Database Rollback

The `scripts/rollback/mongodb-rollback.js` script provides MongoDB-specific rollback capabilities:

- Create backups of the current database state
- Restore database from backups
- Apply schema migrations if needed

### Configuration Rollback

The `scripts/rollback/config-rollback.js` script provides configuration rollback capabilities:

- List available configuration backups
- Create backups of current configuration
- Restore configuration from backups
- Restart services after configuration changes

### Application Version Rollback

The `scripts/rollback/app-version-rollback.js` script provides application code rollback capabilities:

- List available versions (tags, commits)
- Rollback to a specific version, tag, or commit
- Build and deploy the rolled-back version
- Record deployment information

## Deployment Automation

The `scripts/deploy/deploy.sh` script automates the deployment process across different environments.

### Deployment Features

- **Environment-Specific Deployment**: Deploy to development, staging, or production environments
- **Pre-Deployment Testing**: Run tests before deployment
- **Backup Creation**: Create backups before deployment
- **Validation**: Validate build before deployment
- **AWS Deployment**: Deploy to S3 and invalidate CloudFront cache
- **Server Deployment**: Deploy to application servers
- **Notifications**: Send deployment notifications via Slack and email

## Usage Guide

### CI/CD Pipeline

The CI/CD pipeline runs automatically when code is pushed to the repository:

- Pushing to the `develop` branch triggers deployment to the development environment
- Pushing to the `main` branch triggers deployment to the staging environment
- After successful staging deployment, production deployment requires manual approval

### Manual Deployment

To manually deploy the application:

```bash
# Deploy to development environment
./scripts/deploy/deploy.sh -e development

# Deploy to staging environment
./scripts/deploy/deploy.sh -e staging

# Deploy to production environment
./scripts/deploy/deploy.sh -e production

# Skip certain steps
./scripts/deploy/deploy.sh -e development --skip-tests --skip-build
```

### Environment Management

To manage environment configurations:

```bash
# List available environments
node scripts/config/config-manager.js list

# Switch to development environment
node scripts/config/config-manager.js use development

# Validate production configuration
node scripts/config/config-manager.js validate production

# Generate environment-specific files
node scripts/config/config-manager.js generate staging

# Compare environments
node scripts/config/config-manager.js diff development production
```

### Rollback Procedures

To rollback to a previous state:

```bash
# General rollback
./scripts/rollback/rollback.sh -e production -t application -v 2023.08.14-abc123

# Database rollback
node scripts/rollback/mongodb-rollback.js --env=production --backup=backup-20230814-120000

# Configuration rollback
node scripts/rollback/config-rollback.js --env=production --backup=backup-20230814-120000

# Application version rollback
node scripts/rollback/app-version-rollback.js --env=production --tag=v1.2.3
```