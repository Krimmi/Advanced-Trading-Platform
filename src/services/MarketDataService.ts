import axios from 'axios';
import { 
  MarketBreadthData, 
  AnomalyData, 
  CorrelationData, 
  OrderFlowData 
} from '../types/analytics';

/**
 * Service for fetching real-time market data
 */
export default class MarketDataService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Get market breadth data
   * @param index Optional market index to filter by
   * @returns Market breadth data
   */
  public async getMarketBreadth(index?: string): Promise<MarketBreadthData> {
    try {
      const params = new URLSearchParams();
      if (index) {
        params.append('index', index);
      }

      const response = await axios.get(`${this.apiUrl}/api/market-data/breadth?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market breadth data:', error);
      
      // Return mock data for development purposes
      return this.getMockMarketBreadthData();
    }
  }

  /**
   * Get anomaly detection data
   * @param category Optional category to filter by
   * @param severity Optional severity level to filter by
   * @returns Anomaly detection data
   */
  public async getAnomalyDetection(category?: string, severity?: string): Promise<AnomalyData> {
    try {
      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }
      if (severity) {
        params.append('severity', severity);
      }

      const response = await axios.get(`${this.apiUrl}/api/market-data/anomalies?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anomaly detection data:', error);
      
      // Return mock data for development purposes
      return this.getMockAnomalyData();
    }
  }

  /**
   * Get correlation matrix data
   * @param assetClass Optional asset class to filter by
   * @param timeframe Optional timeframe for correlation calculation
   * @returns Correlation data
   */
  public async getCorrelationMatrix(assetClass?: string, timeframe?: string): Promise<CorrelationData> {
    try {
      const params = new URLSearchParams();
      if (assetClass) {
        params.append('assetClass', assetClass);
      }
      if (timeframe) {
        params.append('timeframe', timeframe);
      }

      const response = await axios.get(`${this.apiUrl}/api/market-data/correlations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching correlation matrix data:', error);
      
      // Return mock data for development purposes
      return this.getMockCorrelationData();
    }
  }

  /**
   * Get order flow data
   * @param symbol Optional symbol to filter by
   * @param orderType Optional order type to filter by
   * @returns Order flow data
   */
  public async getOrderFlow(symbol?: string, orderType?: string): Promise<OrderFlowData> {
    try {
      const params = new URLSearchParams();
      if (symbol) {
        params.append('symbol', symbol);
      }
      if (orderType) {
        params.append('orderType', orderType);
      }

      const response = await axios.get(`${this.apiUrl}/api/market-data/order-flow?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order flow data:', error);
      
      // Return mock data for development purposes
      return this.getMockOrderFlowData();
    }
  }

  /**
   * Get real-time price data
   * @param symbols Array of symbols to get prices for
   * @returns Real-time price data
   */
  public async getRealTimePrices(symbols: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/market-data/prices`, { symbols });
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time price data:', error);
      
      // Return mock data for development purposes
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 1000 + 50,
        change: (Math.random() * 10 - 5).toFixed(2),
        percentChange: (Math.random() * 0.1 - 0.05).toFixed(4),
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Subscribe to real-time market data updates
   * @param dataType Type of data to subscribe to
   * @param callback Callback function to handle updates
   * @returns Subscription ID
   */
  public subscribeToMarketData(dataType: string, callback: (data: any) => void): string {
    // In a real implementation, this would set up a WebSocket connection
    // For now, we'll just return a mock subscription ID
    const subscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}`;
    
    // Set up a mock interval to simulate real-time updates
    const interval = setInterval(() => {
      let data;
      switch (dataType) {
        case 'breadth':
          data = this.getMockMarketBreadthData();
          break;
        case 'anomalies':
          data = this.getMockAnomalyData();
          break;
        case 'correlations':
          data = this.getMockCorrelationData();
          break;
        case 'orderFlow':
          data = this.getMockOrderFlowData();
          break;
        default:
          data = {};
      }
      
      callback(data);
    }, 5000); // Update every 5 seconds
    
    // Store the interval ID for cleanup
    this.subscriptions[subscriptionId] = interval;
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time market data updates
   * @param subscriptionId Subscription ID to unsubscribe
   */
  public unsubscribeFromMarketData(subscriptionId: string): void {
    if (this.subscriptions[subscriptionId]) {
      clearInterval(this.subscriptions[subscriptionId]);
      delete this.subscriptions[subscriptionId];
    }
  }

  // Store active subscriptions
  private subscriptions: { [key: string]: NodeJS.Timeout } = {};

  // Mock data generators for development purposes
  private getMockMarketBreadthData(): MarketBreadthData {
    const now = new Date();
    const dateStr = now.toISOString();
    
    // Generate mock advance/decline data
    const advancing = Math.floor(Math.random() * 1500) + 1000;
    const declining = Math.floor(Math.random() * 1000) + 500;
    const unchanged = Math.floor(Math.random() * 200) + 50;
    const total = advancing + declining + unchanged;
    
    // Generate mock historical data
    const advanceDeclineHistory = Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      const adv = Math.floor(Math.random() * 1500) + 1000;
      const dec = Math.floor(Math.random() * 1000) + 500;
      const unch = Math.floor(Math.random() * 200) + 50;
      
      return {
        date: date.toISOString().split('T')[0],
        advancing: adv,
        declining: dec,
        unchanged: unch,
        advanceDeclineRatio: adv / dec,
        advanceDeclineSpread: adv - dec
      };
    });
    
    // Generate mock highs/lows data
    const highsLows = Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      const newHighs = Math.floor(Math.random() * 200) + 50;
      const newLows = Math.floor(Math.random() * 100) + 20;
      
      return {
        date: date.toISOString().split('T')[0],
        newHighs,
        newLows,
        highLowRatio: newHighs / newLows
      };
    });
    
    return {
      asOf: dateStr,
      advanceDecline: {
        advancing,
        declining,
        unchanged,
        advancingPercent: advancing / total,
        decliningPercent: declining / total,
        advanceDeclineRatio: advancing / declining,
        advanceDeclineSpread: advancing - declining
      },
      advanceDeclineHistory,
      breadthIndicators: [
        {
          name: 'McClellan Oscillator',
          value: (Math.random() * 200) - 100,
          change: (Math.random() * 20) - 10,
          signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
        },
        {
          name: 'McClellan Summation Index',
          value: (Math.random() * 2000) - 1000,
          change: (Math.random() * 100) - 50,
          signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
        },
        {
          name: 'Advance/Decline Line',
          value: (Math.random() * 10000) + 5000,
          change: (Math.random() * 500) - 250,
          signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
        },
        {
          name: 'Percentage of Stocks Above 50-Day MA',
          value: Math.random() * 100,
          change: (Math.random() * 10) - 5,
          signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
        },
        {
          name: 'Percentage of Stocks Above 200-Day MA',
          value: Math.random() * 100,
          change: (Math.random() * 5) - 2.5,
          signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
        },
        {
          name: 'NYSE TRIN (Arms Index)',
          value: (Math.random() * 2) + 0.5,
          change: (Math.random() * 0.4) - 0.2,
          signal: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
        }
      ],
      highsLows,
      marketStats: [
        {
          index: 'SPX',
          value: 4800 + (Math.random() * 200) - 100,
          change: (Math.random() * 50) - 25,
          percentChange: (Math.random() * 0.02) - 0.01,
          volume: Math.floor(Math.random() * 1000000000) + 500000000
        },
        {
          index: 'NDX',
          value: 16000 + (Math.random() * 500) - 250,
          change: (Math.random() * 100) - 50,
          percentChange: (Math.random() * 0.02) - 0.01,
          volume: Math.floor(Math.random() * 500000000) + 200000000
        },
        {
          index: 'DJI',
          value: 36000 + (Math.random() * 1000) - 500,
          change: (Math.random() * 200) - 100,
          percentChange: (Math.random() * 0.02) - 0.01,
          volume: Math.floor(Math.random() * 300000000) + 100000000
        },
        {
          index: 'RUT',
          value: 2000 + (Math.random() * 100) - 50,
          change: (Math.random() * 30) - 15,
          percentChange: (Math.random() * 0.02) - 0.01,
          volume: Math.floor(Math.random() * 200000000) + 100000000
        }
      ],
      sectorPerformance: [
        {
          name: 'Technology',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 500000000) + 200000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Financial',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 400000000) + 150000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Healthcare',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 300000000) + 100000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Consumer Discretionary',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 250000000) + 100000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Consumer Staples',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 200000000) + 80000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Energy',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 180000000) + 70000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Utilities',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 150000000) + 60000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Real Estate',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 120000000) + 50000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Materials',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 100000000) + 40000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Industrials',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 220000000) + 90000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        },
        {
          name: 'Communication Services',
          performance: (Math.random() * 0.04) - 0.02,
          volume: Math.floor(Math.random() * 180000000) + 70000000,
          advanceDeclineRatio: (Math.random() * 2) + 0.5
        }
      ]
    };
  }

  private getMockAnomalyData(): AnomalyData {
    const now = new Date();
    const dateStr = now.toISOString();
    
    // Generate mock anomalies
    const anomalies: Anomaly[] = [];
    const categories = ['Price Action', 'Volume', 'Volatility', 'Correlation', 'Options', 'News'];
    const severities = ['critical', 'high', 'medium', 'low', 'info'] as const;
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'IWM'];
    
    // Generate 10-20 random anomalies
    const numAnomalies = Math.floor(Math.random() * 11) + 10;
    
    for (let i = 0; i < numAnomalies; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Generate timestamp within the last 24 hours
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 24));
      
      // Generate historical data
      const historicalData = Array(30).fill(0).map((_, i) => {
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (29 - i));
        
        return {
          timestamp: timestamp.toISOString(),
          value: 100 + (Math.random() * 20) - 10
        };
      });
      
      // Add a spike or drop for the anomaly
      const anomalyIndex = Math.floor(historicalData.length * 0.8);
      if (severity === 'critical' || severity === 'high') {
        historicalData[anomalyIndex].value = historicalData[anomalyIndex].value * (Math.random() > 0.5 ? 1.2 : 0.8);
      }
      
      // Generate related indicators
      const relatedIndicators = Array(30).fill(0).map((_, i) => {
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (29 - i));
        
        return {
          timestamp: timestamp.toISOString(),
          indicator1: Math.random() * 100,
          indicator2: Math.random() * 50,
          indicator3: Math.random() * 25
        };
      });
      
      anomalies.push({
        id: `anomaly_${i}_${Date.now()}`,
        title: this.getAnomalyTitle(category, symbol),
        description: this.getAnomalyDescription(category, symbol),
        symbol,
        timestamp: timestamp.toISOString(),
        severity,
        category,
        status: Math.random() > 0.7 ? 'Resolved' : Math.random() > 0.5 ? 'Monitoring' : 'Active',
        confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        metrics: [
          {
            name: 'Z-Score',
            value: (Math.random() * 6 - 3).toFixed(2),
            direction: Math.random() > 0.5 ? 'up' : 'down'
          },
          {
            name: 'Deviation',
            value: `${(Math.random() * 100).toFixed(1)}%`,
            direction: Math.random() > 0.5 ? 'up' : 'down'
          },
          {
            name: 'Duration',
            value: `${Math.floor(Math.random() * 60)} min`,
            direction: 'flat'
          }
        ],
        recommendations: [
          'Monitor for continued abnormal behavior',
          'Check for news or events that might explain the anomaly',
          'Consider adjusting position sizing if trading this security'
        ],
        historicalData,
        thresholds: [
          {
            type: 'upper',
            value: 110
          },
          {
            type: 'lower',
            value: 90
          }
        ],
        relatedIndicators
      });
    }
    
    // Count anomalies by severity
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
    const mediumAnomalies = anomalies.filter(a => a.severity === 'medium').length;
    const lowAnomalies = anomalies.filter(a => a.severity === 'low').length;
    const infoAnomalies = anomalies.filter(a => a.severity === 'info').length;
    
    return {
      asOf: dateStr,
      anomalies,
      categories,
      summary: {
        totalAnomalies: anomalies.length,
        newAnomalies: Math.floor(anomalies.length * 0.3),
        criticalAnomalies,
        highAnomalies,
        mediumAnomalies,
        lowAnomalies,
        infoAnomalies,
        marketVolatility: Math.random() * 30 + 10,
        volatilityDirection: Math.random() > 0.5 ? 'up' : 'down',
        riskScore: Math.floor(Math.random() * 100),
        riskLevel: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low'
      }
    };
  }

  private getAnomalyTitle(category: string, symbol: string): string {
    switch (category) {
      case 'Price Action':
        return Math.random() > 0.5 ? 
          `Unusual price movement detected in ${symbol}` : 
          `${symbol} price gap outside normal range`;
      case 'Volume':
        return Math.random() > 0.5 ? 
          `Abnormal trading volume in ${symbol}` : 
          `${symbol} volume spike without price movement`;
      case 'Volatility':
        return Math.random() > 0.5 ? 
          `Volatility surge detected in ${symbol}` : 
          `${symbol} implied volatility divergence`;
      case 'Correlation':
        return Math.random() > 0.5 ? 
          `${symbol} correlation breakdown with sector` : 
          `Unusual correlation pattern for ${symbol}`;
      case 'Options':
        return Math.random() > 0.5 ? 
          `Unusual options activity in ${symbol}` : 
          `${symbol} put/call ratio anomaly`;
      case 'News':
        return Math.random() > 0.5 ? 
          `${symbol} price movement without news` : 
          `Delayed price reaction to ${symbol} news`;
      default:
        return `Anomaly detected in ${symbol}`;
    }
  }

  private getAnomalyDescription(category: string, symbol: string): string {
    switch (category) {
      case 'Price Action':
        return `${symbol} has experienced a significant price movement that deviates from its historical pattern. This movement is outside the expected range based on recent volatility and trading patterns.`;
      case 'Volume':
        return `Trading volume for ${symbol} has increased significantly compared to its average daily volume. This unusual activity may indicate potential institutional interest or upcoming news.`;
      case 'Volatility':
        return `${symbol} is showing abnormal volatility patterns. The current implied volatility is significantly different from historical volatility, suggesting potential market uncertainty.`;
      case 'Correlation':
        return `${symbol} has broken its normal correlation pattern with its sector or related securities. This divergence may indicate company-specific factors affecting the stock.`;
      case 'Options':
        return `Unusual options activity detected in ${symbol}. There is a significant imbalance in put/call ratio or open interest that deviates from normal patterns.`;
      case 'News':
        return `${symbol} is showing price action that doesn't align with recent news or announcements. This may indicate potential information asymmetry or delayed market reaction.`;
      default:
        return `An anomaly has been detected in ${symbol} that requires further investigation.`;
    }
  }

  private getMockCorrelationData(): CorrelationData {
    const now = new Date();
    const dateStr = now.toISOString();
    
    // Define asset classes and symbols
    const assetClasses = ['Equities', 'Fixed Income', 'Commodities', 'Currencies', 'Crypto'];
    
    const assets = [
      // Equities
      'SPY', 'QQQ', 'IWM', 'DIA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA',
      // Fixed Income
      'TLT', 'IEF', 'SHY', 'LQD', 'HYG',
      // Commodities
      'GLD', 'SLV', 'USO', 'UNG', 'DBC',
      // Currencies
      'UUP', 'FXE', 'FXY', 'FXB', 'FXA',
      // Crypto
      'BTC', 'ETH', 'SOL', 'ADA', 'DOT'
    ];
    
    // Create asset info
    const assetInfo = [
      // Equities
      { symbol: 'SPY', name: 'S&P 500 ETF', assetClass: 'Equities', sector: 'Broad Market' },
      { symbol: 'QQQ', name: 'Nasdaq 100 ETF', assetClass: 'Equities', sector: 'Technology' },
      { symbol: 'IWM', name: 'Russell 2000 ETF', assetClass: 'Equities', sector: 'Small Cap' },
      { symbol: 'DIA', name: 'Dow Jones Industrial Average ETF', assetClass: 'Equities', sector: 'Blue Chip' },
      { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'Equities', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', assetClass: 'Equities', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'Equities', sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'Equities', sector: 'Consumer Discretionary' },
      { symbol: 'META', name: 'Meta Platforms Inc.', assetClass: 'Equities', sector: 'Technology' },
      { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'Equities', sector: 'Consumer Discretionary' },
      
      // Fixed Income
      { symbol: 'TLT', name: '20+ Year Treasury Bond ETF', assetClass: 'Fixed Income', sector: 'Government' },
      { symbol: 'IEF', name: '7-10 Year Treasury Bond ETF', assetClass: 'Fixed Income', sector: 'Government' },
      { symbol: 'SHY', name: '1-3 Year Treasury Bond ETF', assetClass: 'Fixed Income', sector: 'Government' },
      { symbol: 'LQD', name: 'Investment Grade Corporate Bond ETF', assetClass: 'Fixed Income', sector: 'Corporate' },
      { symbol: 'HYG', name: 'High Yield Corporate Bond ETF', assetClass: 'Fixed Income', sector: 'Corporate' },
      
      // Commodities
      { symbol: 'GLD', name: 'Gold ETF', assetClass: 'Commodities', sector: 'Precious Metals' },
      { symbol: 'SLV', name: 'Silver ETF', assetClass: 'Commodities', sector: 'Precious Metals' },
      { symbol: 'USO', name: 'Oil Fund ETF', assetClass: 'Commodities', sector: 'Energy' },
      { symbol: 'UNG', name: 'Natural Gas Fund ETF', assetClass: 'Commodities', sector: 'Energy' },
      { symbol: 'DBC', name: 'Commodity Index ETF', assetClass: 'Commodities', sector: 'Broad Market' },
      
      // Currencies
      { symbol: 'UUP', name: 'US Dollar Index ETF', assetClass: 'Currencies', sector: 'USD' },
      { symbol: 'FXE', name: 'Euro ETF', assetClass: 'Currencies', sector: 'EUR' },
      { symbol: 'FXY', name: 'Japanese Yen ETF', assetClass: 'Currencies', sector: 'JPY' },
      { symbol: 'FXB', name: 'British Pound ETF', assetClass: 'Currencies', sector: 'GBP' },
      { symbol: 'FXA', name: 'Australian Dollar ETF', assetClass: 'Currencies', sector: 'AUD' },
      
      // Crypto
      { symbol: 'BTC', name: 'Bitcoin', assetClass: 'Crypto', sector: 'Large Cap' },
      { symbol: 'ETH', name: 'Ethereum', assetClass: 'Crypto', sector: 'Large Cap' },
      { symbol: 'SOL', name: 'Solana', assetClass: 'Crypto', sector: 'Alt Coin' },
      { symbol: 'ADA', name: 'Cardano', assetClass: 'Crypto', sector: 'Alt Coin' },
      { symbol: 'DOT', name: 'Polkadot', assetClass: 'Crypto', sector: 'Alt Coin' }
    ];
    
    // Generate correlation matrix
    const size = assets.length;
    const correlationMatrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    
    // Fill the matrix
    for (let i = 0; i < size; i++) {
      correlationMatrix[i][i] = 1; // Diagonal is always 1
      
      for (let j = 0; j < i; j++) {
        // Generate correlation based on asset classes
        const asset1Class = assetInfo[i].assetClass;
        const asset2Class = assetInfo[j].assetClass;
        const asset1Sector = assetInfo[i].sector;
        const asset2Sector = assetInfo[j].sector;
        
        let baseCor = 0;
        
        // Same asset class
        if (asset1Class === asset2Class) {
          baseCor = 0.7;
          
          // Same sector within asset class
          if (asset1Sector === asset2Sector) {
            baseCor = 0.85;
          }
        } else {
          // Different asset classes
          
          // Equities and Fixed Income often have negative correlation
          if ((asset1Class === 'Equities' && asset2Class === 'Fixed Income') || 
              (asset1Class === 'Fixed Income' && asset2Class === 'Equities')) {
            baseCor = -0.4;
          }
          // Equities and Commodities can have mixed correlation
          else if ((asset1Class === 'Equities' && asset2Class === 'Commodities') || 
                  (asset1Class === 'Commodities' && asset2Class === 'Equities')) {
            baseCor = 0.3;
          }
          // Crypto and Equities have some correlation
          else if ((asset1Class === 'Equities' && asset2Class === 'Crypto') || 
                  (asset1Class === 'Crypto' && asset2Class === 'Equities')) {
            baseCor = 0.5;
          }
          // Other combinations
          else {
            baseCor = 0.1;
          }
        }
        
        // Add some randomness
        const correlation = Math.max(-1, Math.min(1, baseCor + (Math.random() * 0.4 - 0.2)));
        
        correlationMatrix[i][j] = correlation;
        correlationMatrix[j][i] = correlation; // Matrix is symmetric
      }
    }
    
    // Generate correlation time series for some pairs
    const correlationTimeSeries = [];
    
    // Generate a few interesting pairs
    const pairs = [
      { asset1: 'SPY', asset2: 'TLT' },
      { asset1: 'SPY', asset2: 'GLD' },
      { asset1: 'QQQ', asset2: 'BTC' },
      { asset1: 'UUP', asset2: 'GLD' },
      { asset1: 'AAPL', asset2: 'MSFT' }
    ];
    
    for (const pair of pairs) {
      const data = Array(90).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (89 - i));
        
        // Base correlation with trend and cyclical component
        const trend = (i / 90) * 0.4 - 0.2; // -0.2 to 0.2 trend
        const cycle = Math.sin(i / 10) * 0.3; // Cyclical component
        const noise = (Math.random() * 0.4) - 0.2; // Random noise
        
        let correlation = 0.5 + trend + cycle + noise;
        correlation = Math.max(-1, Math.min(1, correlation)); // Clamp to [-1, 1]
        
        return {
          date: date.toISOString().split('T')[0],
          correlation
        };
      });
      
      correlationTimeSeries.push({
        asset1: pair.asset1,
        asset2: pair.asset2,
        data
      });
    }
    
    return {
      asOf: dateStr,
      assets,
      assetClasses,
      assetInfo,
      correlationMatrix,
      correlationTimeSeries
    };
  }

  private getMockOrderFlowData(): OrderFlowData {
    const now = new Date();
    const dateStr = now.toISOString();
    
    // Define symbols
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'IWM'];
    
    // Generate recent orders
    const recentOrders: Order[] = [];
    const orderTypes = ['market', 'limit', 'stop', 'stop-limit'];
    const orderStatuses = ['Pending', 'Filled', 'Partial', 'Canceled', 'Rejected'];
    
    // Generate 50-100 random orders
    const numOrders = Math.floor(Math.random() * 51) + 50;
    
    for (let i = 0; i < numOrders; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const type = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      // Generate base price for the symbol
      const basePrice = this.getBasePrice(symbol);
      
      // Generate price with some variation
      const price = basePrice * (1 + (Math.random() * 0.02 - 0.01));
      
      // Generate quantity
      const quantity = Math.floor(Math.random() * 1000) + 100;
      
      // Generate timestamp within the last hour
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 60));
      
      recentOrders.push({
        id: `order_${i}_${Date.now()}`,
        symbol,
        side,
        price,
        quantity,
        timestamp: timestamp.toISOString(),
        type: type as any,
        status: status as any
      });
    }
    
    // Sort orders by timestamp (newest first)
    recentOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Generate market depth data
    const marketDepth: MarketDepth[] = symbols.map(symbol => {
      const basePrice = this.getBasePrice(symbol);
      const bidPrice = basePrice * (1 - (Math.random() * 0.001));
      const askPrice = basePrice * (1 + (Math.random() * 0.001));
      
      // Generate bid levels
      const bidLevels: PriceLevel[] = Array(10).fill(0).map((_, i) => {
        const levelPrice = bidPrice * (1 - (i * 0.001));
        const levelVolume = Math.floor(Math.random() * 5000) + 1000;
        
        return {
          price: levelPrice,
          volume: levelVolume
        };
      });
      
      // Generate ask levels
      const askLevels: PriceLevel[] = Array(10).fill(0).map((_, i) => {
        const levelPrice = askPrice * (1 + (i * 0.001));
        const levelVolume = Math.floor(Math.random() * 5000) + 1000;
        
        return {
          price: levelPrice,
          volume: levelVolume
        };
      });
      
      // Calculate total bid and ask volume
      const bidVolume = bidLevels.reduce((sum, level) => sum + level.volume, 0);
      const askVolume = askLevels.reduce((sum, level) => sum + level.volume, 0);
      
      return {
        symbol,
        timestamp: dateStr,
        bidPrice,
        askPrice,
        bidVolume,
        askVolume,
        bidLevels,
        askLevels
      };
    });
    
    // Generate price impact data
    const priceImpact = symbols.map(symbol => {
      const basePrice = this.getBasePrice(symbol);
      
      // Generate price impact data points
      const data = Array(30).fill(0).map((_, i) => {
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (29 - i));
        
        // Generate price with trend and noise
        const trend = (i / 30) * 0.01; // Small upward trend
        const noise = (Math.random() * 0.02) - 0.01; // Random noise
        const price = basePrice * (1 + trend + noise);
        
        // Generate impact
        const impact = (Math.random() * 0.004) - 0.002;
        
        // Generate cumulative impact
        const cumulativeImpact = (i / 30) * 0.01 * (Math.random() > 0.5 ? 1 : -1);
        
        // Generate volume
        const volume = Math.floor(Math.random() * 10000) + 1000;
        
        return {
          timestamp: timestamp.toISOString(),
          price,
          impact,
          cumulativeImpact,
          volume
        };
      });
      
      return {
        symbol,
        data
      };
    });
    
    return {
      asOf: dateStr,
      symbols,
      recentOrders,
      marketDepth,
      priceImpact
    };
  }

  private getBasePrice(symbol: string): number {
    // Return a realistic base price for each symbol
    switch (symbol) {
      case 'AAPL': return 180 + (Math.random() * 20 - 10);
      case 'MSFT': return 350 + (Math.random() * 30 - 15);
      case 'GOOGL': return 140 + (Math.random() * 15 - 7.5);
      case 'AMZN': return 160 + (Math.random() * 20 - 10);
      case 'META': return 320 + (Math.random() * 30 - 15);
      case 'TSLA': return 240 + (Math.random() * 25 - 12.5);
      case 'NVDA': return 450 + (Math.random() * 40 - 20);
      case 'SPY': return 480 + (Math.random() * 10 - 5);
      case 'QQQ': return 400 + (Math.random() * 15 - 7.5);
      case 'IWM': return 200 + (Math.random() * 10 - 5);
      default: return 100 + (Math.random() * 10 - 5);
    }
  }
}