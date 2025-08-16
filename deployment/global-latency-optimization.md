# Global Latency Optimization Plan

## Overview

This document outlines the strategy for optimizing the Hedge Fund Trading Platform's global latency to ensure consistent, low-latency performance for users across all geographic regions. The plan focuses on edge caching, CDN integration, regional API endpoints, and latency-based routing.

## Current Latency Challenges

The trading platform currently faces several latency challenges:

1. **Geographic Distance**: Users far from our primary data centers experience higher latency
2. **Data Transfer Overhead**: Large datasets being transferred across regions
3. **Network Congestion**: Peak trading hours create bottlenecks
4. **Inconsistent Performance**: Users in different regions experience varying performance
5. **Real-time Requirements**: Trading operations require near-instantaneous responses

## Optimization Goals

1. **Target Latencies**:
   - API Requests: < 100ms for 95% of requests
   - WebSocket Updates: < 50ms for market data updates
   - Page Load Time: < 2 seconds for initial load
   - Time to Interactive: < 3 seconds

2. **Global Consistency**:
   - Maximum 2x latency difference between best and worst-performing regions
   - Consistent 99.9% uptime across all regions
   - Predictable performance during market hours

3. **Scalability**:
   - Support for 10x traffic spikes during market events
   - Graceful degradation under extreme load
   - Cost-effective resource utilization

## Edge Caching Strategy

### 1. Cacheable Content Identification

We will implement a comprehensive edge caching strategy by first identifying content suitable for caching:

#### Highly Cacheable Content:
- Static assets (JS, CSS, images)
- Market reference data (instrument details, exchange information)
- Historical price data (OHLCV data older than 15 minutes)
- News articles and research reports
- Documentation and help content

#### Conditionally Cacheable Content:
- User portfolio summaries (with short TTL)
- Watchlists (with user-specific cache keys)
- Market overviews and indices (with short TTL)
- Search results (with query-based cache keys)

#### Non-Cacheable Content:
- Real-time price data
- Order book data
- User account information
- Trading functionality

### 2. Cache Configuration

```typescript
// Cache configuration service
class CacheConfigurationService {
  getCacheConfig(contentType: string, region: string): CacheConfig {
    // Base configuration
    const baseConfig: CacheConfig = {
      enabled: true,
      ttl: 0, // Default no caching
      staleWhileRevalidate: 0,
      staleIfError: 0,
      varyBy: [],
      purgeOn: []
    };
    
    // Content-specific configurations
    switch (contentType) {
      case 'static-assets':
        return {
          ...baseConfig,
          ttl: 86400, // 24 hours
          staleWhileRevalidate: 86400, // 24 hours
          staleIfError: 604800, // 1 week
          varyBy: ['Accept-Encoding'],
          purgeOn: ['deployment']
        };
        
      case 'reference-data':
        return {
          ...baseConfig,
          ttl: 3600, // 1 hour
          staleWhileRevalidate: 7200, // 2 hours
          staleIfError: 86400, // 24 hours
          varyBy: ['Accept-Encoding', 'Accept-Language'],
          purgeOn: ['reference-data-update']
        };
        
      case 'historical-prices':
        return {
          ...baseConfig,
          ttl: 900, // 15 minutes
          staleWhileRevalidate: 3600, // 1 hour
          staleIfError: 7200, // 2 hours
          varyBy: ['Accept-Encoding'],
          purgeOn: ['price-correction']
        };
        
      case 'news-articles':
        return {
          ...baseConfig,
          ttl: 300, // 5 minutes
          staleWhileRevalidate: 1800, // 30 minutes
          staleIfError: 3600, // 1 hour
          varyBy: ['Accept-Encoding', 'Accept-Language'],
          purgeOn: ['news-update']
        };
        
      case 'portfolio-summary':
        return {
          ...baseConfig,
          ttl: 60, // 1 minute
          staleWhileRevalidate: 300, // 5 minutes
          staleIfError: 600, // 10 minutes
          varyBy: ['user-id', 'Accept-Encoding'],
          purgeOn: ['portfolio-update', 'trade-execution']
        };
        
      case 'market-overview':
        return {
          ...baseConfig,
          ttl: 30, // 30 seconds
          staleWhileRevalidate: 60, // 1 minute
          staleIfError: 300, // 5 minutes
          varyBy: ['Accept-Encoding'],
          purgeOn: ['market-data-update']
        };
        
      case 'search-results':
        return {
          ...baseConfig,
          ttl: 300, // 5 minutes
          staleWhileRevalidate: 1800, // 30 minutes
          staleIfError: 3600, // 1 hour
          varyBy: ['query', 'Accept-Encoding'],
          purgeOn: ['search-index-update']
        };
        
      default:
        return baseConfig;
    }
  }
  
  // Apply region-specific overrides
  applyRegionOverrides(config: CacheConfig, region: string): CacheConfig {
    switch (region) {
      case 'ap-southeast-1':
        // Higher TTLs for APAC region due to higher latency to origin
        return {
          ...config,
          ttl: Math.max(config.ttl * 1.5, config.ttl + 60),
          staleWhileRevalidate: config.staleWhileRevalidate * 1.5,
          staleIfError: config.staleIfError * 1.5
        };
        
      case 'eu-west-1':
        // Standard TTLs for EU region
        return config;
        
      case 'us-east-1':
        // Lower TTLs for US region due to proximity to primary origin
        return {
          ...config,
          ttl: Math.max(config.ttl * 0.8, config.ttl - 30),
          staleWhileRevalidate: config.staleWhileRevalidate * 0.8
        };
        
      default:
        return config;
    }
  }
}
```

