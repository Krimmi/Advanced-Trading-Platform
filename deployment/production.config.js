/**
 * Production Environment Configuration
 * Hedge Fund Trading Application
 */

module.exports = {
  // Application settings
  app: {
    name: 'Hedge Fund Trading Platform',
    version: '1.0.0',
    environment: 'production',
    baseUrl: 'https://trading.example.com',
    apiUrl: 'https://api.trading.example.com',
    wsUrl: 'wss://ws.trading.example.com',
  },

  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    cors: {
      origin: ['https://trading.example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    compression: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https://cdn.example.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", 'https://api.trading.example.com', 'wss://ws.trading.example.com']
        }
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
        maxPoolSize: 100,
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true
      },
      // Replica set configuration
      replicaSet: {
        enabled: true,
        name: 'rs0',
        nodes: [
          { host: 'mongodb-0.example.com', port: 27017 },
          { host: 'mongodb-1.example.com', port: 27017 },
          { host: 'mongodb-2.example.com', port: 27017 }
        ]
      }
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'hftp:',
      cluster: {
        enabled: true,
        nodes: [
          { host: 'redis-0.example.com', port: 6379 },
          { host: 'redis-1.example.com', port: 6379 },
          { host: 'redis-2.example.com', port: 6379 }
        ]
      }
    }
  },

  // Authentication configuration
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
      refreshExpiresIn: '7d'
    },
    mfa: {
      enabled: true,
      issuer: 'Hedge Fund Trading Platform',
      digits: 6,
      period: 30
    },
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    rateLimit: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 failed attempts
        message: 'Too many failed login attempts, please try again later'
      }
    }
  },

  // API data providers
  dataProviders: {
    alpaca: {
      baseUrl: 'https://api.alpaca.markets',
      keyId: process.env.ALPACA_KEY_ID,
      secretKey: process.env.ALPACA_SECRET_KEY,
      paper: false
    },
    iexCloud: {
      baseUrl: 'https://cloud.iexapis.com/v1',
      publicToken: process.env.IEX_PUBLIC_TOKEN,
      secretToken: process.env.IEX_SECRET_TOKEN
    },
    polygon: {
      baseUrl: 'https://api.polygon.io',
      apiKey: process.env.POLYGON_API_KEY
    },
    finnhub: {
      baseUrl: 'https://finnhub.io/api/v1',
      apiKey: process.env.FINNHUB_API_KEY
    }
  },

  // Caching strategy
  cache: {
    marketData: {
      ttl: 60, // 60 seconds
      compression: true
    },
    userPreferences: {
      ttl: 3600, // 1 hour
      compression: false
    },
    analytics: {
      ttl: 300, // 5 minutes
      compression: true
    }
  },

  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    transports: [
      {
        type: 'console',
        colorize: false
      },
      {
        type: 'file',
        filename: '/var/log/hftp/application.log',
        maxSize: '100m',
        maxFiles: 10
      }
    ],
    exceptionHandlers: [
      {
        type: 'file',
        filename: '/var/log/hftp/exceptions.log'
      }
    ]
  },

  // Monitoring configuration
  monitoring: {
    healthCheck: {
      interval: 60000, // 1 minute
      timeout: 5000, // 5 seconds
      path: '/health'
    },
    metrics: {
      enabled: true,
      interval: 15000, // 15 seconds
      prefix: 'hftp_',
      defaultLabels: {
        service: 'hedge-fund-trading-platform'
      }
    },
    alerting: {
      enabled: true,
      channels: ['email', 'slack'],
      thresholds: {
        cpu: 80, // 80% utilization
        memory: 80, // 80% utilization
        errorRate: 2, // 2% error rate
        responseTime: 500 // 500ms
      }
    }
  },

  // Feature flags
  featureFlags: {
    mlPredictions: true,
    backtesting: true,
    portfolioOptimization: true,
    realTimeAlerts: true,
    advancedCharting: true
  },

  // Performance optimization
  performance: {
    compression: true,
    caching: true,
    minification: true,
    batchProcessing: true,
    lazyLoading: true
  },

  // Deployment settings
  deployment: {
    replicaCount: 3,
    autoscaling: {
      enabled: true,
      minReplicas: 3,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 70,
      targetMemoryUtilizationPercentage: 80
    },
    resources: {
      requests: {
        cpu: '500m',
        memory: '1Gi'
      },
      limits: {
        cpu: '2',
        memory: '4Gi'
      }
    },
    nodeSelector: {
      'kubernetes.io/os': 'linux'
    },
    affinity: {
      podAntiAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight: 100,
            podAffinityTerm: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'app',
                    operator: 'In',
                    values: ['hedge-fund-trading-platform']
                  }
                ]
              },
              topologyKey: 'kubernetes.io/hostname'
            }
          }
        ]
      }
    }
  }
};