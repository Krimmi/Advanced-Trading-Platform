import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  RiskAlert,
  RiskAlertLevel
} from './models/RiskModels';
import { MarketDataService } from '../api/marketData/MarketDataService';
import { MarketDataServiceFactory } from '../api/marketData/MarketDataServiceFactory';
import { positionTrackingService } from '../api/trading/PositionTrackingService';

/**
 * Stop loss types
 */
export enum StopLossType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  TRAILING = 'trailing',
  VOLATILITY_BASED = 'volatility_based',
  TIME_BASED = 'time_based',
  VOLUME_BASED = 'volume_based',
  TECHNICAL_BASED = 'technical_based',
  COMBINED = 'combined'
}

/**
 * Stop loss configuration
 */
export interface StopLossConfig {
  type: StopLossType;
  value: number;
  trailingDistance?: number;
  timeLimit?: number;
  volumeThreshold?: number;
  technicalIndicator?: string;
  activationThreshold?: number;
  isActive: boolean;
}

/**
 * Position stop loss
 */
export interface PositionStopLoss {
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLossPrice: number;
  stopLossType: StopLossType;
  stopLossValue: number;
  maxPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  distanceToStopLoss: number;
  distanceToStopLossPercent: number;
  isActive: boolean;
  isTriggered: boolean;
  lastUpdated: number;
}

/**
 * Stop loss alert
 */
export interface StopLossAlert {
  symbol: string;
  alertLevel: RiskAlertLevel;
  message: string;
  currentPrice: number;
  stopLossPrice: number;
  distanceToStopLoss: number;
  distanceToStopLossPercent: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  timestamp: number;
}

/**
 * Service for managing stop losses
 */
export class StopLossManagementService extends EventEmitter {
  private marketDataService: MarketDataService;
  private stopLosses: Map<string, PositionStopLoss> = new Map();
  private defaultConfigs: Map<StopLossType, StopLossConfig> = new Map();
  private alertThresholds: Map<RiskAlertLevel, number> = new Map();
  private lastAlerts: Map<string, StopLossAlert> = new Map();
  
  /**
   * Creates a new StopLossManagementService
   * @param marketDataService Market data service
   */
  constructor(marketDataService?: MarketDataService) {
    super();
    this.marketDataService = marketDataService || MarketDataServiceFactory.getService();
    
    // Initialize default stop loss configurations
    this.initializeDefaultConfigs();
    
    // Initialize alert thresholds
    this.initializeAlertThresholds();
  }
  