### 3. Cache Invalidation Strategy

We will implement a robust cache invalidation strategy:

1. **Time-Based Invalidation**:
   - Default mechanism using appropriate TTLs for each content type
   - Stale-while-revalidate for graceful updates

2. **Event-Based Invalidation**:
   - Publish cache invalidation events to a global event bus
   - Regional cache nodes subscribe to relevant events
   - Targeted invalidation based on content type and identifiers

3. **Purge API**:
   - Secure API for manual cache purging
   - Support for wildcard and pattern-based purging
   - Regional or global purge options

```typescript
// Cache Invalidation Service
class CacheInvalidationService {
  async invalidateContent(
    contentType: string,
    identifiers: string[],
    regions: string[] = ['all']
  ): Promise<InvalidationResult> {
    // Create invalidation event
    const invalidationEvent: CacheInvalidationEvent = {
      id: generateUuid(),
      contentType,
      identifiers,
      regions: regions.includes('all') ? ['us-east-1', 'eu-west-1', 'ap-southeast-1'] : regions,
      timestamp: new Date(),
      initiator: getCurrentUser().id
    };
    
    // Publish to event bus
    await this.eventBus.publish('cache.invalidation', invalidationEvent);
    
    // For immediate invalidation, also call CDN API directly
    const cdnResults = await Promise.all(
      invalidationEvent.regions.map(region => 
        this.cdnProvider.purge(region, contentType, identifiers)
      )
    );
    
    // Log invalidation
    await this.invalidationLogger.logInvalidation(invalidationEvent, cdnResults);
    
    return {
      invalidationId: invalidationEvent.id,
      regions: invalidationEvent.regions,
      status: 'initiated',
      results: cdnResults
    };
  }
  
  async invalidateByTags(
    tags: string[],
    regions: string[] = ['all']
  ): Promise<InvalidationResult> {
    // Similar to invalidateContent but uses tags instead of content type/identifiers
    // ...
  }
  
  async invalidateAll(
    regions: string[] = ['all']
  ): Promise<InvalidationResult> {
    // Emergency purge of all cache
    // Requires elevated permissions
    // ...
  }
}
```

### 4. Cache Warming Strategy

To ensure optimal performance, especially after cache invalidations, we will implement cache warming:

1. **Proactive Cache Warming**:
   - Scheduled warming of high-priority content
   - Pre-warming before market open
   - Intelligent warming based on usage patterns

2. **Post-Invalidation Warming**:
   - Automatic warming after cache invalidation events
   - Prioritized warming based on content importance

3. **User-Triggered Warming**:
   - Predict and pre-warm content based on user navigation
   - Warm personalized content upon user login

```typescript
// Cache Warming Service
class CacheWarmingService {
  async warmCache(
    contentType: string,
    patterns: string[],
    regions: string[] = ['all']
  ): Promise<WarmingResult> {
    // Resolve regions
    const targetRegions = regions.includes('all') 
      ? ['us-east-1', 'eu-west-1', 'ap-southeast-1'] 
      : regions;
    
    // Get URLs to warm based on content type and patterns
    const urlsToWarm = await this.resolveWarmingUrls(contentType, patterns);
    
    // Warm cache in each region
    const results = await Promise.allSettled(
      targetRegions.flatMap(region =>
        urlsToWarm.map(url => this.warmUrl(url, region))
      )
    );
    
    // Analyze results
    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      byRegion: targetRegions.reduce((acc, region) => {
        acc[region] = {
          successful: results.filter(
            (r, i) => r.status === 'fulfilled' && 
            Math.floor(i / urlsToWarm.length) === targetRegions.indexOf(region)
          ).length,
          failed: results.filter(
            (r, i) => r.status === 'rejected' && 
            Math.floor(i / urlsToWarm.length) === targetRegions.indexOf(region)
          ).length
        };
        return acc;
      }, {})
    };
    
    return {
      warmingId: generateUuid(),
      contentType,
      patterns,
      regions: targetRegions,
      urlsWarmed: urlsToWarm.length,
      summary
    };
  }
  
  async scheduleWarmingJob(
    schedule: WarmingSchedule
  ): Promise<ScheduledWarmingJob> {
    // Schedule a warming job
    const job = {
      id: generateUuid(),
      schedule,
      status: 'scheduled',
      nextRun: this.calculateNextRun(schedule.cronExpression),
      createdAt: new Date(),
      createdBy: getCurrentUser().id
    };
    
    // Save job
    await this.warmingJobRepository.save(job);
    
    // Schedule job in task scheduler
    await this.taskScheduler.schedule(
      `cache-warming-${job.id}`,
      schedule.cronExpression,
      {
        contentType: schedule.contentType,
        patterns: schedule.patterns,
        regions: schedule.regions
      }
    );
    
    return job;
  }
  
  private async warmUrl(url: string, region: string): Promise<WarmingResponse> {
    try {
      // Make request to edge node in specific region
      const response = await this.httpClient.get(url, {
        headers: {
          'X-Cache-Warm': '1',
          'X-Region': region
        },
        timeout: 5000 // 5 second timeout for warming requests
      });
      
      return {
        url,
        region,
        status: response.status,
        cacheStatus: response.headers['x-cache'] || 'unknown',
        timeToFirstByte: response.timings.firstByte
      };
    } catch (error) {
      throw new Error(`Failed to warm ${url} in ${region}: ${error.message}`);
    }
  }
}
```

