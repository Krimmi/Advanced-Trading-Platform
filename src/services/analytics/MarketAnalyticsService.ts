import { MarketDataService } from '../market-data/MarketDataService';
import { MarketDataType, MarketDataEventType, Bar } from '../market-data/IMarketDataProvider';
import { EventEmitter } from 'events';

/**
 * Market Analytics Service
 * 
 * Provides real-time analytics and technical indicators for market data
 */
export class MarketAnalyticsService {
  private static instance: MarketAnalyticsService;
  
  private marketDataService: MarketDataService;
  private eventEmitter: EventEmitter = new EventEmitter();
  private isInitialized: boolean = false;
  
  // Cache for calculated indicators
  private movingAverages: Map<string, Map<string, number[]>> = new Map(); // symbol -> period -> values
  private rsiValues: Map<string, number[]> = new Map(); // symbol -> values
  private macdValues: Map<string, MACDResult[]> = new Map(); // symbol -> values
  private bollingerBands: Map<string, BollingerBandsResult[]> = new Map(); // symbol -> values
  private supportResistanceLevels: Map<string, SupportResistanceResult> = new Map(); // symbol -> levels
  private volumeProfiles: Map<string, VolumeProfileResult> = new Map(); // symbol -> profile
  
  // Historical data cache
  private historicalPrices: Map<string, Map<string, Bar[]>> = new Map(); // symbol -> timeframe -> bars
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.marketDataService = MarketDataService.getInstance();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): MarketAnalyticsService {
    if (!MarketAnalyticsService.instance) {
      MarketAnalyticsService.instance = new MarketAnalyticsService();
    }
    return MarketAnalyticsService.instance;
  }
  
  /**
   * Initialize the market analytics service
   * @param config Configuration for the service
   */
  public async initialize(config: Record<string, any> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Subscribe to market data events
      this.marketDataService.addListener(MarketDataEventType.BAR, this.handleBarData.bind(this));
      this.marketDataService.addListener(MarketDataEventType.TRADE, this.handleTradeData.bind(this));
      
      this.isInitialized = true;
      console.log('Market Analytics Service initialized');
    } catch (error) {
      console.error('Error initializing Market Analytics Service:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to analytics for a symbol
   * @param symbol Symbol to subscribe to
   * @param timeframe Timeframe for the data
   */
  public async subscribeToAnalytics(symbol: string, timeframe: string): Promise<void> {
    // Subscribe to market data
    await this.marketDataService.subscribe(symbol, [MarketDataType.BAR, MarketDataType.TRADE]);
    
    // Load historical data for initial calculations
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const historicalData = await this.marketDataService.getHistoricalData(
      symbol,
      timeframe,
      start,
      end
    );
    
    // Store historical data
    let timeframeMap = this.historicalPrices.get(symbol);
    if (!timeframeMap) {
      timeframeMap = new Map();
      this.historicalPrices.set(symbol, timeframeMap);
    }
    timeframeMap.set(timeframe, historicalData as Bar[]);
    
    // Calculate initial indicators
    await this.calculateAllIndicators(symbol, timeframe);
  }
  
  /**
   * Unsubscribe from analytics for a symbol
   * @param symbol Symbol to unsubscribe from
   */
  public async unsubscribeFromAnalytics(symbol: string): Promise<void> {
    // Unsubscribe from market data
    await this.marketDataService.unsubscribe(symbol);
    
    // Clear cached data
    this.movingAverages.delete(symbol);
    this.rsiValues.delete(symbol);
    this.macdValues.delete(symbol);
    this.bollingerBands.delete(symbol);
    this.supportResistanceLevels.delete(symbol);
    this.volumeProfiles.delete(symbol);
    this.historicalPrices.delete(symbol);
  }
  
  /**
   * Get moving average for a symbol
   * @param symbol Symbol to get moving average for
   * @param period Period for the moving average
   * @param type Type of moving average (SMA, EMA, WMA)
   * @param timeframe Timeframe for the data
   * @returns Moving average values
   */
  public async getMovingAverage(
    symbol: string,
    period: number,
    type: 'SMA' | 'EMA' | 'WMA' = 'SMA',
    timeframe: string = '1d'
  ): Promise<number[]> {
    // Check if we have cached values
    const symbolMap = this.movingAverages.get(symbol);
    if (symbolMap) {
      const key = `${type}_${period}_${timeframe}`;
      const cachedValues = symbolMap.get(key);
      if (cachedValues) {
        return cachedValues;
      }
    }
    
    // Get historical data
    const bars = await this.getHistoricalBars(symbol, timeframe);
    
    // Calculate moving average
    const values = this.calculateMovingAverage(bars.map(b => b.close), period, type);
    
    // Cache the result
    let symbolMap = this.movingAverages.get(symbol);
    if (!symbolMap) {
      symbolMap = new Map();
      this.movingAverages.set(symbol, symbolMap);
    }
    const key = `${type}_${period}_${timeframe}`;
    symbolMap.set(key, values);
    
    return values;
  }
  
  /**
   * Get RSI for a symbol
   * @param symbol Symbol to get RSI for
   * @param period Period for the RSI calculation
   * @param timeframe Timeframe for the data
   * @returns RSI values
   */
  public async getRSI(
    symbol: string,
    period: number = 14,
    timeframe: string = '1d'
  ): Promise<number[]> {
    // Check if we have cached values
    const cachedValues = this.rsiValues.get(symbol);
    if (cachedValues) {
      return cachedValues;
    }
    
    // Get historical data
    const bars = await this.getHistoricalBars(symbol, timeframe);
    
    // Calculate RSI
    const values = this.calculateRSI(bars.map(b => b.close), period);
    
    // Cache the result
    this.rsiValues.set(symbol, values);
    
    return values;
  }
  
  /**
   * Get MACD for a symbol
   * @param symbol Symbol to get MACD for
   * @param fastPeriod Fast period for the MACD calculation
   * @param slowPeriod Slow period for the MACD calculation
   * @param signalPeriod Signal period for the MACD calculation
   * @param timeframe Timeframe for the data
   * @returns MACD values
   */
  public async getMACD(
    symbol: string,
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
    timeframe: string = '1d'
  ): Promise<MACDResult[]> {
    // Check if we have cached values
    const cachedValues = this.macdValues.get(symbol);
    if (cachedValues) {
      return cachedValues;
    }
    
    // Get historical data
    const bars = await this.getHistoricalBars(symbol, timeframe);
    
    // Calculate MACD
    const values = this.calculateMACD(
      bars.map(b => b.close),
      fastPeriod,
      slowPeriod,
      signalPeriod
    );
    
    // Cache the result
    this.macdValues.set(symbol, values);
    
    return values;
  }
  
  /**
   * Get Bollinger Bands for a symbol
   * @param symbol Symbol to get Bollinger Bands for
   * @param period Period for the Bollinger Bands calculation
   * @param stdDev Standard deviation multiplier
   * @param timeframe Timeframe for the data
   * @returns Bollinger Bands values
   */
  public async getBollingerBands(
    symbol: string,
    period: number = 20,
    stdDev: number = 2,
    timeframe: string = '1d'
  ): Promise<BollingerBandsResult[]> {
    // Check if we have cached values
    const cachedValues = this.bollingerBands.get(symbol);
    if (cachedValues) {
      return cachedValues;
    }
    
    // Get historical data
    const bars = await this.getHistoricalBars(symbol, timeframe);
    
    // Calculate Bollinger Bands
    const values = this.calculateBollingerBands(
      bars.map(b => b.close),
      period,
      stdDev
    );
    
    // Cache the result
    this.bollingerBands.set(symbol, values);
    
    return values;
  }
  
  /**
   * Get support and resistance levels for a symbol
   * @param symbol Symbol to get support and resistance levels for
   * @param timeframe Timeframe for the data
   * @returns Support and resistance levels
   */
  public async getSupportResistanceLevels(
    symbol: string,
    timeframe: string = '1d'
  ): Promise<SupportResistanceResult> {
    // Check if we have cached values
    const cachedValues = this.supportResistanceLevels.get(symbol);
    if (cachedValues) {
      return cachedValues;
    }
    
    // Get historical data
    const bars = await this.getHistoricalBars(symbol, timeframe);
    
    // Calculate support and resistance levels
    const values = this.calculateSupportResistance(bars);
    
    // Cache the result
    this.supportResistanceLevels.set(symbol, values);
    
    return values;
  }
  
  /**
   * Get volume profile for a symbol
   * @param symbol Symbol to get volume profile for
   * @param timeframe Timeframe for the data
   * @param numBins Number of price bins
   * @returns Volume profile
   */
  public async getVolumeProfile(
    symbol: string,
    timeframe: string = '1d',
    numBins: number = 10
  ): Promise<VolumeProfileResult> {
    // Check if we have cached values
    const cachedValues = this.volumeProfiles.get(symbol);
    if (cachedValues) {
      return cachedValues;
    }
    
    // Get historical data
    const bars = await this.getHistoricalBars(symbol, timeframe);
    
    // Calculate volume profile
    const values = this.calculateVolumeProfile(bars, numBins);
    
    // Cache the result
    this.volumeProfiles.set(symbol, values);
    
    return values;
  }
  
  /**
   * Add a listener for analytics events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  public addListener(eventType: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(eventType, listener);
  }
  
  /**
   * Remove a listener for analytics events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  public removeListener(eventType: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(eventType, listener);
  }
  
  /**
   * Handle new bar data
   * @param data Bar data
   */
  private async handleBarData(data: any): Promise<void> {
    const { symbol, timeframe } = data;
    
    // Update historical data
    let timeframeMap = this.historicalPrices.get(symbol);
    if (!timeframeMap) {
      timeframeMap = new Map();
      this.historicalPrices.set(symbol, timeframeMap);
    }
    
    let bars = timeframeMap.get(timeframe) || [];
    bars.push(data);
    
    // Keep only the last 1000 bars
    if (bars.length > 1000) {
      bars = bars.slice(-1000);
    }
    
    timeframeMap.set(timeframe, bars);
    
    // Recalculate indicators
    await this.calculateAllIndicators(symbol, timeframe);
    
    // Emit event
    this.eventEmitter.emit('analytics_updated', {
      symbol,
      timeframe,
      timestamp: new Date()
    });
  }
  
  /**
   * Handle new trade data
   * @param data Trade data
   */
  private handleTradeData(data: any): void {
    // Currently we don't do anything with trade data
    // This could be used for real-time tick analysis in the future
  }
  
  /**
   * Calculate all indicators for a symbol
   * @param symbol Symbol to calculate indicators for
   * @param timeframe Timeframe for the data
   */
  private async calculateAllIndicators(symbol: string, timeframe: string): Promise<void> {
    try {
      // Calculate moving averages
      await this.getMovingAverage(symbol, 20, 'SMA', timeframe);
      await this.getMovingAverage(symbol, 50, 'SMA', timeframe);
      await this.getMovingAverage(symbol, 200, 'SMA', timeframe);
      await this.getMovingAverage(symbol, 20, 'EMA', timeframe);
      await this.getMovingAverage(symbol, 50, 'EMA', timeframe);
      
      // Calculate RSI
      await this.getRSI(symbol, 14, timeframe);
      
      // Calculate MACD
      await this.getMACD(symbol, 12, 26, 9, timeframe);
      
      // Calculate Bollinger Bands
      await this.getBollingerBands(symbol, 20, 2, timeframe);
      
      // Calculate support and resistance levels
      await this.getSupportResistanceLevels(symbol, timeframe);
      
      // Calculate volume profile
      await this.getVolumeProfile(symbol, timeframe);
    } catch (error) {
      console.error(`Error calculating indicators for ${symbol}:`, error);
    }
  }
  
  /**
   * Get historical bars for a symbol
   * @param symbol Symbol to get historical bars for
   * @param timeframe Timeframe for the data
   * @returns Historical bars
   */
  private async getHistoricalBars(symbol: string, timeframe: string): Promise<Bar[]> {
    // Check if we have cached data
    const timeframeMap = this.historicalPrices.get(symbol);
    if (timeframeMap) {
      const bars = timeframeMap.get(timeframe);
      if (bars && bars.length > 0) {
        return bars;
      }
    }
    
    // Load historical data
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const historicalData = await this.marketDataService.getHistoricalData(
      symbol,
      timeframe,
      start,
      end
    );
    
    // Store historical data
    let newTimeframeMap = this.historicalPrices.get(symbol);
    if (!newTimeframeMap) {
      newTimeframeMap = new Map();
      this.historicalPrices.set(symbol, newTimeframeMap);
    }
    newTimeframeMap.set(timeframe, historicalData as Bar[]);
    
    return historicalData as Bar[];
  }
  
  /**
   * Calculate moving average
   * @param prices Array of prices
   * @param period Period for the moving average
   * @param type Type of moving average (SMA, EMA, WMA)
   * @returns Moving average values
   */
  private calculateMovingAverage(
    prices: number[],
    period: number,
    type: 'SMA' | 'EMA' | 'WMA' = 'SMA'
  ): number[] {
    if (prices.length < period) {
      return [];
    }
    
    const result: number[] = [];
    
    switch (type) {
      case 'SMA':
        // Simple Moving Average
        for (let i = period - 1; i < prices.length; i++) {
          const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
          result.push(sum / period);
        }
        break;
        
      case 'EMA':
        // Exponential Moving Average
        const multiplier = 2 / (period + 1);
        let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
        result.push(ema);
        
        for (let i = period; i < prices.length; i++) {
          ema = (prices[i] - ema) * multiplier + ema;
          result.push(ema);
        }
        break;
        
      case 'WMA':
        // Weighted Moving Average
        for (let i = period - 1; i < prices.length; i++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let j = 0; j < period; j++) {
            const weight = period - j;
            sum += prices[i - j] * weight;
            weightSum += weight;
          }
          
          result.push(sum / weightSum);
        }
        break;
    }
    
    return result;
  }
  
  /**
   * Calculate RSI
   * @param prices Array of prices
   * @param period Period for the RSI calculation
   * @returns RSI values
   */
  private calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) {
      return [];
    }
    
    const deltas = [];
    for (let i = 1; i < prices.length; i++) {
      deltas.push(prices[i] - prices[i - 1]);
    }
    
    const gains = deltas.map(d => d > 0 ? d : 0);
    const losses = deltas.map(d => d < 0 ? -d : 0);
    
    // Calculate first average gain and loss
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const rsiValues: number[] = [];
    
    // Calculate first RSI
    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
    
    // Calculate remaining RSI values
    for (let i = period; i < deltas.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return rsiValues;
  }
  
  /**
   * Calculate MACD
   * @param prices Array of prices
   * @param fastPeriod Fast period for the MACD calculation
   * @param slowPeriod Slow period for the MACD calculation
   * @param signalPeriod Signal period for the MACD calculation
   * @returns MACD values
   */
  private calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDResult[] {
    if (prices.length < slowPeriod + signalPeriod) {
      return [];
    }
    
    // Calculate EMAs
    const fastEMA = this.calculateMovingAverage(prices, fastPeriod, 'EMA');
    const slowEMA = this.calculateMovingAverage(prices, slowPeriod, 'EMA');
    
    // Calculate MACD line
    const macdLine: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < slowEMA.length; i++) {
      const fastIndex = i + startIndex;
      if (fastIndex >= 0 && fastIndex < fastEMA.length) {
        macdLine.push(fastEMA[fastIndex] - slowEMA[i]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateMovingAverage(macdLine, signalPeriod, 'EMA');
    
    // Calculate histogram (MACD line - signal line)
    const histogram: number[] = [];
    for (let i = 0; i < signalLine.length; i++) {
      const macdIndex = i + signalPeriod - 1;
      if (macdIndex < macdLine.length) {
        histogram.push(macdLine[macdIndex] - signalLine[i]);
      }
    }
    
    // Combine results
    const result: MACDResult[] = [];
    const startOffset = slowPeriod + signalPeriod - 2;
    
    for (let i = 0; i < histogram.length; i++) {
      const priceIndex = i + startOffset;
      if (priceIndex < prices.length) {
        result.push({
          macd: macdLine[i + signalPeriod - 1],
          signal: signalLine[i],
          histogram: histogram[i],
          price: prices[priceIndex]
        });
      }
    }
    
    return result;
  }
  
  /**
   * Calculate Bollinger Bands
   * @param prices Array of prices
   * @param period Period for the Bollinger Bands calculation
   * @param stdDev Standard deviation multiplier
   * @returns Bollinger Bands values
   */
  private calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ): BollingerBandsResult[] {
    if (prices.length < period) {
      return [];
    }
    
    const result: BollingerBandsResult[] = [];
    
    // Calculate SMA
    const sma = this.calculateMovingAverage(prices, period, 'SMA');
    
    // Calculate standard deviation and bands
    for (let i = period - 1; i < prices.length; i++) {
      const smaIndex = i - (period - 1);
      const middle = sma[smaIndex];
      
      // Calculate standard deviation
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += Math.pow(prices[i - j] - middle, 2);
      }
      const standardDeviation = Math.sqrt(sum / period);
      
      // Calculate bands
      const upper = middle + (standardDeviation * stdDev);
      const lower = middle - (standardDeviation * stdDev);
      
      result.push({
        middle,
        upper,
        lower,
        price: prices[i],
        standardDeviation
      });
    }
    
    return result;
  }
  
  /**
   * Calculate support and resistance levels
   * @param bars Array of bars
   * @returns Support and resistance levels
   */
  private calculateSupportResistance(bars: Bar[]): SupportResistanceResult {
    if (bars.length < 10) {
      return {
        support: [],
        resistance: [],
        timestamp: new Date()
      };
    }
    
    const prices = bars.map(b => b.close);
    const highs = bars.map(b => b.high);
    const lows = bars.map(b => b.low);
    
    // Find local maxima and minima
    const localMaxima: number[] = [];
    const localMinima: number[] = [];
    
    for (let i = 2; i < prices.length - 2; i++) {
      // Check for local maximum
      if (
        highs[i] > highs[i - 1] && 
        highs[i] > highs[i - 2] && 
        highs[i] > highs[i + 1] && 
        highs[i] > highs[i + 2]
      ) {
        localMaxima.push(highs[i]);
      }
      
      // Check for local minimum
      if (
        lows[i] < lows[i - 1] && 
        lows[i] < lows[i - 2] && 
        lows[i] < lows[i + 1] && 
        lows[i] < lows[i + 2]
      ) {
        localMinima.push(lows[i]);
      }
    }
    
    // Cluster levels
    const resistanceLevels = this.clusterPriceLevels(localMaxima);
    const supportLevels = this.clusterPriceLevels(localMinima);
    
    return {
      support: supportLevels,
      resistance: resistanceLevels,
      timestamp: new Date()
    };
  }
  
  /**
   * Cluster price levels
   * @param prices Array of prices
   * @returns Clustered price levels
   */
  private clusterPriceLevels(prices: number[]): number[] {
    if (prices.length === 0) {
      return [];
    }
    
    // Sort prices
    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    // Calculate average price
    const avgPrice = sortedPrices.reduce((a, b) => a + b, 0) / sortedPrices.length;
    
    // Calculate clustering threshold (0.5% of average price)
    const threshold = avgPrice * 0.005;
    
    // Cluster prices
    const clusters: number[][] = [];
    let currentCluster: number[] = [sortedPrices[0]];
    
    for (let i = 1; i < sortedPrices.length; i++) {
      const price = sortedPrices[i];
      const prevPrice = sortedPrices[i - 1];
      
      if (price - prevPrice <= threshold) {
        // Add to current cluster
        currentCluster.push(price);
      } else {
        // Start a new cluster
        clusters.push(currentCluster);
        currentCluster = [price];
      }
    }
    
    // Add the last cluster
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }
    
    // Calculate average price for each cluster
    return clusters.map(cluster => {
      return cluster.reduce((a, b) => a + b, 0) / cluster.length;
    });
  }
  
  /**
   * Calculate volume profile
   * @param bars Array of bars
   * @param numBins Number of price bins
   * @returns Volume profile
   */
  private calculateVolumeProfile(bars: Bar[], numBins: number = 10): VolumeProfileResult {
    if (bars.length === 0) {
      return {
        bins: [],
        valueArea: { low: 0, high: 0 },
        pointOfControl: 0,
        timestamp: new Date()
      };
    }
    
    // Find price range
    const prices = bars.map(b => b.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Create bins
    const binSize = priceRange / numBins;
    const bins: VolumeBin[] = [];
    
    for (let i = 0; i < numBins; i++) {
      const lowPrice = minPrice + (i * binSize);
      const highPrice = lowPrice + binSize;
      bins.push({
        lowPrice,
        highPrice,
        volume: 0,
        trades: 0
      });
    }
    
    // Fill bins with volume data
    for (const bar of bars) {
      const avgPrice = (bar.high + bar.low) / 2;
      const binIndex = Math.min(
        numBins - 1,
        Math.floor((avgPrice - minPrice) / binSize)
      );
      
      bins[binIndex].volume += bar.volume;
      bins[binIndex].trades += 1;
    }
    
    // Find point of control (bin with highest volume)
    let maxVolume = 0;
    let pocIndex = 0;
    
    for (let i = 0; i < bins.length; i++) {
      if (bins[i].volume > maxVolume) {
        maxVolume = bins[i].volume;
        pocIndex = i;
      }
    }
    
    const pointOfControl = (bins[pocIndex].lowPrice + bins[pocIndex].highPrice) / 2;
    
    // Calculate value area (70% of volume)
    const totalVolume = bins.reduce((sum, bin) => sum + bin.volume, 0);
    const valueAreaVolume = totalVolume * 0.7;
    
    let currentVolume = bins[pocIndex].volume;
    let lowIndex = pocIndex;
    let highIndex = pocIndex;
    
    while (currentVolume < valueAreaVolume && (lowIndex > 0 || highIndex < bins.length - 1)) {
      const nextLowVolume = lowIndex > 0 ? bins[lowIndex - 1].volume : 0;
      const nextHighVolume = highIndex < bins.length - 1 ? bins[highIndex + 1].volume : 0;
      
      if (nextLowVolume > nextHighVolume) {
        lowIndex--;
        currentVolume += nextLowVolume;
      } else {
        highIndex++;
        currentVolume += nextHighVolume;
      }
    }
    
    const valueArea = {
      low: bins[lowIndex].lowPrice,
      high: bins[highIndex].highPrice
    };
    
    return {
      bins,
      valueArea,
      pointOfControl,
      timestamp: new Date()
    };
  }
}

/**
 * MACD result interface
 */
export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  price: number;
}

/**
 * Bollinger Bands result interface
 */
export interface BollingerBandsResult {
  middle: number;
  upper: number;
  lower: number;
  price: number;
  standardDeviation: number;
}

/**
 * Support and resistance result interface
 */
export interface SupportResistanceResult {
  support: number[];
  resistance: number[];
  timestamp: Date;
}

/**
 * Volume bin interface
 */
export interface VolumeBin {
  lowPrice: number;
  highPrice: number;
  volume: number;
  trades: number;
}

/**
 * Volume profile result interface
 */
export interface VolumeProfileResult {
  bins: VolumeBin[];
  valueArea: {
    low: number;
    high: number;
  };
  pointOfControl: number;
  timestamp: Date;
}