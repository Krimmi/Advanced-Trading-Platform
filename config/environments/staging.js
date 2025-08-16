/**
 * Staging Environment Configuration
 * 
 * This file contains configuration settings specific to the staging environment.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: [
        'https://staging.hedgefund.example.com',
        'https://api-staging.hedgefund.example.com'
      ],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500 // limit each IP to 500 requests per windowMs
    }
  },
  
  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/hedge_fund_staging',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        replicaSet: process.env.MONGODB_REPLICA_SET,
        ssl: true,
        authSource: 'admin'
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: 0,
      keyPrefix: 'hedge_fund_staging:',
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  
  // API Services configuration
  apiServices: {
    alpaca: {
      baseUrl: 'https://paper-api.alpaca.markets',
      dataBaseUrl: 'https://data.alpaca.markets',
      keyId: process.env.ALPACA_KEY_ID || '',
      secretKey: process.env.ALPACA_SECRET_KEY || '',
      paper: true,
      rateLimit: {
        maxRequests: 200,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      }
    },
    iexCloud: {
      baseUrl: 'https://cloud.iexapis.com',
      publicToken: process.env.IEX_PUBLIC_TOKEN || '',
      secretToken: process.env.IEX_SECRET_TOKEN || '',
      rateLimit: {
        maxRequests: 100,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      }
    },
    polygon: {
      baseUrl: 'https://api.polygon.io',
      apiKey: process.env.POLYGON_API_KEY || '',
      rateLimit: {
        maxRequests: 120,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      }
    },
    fmp: {
      baseUrl: 'https://financialmodelingprep.com/api',
      apiKey: process.env.FMP_API_KEY || '',
      rateLimit: {
        maxRequests: 300,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      }
    }
  },
  
  // Authentication configuration
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: '12h',
      refreshExpiresIn: '7d'
    },
    session: {
      secret: process.env.SESSION_SECRET || '',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
      }
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    enableConsole: true,
    enableFile: true,
    filePath: './logs/staging.log',
    maxSize: '20m',
    maxFiles: '14d'
  },
  
  // Caching configuration
  cache: {
    defaultTTL: 300, // 5 minutes
    quoteTTL: 10, // 10 seconds
    barsTTL: 300, // 5 minutes
    fundamentalsTTL: 86400, // 1 day
    technicalIndicatorsTTL: 3600, // 1 hour
    newsTTL: 1800 // 30 minutes
  },
  
  // WebSocket configuration
  webSocket: {
    enabled: true,
    reconnectInterval: 5000,
    reconnectAttempts: 20,
    pingInterval: 30000,
    pongTimeout: 5000
  },
  
  // Feature flags
  featureFlags: {
    enableRealTimeData: true,
    enableAlgorithmicTrading: true,
    enableRiskManagement: true,
    enablePortfolioOptimization: true,
    enableMachineLearning: true,
    enableAdvancedCharts: true,
    enableBacktesting: true,
    enablePaperTrading: true,
    enableLiveTrading: false
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: true,
    metricsInterval: 30000, // 30 seconds
    healthCheckInterval: 15000, // 15 seconds
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment: 'staging',
      tracesSampleRate: 0.5
    },
    prometheus: {
      enabled: true,
      port: 9090
    }
  },
  
  // Deployment configuration
  deployment: {
    s3Bucket: process.env.STAGING_S3_BUCKET || 'hedge-fund-staging',
    cloudFrontId: process.env.STAGING_CLOUDFRONT_ID || '',
    domain: process.env.STAGING_DOMAIN || 'staging.hedgefund.example.com',
    backupBucket: process.env.STAGING_BACKUP_BUCKET || 'hedge-fund-staging-backups'
  },
  
  // Rollback configuration
  rollback: {
    enabled: true,
    maxBackups: 10,
    backupDirectory: './backups/staging'
  }
};