## CDN Integration

### 1. Multi-Region CDN Architecture

We will implement a comprehensive CDN strategy using AWS CloudFront with regional edge caches:

```terraform
# CloudFront Distribution with Regional Edge Caches
resource "aws_cloudfront_distribution" "hedge_fund_platform" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Hedge Fund Trading Platform CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_All" # All edge locations for global coverage
  
  # Static assets origin
  origin {
    domain_name = "assets.${var.domain_name}"
    origin_id   = "S3-assets"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets_oai.cloudfront_access_identity_path
    }
  }
  
  # API origin
  origin {
    domain_name = "api.${var.domain_name}"
    origin_id   = "API-origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      
      # Origin shield in US-East-1 as central region
      origin_shield {
        enabled              = true
        origin_shield_region = "us-east-1"
      }
    }
  }
  
  # Default behavior for static assets
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-assets"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true
    
    # Lambda@Edge for optimizing content delivery
    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = aws_lambda_function.cdn_router.qualified_arn
      include_body = false
    }
  }
  
  # API cache behavior
  ordered_cache_behavior {
    path_pattern     = "/api/cacheable/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "API-origin"
    
    forwarded_values {
      query_string = true
      cookies {
        forward = "whitelist"
        whitelisted_names = ["session-region"]
      }
      headers = [
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Accept",
        "Accept-Language",
        "Accept-Encoding"
      ]
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 300  # 5 minutes
    max_ttl                = 3600 # 1 hour
    compress               = true
    
    # Lambda@Edge for cache key normalization
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.cache_key_normalizer.qualified_arn
      include_body = false
    }
  }
  
  # Non-cached API behavior
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "API-origin"
    
    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
      headers = ["*"]
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }
  
  # Geo restrictions - none, we want global access
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  # SSL certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  # Custom error responses
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }
  
  # Tags
  tags = {
    Name        = "hedge-fund-platform-cdn"
    Environment = var.environment
  }
}
```

### 2. Dynamic Content Caching Rules

We will implement sophisticated caching rules for dynamic content:

```typescript
// Lambda@Edge function for cache key normalization
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  
  // Extract path and query parameters
  const uri = request.uri;
  const queryParams = request.querystring ? 
    new URLSearchParams(request.querystring) : 
    new URLSearchParams();
  
  // Normalize cache key based on content type
  if (uri.startsWith('/api/cacheable/market-data')) {
    // For market data, include only relevant query parameters
    const relevantParams = ['symbol', 'resolution', 'from', 'to'];
    const normalizedParams = new URLSearchParams();
    
    for (const param of relevantParams) {
      if (queryParams.has(param)) {
        normalizedParams.append(param, queryParams.get(param));
      }
    }
    
    // Round timestamp parameters to nearest caching interval
    if (normalizedParams.has('from')) {
      const from = parseInt(normalizedParams.get('from'));
      normalizedParams.set('from', (Math.floor(from / 300) * 300).toString());
    }
    
    if (normalizedParams.has('to')) {
      const to = parseInt(normalizedParams.get('to'));
      normalizedParams.set('to', (Math.floor(to / 300) * 300).toString());
    }
    
    // Update query string with normalized parameters
    request.querystring = normalizedParams.toString();
    
    // Remove user-specific headers from cache key
    const headersToRemove = ['authorization', 'x-user-id', 'x-session-id'];
    for (const header of headersToRemove) {
      delete headers[header];
    }
  } else if (uri.startsWith('/api/cacheable/reference-data')) {
    // For reference data, include language but remove other params
    const normalizedParams = new URLSearchParams();
    
    if (queryParams.has('language')) {
      normalizedParams.append('language', queryParams.get('language'));
    }
    
    request.querystring = normalizedParams.toString();
  } else if (uri.startsWith('/api/cacheable/news')) {
    // For news, include category, language, and page
    const relevantParams = ['category', 'language', 'page', 'pageSize'];
    const normalizedParams = new URLSearchParams();
    
    for (const param of relevantParams) {
      if (queryParams.has(param)) {
        normalizedParams.append(param, queryParams.get(param));
      }
    }
    
    request.querystring = normalizedParams.toString();
  }
  
  return request;
};
```

