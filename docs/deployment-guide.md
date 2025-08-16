# Hedge Fund Trading Application Deployment Guide

This guide provides comprehensive instructions for deploying the hedge fund trading application to different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Process](#deployment-process)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Rollback Procedures](#rollback-procedures)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have the following:

### Required Tools

- Node.js 18.x or later
- npm 8.x or later
- AWS CLI configured with appropriate permissions
- GitHub account with access to the repository
- Access to AWS services (S3, CloudFront, Route 53, etc.)

### Required Access

- AWS IAM credentials with permissions for:
  - S3 bucket management
  - CloudFront distribution management
  - Route 53 DNS management (if using AWS for DNS)
  - Parameter Store or Secrets Manager (for storing secrets)
- GitHub repository access with permissions to:
  - Push to protected branches
  - Create and manage GitHub Actions workflows
  - Create releases

### Required Secrets

- API keys for all external services:
  - Alpha Vantage
  - Polygon
  - IEX Cloud
  - Financial Modeling Prep
  - Quandl
  - NewsAPI
  - Finnhub
  - Alpaca
  - Interactive Brokers
- Sentry DSN for error tracking
- AWS access keys for deployment

## Environment Setup

### Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/hedge-fund-app.git
   cd hedge-fund-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.development` file with the required environment variables:
   ```
   REACT_APP_ENV=development
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_WS_URL=ws://localhost:3001/ws
   REACT_APP_SENTRY_DSN=your-sentry-dsn
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Staging Environment

1. Create a `.env.staging` file with the staging environment variables:
   ```
   REACT_APP_ENV=staging
   REACT_APP_API_URL=https://api.staging.hedgefund-app.com
   REACT_APP_WS_URL=wss://ws.staging.hedgefund-app.com
   REACT_APP_SENTRY_DSN=your-sentry-dsn
   ```

2. Build the application for staging:
   ```bash
   npm run build:staging
   ```

### Production Environment

1. Create a `.env.production` file with the production environment variables:
   ```
   REACT_APP_ENV=production
   REACT_APP_API_URL=https://api.hedgefund-app.com
   REACT_APP_WS_URL=wss://ws.hedgefund-app.com
   REACT_APP_SENTRY_DSN=your-sentry-dsn
   ```

2. Build the application for production:
   ```bash
   npm run build
   ```

## Deployment Process

### Manual Deployment

#### To Development Environment

1. Build the application:
   ```bash
   npm run build:dev
   ```

2. Deploy to S3:
   ```bash
   aws s3 sync build/ s3://dev-hedge-fund-app --delete
   ```

3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DEV_DISTRIBUTION_ID --paths "/*"
   ```

#### To Staging Environment

1. Build the application:
   ```bash
   npm run build:staging
   ```

2. Deploy to S3:
   ```bash
   aws s3 sync build/ s3://staging-hedge-fund-app --delete
   ```

3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_STAGING_DISTRIBUTION_ID --paths "/*"
   ```

#### To Production Environment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to S3:
   ```bash
   aws s3 sync build/ s3://hedge-fund-app --delete
   ```

3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_PRODUCTION_DISTRIBUTION_ID --paths "/*"
   ```

### Automated Deployment via CI/CD

The application is configured with GitHub Actions for automated deployment. The workflow is defined in `.github/workflows/ci-cd.yml`.

To deploy using the CI/CD pipeline:

1. For development deployment:
   - Push changes to the `develop` branch
   - The CI/CD pipeline will automatically build and deploy to the development environment

2. For staging deployment:
   - Create a pull request from `develop` to `main`
   - Once the pull request is approved and merged, the CI/CD pipeline will automatically build and deploy to the staging environment

3. For production deployment:
   - Create a release tag from the `main` branch
   - The CI/CD pipeline will automatically build and deploy to the production environment

## CI/CD Pipeline

The CI/CD pipeline is configured with the following stages:

1. **Lint**: Runs ESLint to check code quality
2. **Unit Tests**: Runs Jest unit tests
3. **E2E Tests**: Runs Cypress end-to-end tests
4. **Build**: Builds the application for the target environment
5. **Deploy**: Deploys the application to the target environment
6. **Release**: Creates a GitHub release (for production deployments)

### GitHub Secrets Configuration

The following secrets need to be configured in GitHub:

- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `DEV_S3_BUCKET`: Development S3 bucket name
- `STAGING_S3_BUCKET`: Staging S3 bucket name
- `PROD_S3_BUCKET`: Production S3 bucket name
- `DEV_CLOUDFRONT_ID`: Development CloudFront distribution ID
- `STAGING_CLOUDFRONT_ID`: Staging CloudFront distribution ID
- `PROD_CLOUDFRONT_ID`: Production CloudFront distribution ID
- `SENTRY_AUTH_TOKEN`: Sentry authentication token
- `SENTRY_ORG`: Sentry organization name
- `SENTRY_PROJECT`: Sentry project name
- `SLACK_WEBHOOK_URL`: Slack webhook URL for notifications
- `CYPRESS_RECORD_KEY`: Cypress Dashboard record key

## Monitoring and Alerts

### Error Tracking with Sentry

The application uses Sentry for error tracking. Errors are automatically captured and reported to Sentry.

To view errors:

1. Log in to the Sentry dashboard: https://sentry.io
2. Navigate to your project
3. View issues and events

### Performance Monitoring

Performance monitoring is implemented using:

1. **Sentry Performance**: Tracks API calls and frontend performance
2. **CloudWatch**: Monitors AWS infrastructure
3. **Custom Performance Metrics**: Tracks component rendering and data processing performance

### Alerts Configuration

Configure alerts in Sentry for:

1. Error rate thresholds
2. Performance degradation
3. API failure rates

Configure CloudWatch alerts for:

1. S3 bucket access issues
2. CloudFront distribution errors
3. Route 53 health checks

## Rollback Procedures

### Rolling Back a Deployment

If a deployment causes issues, follow these steps to roll back:

1. Identify the last stable version from GitHub releases
2. Download the build artifacts from the GitHub Actions run
3. Deploy the previous version using the manual deployment steps

Alternatively, use the AWS S3 versioning feature:

1. Enable versioning on the S3 bucket
2. Restore the previous version of all files

### Emergency Rollback

For critical issues requiring immediate rollback:

1. Use the CloudFront origin failover feature to switch to a backup origin
2. Update the Route 53 DNS record to point to a backup distribution

## Security Considerations

### API Key Management

API keys are managed using:

1. Environment variables for production deployment
2. Encrypted local storage for development
3. AWS Secrets Manager for CI/CD pipeline

### HTTPS Configuration

Ensure HTTPS is properly configured:

1. Use CloudFront with an SSL certificate
2. Configure security headers in CloudFront:
   - Strict-Transport-Security
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection

### Access Control

Implement proper access control:

1. Use AWS IAM roles with least privilege
2. Configure S3 bucket policies to restrict access
3. Set up CloudFront origin access identity

## Performance Optimization

### CloudFront Configuration

Optimize CloudFront settings:

1. Configure caching based on content type
2. Set appropriate TTLs for different content
3. Enable compression
4. Use edge locations closest to your users

### S3 Optimization

Optimize S3 configuration:

1. Enable transfer acceleration for faster uploads
2. Configure appropriate CORS settings
3. Use S3 object metadata for caching control

### Application Optimization

Optimize the application:

1. Enable code splitting and lazy loading
2. Implement efficient caching strategies
3. Use service workers for offline capabilities
4. Optimize images and assets

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   - Check AWS credentials
   - Verify S3 bucket permissions
   - Check CloudFront distribution status

2. **API Integration Issues**
   - Verify API keys are correctly configured
   - Check API rate limits
   - Verify network connectivity

3. **Performance Issues**
   - Check browser console for errors
   - Analyze Sentry performance metrics
   - Review CloudFront cache hit ratio

### Support Resources

- GitHub Issues: https://github.com/your-org/hedge-fund-app/issues
- Internal Documentation: [Link to internal wiki]
- Support Contact: [support@your-company.com]

## Appendix

### AWS Infrastructure Diagram

```
                                  +----------------+
                                  |                |
                                  |   Route 53     |
                                  |                |
                                  +-------+--------+
                                          |
                                          v
+----------------+             +----------+---------+
|                |             |                    |
|  GitHub        +------------>+   CloudFront       |
|  Actions       |             |                    |
|                |             +----------+---------+
+----------------+                        |
                                          v
                                  +-------+--------+
                                  |                |
                                  |   S3 Bucket    |
                                  |                |
                                  +----------------+
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| REACT_APP_ENV | Environment name | Yes | development |
| REACT_APP_API_URL | API base URL | Yes | http://localhost:3001/api |
| REACT_APP_WS_URL | WebSocket URL | Yes | ws://localhost:3001/ws |
| REACT_APP_SENTRY_DSN | Sentry DSN | No | - |
| REACT_APP_VERSION | Application version | No | 0.0.0 |
| REACT_APP_FEATURE_FLAGS_URL | Feature flags URL | No | - |

### Deployment Checklist

- [ ] Run all tests locally
- [ ] Update version number
- [ ] Update changelog
- [ ] Build application
- [ ] Deploy to target environment
- [ ] Verify deployment
- [ ] Run smoke tests
- [ ] Monitor for errors
- [ ] Update documentation