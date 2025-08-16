/**
 * Market Data Repository for Hedge Fund Trading Application
 * 
 * This repository handles database operations for market data.
 */

const logger = require('../logging/LoggingService');

class MarketDataRepository {
  constructor(models) {
    this.models = models;
  }
  
  /**
   * Save a quote to the database
   * @param {Object} quote - Quote data
   * @returns {Promise<Object>} Saved quote
   */
  async saveQuote(quote) {
    try {
      const { Quote } = this.models;
      
      // Check if quote already exists
      const existingQuote = await Quote.findOne({
        symbol: quote.symbol,
        timestamp: quote.timestamp
      });
      
      if (existingQuote) {
        // Update existing quote
        Object.assign(existingQuote, quote);
        return await existingQuote.save();
      } else {
        // Create new quote
        const newQuote = new Quote(quote);
        return await newQuote.save();
      }
    } catch (error) {
      logger.error('Error saving quote:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple quotes to the database
   * @param {Array<Object>} quotes - Array of quote data
   * @returns {Promise<Array<Object>>} Saved quotes
   */
  async saveQuotes(quotes) {
    try {
      const { Quote } = this.models;
      
      // Use bulkWrite for better performance
      const operations = quotes.map(quote => ({
        updateOne: {
          filter: {
            symbol: quote.symbol,
            timestamp: quote.timestamp
          },
          update: { $set: quote },
          upsert: true
        }
      }));
      
      const result = await Quote.bulkWrite(operations);
      logger.debug(`Saved ${result.upsertedCount + result.modifiedCount} quotes`);
      
      return result;
    } catch (error) {
      logger.error('Error saving quotes:', error);
      throw error;
    }
  }
  
  /**
   * Get the latest quote for a symbol
   * @param {string} symbol - Symbol to get quote for
   * @returns {Promise<Object>} Latest quote
   */
  async getLatestQuote(symbol) {
    try {
      const { Quote } = this.models;
      
      return await Quote.findOne({ symbol })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      logger.error(`Error getting latest quote for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get quotes for a symbol within a time range
   * @param {string} symbol - Symbol to get quotes for
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {number} limit - Maximum number of quotes to return
   * @returns {Promise<Array<Object>>} Quotes
   */
  async getQuotes(symbol, startTime, endTime, limit = 1000) {
    try {
      const { Quote } = this.models;
      
      const query = { symbol };
      
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }
      
      return await Quote.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error(`Error getting quotes for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Save a bar to the database
   * @param {Object} bar - Bar data
   * @returns {Promise<Object>} Saved bar
   */
  async saveBar(bar) {
    try {
      const { Bar } = this.models;
      
      // Check if bar already exists
      const existingBar = await Bar.findOne({
        symbol: bar.symbol,
        interval: bar.interval,
        timestamp: bar.timestamp
      });
      
      if (existingBar) {
        // Update existing bar
        Object.assign(existingBar, bar);
        return await existingBar.save();
      } else {
        // Create new bar
        const newBar = new Bar(bar);
        return await newBar.save();
      }
    } catch (error) {
      logger.error('Error saving bar:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple bars to the database
   * @param {Array<Object>} bars - Array of bar data
   * @returns {Promise<Array<Object>>} Saved bars
   */
  async saveBars(bars) {
    try {
      const { Bar } = this.models;
      
      // Use bulkWrite for better performance
      const operations = bars.map(bar => ({
        updateOne: {
          filter: {
            symbol: bar.symbol,
            interval: bar.interval,
            timestamp: bar.timestamp
          },
          update: { $set: bar },
          upsert: true
        }
      }));
      
      const result = await Bar.bulkWrite(operations);
      logger.debug(`Saved ${result.upsertedCount + result.modifiedCount} bars`);
      
      return result;
    } catch (error) {
      logger.error('Error saving bars:', error);
      throw error;
    }
  }
  
  /**
   * Get bars for a symbol within a time range
   * @param {string} symbol - Symbol to get bars for
   * @param {string} interval - Bar interval
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {number} limit - Maximum number of bars to return
   * @returns {Promise<Array<Object>>} Bars
   */
  async getBars(symbol, interval, startTime, endTime, limit = 1000) {
    try {
      const { Bar } = this.models;
      
      const query = { 
        symbol,
        interval
      };
      
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }
      
      return await Bar.find(query)
        .sort({ timestamp: 1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error(`Error getting bars for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the latest bar for a symbol
   * @param {string} symbol - Symbol to get bar for
   * @param {string} interval - Bar interval
   * @returns {Promise<Object>} Latest bar
   */
  async getLatestBar(symbol, interval) {
    try {
      const { Bar } = this.models;
      
      return await Bar.findOne({ symbol, interval })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      logger.error(`Error getting latest bar for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Save a trade to the database
   * @param {Object} trade - Trade data
   * @returns {Promise<Object>} Saved trade
   */
  async saveTrade(trade) {
    try {
      const { Trade } = this.models;
      
      // Create new trade
      const newTrade = new Trade(trade);
      return await newTrade.save();
    } catch (error) {
      logger.error('Error saving trade:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple trades to the database
   * @param {Array<Object>} trades - Array of trade data
   * @returns {Promise<Array<Object>>} Saved trades
   */
  async saveTrades(trades) {
    try {
      const { Trade } = this.models;
      
      // Use insertMany for better performance
      const result = await Trade.insertMany(trades);
      logger.debug(`Saved ${result.length} trades`);
      
      return result;
    } catch (error) {
      logger.error('Error saving trades:', error);
      throw error;
    }
  }
  
  /**
   * Get trades for a symbol within a time range
   * @param {string} symbol - Symbol to get trades for
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {number} limit - Maximum number of trades to return
   * @returns {Promise<Array<Object>>} Trades
   */
  async getTrades(symbol, startTime, endTime, limit = 1000) {
    try {
      const { Trade } = this.models;
      
      const query = { symbol };
      
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }
      
      return await Trade.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error(`Error getting trades for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Save a technical indicator to the database
   * @param {Object} indicator - Technical indicator data
   * @returns {Promise<Object>} Saved indicator
   */
  async saveTechnicalIndicator(indicator) {
    try {
      const { TechnicalIndicator } = this.models;
      
      // Check if indicator already exists
      const existingIndicator = await TechnicalIndicator.findOne({
        symbol: indicator.symbol,
        indicator: indicator.indicator,
        parameters: indicator.parameters,
        interval: indicator.interval,
        timestamp: indicator.timestamp
      });
      
      if (existingIndicator) {
        // Update existing indicator
        Object.assign(existingIndicator, indicator);
        return await existingIndicator.save();
      } else {
        // Create new indicator
        const newIndicator = new TechnicalIndicator(indicator);
        return await newIndicator.save();
      }
    } catch (error) {
      logger.error('Error saving technical indicator:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple technical indicators to the database
   * @param {Array<Object>} indicators - Array of technical indicator data
   * @returns {Promise<Array<Object>>} Saved indicators
   */
  async saveTechnicalIndicators(indicators) {
    try {
      const { TechnicalIndicator } = this.models;
      
      // Use bulkWrite for better performance
      const operations = indicators.map(indicator => ({
        updateOne: {
          filter: {
            symbol: indicator.symbol,
            indicator: indicator.indicator,
            parameters: indicator.parameters,
            interval: indicator.interval,
            timestamp: indicator.timestamp
          },
          update: { $set: indicator },
          upsert: true
        }
      }));
      
      const result = await TechnicalIndicator.bulkWrite(operations);
      logger.debug(`Saved ${result.upsertedCount + result.modifiedCount} technical indicators`);
      
      return result;
    } catch (error) {
      logger.error('Error saving technical indicators:', error);
      throw error;
    }
  }
  
  /**
   * Get technical indicators for a symbol
   * @param {string} symbol - Symbol to get indicators for
   * @param {string} indicatorType - Type of indicator
   * @param {Object} parameters - Indicator parameters
   * @param {string} interval - Bar interval
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {number} limit - Maximum number of indicators to return
   * @returns {Promise<Array<Object>>} Technical indicators
   */
  async getTechnicalIndicators(symbol, indicatorType, parameters, interval, startTime, endTime, limit = 1000) {
    try {
      const { TechnicalIndicator } = this.models;
      
      const query = { 
        symbol,
        indicator: indicatorType,
        interval
      };
      
      if (parameters) {
        query.parameters = parameters;
      }
      
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }
      
      return await TechnicalIndicator.find(query)
        .sort({ timestamp: 1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error(`Error getting technical indicators for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Save symbol metadata to the database
   * @param {Object} metadata - Symbol metadata
   * @returns {Promise<Object>} Saved metadata
   */
  async saveSymbolMetadata(metadata) {
    try {
      const { SymbolMetadata } = this.models;
      
      // Check if metadata already exists
      const existingMetadata = await SymbolMetadata.findOne({
        symbol: metadata.symbol
      });
      
      if (existingMetadata) {
        // Update existing metadata
        Object.assign(existingMetadata, metadata);
        existingMetadata.lastUpdated = new Date();
        return await existingMetadata.save();
      } else {
        // Create new metadata
        const newMetadata = new SymbolMetadata(metadata);
        return await newMetadata.save();
      }
    } catch (error) {
      logger.error('Error saving symbol metadata:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple symbol metadata to the database
   * @param {Array<Object>} metadataArray - Array of symbol metadata
   * @returns {Promise<Array<Object>>} Saved metadata
   */
  async saveSymbolMetadataBatch(metadataArray) {
    try {
      const { SymbolMetadata } = this.models;
      
      // Use bulkWrite for better performance
      const operations = metadataArray.map(metadata => ({
        updateOne: {
          filter: {
            symbol: metadata.symbol
          },
          update: { 
            $set: {
              ...metadata,
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      }));
      
      const result = await SymbolMetadata.bulkWrite(operations);
      logger.debug(`Saved ${result.upsertedCount + result.modifiedCount} symbol metadata`);
      
      return result;
    } catch (error) {
      logger.error('Error saving symbol metadata batch:', error);
      throw error;
    }
  }
  
  /**
   * Get symbol metadata
   * @param {string} symbol - Symbol to get metadata for
   * @returns {Promise<Object>} Symbol metadata
   */
  async getSymbolMetadata(symbol) {
    try {
      const { SymbolMetadata } = this.models;
      
      return await SymbolMetadata.findOne({ symbol }).lean();
    } catch (error) {
      logger.error(`Error getting metadata for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get metadata for multiple symbols
   * @param {Array<string>} symbols - Symbols to get metadata for
   * @returns {Promise<Array<Object>>} Symbol metadata
   */
  async getSymbolMetadataBatch(symbols) {
    try {
      const { SymbolMetadata } = this.models;
      
      return await SymbolMetadata.find({ symbol: { $in: symbols } }).lean();
    } catch (error) {
      logger.error('Error getting metadata batch:', error);
      throw error;
    }
  }
  
  /**
   * Search for symbols by various criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array<Object>>} Matching symbols
   */
  async searchSymbols(criteria) {
    try {
      const { SymbolMetadata } = this.models;
      
      const query = {};
      
      if (criteria.symbol) {
        query.symbol = { $regex: criteria.symbol, $options: 'i' };
      }
      
      if (criteria.name) {
        query.name = { $regex: criteria.name, $options: 'i' };
      }
      
      if (criteria.exchange) {
        query.exchange = criteria.exchange;
      }
      
      if (criteria.assetType) {
        query.assetType = criteria.assetType;
      }
      
      if (criteria.sector) {
        query.sector = criteria.sector;
      }
      
      if (criteria.industry) {
        query.industry = criteria.industry;
      }
      
      if (criteria.country) {
        query.country = criteria.country;
      }
      
      if (criteria.isActive !== undefined) {
        query.isActive = criteria.isActive;
      }
      
      const limit = criteria.limit || 100;
      
      return await SymbolMetadata.find(query)
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Error searching symbols:', error);
      throw error;
    }
  }
  
  /**
   * Save market news to the database
   * @param {Object} news - News data
   * @returns {Promise<Object>} Saved news
   */
  async saveMarketNews(news) {
    try {
      const { MarketNews } = this.models;
      
      // Check if news already exists (by URL)
      const existingNews = await MarketNews.findOne({
        url: news.url
      });
      
      if (existingNews) {
        // Update existing news
        Object.assign(existingNews, news);
        return await existingNews.save();
      } else {
        // Create new news
        const newNews = new MarketNews(news);
        return await newNews.save();
      }
    } catch (error) {
      logger.error('Error saving market news:', error);
      throw error;
    }
  }
  
  /**
   * Save multiple market news to the database
   * @param {Array<Object>} newsArray - Array of news data
   * @returns {Promise<Array<Object>>} Saved news
   */
  async saveMarketNewsBatch(newsArray) {
    try {
      const { MarketNews } = this.models;
      
      // Use bulkWrite for better performance
      const operations = newsArray.map(news => ({
        updateOne: {
          filter: {
            url: news.url
          },
          update: { $set: news },
          upsert: true
        }
      }));
      
      const result = await MarketNews.bulkWrite(operations);
      logger.debug(`Saved ${result.upsertedCount + result.modifiedCount} market news`);
      
      return result;
    } catch (error) {
      logger.error('Error saving market news batch:', error);
      throw error;
    }
  }
  
  /**
   * Get market news
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array<Object>>} Market news
   */
  async getMarketNews(criteria) {
    try {
      const { MarketNews } = this.models;
      
      const query = {};
      
      if (criteria.symbols && criteria.symbols.length > 0) {
        query.symbols = { $in: criteria.symbols };
      }
      
      if (criteria.categories && criteria.categories.length > 0) {
        query.categories = { $in: criteria.categories };
      }
      
      if (criteria.startDate || criteria.endDate) {
        query.publishedAt = {};
        if (criteria.startDate) query.publishedAt.$gte = criteria.startDate;
        if (criteria.endDate) query.publishedAt.$lte = criteria.endDate;
      }
      
      if (criteria.source) {
        query.source = criteria.source;
      }
      
      const limit = criteria.limit || 50;
      const skip = criteria.skip || 0;
      
      return await MarketNews.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Error getting market news:', error);
      throw error;
    }
  }
  
  /**
   * Purge old market data
   * @param {Object} options - Purge options
   * @returns {Promise<Object>} Purge results
   */
  async purgeOldData(options) {
    try {
      const results = {
        quotes: 0,
        bars: 0,
        trades: 0,
        technicalIndicators: 0,
        news: 0
      };
      
      const now = new Date();
      
      // Purge quotes
      if (options.quotes && options.quotes.maxAge) {
        const cutoffDate = new Date(now.getTime() - options.quotes.maxAge * 1000);
        const result = await this.models.Quote.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        results.quotes = result.deletedCount;
      }
      
      // Purge bars
      if (options.bars && options.bars.maxAge) {
        const cutoffDate = new Date(now.getTime() - options.bars.maxAge * 1000);
        const result = await this.models.Bar.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        results.bars = result.deletedCount;
      }
      
      // Purge trades
      if (options.trades && options.trades.maxAge) {
        const cutoffDate = new Date(now.getTime() - options.trades.maxAge * 1000);
        const result = await this.models.Trade.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        results.trades = result.deletedCount;
      }
      
      // Purge technical indicators
      if (options.technicalIndicators && options.technicalIndicators.maxAge) {
        const cutoffDate = new Date(now.getTime() - options.technicalIndicators.maxAge * 1000);
        const result = await this.models.TechnicalIndicator.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        results.technicalIndicators = result.deletedCount;
      }
      
      // Purge news
      if (options.news && options.news.maxAge) {
        const cutoffDate = new Date(now.getTime() - options.news.maxAge * 1000);
        const result = await this.models.MarketNews.deleteMany({
          publishedAt: { $lt: cutoffDate }
        });
        results.news = result.deletedCount;
      }
      
      logger.info('Purged old market data:', results);
      return results;
    } catch (error) {
      logger.error('Error purging old market data:', error);
      throw error;
    }
  }
}

module.exports = MarketDataRepository;