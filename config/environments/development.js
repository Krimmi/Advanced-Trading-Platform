/**
 * Development Environment Configuration
 * 
 * This file contains configuration settings specific to the development environment.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // limit each IP to 1000 requests per windowMs
    }
  },
  
  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hedge_fund_dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: 0,
      keyPrefix: 'hedge_fund_dev:'
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
      }
    },
    iexCloud: {
      baseUrl: 'https://cloud.iexapis.com',
      publicToken: process.env.IEX_PUBLIC_TOKEN || '',
      secretToken: process.env.IEX_SECRET_TOKEN || '',
      rateLimit: {
        maxRequests: 100,
        perMinute: 60
      }
    },
    polygon: {
      baseUrl: 'https://api.polygon.io',
      apiKey: process.env.POLYGON_API_KEY || '',
      rateLimit: {
        maxRequests: 120,
        perMinute: 60
      }
    },
    fmp: {
      baseUrl: 'https://financialmodelingprep.com/api',
      apiKey: process.env.FMP_API_KEY || '',
      rateLimit: {
        maxRequests: 300,
        perMinute: 60
      }
    }
  },
  
  // Authentication configuration
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'development-secret-key-change-in-production',
      expiresIn: '1d',
      refreshExpiresIn: '7d'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'development-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      }
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: 'dev',
    enableConsole: true,
    enableFile: true,
    filePath: './logs/development.log',
    maxSize: '10m',
    maxFiles: '7d'
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
    reconnectInterval: 10000,
    reconnectAttempts: 10,
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
    metricsInterval: 60000, // 1 minute
    healthCheckInterval: 30000 // 30 seconds
  },
  
  // Deployment configuration
  deployment: {
    s3Bucket: process.env.DEV_S3_BUCKET || 'hedge-fund-dev',
    cloudFrontId: process.env.DEV_CLOUDFRONT_ID || '',
    domain: process.env.DEV_DOMAIN || 'dev.hedgefund.example.com'
  }
};