### 3. Cache Purging Mechanisms

We will implement efficient cache purging mechanisms:

```typescript
// CDN Cache Purging Service
class CDNCachePurgingService {
  async purgeContent(
    contentType: string,
    patterns: string[],
    regions: string[] = ['all']
  ): Promise<PurgeResult> {
    // Convert content type and patterns to CDN paths
    const paths = await this.resolvePathsForPurge(contentType, patterns);
    
    // Determine which CDN distribution to use based on regions
    const distributions = this.getDistributionsForRegions(regions);
    
    // Create invalidation for each distribution
    const invalidations = await Promise.all(
      distributions.map(distribution =>
        this.createInvalidation(distribution, paths)
      )
    );
    
    // Log purge operation
    await this.purgingLogger.logPurge({
      contentType,
      patterns,
      regions,
      paths,
      invalidations,
      timestamp: new Date(),
      initiator: getCurrentUser().id
    });
    
    return {
      purgeId: generateUuid(),
      contentType,
      patterns,
      regions,
      invalidations: invalidations.map(inv => ({
        distributionId: inv.distributionId,
        invalidationId: inv.id,
        status: inv.status
      }))
    };
  }
  
  private async createInvalidation(
    distribution: string,
    paths: string[]
  ): Promise<AWS.CloudFront.CreateInvalidationResult> {
    // Create CloudFront invalidation
    const params = {
      DistributionId: distribution,
      InvalidationBatch: {
        CallerReference: `purge-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    };
    
    return await this.cloudFront.createInvalidation(params).promise();
  }
  
  private async resolvePathsForPurge(
    contentType: string,
    patterns: string[]
  ): Promise<string[]> {
    // Convert content type and patterns to CDN paths
    switch (contentType) {
      case 'static-assets':
        return patterns.map(pattern => `/assets/${pattern}`);
        
      case 'market-data':
        return patterns.map(pattern => `/api/cacheable/market-data/${pattern}`);
        
      case 'reference-data':
        return patterns.map(pattern => `/api/cacheable/reference-data/${pattern}`);
        
      case 'news':
        return patterns.map(pattern => `/api/cacheable/news/${pattern}`);
        
      case 'all':
        return ['/*'];
        
      default:
        return patterns.map(pattern => `/${pattern}`);
    }
  }
}
```

## Regional API Endpoints

### 1. Regional API Gateway Deployments

We will deploy API Gateways in each region with consistent configurations:

```yaml
# API Gateway Regional Deployment
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: regional-api-gateway
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "alb"
    alb.ingress.kubernetes.io/scheme: "internet-facing"
    alb.ingress.kubernetes.io/target-type: "ip"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/certificate-arn: "${SSL_CERT_ARN}"
    alb.ingress.kubernetes.io/healthcheck-path: "/api/health"
    alb.ingress.kubernetes.io/success-codes: "200"
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "2"
    alb.ingress.kubernetes.io/load-balancer-attributes: "idle_timeout.timeout_seconds=60"
spec:
  rules:
  - host: "api-${REGION_CODE}.${DOMAIN_NAME}"
    http:
      paths:
      - path: /api/market
        pathType: Prefix
        backend:
          service:
            name: market-data-service
            port:
              number: 80
      - path: /api/portfolio
        pathType: Prefix
        backend:
          service:
            name: portfolio-service
            port:
              number: 80
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 80
      - path: /api/predictions
        pathType: Prefix
        backend:
          service:
            name: ml-predictions-service
            port:
              number: 80
      - path: /api/risk-management
        pathType: Prefix
        backend:
          service:
            name: risk-management-service
            port:
              number: 80
      - path: /api/alternative-data
        pathType: Prefix
        backend:
          service:
            name: alternative-data-service
            port:
              number: 80
      - path: /api/health
        pathType: Exact
        backend:
          service:
            name: health-check-service
            port:
              number: 80
