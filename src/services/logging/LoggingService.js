/**
 * Logging Service for Hedge Fund Trading Application
 * 
 * This service provides structured logging capabilities with different
 * transport options, log levels, and formatting.
 */

const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'cyan'
};

// Add colors to winston
winston.addColors(logColors);

// Get environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const ENABLE_CONSOLE_LOGS = process.env.ENABLE_CONSOLE_LOGS !== 'false';
const ENABLE_FILE_LOGS = process.env.ENABLE_FILE_LOGS !== 'false';
const ENABLE_JSON_LOGS = process.env.ENABLE_JSON_LOGS === 'true' || NODE_ENV === 'production';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || path.join(logsDir, `${NODE_ENV}.log`);
const ERROR_LOG_FILE_PATH = process.env.ERROR_LOG_FILE_PATH || path.join(logsDir, `${NODE_ENV}-error.log`);
const MAX_LOG_FILE_SIZE = process.env.MAX_LOG_FILE_SIZE || '10m';
const MAX_LOG_FILES = process.env.MAX_LOG_FILES || '7d';
const ENABLE_CLOUDWATCH_LOGS = process.env.ENABLE_CLOUDWATCH_LOGS === 'true';

// Create custom format for development logs
const developmentFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  })
);

// Create custom format for production logs (JSON)
const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create custom format for file logs
const fileFormat = ENABLE_JSON_LOGS
  ? productionFormat
  : format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.splat(),
      format.uncolorize(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} ${level}: ${message} ${metaString}`;
      })
    );

// Configure transports
const transports = [];

// Add console transport if enabled
if (ENABLE_CONSOLE_LOGS) {
  transports.push(
    new winston.transports.Console({
      level: LOG_LEVEL,
      format: NODE_ENV === 'production' ? productionFormat : developmentFormat
    })
  );
}

// Add file transport if enabled
if (ENABLE_FILE_LOGS) {
  // Add combined log file
  transports.push(
    new winston.transports.File({
      filename: LOG_FILE_PATH,
      level: LOG_LEVEL,
      format: fileFormat,
      maxsize: parseFileSize(MAX_LOG_FILE_SIZE),
      maxFiles: parseMaxFiles(MAX_LOG_FILES),
      tailable: true
    })
  );
  
  // Add error log file
  transports.push(
    new winston.transports.File({
      filename: ERROR_LOG_FILE_PATH,
      level: 'error',
      format: fileFormat,
      maxsize: parseFileSize(MAX_LOG_FILE_SIZE),
      maxFiles: parseMaxFiles(MAX_LOG_FILES),
      tailable: true
    })
  );
}

// Add CloudWatch transport if enabled
if (ENABLE_CLOUDWATCH_LOGS) {
  try {
    const { CloudWatchTransport } = require('winston-cloudwatch');
    
    transports.push(
      new CloudWatchTransport({
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP || `/hedge-fund/${NODE_ENV}`,
        logStreamName: process.env.CLOUDWATCH_LOG_STREAM || `app-${NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        messageFormatter: ({ level, message, ...meta }) => {
          return JSON.stringify({
            level,
            message,
            timestamp: new Date().toISOString(),
            service: 'hedge-fund-app',
            environment: NODE_ENV,
            ...meta
          });
        }
      })
    );
  } catch (error) {
    console.error('Failed to initialize CloudWatch transport:', error);
  }
}

// Create logger
const logger = winston.createLogger({
  levels: logLevels,
  level: LOG_LEVEL,
  defaultMeta: {
    service: 'hedge-fund-app',
    environment: NODE_ENV
  },
  transports,
  exitOnError: false
});

// Add request context middleware
logger.addRequestContext = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const userId = req.user?.id || 'anonymous';
  
  // Add request context to logger
  req.logger = logger.child({
    requestId,
    userId,
    path: req.path,
    method: req.method
  });
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Helper function to parse file size
function parseFileSize(size) {
  const units = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024
  };
  
  const match = size.toString().match(/^(\d+)([bkmg])?$/i);
  
  if (!match) {
    return 10 * 1024 * 1024; // Default to 10MB
  }
  
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'b').toLowerCase();
  
  return value * (units[unit] || 1);
}

// Helper function to parse max files
function parseMaxFiles(maxFiles) {
  if (typeof maxFiles === 'number') {
    return maxFiles;
  }
  
  const match = maxFiles.toString().match(/^(\d+)([dwmy])?$/i);
  
  if (!match) {
    return 10; // Default to 10 files
  }
  
  const value = parseInt(match[1], 10);
  const unit = (match[2] || '').toLowerCase();
  
  // Convert time-based retention to approximate number of files
  // Assuming one log file per day
  switch (unit) {
    case 'd': return value;
    case 'w': return value * 7;
    case 'm': return value * 30;
    case 'y': return value * 365;
    default: return value;
  }
}

// Helper function to generate request ID
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Export logger
module.exports = logger;