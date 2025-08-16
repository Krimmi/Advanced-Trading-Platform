import { EventEmitter } from 'events';
import { Bar } from '../market-data/IMarketDataProvider';
import { HistoricalDataService, HistoricalBarParams } from './HistoricalDataService';

/**
 * Historical data replay configuration
 */
export interface DataReplayConfig {
  symbols: string[];
  startDate: Date;
  endDate: Date;
  timeframe: string;
  includeAfterHours?: boolean;
  replaySpeed?: number; // Speed multiplier (1 = real-time, 0 = as fast as possible)
  dataSource?: 'alpaca' | 'polygon' | 'iex' | 'csv';
  batchSize?: number; // Number of bars to process in each batch
}

/**
 * Historical data replay service
 * 
 * This service replays historical market data for backtesting
 */
export class HistoricalDataReplayService extends EventEmitter {
  private historicalDataService: HistoricalDataService;
  private config: DataReplayConfig;
  private historicalData: Map<string, Bar[]> = new Map();
  private currentIndex: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private replayInterval: NodeJS.Timeout | null = null;
  private currentDate: Date | null = null;
  
  /**
   * Constructor
   * @param config Data replay configuration
   */
  constructor(config: DataReplayConfig) {
    super();
    this.historicalDataService = HistoricalDataService.getInstance();
    this.config = {
      includeAfterHours: false,
      replaySpeed: 0, // Default to as fast as possible
      batchSize: 100,
      ...config
    };
  }
  
  /**
   * Initialize the data replay service
   */
  public async initialize(): Promise<void> {
    // Initialize the historical data service
    await this.historicalDataService.initialize({
      dataSource: this.config.dataSource
    });
    
    // Load historical data for all symbols
    await this.loadHistoricalData();
    
    // Reset replay state
    this.currentIndex = 0;
    this.currentDate = null;
    
    console.log('Historical Data Replay Service initialized');
  }
  
  /**
   * Load historical data for all symbols
   */
  private async loadHistoricalData(): Promise<void> {
    const loadPromises: Promise<void>[] = [];
    
    for (const symbol of this.config.symbols) {
      loadPromises.push(this.loadHistoricalDataForSymbol(symbol));
    }
    
    await Promise.all(loadPromises);
    
    console.log(`Loaded historical data for ${this.config.symbols.length} symbols`);
  }
  