```

### 2. Request Routing Based on User Location

We will implement intelligent request routing based on user location:

```typescript
// Global Router Service
class GlobalRouterService {
  async determineOptimalRegion(
    request: RouterRequest
  ): Promise<RouterResponse> {
    // Extract client information
    const clientIP = request.ip;
    const userRegion = request.headers['x-user-region'];
    const userPreference = request.headers['x-preferred-region'];
    
    // Get geolocation data for client IP
    const geoData = await this.geoIPService.lookup(clientIP);
    
    // Check if user has a home region set (for data residency)
    let homeRegion = null;
    if (request.user) {
      const userData = await this.userService.getUserDataResidency(request.user.id);
      homeRegion = userData.homeRegion;
    }
    
    // Determine optimal region based on multiple factors
    let optimalRegion;
    
    // 1. If request requires data residency, use home region
    if (request.requiresDataResidency && homeRegion) {
      optimalRegion = homeRegion;
    }
    // 2. If user has explicit preference, use that
    else if (userPreference && this.isValidRegion(userPreference)) {
      optimalRegion = userPreference;
    }
    // 3. If user region is set in session, use that
    else if (userRegion && this.isValidRegion(userRegion)) {
      optimalRegion = userRegion;
    }
    // 4. Otherwise, determine based on geolocation
    else {
      optimalRegion = this.mapGeoToRegion(geoData);
    }
    
    // Check if optimal region is healthy
    const isHealthy = await this.healthCheckService.isRegionHealthy(optimalRegion);
    
    // If not healthy, fallback to next best region
    if (!isHealthy) {
      optimalRegion = await this.determineFallbackRegion(optimalRegion);
    }
    
    // Get endpoint for the optimal region
    const endpoint = this.getRegionalEndpoint(optimalRegion);
    
    return {
      region: optimalRegion,
      endpoint,
      ttl: 300, // Cache this decision for 5 minutes
      factors: {
        geoLocation: geoData.country,
        userPreference: !!userPreference,
        dataResidency: !!homeRegion && request.requiresDataResidency,
        healthStatus: isHealthy ? 'primary' : 'fallback'
      }
    };
  }
  
  private mapGeoToRegion(geoData: GeoIPData): string {
    // Map countries/continents to closest region
    const regionMappings = {
      // North America
      'US': 'us-east-1',
      'CA': 'us-east-1',
      'MX': 'us-east-1',
      
      // Europe
      'GB': 'eu-west-1',
      'DE': 'eu-west-1',
      'FR': 'eu-west-1',
      'IT': 'eu-west-1',
      'ES': 'eu-west-1',
      // ... other European countries
      
      // Asia Pacific
      'SG': 'ap-southeast-1',
      'JP': 'ap-southeast-1',
      'AU': 'ap-southeast-1',
      'IN': 'ap-southeast-1',
      // ... other APAC countries
    };
    
    // Get region for country, or default to closest continent
    const region = regionMappings[geoData.country] || this.getContinentDefaultRegion(geoData.continent);
    
    return region;
  }
  
  private getContinentDefaultRegion(continent: string): string {
    const continentDefaults = {
      'NA': 'us-east-1',   // North America
      'SA': 'us-east-1',   // South America
      'EU': 'eu-west-1',   // Europe
      'AF': 'eu-west-1',   // Africa
      'AS': 'ap-southeast-1', // Asia
      'OC': 'ap-southeast-1'  // Oceania
    };
    
    return continentDefaults[continent] || 'us-east-1'; // Default to US East
  }
  
  private async determineFallbackRegion(primaryRegion: string): Promise<string> {
    // Define fallback order
    const fallbackMap = {
      'us-east-1': ['eu-west-1', 'ap-southeast-1'],
      'eu-west-1': ['us-east-1', 'ap-southeast-1'],
      'ap-southeast-1': ['us-east-1', 'eu-west-1']
    };
    
    // Try each fallback region in order until finding a healthy one
    for (const region of fallbackMap[primaryRegion]) {
      if (await this.healthCheckService.isRegionHealthy(region)) {
        return region;
      }
    }
    
    // If all regions are unhealthy, return primary (better to try than nothing)
    return primaryRegion;
  }
}
```

### 3. Regional Health Checks and Failover

We will implement comprehensive health checks and automatic failover:

```typescript
// Regional Health Check Service
class RegionalHealthCheckService {
  async checkRegionHealth(region: string): Promise<RegionHealthStatus> {
    // Check multiple components in the region
    const [apiStatus, dbStatus, cacheStatus] = await Promise.all([
      this.checkAPIHealth(region),
      this.checkDatabaseHealth(region),
      this.checkCacheHealth(region)
    ]);
    
    // Calculate overall health score (0-100)
    const healthScore = this.calculateHealthScore(apiStatus, dbStatus, cacheStatus);
    
    // Determine status based on health score
    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    if (healthScore >= 80) {
      status = 'HEALTHY';
    } else if (healthScore >= 50) {
      status = 'DEGRADED';
    } else {
      status = 'UNHEALTHY';
    }
    
    // Get current traffic allocation
    const trafficAllocation = await this.trafficManager.getRegionAllocation(region);
    
    return {
      region,
      status,
      healthScore,
      components: {
        api: apiStatus,
        database: dbStatus,
        cache: cacheStatus
      },
      trafficAllocation,
      lastChecked: new Date(),
      latencyStats: await this.getRegionLatencyStats(region)
    };
  }
  
