/**
 * Transaction cost modeling service for backtesting
 * 
 * This service provides models for simulating transaction costs in backtests,
 * including commissions, slippage, market impact, and spread costs.
 */

/**
 * Commission model types
 */
export enum CommissionModelType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  PER_SHARE = 'per_share',
  TIERED = 'tiered',
  CUSTOM = 'custom'
}

/**
 * Slippage model types
 */
export enum SlippageModelType {
  NONE = 'none',
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  MARKET_IMPACT = 'market_impact',
  VOLUME_BASED = 'volume_based',
  CUSTOM = 'custom'
}

/**
 * Commission model configuration
 */
export interface CommissionModelConfig {
  type: CommissionModelType;
  value: number; // Fixed amount, percentage, or per-share amount
  minCommission?: number; // Minimum commission amount
  maxCommission?: number; // Maximum commission amount
  tiers?: { threshold: number; value: number }[]; // For tiered commission model
  customModelFn?: (price: number, quantity: number, metadata?: any) => number; // For custom commission model
}

/**
 * Slippage model configuration
 */
export interface SlippageModelConfig {
  type: SlippageModelType;
  value: number; // Fixed amount, percentage, or market impact factor
  volumeProfile?: { [hour: number]: number }; // For volume-based slippage model
  customModelFn?: (price: number, quantity: number, volume: number, metadata?: any) => number; // For custom slippage model
}

/**
 * Market impact model configuration
 */
export interface MarketImpactModelConfig {
  factor: number; // Market impact factor
  exponent: number; // Market impact exponent (typically 0.5-0.6)
  minImpact?: number; // Minimum market impact
  maxImpact?: number; // Maximum market impact
}

/**
 * Spread model configuration
 */
export interface SpreadModelConfig {
  type: 'fixed' | 'percentage' | 'custom';
  value: number; // Fixed amount or percentage
  customModelFn?: (price: number, metadata?: any) => number; // For custom spread model
}

/**
 * Transaction cost model configuration
 */
export interface TransactionCostModelConfig {
  commission: CommissionModelConfig;
  slippage: SlippageModelConfig;
  marketImpact?: MarketImpactModelConfig;
  spread?: SpreadModelConfig;
}

/**
 * Transaction cost modeling service
 */
export class TransactionCostModelingService {
  private config: TransactionCostModelConfig;
  
  /**
   * Constructor
   * @param config Transaction cost model configuration
   */
  constructor(config: TransactionCostModelConfig) {
    this.config = config;
  }
  
  /**
   * Calculate commission for a trade
   * @param price Trade price
   * @param quantity Trade quantity
   * @param metadata Additional metadata for custom models
   * @returns Commission amount
   */
  public calculateCommission(price: number, quantity: number, metadata?: any): number {
    const { type, value, minCommission, maxCommission, tiers, customModelFn } = this.config.commission;
    let commission = 0;
    
    switch (type) {
      case CommissionModelType.FIXED:
        commission = value;
        break;
        
      case CommissionModelType.PERCENTAGE:
        commission = price * quantity * (value / 100);
        break;
        
      case CommissionModelType.PER_SHARE:
        commission = quantity * value;
        break;
        
      case CommissionModelType.TIERED:
        if (tiers && tiers.length > 0) {
          // Sort tiers by threshold in descending order
          const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);
          
          // Find the applicable tier
          const tier = sortedTiers.find(t => price * quantity >= t.threshold) || sortedTiers[sortedTiers.length - 1];
          
          commission = price * quantity * (tier.value / 100);
        } else {
          console.warn('No tiers defined for tiered commission model, using default percentage');
          commission = price * quantity * (value / 100);
        }
        break;
        
      case CommissionModelType.CUSTOM:
        if (customModelFn) {
          commission = customModelFn(price, quantity, metadata);
        } else {
          console.warn('No custom function defined for custom commission model, using default percentage');
          commission = price * quantity * (value / 100);
        }
        break;
    }
    
    // Apply min/max constraints
    if (minCommission !== undefined) {
      commission = Math.max(commission, minCommission);
    }
    
    if (maxCommission !== undefined) {
      commission = Math.min(commission, maxCommission);
    }
    