  /**
   * Sets stop loss for a position
   * @param symbol Symbol
   * @param config Stop loss configuration
   * @param entryPrice Entry price (optional)
   * @param quantity Quantity (optional)
   * @returns Position stop loss
   */
  public async setStopLoss(
    symbol: string,
    config: StopLossConfig,
    entryPrice?: number,
    quantity?: number
  ): Promise<PositionStopLoss> {
    try {
      // Get current price
      const quote = await this.marketDataService.getQuote(symbol);
      const currentPrice = quote.price;
      
      // Get position details if not provided
      if (entryPrice === undefined || quantity === undefined) {
        const position = await positionTrackingService.getPosition(symbol);
        
        if (position) {
          entryPrice = entryPrice || position.averageEntryPrice;
          quantity = quantity || position.quantity;
        } else {
          entryPrice = entryPrice || currentPrice;
          quantity = quantity || 0;
        }
      }
      
      // Calculate stop loss price based on type
      const stopLossPrice = this.calculateStopLossPrice(
        currentPrice,
        entryPrice,
        config
      );
      
      // Calculate unrealized P&L
      const unrealizedPnl = (currentPrice - entryPrice) * quantity;
      const unrealizedPnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
      
      // Calculate distance to stop loss
      const distanceToStopLoss = currentPrice - stopLossPrice;
      const distanceToStopLossPercent = (distanceToStopLoss / currentPrice) * 100;
      
      // Create position stop loss
      const positionStopLoss: PositionStopLoss = {
        symbol,
        entryPrice,
        currentPrice,
        quantity,
        stopLossPrice,
        stopLossType: config.type,
        stopLossValue: config.value,
        maxPrice: currentPrice, // Initialize max price to current price
        unrealizedPnl,
        unrealizedPnlPercent,
        distanceToStopLoss,
        distanceToStopLossPercent,
        isActive: config.isActive,
        isTriggered: false,
        lastUpdated: Date.now()
      };
      
      // Store stop loss
      this.stopLosses.set(symbol, positionStopLoss);
      
      return positionStopLoss;
    } catch (error) {
      console.error(`Error setting stop loss for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Sets default stop loss configuration for a type
   * @param type Stop loss type
   * @param config Stop loss configuration
   */
  public setDefaultConfig(type: StopLossType, config: StopLossConfig): void {
    this.defaultConfigs.set(type, config);
  }
  
  /**
   * Gets default stop loss configuration for a type
   * @param type Stop loss type
   * @returns Stop loss configuration
   */
  public getDefaultConfig(type: StopLossType): StopLossConfig | undefined {
    return this.defaultConfigs.get(type);
  }
  
  /**
   * Gets stop loss for a symbol
   * @param symbol Symbol
   * @returns Position stop loss
   */
  public getStopLoss(symbol: string): PositionStopLoss | undefined {
    return this.stopLosses.get(symbol);
  }
  
  /**
   * Gets all stop losses
   * @returns Map of symbol to position stop loss
   */
  public getAllStopLosses(): Map<string, PositionStopLoss> {
    return new Map(this.stopLosses);
  }
  
  /**
   * Updates stop loss for a symbol
   * @param symbol Symbol
   * @returns Updated position stop loss
   */
  public async updateStopLoss(symbol: string): Promise<PositionStopLoss | null> {
    try {
      const stopLoss = this.stopLosses.get(symbol);
      
      if (!stopLoss) {
        return null;
      }
      
      // Get current price
      const quote = await this.marketDataService.getQuote(symbol);
      const currentPrice = quote.price;
      
      // Update max price if current price is higher
      const maxPrice = Math.max(stopLoss.maxPrice, currentPrice);
      
      // Recalculate stop loss price for trailing stop loss
      let stopLossPrice = stopLoss.stopLossPrice;
      
      if (stopLoss.stopLossType === StopLossType.TRAILING && stopLoss.isActive) {
        const trailingConfig = this.defaultConfigs.get(StopLossType.TRAILING);
        const trailingDistance = trailingConfig?.trailingDistance || 0.05; // Default 5%
        
        const newStopLossPrice = maxPrice * (1 - trailingDistance);
        
        // Only move stop loss up, never down
        if (newStopLossPrice > stopLossPrice) {
          stopLossPrice = newStopLossPrice;
        }
      }
      
      // Calculate unrealized P&L
      const unrealizedPnl = (currentPrice - stopLoss.entryPrice) * stopLoss.quantity;
      const unrealizedPnlPercent = ((currentPrice - stopLoss.entryPrice) / stopLoss.entryPrice) * 100;
      
      // Calculate distance to stop loss
      const distanceToStopLoss = currentPrice - stopLossPrice;
      const distanceToStopLossPercent = (distanceToStopLoss / currentPrice) * 100;
      
      // Check if stop loss is triggered
      const isTriggered = currentPrice <= stopLossPrice && stopLoss.isActive;
      
      // Update stop loss
      const updatedStopLoss: PositionStopLoss = {
        ...stopLoss,
        currentPrice,
        maxPrice,
        stopLossPrice,
        unrealizedPnl,
        unrealizedPnlPercent,
        distanceToStopLoss,
        distanceToStopLossPercent,
        isTriggered,
        lastUpdated: Date.now()
      };
      
      // Store updated stop loss
      this.stopLosses.set(symbol, updatedStopLoss);
      
      // Check for alerts
      if (stopLoss.isActive) {
        this.checkForAlert(updatedStopLoss);
      }
      
      // Emit event if stop loss is triggered
      if (isTriggered && !stopLoss.isTriggered) {
        this.emit('stopLossTriggered', updatedStopLoss);
      }
      
      return updatedStopLoss;
    } catch (error) {
      console.error(`Error updating stop loss for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Updates all stop losses
   * @returns Map of updated stop losses
   */
  public async updateAllStopLosses(): Promise<Map<string, PositionStopLoss>> {
    const symbols = Array.from(this.stopLosses.keys());
    const updatedStopLosses = new Map<string, PositionStopLoss>();
    
    for (const symbol of symbols) {
      const updatedStopLoss = await this.updateStopLoss(symbol);
      
      if (updatedStopLoss) {
        updatedStopLosses.set(symbol, updatedStopLoss);
      }
    }
    
    return updatedStopLosses;
  }
  
  /**
   * Removes stop loss for a symbol
   * @param symbol Symbol
   * @returns True if removed
   */
  public removeStopLoss(symbol: string): boolean {
    return this.stopLosses.delete(symbol);
  }
  
  /**
   * Activates stop loss for a symbol
   * @param symbol Symbol
   * @returns Updated position stop loss
   */
  public activateStopLoss(symbol: string): PositionStopLoss | null {
    const stopLoss = this.stopLosses.get(symbol);
    
    if (!stopLoss) {
      return null;
    }
    
    const updatedStopLoss: PositionStopLoss = {
      ...stopLoss,
      isActive: true
    };
    
    this.stopLosses.set(symbol, updatedStopLoss);
    
    return updatedStopLoss;
  }
  
  /**
   * Deactivates stop loss for a symbol
   * @param symbol Symbol
   * @returns Updated position stop loss
   */
  public deactivateStopLoss(symbol: string): PositionStopLoss | null {
    const stopLoss = this.stopLosses.get(symbol);
    
    if (!stopLoss) {
      return null;
    }
    
    const updatedStopLoss: PositionStopLoss = {
      ...stopLoss,
      isActive: false
    };
    
    this.stopLosses.set(symbol, updatedStopLoss);
    
    return updatedStopLoss;
  }
  
  /**
   * Sets stop losses for a portfolio
   * @param portfolio Portfolio
   * @param type Stop loss type
   * @param value Stop loss value
   * @returns Map of position stop losses
   */
  public async setPortfolioStopLosses(
    portfolio: Portfolio,
    type: StopLossType,
    value: number
  ): Promise<Map<string, PositionStopLoss>> {
    const config: StopLossConfig = {
      type,
      value,
      isActive: true
    };
    
    const stopLosses = new Map<string, PositionStopLoss>();
    
    for (const position of portfolio.positions) {
      const stopLoss = await this.setStopLoss(
        position.symbol,
        config,
        position.price,
        position.quantity
      );
      
      stopLosses.set(position.symbol, stopLoss);
    }
    
    return stopLosses;
  }
  
  /**
   * Gets triggered stop losses
   * @returns Array of triggered stop losses
   */
  public getTriggeredStopLosses(): PositionStopLoss[] {
    return Array.from(this.stopLosses.values()).filter(sl => sl.isTriggered);
  }
  
  /**
   * Gets stop loss alerts
   * @returns Array of stop loss alerts
   */
  public getStopLossAlerts(): StopLossAlert[] {
    return Array.from(this.lastAlerts.values());
  }
  
  /**
   * Calculates stop loss price
   * @param currentPrice Current price
   * @param entryPrice Entry price
   * @param config Stop loss configuration
   * @returns Stop loss price
   */
  private calculateStopLossPrice(
    currentPrice: number,
    entryPrice: number,
    config: StopLossConfig
  ): number {
    switch (config.type) {
      case StopLossType.FIXED:
        // Fixed price stop loss
        return config.value;
        
      case StopLossType.PERCENTAGE:
        // Percentage below entry price
        return entryPrice * (1 - config.value);
        
      case StopLossType.TRAILING:
        // Trailing stop loss (percentage below current price)
        const trailingDistance = config.trailingDistance || 0.05; // Default 5%
        return currentPrice * (1 - trailingDistance);
        
      case StopLossType.VOLATILITY_BASED:
        // Volatility-based stop loss (ATR multiple below current price)
        // In a real implementation, would calculate ATR
        const atr = currentPrice * 0.02; // Simplified ATR calculation (2% of price)
        return currentPrice - (atr * config.value);
        
      case StopLossType.TECHNICAL_BASED:
        // Technical indicator-based stop loss
        // In a real implementation, would calculate based on indicator
        return entryPrice * 0.95; // Simplified to 5% below entry price
        
      case StopLossType.COMBINED:
        // Combined stop loss (maximum of percentage and volatility-based)
        const percentageStop = entryPrice * (1 - config.value);
        const atrCombined = currentPrice * 0.02; // Simplified ATR
        const volatilityStop = currentPrice - (atrCombined * 2); // 2 ATR
        return Math.max(percentageStop, volatilityStop);
        
      default:
        // Default to percentage stop loss
        return entryPrice * (1 - config.value);
    }
  }
  
  /**
   * Checks for stop loss alert
   * @param stopLoss Position stop loss
   */
  private checkForAlert(stopLoss: PositionStopLoss): void {
    if (!stopLoss.isActive) {
      return;
    }
    
    // Calculate alert level based on distance to stop loss
    let alertLevel: RiskAlertLevel = RiskAlertLevel.LOW;
    
    if (stopLoss.isTriggered) {
      alertLevel = RiskAlertLevel.CRITICAL;
    } else if (stopLoss.distanceToStopLossPercent < this.alertThresholds.get(RiskAlertLevel.HIGH)!) {
      alertLevel = RiskAlertLevel.HIGH;
    } else if (stopLoss.distanceToStopLossPercent < this.alertThresholds.get(RiskAlertLevel.MEDIUM)!) {
      alertLevel = RiskAlertLevel.MEDIUM;
    } else if (stopLoss.distanceToStopLossPercent < this.alertThresholds.get(RiskAlertLevel.LOW)!) {
      alertLevel = RiskAlertLevel.LOW;
    } else {
      return; // No alert needed
    }
    
    // Create alert message
    let message = '';
    
    if (stopLoss.isTriggered) {
      message = `STOP LOSS TRIGGERED for ${stopLoss.symbol} at $${stopLoss.currentPrice.toFixed(2)}`;
    } else {
      message = `${stopLoss.symbol} is ${stopLoss.distanceToStopLossPercent.toFixed(2)}% away from stop loss at $${stopLoss.stopLossPrice.toFixed(2)}`;
    }
    
    // Create alert
    const alert: StopLossAlert = {
      symbol: stopLoss.symbol,
      alertLevel,
      message,
      currentPrice: stopLoss.currentPrice,
      stopLossPrice: stopLoss.stopLossPrice,
      distanceToStopLoss: stopLoss.distanceToStopLoss,
      distanceToStopLossPercent: stopLoss.distanceToStopLossPercent,
      unrealizedPnl: stopLoss.unrealizedPnl,
      unrealizedPnlPercent: stopLoss.unrealizedPnlPercent,
      timestamp: Date.now()
    };
    
    // Check if alert level has changed
    const lastAlert = this.lastAlerts.get(stopLoss.symbol);
    
    if (!lastAlert || lastAlert.alertLevel !== alertLevel) {
      // Store alert
      this.lastAlerts.set(stopLoss.symbol, alert);
      
      // Emit alert event
      this.emit('stopLossAlert', alert);
    }
  }
  
  /**
   * Initializes default stop loss configurations
   */
  private initializeDefaultConfigs(): void {
    this.defaultConfigs.set(StopLossType.FIXED, {
      type: StopLossType.FIXED,
      value: 0,
      isActive: false
    });
    
    this.defaultConfigs.set(StopLossType.PERCENTAGE, {
      type: StopLossType.PERCENTAGE,
      value: 0.05, // 5% below entry price
      isActive: true
    });
    
    this.defaultConfigs.set(StopLossType.TRAILING, {
      type: StopLossType.TRAILING,
      value: 0,
      trailingDistance: 0.05, // 5% below max price
      isActive: true
    });
    
    this.defaultConfigs.set(StopLossType.VOLATILITY_BASED, {
      type: StopLossType.VOLATILITY_BASED,
      value: 2, // 2 ATR below current price
      isActive: true
    });
    
    this.defaultConfigs.set(StopLossType.TIME_BASED, {
      type: StopLossType.TIME_BASED,
      value: 0.05, // 5% below entry price
      timeLimit: 30, // 30 days
      isActive: false
    });
    
    this.defaultConfigs.set(StopLossType.VOLUME_BASED, {
      type: StopLossType.VOLUME_BASED,
      value: 0.05, // 5% below entry price
      volumeThreshold: 2, // 2x average volume
      isActive: false
    });
    
    this.defaultConfigs.set(StopLossType.TECHNICAL_BASED, {
      type: StopLossType.TECHNICAL_BASED,
      value: 0,
      technicalIndicator: 'MA50', // 50-day moving average
      isActive: false
    });
    
    this.defaultConfigs.set(StopLossType.COMBINED, {
      type: StopLossType.COMBINED,
      value: 0.05, // 5% below entry price
      isActive: true
    });
  }
  
  /**
   * Initializes alert thresholds
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds.set(RiskAlertLevel.LOW, 10); // 10% away from stop loss
    this.alertThresholds.set(RiskAlertLevel.MEDIUM, 5); // 5% away from stop loss
    this.alertThresholds.set(RiskAlertLevel.HIGH, 2); // 2% away from stop loss
    this.alertThresholds.set(RiskAlertLevel.CRITICAL, 0); // At or below stop loss
  }
}

// Export singleton instance
export const stopLossManagementService = new StopLossManagementService();