  async isRegionHealthy(region: string): Promise<boolean> {
    // Get cached health status first
    const cachedStatus = await this.cache.get(`region-health:${region}`);
    if (cachedStatus) {
      return cachedStatus.status !== 'UNHEALTHY';
    }
    
    // If not cached, do a quick check
    try {
      const response = await this.httpClient.get(
        `https://api-${this.getRegionCode(region)}.${this.config.domain}/api/health`,
        { timeout: 2000 }
      );
      
      const isHealthy = response.status === 200 && response.data.status === 'healthy';
      
      // Cache result briefly
      await this.cache.set(`region-health:${region}`, {
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        lastChecked: new Date()
      }, 60); // Cache for 60 seconds
      
      return isHealthy;
    } catch (error) {
      // Cache negative result
      await this.cache.set(`region-health:${region}`, {
        status: 'UNHEALTHY',
        lastChecked: new Date(),
        error: error.message
      }, 30); // Cache for 30 seconds
      
      return false;
    }
  }
  
  async initiateFailover(
    fromRegion: string,
    toRegion: string,
    reason: string
  ): Promise<FailoverResult> {
    // Log failover initiation
    await this.eventLogger.logEvent('FAILOVER_INITIATED', {
      fromRegion,
      toRegion,
      reason,
      timestamp: new Date(),
      initiator: 'health-check-service'
    });
    
    // Update traffic allocation
    const trafficUpdate = await this.trafficManager.updateTrafficAllocation({
      [fromRegion]: 0,    // Remove traffic from unhealthy region
      [toRegion]: 100     // Direct all traffic to healthy region
    });
    
    // Update DNS if needed
    if (this.config.updateDNSOnFailover) {
      await this.dnsManager.updateRegionalEndpoints({
        [this.getRegionCode(fromRegion)]: {
          active: false,
          target: this.getRegionCode(toRegion)
        },
        [this.getRegionCode(toRegion)]: {
          active: true
        }
      });
    }
    
    // Notify operations team
    await this.notificationService.sendAlert('REGION_FAILOVER', {
      fromRegion,
      toRegion,
      reason,
      timestamp: new Date()
    });
    
    return {
      id: generateUuid(),
      fromRegion,
      toRegion,
      timestamp: new Date(),
      reason,
      trafficUpdate,
      status: 'COMPLETED'
    };
  }
}
```

## Latency-Based Routing

### 1. Real-time Latency Monitoring

We will implement comprehensive latency monitoring:

```typescript
// Latency Monitoring Service
class LatencyMonitoringService {
  async collectLatencyMetrics(): Promise<void> {
    // Get all active regions
    const regions = this.config.activeRegions;
    
    // Collect metrics from each region
    for (const region of regions) {
      await this.collectRegionMetrics(region);
    }
    
    // Update global latency map
    await this.updateGlobalLatencyMap();
  }
  
  private async collectRegionMetrics(region: string): Promise<RegionMetrics> {
    // Collect API latency metrics
    const apiLatency = await this.measureAPILatency(region);
    
    // Collect database metrics
    const dbMetrics = await this.getDatabaseMetrics(region);
    
    // Collect cache metrics
    const cacheMetrics = await this.getCacheMetrics(region);
    
    // Collect network metrics
    const networkMetrics = await this.getNetworkMetrics(region);
    
    // Combine all metrics
    const metrics: RegionMetrics = {
      region,
      timestamp: new Date(),
      api: apiLatency,
      database: dbMetrics,
      cache: cacheMetrics,
      network: networkMetrics,
      overall: this.calculateOverallLatency(apiLatency, dbMetrics, cacheMetrics, networkMetrics)
    };
    
    // Store metrics
    await this.metricsRepository.storeRegionMetrics(metrics);
    
    return metrics;
  }
  
  private async measureAPILatency(region: string): Promise<APILatencyMetrics> {
    // Define API endpoints to test
    const endpoints = [
      '/api/health',
      '/api/market/overview',
      '/api/reference-data/exchanges'
    ];
    
    // Measure latency for each endpoint
    const results = await Promise.all(
      endpoints.map(endpoint => this.measureEndpointLatency(region, endpoint))
    );
    
    // Calculate aggregate metrics
    const p50 = this.calculatePercentile(results.map(r => r.latency), 50);
    const p90 = this.calculatePercentile(results.map(r => r.latency), 90);
    const p99 = this.calculatePercentile(results.map(r => r.latency), 99);
    
    return {
      p50,
      p90,
      p99,
      min: Math.min(...results.map(r => r.latency)),
      max: Math.max(...results.map(r => r.latency)),
      endpoints: results.reduce((acc, result) => {
        acc[result.endpoint] = result.latency;
        return acc;
      }, {})
    };
  }
  
