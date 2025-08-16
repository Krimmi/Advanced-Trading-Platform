/**
 * Production Environment Configuration
 * 
 * This file contains configuration settings specific to the production environment.
 * IMPORTANT: Sensitive values should be loaded from environment variables, not hardcoded.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: [
        'https://hedgefund.example.com',
        'https://api.hedgefund.example.com',
        'https://app.hedgefund.example.com'
      ],
      credentials: true
    },
    rateLimit: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 300 // limit each IP to 300 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdn.datatables.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
          connectSrc: ["'self'", 'api.hedgefund.example.com', 'wss://ws.hedgefund.example.com']
        }
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    }
  },
  
  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        replicaSet: process.env.MONGODB_REPLICA_SET,
        ssl: true,
        authSource: 'admin',
        retryWrites: true,
        w: 'majority'
      }
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'hedge_fund_prod:',
      tls: {
        rejectUnauthorized: true,
        ca: process.env.REDIS_CA_CERT
      },
      cluster: {
        enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
        nodes: process.env.REDIS_CLUSTER_NODES ? 
          process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) };
          }) : []
      }
    }
  },
  
  // API Services configuration
  apiServices: {
    alpaca: {
      baseUrl: 'https://api.alpaca.markets',
      dataBaseUrl: 'https://data.alpaca.markets',
      keyId: process.env.ALPACA_KEY_ID,
      secretKey: process.env.ALPACA_SECRET_KEY,
      paper: process.env.ALPACA_PAPER_TRADING === 'true',
      rateLimit: {
        maxRequests: 200,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      },
      retryConfig: {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2
      }
    },
    iexCloud: {
      baseUrl: 'https://cloud.iexapis.com',
      publicToken: process.env.IEX_PUBLIC_TOKEN,
      secretToken: process.env.IEX_SECRET_TOKEN,
      rateLimit: {
        maxRequests: 100,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      },
      retryConfig: {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2
      }
    },
    polygon: {
      baseUrl: 'https://api.polygon.io',
      apiKey: process.env.POLYGON_API_KEY,
      rateLimit: {
        maxRequests: 120,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      },
      retryConfig: {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2
      }
    },
    fmp: {
      baseUrl: 'https://financialmodelingprep.com/api',
      apiKey: process.env.FMP_API_KEY,
      rateLimit: {
        maxRequests: 300,
        perMinute: 60
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000
      },
      retryConfig: {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2
      }
    }
  },
  
  // Authentication configuration
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '8h',
      refreshExpiresIn: '7d',
      algorithm: 'HS512'
    },
    session: {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        sameSite: 'strict'
      },
      store: {
        type: 'redis',
        ttl: 86400 // 1 day
      }
    },
    mfa: {
      enabled: true,
      issuer: 'HedgeFund Trading App',
      window: 1
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    enableConsole: false,
    enableFile: true,
    filePath: './logs/production.log',
    maxSize: '50m',
    maxFiles: '30d',
    cloudWatch: {
      enabled: true,
      logGroupName: '/hedge-fund/production',
      logStreamName: `app-${process.env.NODE_ENV}-${process.env.HOSTNAME || 'unknown'}`
    }
  },
  
  // Caching configuration
  cache: {
    defaultTTL: 300, // 5 minutes
    quoteTTL: 10, // 10 seconds
    barsTTL: 300, // 5 minutes
    fundamentalsTTL: 86400, // 1 day
    technicalIndicatorsTTL: 3600, // 1 hour
    newsTTL: 1800, // 30 minutes
    tieredCache: {
      enabled: true,
      levels: [
        { type: 'memory', maxSize: '500mb', ttl: 60 }, // 1 minute
        { type: 'redis', ttl: 300 } // 5 minutes
      ]
    }
  },
  
  // WebSocket configuration
  webSocket: {
    enabled: true,
    reconnectInterval: 2000,
    reconnectAttempts: 50,
    pingInterval: 30000,
    pongTimeout: 5000,
    clustering: {
      enabled: true,
      redisAdapter: true
    }
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
    enableLiveTrading: process.env.ENABLE_LIVE_TRADING === 'true'
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: true,
    metricsInterval: 15000, // 15 seconds
    healthCheckInterval: 10000, // 10 seconds
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.2,
      attachStacktrace: true
    },
    prometheus: {
      enabled: true,
      port: 9090
    },
    datadog: {
      enabled: process.env.DATADOG_ENABLED === 'true',
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY
    },
    newRelic: {
      enabled: process.env.NEW_RELIC_ENABLED === 'true',
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: 'Hedge Fund Trading App'
    }
  },
  
  // Deployment configuration
  deployment: {
    s3Bucket: process.env.PROD_S3_BUCKET,
    cloudFrontId: process.env.PROD_CLOUDFRONT_ID,
    domain: process.env.PROD_DOMAIN || 'hedgefund.example.com',
    backupBucket: process.env.PROD_BACKUP_BUCKET,
    route53: {
      hostedZoneId: process.env.ROUTE53_HOSTED_ZONE_ID,
      recordSetName: process.env.ROUTE53_RECORD_SET_NAME
    }
  },
  
  // Rollback configuration
  rollback: {
    enabled: true,
    maxBackups: 20,
    backupDirectory: './backups/production',
    autoRollbackOnFailure: true,
    healthCheckBeforeCommit: true,
    notifyOnRollback: true,
    slackWebhook: process.env.ROLLBACK_SLACK_WEBHOOK
  },
  
  // Security configuration
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      key: process.env.ENCRYPTION_KEY
    },
    rateLimit: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 failed attempts
        message: 'Too many failed login attempts, please try again later'
      },
      api: {
        windowMs: 60 * 1000, // 1 minute
        max: 120 // 120 requests per minute
      }
    },
    ddosProtection: {
      enabled: true,
      rateLimit: 500, // requests per minute
      burst: 50, // burst size
      maxExpiry: 60 // seconds
    }
  }
};