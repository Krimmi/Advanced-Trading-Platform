import { Position } from './TradingServiceFactory';
import { tradingService } from './TradingServiceFactory';
import { marketDataService } from '../marketData/MarketDataServiceFactory';
import { ApiError } from '../BaseApiService';

/**
 * Position summary with additional metrics
 */
export interface PositionSummary extends Position {
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number; // Portfolio weight as percentage
}

/**
 * Portfolio summary
 */
export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: PositionSummary[];
}

/**
 * Position tracking service for monitoring positions
 */
export class PositionTrackingService {
  private static instance: PositionTrackingService;
  private cachedPositions: Position[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): PositionTrackingService {
    if (!PositionTrackingService.instance) {
      PositionTrackingService.instance = new PositionTrackingService();
    }
    return PositionTrackingService.instance;
  }

  /**
   * Get all positions
   * @param forceRefresh - Force refresh from API
   * @returns Promise with positions
   */
  public async getPositions(forceRefresh: boolean = false): Promise<Position[]> {
    try {
      const now = Date.now();
      
      // Return cached positions if available and not expired
      if (!forceRefresh && this.cachedPositions && (now - this.lastFetchTime) < this.CACHE_TTL) {
        return this.cachedPositions;
      }
      
      // Fetch fresh positions
      const positions = await tradingService.getPositions();
      
      // Update cache
      this.cachedPositions = positions;
      this.lastFetchTime = now;
      
      return positions;
    } catch (error) {
      console.error('Error getting positions:', error);
      throw error;
    }
  }

  /**
   * Get position for a specific symbol
   * @param symbol - Stock symbol
   * @returns Promise with position or null if not found
   */
  public async getPosition(symbol: string): Promise<Position | null> {
    try {
      const positions = await this.getPositions();
      return positions.find(p => p.symbol.toUpperCase() === symbol.toUpperCase()) || null;
    } catch (error) {
      console.error(`Error getting position for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio summary with additional metrics
   * @returns Promise with portfolio summary
   */
  public async getPortfolioSummary(): Promise<PortfolioSummary> {
    try {
      // Get positions
      const positions = await this.getPositions(true);
      
      // Get account information for cash balance
      const account = await tradingService.getAccount();
      
      // Calculate portfolio metrics
      let totalValue = 0;
      let totalCostBasis = 0;
      let totalUnrealizedPnl = 0;
      let dayChange = 0;
      
      // Enhanced positions with additional metrics
      const enhancedPositions: PositionSummary[] = [];
      
      // Process each position
      for (const position of positions) {
        // Get latest quote for day change calculation
        const quote = await marketDataService.getQuote(position.symbol);
        
        // Calculate position metrics
        const marketValue = position.quantity * position.currentPrice;
        const costBasis = position.quantity * position.averageEntryPrice;
        const unrealizedPnl = marketValue - costBasis;
        const unrealizedPnlPercent = (unrealizedPnl / costBasis) * 100;
        const dayChange = position.quantity * (quote.price - quote.previousClose);
        const dayChangePercent = ((quote.price - quote.previousClose) / quote.previousClose) * 100;
        
        // Add to totals
        totalValue += marketValue;
        totalCostBasis += costBasis;
        totalUnrealizedPnl += unrealizedPnl;
        dayChange += dayChange;
        
        // Add enhanced position
        enhancedPositions.push({
          ...position,
          marketValue,
          costBasis,
          unrealizedPnl,
          unrealizedPnlPercent,
          dayChange,
          dayChangePercent,
          weight: 0 // Will calculate after total is known
        });
      }
      
      // Calculate portfolio weight for each position
      enhancedPositions.forEach(position => {
        position.weight = (position.marketValue / totalValue) * 100;
      });
      
      // Calculate total metrics
      const totalUnrealizedPnlPercent = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;
      const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;
      
      // Sort positions by weight (descending)
      enhancedPositions.sort((a, b) => b.weight - a.weight);
      
      return {
        totalValue,
        totalCostBasis,
        totalUnrealizedPnl,
        totalUnrealizedPnlPercent,
        dayChange,
        dayChangePercent,
        positions: enhancedPositions
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw error;
    }
  }

  /**
   * Get position history for a symbol
   * @param symbol - Stock symbol
   * @param days - Number of days to look back
   * @returns Promise with position history
   */
  public async getPositionHistory(symbol: string, days: number = 30): Promise<any> {
    try {
      // This would typically come from a database or historical API
      // For now, we'll return a mock implementation
      
      // Get current position
      const position = await this.getPosition(symbol);
      
      if (!position) {
        throw new ApiError(`No position found for ${symbol}`, 404);
      }
      
      // Get historical prices
      const historicalPrices = await marketDataService.getHistoricalPrices(symbol, `${days}d`);
      
      // Generate position history based on current position and historical prices
      const history = historicalPrices.map(price => {
        const closePrice = price.close;
        const marketValue = position.quantity * closePrice;
        const unrealizedPnl = position.quantity * (closePrice - position.averageEntryPrice);
        const unrealizedPnlPercent = (unrealizedPnl / (position.quantity * position.averageEntryPrice)) * 100;
        
        return {
          date: price.date,
          quantity: position.quantity,
          price: closePrice,
          marketValue,
          unrealizedPnl,
          unrealizedPnlPercent
        };
      });
      
      return history;
    } catch (error) {
      console.error(`Error getting position history for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Clear position cache
   */
  public clearCache(): void {
    this.cachedPositions = null;
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const positionTrackingService = PositionTrackingService.getInstance();