  private async measureEndpointLatency(
    region: string,
    endpoint: string
  ): Promise<EndpointLatencyResult> {
    const startTime = performance.now();
    
    try {
      // Make request to endpoint in specific region
      const response = await this.httpClient.get(
        `https://api-${this.getRegionCode(region)}.${this.config.domain}${endpoint}`,
        {
          timeout: 5000,
          headers: {
            'X-Latency-Check': '1'
          }
        }
      );
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      return {
        endpoint,
        latency,
        status: response.status,
        success: true
      };
    } catch (error) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      return {
        endpoint,
        latency,
        status: error.response?.status || 0,
        success: false,
        error: error.message
      };
    }
  }
  
  async updateGlobalLatencyMap(): Promise<GlobalLatencyMap> {
    // Get latest metrics for all regions
    const regions = this.config.activeRegions;
    const latestMetrics = await Promise.all(
      regions.map(region => this.metricsRepository.getLatestRegionMetrics(region))
    );
    
    // Create latency map between regions
    const latencyMap: Record<string, Record<string, number>> = {};
    
    for (const sourceRegion of regions) {
      latencyMap[sourceRegion] = {};
      
      for (const targetRegion of regions) {
        if (sourceRegion === targetRegion) {
          // Latency within same region
          const metrics = latestMetrics.find(m => m.region === sourceRegion);
          latencyMap[sourceRegion][targetRegion] = metrics ? metrics.overall.p50 : 0;
        } else {
          // Latency between regions - use network metrics
          const metrics = latestMetrics.find(m => m.region === sourceRegion);
          const networkLatency = metrics?.network.regionLatency[targetRegion] || 100;
          latencyMap[sourceRegion][targetRegion] = networkLatency;
        }
      }
    }
    
    // Store global latency map
    const globalMap: GlobalLatencyMap = {
      timestamp: new Date(),
      latencyMap,
      regionMetrics: latestMetrics.reduce((acc, metrics) => {
        acc[metrics.region] = {
          overall: metrics.overall,
          api: metrics.api
        };
        return acc;
      }, {})
    };
    
    await this.metricsRepository.storeGlobalLatencyMap(globalMap);
    
    return globalMap;
  }
}
```

### 2. Dynamic Routing Algorithms

We will implement sophisticated dynamic routing algorithms:

```typescript
// Dynamic Routing Service
class DynamicRoutingService {
  async determineOptimalRoute(
    request: RoutingRequest
  ): Promise<RoutingDecision> {
    // Get client information
    const clientIP = request.clientIP;
    const userRegion = request.userRegion;
    const userPreference = request.userPreference;
    
    // Get geolocation data for client IP
    const geoData = await this.geoIPService.lookup(clientIP);
    
    // Get latest global latency map
    const latencyMap = await this.latencyMonitoringService.getLatestGlobalLatencyMap();
    
    // Get region health status
    const regionHealth = await this.healthCheckService.getAllRegionsHealth();
    
    // Filter out unhealthy regions
    const healthyRegions = Object.keys(regionHealth)
      .filter(region => regionHealth[region].status !== 'UNHEALTHY');
    
    if (healthyRegions.length === 0) {
      // All regions unhealthy, use primary region as fallback
      return {
        region: this.config.primaryRegion,
        endpoint: this.getRegionalEndpoint(this.config.primaryRegion),
        routingStrategy: 'FALLBACK',
        factors: {
          allRegionsUnhealthy: true
        }
      };
    }
    
    // Determine client's closest region based on geolocation
    const geoRegion = this.mapGeoToRegion(geoData);
    
    // Calculate latency-based scores for each healthy region
    const regionScores = healthyRegions.map(region => {
      // Start with base score
      let score = 100;
      
      // Adjust based on latency from client's geo region
      const latency = latencyMap.latencyMap[geoRegion][region] || 100;
      score -= (latency / 10); // Reduce score as latency increases
      
      // Adjust based on region health score
      score += (regionHealth[region].healthScore - 80) / 2;
      
      // Adjust based on current load
      const load = regionHealth[region].components.api.currentLoad || 50;
      score -= (load - 50) / 5; // Reduce score as load increases above 50%
      
      // Prefer user's home region for data residency
      if (region === userRegion) {
        score += 20;
      }
      
      // Respect user preference if specified
      if (region === userPreference) {
        score += 30;
      }
      
      return {
        region,
        score,
        latency,
        healthScore: regionHealth[region].healthScore,
        load
      };
    });
    
    // Sort by score (highest first)
    regionScores.sort((a, b) => b.score - a.score);
    
    // Select the highest scoring region
    const selectedRegion = regionScores[0].region;
    
    return {
      region: selectedRegion,
      endpoint: this.getRegionalEndpoint(selectedRegion),
      routingStrategy: 'LATENCY_OPTIMIZED',
      factors: {
        geoRegion,
        latency: regionScores[0].latency,
        healthScore: regionScores[0].healthScore,
        load: regionScores[0].load,
        userRegionMatch: selectedRegion === userRegion,
        userPreferenceMatch: selectedRegion === userPreference
      },
      alternativeRegions: regionScores.slice(1, 3).map(rs => ({
        region: rs.region,
        score: rs.score
      }))
    };
  }
  
  async updateRoutingPolicy(
    policy: RoutingPolicy
  ): Promise<void> {
    // Validate policy
    this.validateRoutingPolicy(policy);
    
    // Store policy
    await this.policyRepository.storeRoutingPolicy(policy);
    
    // Apply policy to routing service
    this.applyRoutingPolicy(policy);
    
    // Log policy update
    await this.eventLogger.logEvent('ROUTING_POLICY_UPDATED', {
      policy,
      timestamp: new Date(),
      updatedBy: getCurrentUser().id
    });
  }
  
