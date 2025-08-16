/**
 * Database Service for Hedge Fund Trading Application
 * 
 * This service handles database connections, provides repository access,
 * and manages database operations.
 */

const mongoose = require('mongoose');
const { EventEmitter } = require('events');
const logger = require('../logging/LoggingService');

class DatabaseService extends EventEmitter {
  constructor(config) {
    super();
    this.config = config || {};
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = this.config.maxRetries || 5;
    this.retryInterval = this.config.retryInterval || 5000; // 5 seconds
    this.models = {};
    this.repositories = {};
    
    // Set mongoose options
    mongoose.set('strictQuery', true);
    
    // Setup connection events
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.connectionRetries = 0;
      logger.info('Database connection established');
      this.emit('connected');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Database connection error:', err);
      this.emit('error', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('Database connection lost');
      this.emit('disconnected');
      
      // Attempt reconnection if not manually disconnected
      if (!this.manualDisconnect) {
        this.reconnect();
      }
    });
    
    // Handle process termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }
  
  /**
   * Connect to the database
   * @returns {Promise} Resolves when connected
   */
  async connect() {
    if (this.isConnected) {
      logger.info('Already connected to database');
      return;
    }
    
    this.manualDisconnect = false;
    
    try {
      logger.info('Connecting to database...');
      
      // Get connection URI from config or environment
      const uri = this.config.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/hedge_fund';
      
      // Connect to MongoDB
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS || 5000,
        ...this.config.options
      });
      
      // Load models
      this.loadModels();
      
      // Initialize repositories
      this.initializeRepositories();
      
      logger.info('Database connection successful');
      return mongoose.connection;
    } catch (error) {
      logger.error('Database connection failed:', error);
      this.emit('error', error);
      
      // Attempt reconnection
      if (this.connectionRetries < this.maxRetries) {
        return this.reconnect();
      } else {
        throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
      }
    }
  }
  
  /**
   * Reconnect to the database
   * @returns {Promise} Resolves when reconnected
   */
  async reconnect() {
    this.connectionRetries++;
    logger.info(`Attempting to reconnect to database (${this.connectionRetries}/${this.maxRetries})...`);
    
    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, this.retryInterval));
    
    // Attempt to reconnect
    return this.connect();
  }
  
  /**
   * Disconnect from the database
   * @returns {Promise} Resolves when disconnected
   */
  async disconnect() {
    if (!this.isConnected) {
      logger.info('Not connected to database');
      return;
    }
    
    this.manualDisconnect = true;
    
    try {
      logger.info('Disconnecting from database...');
      await mongoose.disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }
  
  /**
   * Gracefully shutdown the database connection
   */
  async gracefulShutdown() {
    logger.info('Received shutdown signal, closing database connection...');
    
    try {
      await this.disconnect();
      logger.info('Database connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error('Error during database disconnection:', error);
      process.exit(1);
    }
  }
  
  /**
   * Load database models
   */
  loadModels() {
    logger.info('Loading database models...');
    
    try {
      // Market Data models
      const { 
        Quote, Bar, Trade, TechnicalIndicator, 
        SymbolMetadata, MarketNews 
      } = require('../../models/MarketData');
      
      // Analytics Results models
      const { 
        BacktestResult, RiskAnalysisResult, 
        MachineLearningResult 
      } = require('../../models/AnalyticsResults');
      
      // User Preferences models
      const { 
        UserPreferences, Watchlist, Alert 
      } = require('../../models/UserPreferences');
      
      // Store models
      this.models = {
        // Market Data
        Quote,
        Bar,
        Trade,
        TechnicalIndicator,
        SymbolMetadata,
        MarketNews,
        
        // Analytics Results
        BacktestResult,
        RiskAnalysisResult,
        MachineLearningResult,
        
        // User Preferences
        UserPreferences,
        Watchlist,
        Alert
      };
      
      logger.info('Database models loaded successfully');
    } catch (error) {
      logger.error('Error loading database models:', error);
      throw error;
    }
  }
  
  /**
   * Initialize repositories for data access
   */
  initializeRepositories() {
    logger.info('Initializing repositories...');
    
    try {
      // Import repositories
      const MarketDataRepository = require('../repositories/MarketDataRepository');
      const AnalyticsRepository = require('../repositories/AnalyticsRepository');
      const UserPreferencesRepository = require('../repositories/UserPreferencesRepository');
      
      // Initialize repositories with models
      this.repositories = {
        marketData: new MarketDataRepository(this.models),
        analytics: new AnalyticsRepository(this.models),
        userPreferences: new UserPreferencesRepository(this.models)
      };
      
      logger.info('Repositories initialized successfully');
    } catch (error) {
      logger.error('Error initializing repositories:', error);
      throw error;
    }
  }
  
  /**
   * Get a database model
   * @param {string} modelName - Name of the model to get
   * @returns {Object} Mongoose model
   */
  getModel(modelName) {
    if (!this.models[modelName]) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    return this.models[modelName];
  }
  
  /**
   * Get a repository
   * @param {string} repositoryName - Name of the repository to get
   * @returns {Object} Repository instance
   */
  getRepository(repositoryName) {
    if (!this.repositories[repositoryName]) {
      throw new Error(`Repository ${repositoryName} not found`);
    }
    
    return this.repositories[repositoryName];
  }
  
  /**
   * Create a database transaction
   * @returns {Object} Mongoose session
   */
  async startTransaction() {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  }
  
  /**
   * Check database connection health
   * @returns {Object} Health status
   */
  async checkHealth() {
    try {
      if (!this.isConnected) {
        return {
          status: 'error',
          message: 'Not connected to database',
          details: null
        };
      }
      
      // Check if we can execute a simple command
      const result = await mongoose.connection.db.admin().ping();
      
      if (result && result.ok === 1) {
        return {
          status: 'ok',
          message: 'Database connection is healthy',
          details: {
            connectionState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
          }
        };
      } else {
        return {
          status: 'warning',
          message: 'Database connection may have issues',
          details: result
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Database health check failed',
        details: error.message
      };
    }
  }
  
  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  async getStats() {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    try {
      const stats = await mongoose.connection.db.stats();
      return stats;
    } catch (error) {
      logger.error('Error getting database stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService({
  uri: process.env.MONGODB_URI,
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '5', 10),
  retryInterval: parseInt(process.env.DB_RETRY_INTERVAL || '5000', 10),
  options: {
    serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000', 10),
    socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000', 10),
    replicaSet: process.env.DB_REPLICA_SET,
    ssl: process.env.DB_SSL === 'true',
    authSource: process.env.DB_AUTH_SOURCE || 'admin'
  }
});

module.exports = databaseService;