  /**
   * Load historical data for a symbol
   * @param symbol Symbol to load data for
   */
  private async loadHistoricalDataForSymbol(symbol: string): Promise<void> {
    try {
      const params: HistoricalBarParams = {
        symbol,
        timeframe: this.config.timeframe,
        start: this.config.startDate,
        end: this.config.endDate,
        adjustment: 'all' // Apply all adjustments
      };
      
      const bars = await this.historicalDataService.getBars(params);
      
      if (bars.length === 0) {
        console.warn(`No historical data found for ${symbol}`);
        return;
      }
      
      // Filter out after-hours data if not included
      const filteredBars = this.config.includeAfterHours
        ? bars
        : bars.filter(bar => this.isMarketHours(bar.timestamp));
      
      this.historicalData.set(symbol, filteredBars);
      
      console.log(`Loaded ${filteredBars.length} bars for ${symbol}`);
    } catch (error) {
      console.error(`Error loading historical data for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if a timestamp is during market hours
   * @param timestamp Timestamp to check
   * @returns True if during market hours
   */
  private isMarketHours(timestamp: Date): boolean {
    const hours = timestamp.getUTCHours();
    const minutes = timestamp.getUTCMinutes();
    const dayOfWeek = timestamp.getUTCDay();
    
    // Check if it's a weekday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Check if it's during market hours (9:30 AM - 4:00 PM ET)
    // Convert to UTC (ET+4 or ET+5 depending on daylight saving)
    // This is a simplification - in reality, you'd need to account for DST
    const marketOpen = 13 * 60 + 30; // 9:30 AM ET in minutes (UTC+4)
    const marketClose = 20 * 60; // 4:00 PM ET in minutes (UTC+4)
    const currentMinutes = hours * 60 + minutes;
    
    return currentMinutes >= marketOpen && currentMinutes <= marketClose;
  }
  
  /**
   * Start replaying historical data
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('Historical data replay is already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.isCancelled = false;
    
    // Emit start event
    this.emit('start');
    
    // Start replay
    this.replay();
  }
  
  /**
   * Replay historical data
   */
  private replay(): void {
    if (this.isPaused || this.isCancelled) {
      return;
    }
    
    // Get all bars sorted by timestamp
    const allBars = this.getAllBarsSorted();
    
    if (allBars.length === 0) {
      console.warn('No historical data to replay');
      this.stop();
      return;
    }
    
    // If we're at the end, stop
    if (this.currentIndex >= allBars.length) {
      console.log('Replay complete');
      this.stop();
      return;
    }
    
    // Process a batch of bars
    const batchSize = this.config.batchSize!;
    const endIndex = Math.min(this.currentIndex + batchSize, allBars.length);
    
    for (let i = this.currentIndex; i < endIndex; i++) {
      const bar = allBars[i];
      
      // Update current date
      this.currentDate = bar.timestamp;
      
      // Emit bar event
      this.emit('bar', bar);
      
      // Calculate progress
      const progress = (i / allBars.length) * 100;
      this.emit('progress', progress);
    }
    
    // Update current index
    this.currentIndex = endIndex;
    
    // If we're replaying in real-time or at a specific speed
    if (this.config.replaySpeed! > 0) {
      // Calculate time to next batch
      const timeToNextBatch = this.calculateTimeToNextBatch(allBars);
      
      // Schedule next batch
      this.replayInterval = setTimeout(() => {
        this.replay();
      }, timeToNextBatch);
    } else {
      // As fast as possible - use setImmediate for better performance
      setImmediate(() => {
        this.replay();
      });
    }
  }
  
  /**
   * Calculate time to next batch
   * @param allBars All bars sorted by timestamp
   * @returns Time to next batch in milliseconds
   */
  private calculateTimeToNextBatch(allBars: Bar[]): number {
    if (this.currentIndex >= allBars.length) {
      return 0;
    }
    
    const batchSize = this.config.batchSize!;
    const nextIndex = Math.min(this.currentIndex + batchSize, allBars.length - 1);
    
    // If we're at the end, return 0
    if (nextIndex >= allBars.length) {
      return 0;
    }
    
    // Calculate time difference between current and next batch
    const currentBar = allBars[this.currentIndex];
    const nextBar = allBars[nextIndex];
    
    const timeDiff = nextBar.timestamp.getTime() - currentBar.timestamp.getTime();
    
    // Apply replay speed
    return timeDiff / this.config.replaySpeed!;
  }
  
  /**
   * Get all bars sorted by timestamp
   * @returns All bars sorted by timestamp
   */
  private getAllBarsSorted(): Bar[] {
    const allBars: Bar[] = [];
    
    // Collect all bars
    for (const bars of this.historicalData.values()) {
      allBars.push(...bars);
    }
    
    // Sort by timestamp
    allBars.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return allBars;
  }
  
  /**
   * Pause replay
   */
  public pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    this.isPaused = true;
    
    // Clear replay interval
    if (this.replayInterval) {
      clearTimeout(this.replayInterval);
      this.replayInterval = null;
    }
    
    // Emit pause event
    this.emit('pause');
  }
  
  /**
   * Resume replay
   */
  public resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    
    // Emit resume event
    this.emit('resume');
    
    // Resume replay
    this.replay();
  }
  
  /**
   * Stop replay
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    this.isCancelled = true;
    
    // Clear replay interval
    if (this.replayInterval) {
      clearTimeout(this.replayInterval);
      this.replayInterval = null;
    }
    
    // Emit stop event
    this.emit('stop');
  }
  
  /**
   * Reset replay
   */
  public reset(): void {
    // Stop replay if running
    this.stop();
    
    // Reset state
    this.currentIndex = 0;
    this.currentDate = null;
    
    // Emit reset event
    this.emit('reset');
  }
  
  /**
   * Get current progress
   * @returns Progress percentage (0-100)
   */
  public getProgress(): number {
    const allBars = this.getAllBarsSorted();
    
    if (allBars.length === 0) {
      return 0;
    }
    
    return (this.currentIndex / allBars.length) * 100;
  }
  
  /**
   * Get current date
   * @returns Current date
   */
  public getCurrentDate(): Date | null {
    return this.currentDate;
  }
  
  /**
   * Check if replay is running
   * @returns True if replay is running
   */
  public isReplayRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Check if replay is paused
   * @returns True if replay is paused
   */
  public isReplayPaused(): boolean {
    return this.isPaused;
  }
}

// Export singleton instance
export const historicalDataReplayService = new HistoricalDataReplayService({
  symbols: [],
  startDate: new Date(),
  endDate: new Date(),
  timeframe: '1d'
});