  private applyRoutingPolicy(policy: RoutingPolicy): void {
    // Update routing weights
    if (policy.regionWeights) {
      this.routingWeights = { ...policy.regionWeights };
    }
    
    // Update latency thresholds
    if (policy.latencyThresholds) {
      this.latencyThresholds = { ...policy.latencyThresholds };
    }
    
    // Update routing strategy
    if (policy.strategy) {
      this.routingStrategy = policy.strategy;
    }
    
    // Update failover settings
    if (policy.failover) {
      this.failoverSettings = { ...policy.failover };
    }
  }
}
```

### 3. A/B Testing for Routing Strategies

We will implement A/B testing for routing strategies:

```typescript
// Routing Strategy A/B Testing Service
class RoutingStrategyTestingService {
  async assignTestGroup(
    userId: string,
    clientIP: string
  ): Promise<TestAssignment> {
    // Check if user is already assigned to a test group
    const existingAssignment = await this.testRepository.getUserAssignment(userId);
    if (existingAssignment) {
      return existingAssignment;
    }
    
    // Get active routing strategy tests
    const activeTests = await this.testRepository.getActiveTests();
    
    if (activeTests.length === 0) {
      // No active tests, assign to default strategy
      return {
        userId,
        testId: null,
        group: 'default',
        strategy: 'LATENCY_OPTIMIZED',
        assignedAt: new Date()
      };
    }
    
    // Select a test to assign user to
    const selectedTest = this.selectTestForUser(activeTests, userId, clientIP);
    
    // Determine which test group to assign
    const group = this.determineTestGroup(selectedTest, userId);
    
    // Get strategy for the assigned group
    const strategy = selectedTest.groups[group].strategy;
    
    // Create assignment
    const assignment: TestAssignment = {
      userId,
      testId: selectedTest.id,
      group,
      strategy,
      assignedAt: new Date()
    };
    
    // Store assignment
    await this.testRepository.storeUserAssignment(assignment);
    
    // Log assignment
    await this.eventLogger.logEvent('TEST_GROUP_ASSIGNMENT', {
      userId,
      testId: selectedTest.id,
      group,
      strategy,
      timestamp: new Date()
    });
    
    return assignment;
  }
  
  async getRoutingStrategy(
    userId: string,
    clientIP: string
  ): Promise<RoutingStrategy> {
    // Get user's test assignment
    const assignment = await this.assignTestGroup(userId, clientIP);
    
    // Get strategy configuration
    const strategyConfig = await this.getStrategyConfig(assignment.strategy);
    
    return {
      name: assignment.strategy,
      config: strategyConfig,
      testId: assignment.testId,
      testGroup: assignment.group
    };
  }
  
  async recordRoutingResult(
    userId: string,
    result: RoutingResult
  ): Promise<void> {
    // Get user's test assignment
    const assignment = await this.testRepository.getUserAssignment(userId);
    
    if (!assignment || !assignment.testId) {
      // User not in a test, just log the result
      await this.metricsRepository.storeRoutingResult(result);
      return;
    }
    
    // Record result with test information
    await this.metricsRepository.storeRoutingResult({
      ...result,
      testId: assignment.testId,
      testGroup: assignment.group
    });
    
    // Update test metrics
    await this.updateTestMetrics(assignment.testId, assignment.group, result);
  }
  
  private async updateTestMetrics(
    testId: string,
    group: string,
    result: RoutingResult
  ): Promise<void> {
    // Update latency metrics
    await this.metricsRepository.updateTestLatencyMetrics(
      testId,
      group,
      result.latency
    );
    
    // Update success rate metrics
    await this.metricsRepository.updateTestSuccessMetrics(
      testId,
      group,
      result.success
    );
    
    // Update region selection metrics
    await this.metricsRepository.updateTestRegionSelectionMetrics(
      testId,
      group,
      result.selectedRegion
    );
  }
}
```

## Implementation Phases

### Phase 1: Edge Caching Implementation
- Identify cacheable content and configure caching rules
- Set up cache invalidation mechanisms
- Implement cache warming strategies
- Create monitoring for cache hit rates

### Phase 2: CDN Integration
- Set up CloudFront distribution with regional edge caches
- Configure dynamic content caching rules
- Implement cache purging mechanisms
- Create CDN performance monitoring

### Phase 3: Regional API Endpoints
- Deploy API Gateways in each region
- Implement request routing based on user location
- Set up health checks and failover mechanisms
- Create regional API documentation

### Phase 4: Latency-Based Routing
- Implement real-time latency monitoring
- Develop dynamic routing algorithms
- Set up A/B testing for routing strategies
- Create latency dashboards and alerts

### Phase 5: Validation and Optimization
- Conduct global latency testing
- Optimize routing algorithms based on real-world data
- Fine-tune caching strategies
- Create performance reports by region