    return commission;
  }
  
  /**
   * Calculate slippage for a trade
   * @param price Trade price
   * @param quantity Trade quantity
   * @param volume Trading volume
   * @param metadata Additional metadata for custom models
   * @returns Slippage amount
   */
  public calculateSlippage(price: number, quantity: number, volume: number, metadata?: any): number {
    const { type, value, volumeProfile, customModelFn } = this.config.slippage;
    let slippage = 0;
    
    switch (type) {
      case SlippageModelType.NONE:
        slippage = 0;
        break;
        
      case SlippageModelType.FIXED:
        slippage = value;
        break;
        
      case SlippageModelType.PERCENTAGE:
        slippage = price * (value / 100);
        break;
        
      case SlippageModelType.MARKET_IMPACT:
        if (this.config.marketImpact) {
          slippage = this.calculateMarketImpact(price, quantity, volume);
        } else {
          console.warn('No market impact model defined, using default percentage slippage');
          slippage = price * (value / 100);
        }
        break;
        
      case SlippageModelType.VOLUME_BASED:
        if (volumeProfile && metadata?.timestamp) {
          const hour = new Date(metadata.timestamp).getUTCHours();
          const volumeFactor = volumeProfile[hour] || 1;
          
          // Higher volume = lower slippage
          slippage = price * (value / 100) * (1 / volumeFactor);
        } else {
          console.warn('No volume profile defined or timestamp missing, using default percentage slippage');
          slippage = price * (value / 100);
        }
        break;
        
      case SlippageModelType.CUSTOM:
        if (customModelFn) {
          slippage = customModelFn(price, quantity, volume, metadata);
        } else {
          console.warn('No custom function defined for custom slippage model, using default percentage');
          slippage = price * (value / 100);
        }
        break;
    }
    
    return slippage;
  }
  
  /**
   * Calculate market impact for a trade
   * @param price Trade price
   * @param quantity Trade quantity
   * @param volume Trading volume
   * @returns Market impact amount
   */
  public calculateMarketImpact(price: number, quantity: number, volume: number): number {
    if (!this.config.marketImpact) {
      return 0;
    }
    
    const { factor, exponent, minImpact, maxImpact } = this.config.marketImpact;
    
    // Calculate market impact using square-root model
    // Impact = factor * price * (quantity / volume) ^ exponent
    let impact = factor * price * Math.pow(quantity / Math.max(volume, 1), exponent);
    
    // Apply min/max constraints
    if (minImpact !== undefined) {
      impact = Math.max(impact, minImpact);
    }
    
    if (maxImpact !== undefined) {
      impact = Math.min(impact, maxImpact);
    }
    
    return impact;
  }
  
  /**
   * Calculate spread cost for a trade
   * @param price Trade price
   * @param metadata Additional metadata for custom models
   * @returns Spread cost amount
   */
  public calculateSpreadCost(price: number, metadata?: any): number {
    if (!this.config.spread) {
      return 0;
    }
    
    const { type, value, customModelFn } = this.config.spread;
    let spreadCost = 0;
    
    switch (type) {
      case 'fixed':
        spreadCost = value;
        break;
        
      case 'percentage':
        spreadCost = price * (value / 100);
        break;
        
      case 'custom':
        if (customModelFn) {
          spreadCost = customModelFn(price, metadata);
        } else {
          console.warn('No custom function defined for custom spread model, using default percentage');
          spreadCost = price * (value / 100);
        }
        break;
    }
    
    return spreadCost;
  }
  
  /**
   * Calculate total transaction cost for a trade
   * @param price Trade price
   * @param quantity Trade quantity
   * @param volume Trading volume
   * @param metadata Additional metadata for custom models
   * @returns Total transaction cost
   */
  public calculateTotalTransactionCost(price: number, quantity: number, volume: number, metadata?: any): {
    commission: number;
    slippage: number;
    marketImpact: number;
    spreadCost: number;
    total: number;
  } {
    const commission = this.calculateCommission(price, quantity, metadata);
    const slippage = this.calculateSlippage(price, quantity, volume, metadata);
    const marketImpact = this.calculateMarketImpact(price, quantity, volume);
    const spreadCost = this.calculateSpreadCost(price, metadata);
    
    const total = commission + slippage + marketImpact + spreadCost;
    
    return {
      commission,
      slippage,
      marketImpact,
      spreadCost,
      total
    };
  }
  
  /**
   * Get adjusted execution price including slippage and market impact
   * @param price Base price
   * @param quantity Trade quantity
   * @param volume Trading volume
   * @param isBuy Whether the trade is a buy (true) or sell (false)
   * @param metadata Additional metadata for custom models
   * @returns Adjusted execution price
   */
  public getAdjustedExecutionPrice(
    price: number,
    quantity: number,
    volume: number,
    isBuy: boolean,
    metadata?: any
  ): number {
    const slippage = this.calculateSlippage(price, quantity, volume, metadata);
    const marketImpact = this.calculateMarketImpact(price, quantity, volume);
    const spreadCost = this.calculateSpreadCost(price, metadata);
    
    // For buys, price increases; for sells, price decreases
    const priceAdjustment = slippage + marketImpact + spreadCost;
    
    return isBuy ? price + priceAdjustment : price - priceAdjustment;
  }
  
  /**
   * Update transaction cost model configuration
   * @param config New configuration
   */
  public updateConfig(config: Partial<TransactionCostModelConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Get current transaction cost model configuration
   * @returns Current configuration
   */
  public getConfig(): TransactionCostModelConfig {
    return { ...this.config };
  }
}

/**
 * Create a default transaction cost model configuration
 * @returns Default transaction cost model configuration
 */
export function createDefaultTransactionCostModelConfig(): TransactionCostModelConfig {
  return {
    commission: {
      type: CommissionModelType.PERCENTAGE,
      value: 0.1, // 0.1% commission
      minCommission: 1, // $1 minimum commission
    },
    slippage: {
      type: SlippageModelType.PERCENTAGE,
      value: 0.05, // 0.05% slippage
    },
    marketImpact: {
      factor: 0.1,
      exponent: 0.5,
      minImpact: 0,
      maxImpact: Number.POSITIVE_INFINITY
    },
    spread: {
      type: 'percentage',
      value: 0.01 // 0.01% spread
    }
  };
}

// Export default instance with standard configuration
export const transactionCostModelingService = new TransactionCostModelingService(
  createDefaultTransactionCostModelConfig()
);