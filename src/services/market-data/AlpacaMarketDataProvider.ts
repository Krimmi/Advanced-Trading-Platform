import axios from 'axios';
import WebSocket from 'ws';
import {
  ConnectionStatus,
  MarketDataType,
  Quote,
  Trade,
  OrderBook,
  MarketData
} from './IMarketDataProvider';
import { BaseMarketDataProvider } from './BaseMarketDataProvider';
import { environmentConfig } from '../config/EnvironmentConfig';
import { secretManager } from '../config/SecretManager';

/**
 * Alpaca Market Data Provider
 * 
 * Implements real-time and historical market data from Alpaca Markets
 * https://alpaca.markets/docs/api-references/market-data-api/
 */
export class AlpacaMarketDataProvider extends BaseMarketDataProvider {
  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl: string = '';
  private wsUrl: string = '';
  private dataWs: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  
  /**
   * Constructor
   */
  constructor() {
    super('Alpaca Market Data');
  }
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected async onInitialize(config: Record<string, any>): Promise<void> {
    // Extract configuration
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Alpaca API key and secret are required');
    }
    
    // Set URLs based on paper/live mode
    const isPaperTrading = config.paperTrading !== false;
    
    if (isPaperTrading) {
      this.baseUrl = 'https://paper-api.alpaca.markets';
      this.wsUrl = 'wss://stream.data.alpaca.markets/v2';
    } else {
      this.baseUrl = 'https://api.alpaca.markets';
      this.wsUrl = 'wss://stream.data.alpaca.markets/v2';
    }
    
    // Override URLs if provided in config
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
    
    if (config.wsUrl) {
      this.wsUrl = config.wsUrl;
    }
    
    // Set reconnect parameters
    if (config.maxReconnectAttempts !== undefined) {
      this.maxReconnectAttempts = config.maxReconnectAttempts;
    }
    
    if (config.reconnectInterval !== undefined) {
      this.reconnectInterval = config.reconnectInterval;
    }
  }
  
  /**
   * Implementation-specific connection logic
   */
  protected async onConnect(): Promise<void> {
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Connect to WebSocket
    await this.connectWebSocket();
    
    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000);
  }
  
  /**
   * Implementation-specific disconnection logic
   */
  protected async onDisconnect(): Promise<void> {
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close WebSocket
    if (this.dataWs) {
      this.dataWs.close();
      this.dataWs = null;
    }
  }
  
  /**
   * Implementation-specific subscription logic
   * @param symbol Symbol to subscribe to
   * @param dataTypes Types of data to subscribe to
   */
  protected async onSubscribe(symbol: string, dataTypes: MarketDataType[]): Promise<void> {
    if (!this.dataWs) {
      throw new Error('WebSocket is not connected');
    }
    
    // Map our data types to Alpaca's
    const streams: string[] = [];
    
    for (const dataType of dataTypes) {
      switch (dataType) {
        case MarketDataType.TRADE:
          streams.push(`trades_${symbol}`);
          break;
        case MarketDataType.QUOTE:
          streams.push(`quotes_${symbol}`);
          break;
        case MarketDataType.BAR:
          streams.push(`bars_${symbol}`);
          break;
        // Alpaca doesn't support full order book
        default:
          break;
      }
    }
    
    if (streams.length === 0) {
      return;
    }
    
    // Send subscription message
    const subscribeMsg = {
      action: 'subscribe',
      trades: dataTypes.includes(MarketDataType.TRADE) ? [symbol] : [],
      quotes: dataTypes.includes(MarketDataType.QUOTE) ? [symbol] : [],
      bars: dataTypes.includes(MarketDataType.BAR) ? [symbol] : []
    };
    
    this.dataWs.send(JSON.stringify(subscribeMsg));
  }
  
  /**
   * Implementation-specific unsubscription logic
   * @param symbol Symbol to unsubscribe from
   * @param dataTypes Types of data to unsubscribe from
   */
  protected async onUnsubscribe(symbol: string, dataTypes: MarketDataType[]): Promise<void> {
    if (!this.dataWs) {
      return; // Already disconnected
    }
    
    // Send unsubscription message
    const unsubscribeMsg = {
      action: 'unsubscribe',
      trades: dataTypes.includes(MarketDataType.TRADE) ? [symbol] : [],
      quotes: dataTypes.includes(MarketDataType.QUOTE) ? [symbol] : [],
      bars: dataTypes.includes(MarketDataType.BAR) ? [symbol] : []
    };
    
    this.dataWs.send(JSON.stringify(unsubscribeMsg));
  }
  
  /**
   * Implementation-specific historical data retrieval logic
   * @param symbol Symbol to get data for
   * @param timeframe Timeframe for the data
   * @param start Start time for the data
   * @param end End time for the data
   * @param limit Maximum number of data points to return
   */
  protected async onGetHistoricalData(
    symbol: string,
    timeframe: string,
    start: Date,
    end: Date,
    limit?: number
  ): Promise<MarketData[]> {
    // Format dates for Alpaca API
    const startStr = start.toISOString();
    const endStr = end.toISOString();
    
    // Map timeframe to Alpaca format
    const alpacaTimeframe = this.mapTimeframeToAlpaca(timeframe);
    
    // Make API request
    const url = `${this.baseUrl}/v2/stocks/${symbol}/bars`;
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret
      },
      params: {
        start: startStr,
        end: endStr,
        timeframe: alpacaTimeframe,
        limit: limit || 1000
      }
    });
    
    // Transform response to our format
    const bars = response.data.bars.map((bar: any) => ({
      symbol,
      open: parseFloat(bar.o),
      high: parseFloat(bar.h),
      low: parseFloat(bar.l),
      close: parseFloat(bar.c),
      volume: parseInt(bar.v),
      timestamp: new Date(bar.t),
      timeframe
    }));
    
    return bars;
  }
  
  /**
   * Implementation-specific quote retrieval logic
   * @param symbol Symbol to get quote for
   */
  protected async onGetQuote(symbol: string): Promise<Quote> {
    // Make API request
    const url = `${this.baseUrl}/v2/stocks/${symbol}/quotes/latest`;
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret
      }
    });
    
    const quoteData = response.data;
    
    // Transform response to our format
    return {
      symbol,
      bidPrice: parseFloat(quoteData.bid_price),
      bidSize: parseInt(quoteData.bid_size),
      askPrice: parseFloat(quoteData.ask_price),
      askSize: parseInt(quoteData.ask_size),
      timestamp: new Date(quoteData.timestamp)
    };
  }
  
  /**
   * Implementation-specific trade retrieval logic
   * @param symbol Symbol to get trade for
   */
  protected async onGetTrade(symbol: string): Promise<Trade> {
    // Make API request
    const url = `${this.baseUrl}/v2/stocks/${symbol}/trades/latest`;
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret
      }
    });
    
    const tradeData = response.data;
    
    // Transform response to our format
    return {
      symbol,
      price: parseFloat(tradeData.price),
      size: parseInt(tradeData.size),
      timestamp: new Date(tradeData.timestamp),
      tradeId: tradeData.id
    };
  }
  
  /**
   * Implementation-specific order book retrieval logic
   * @param symbol Symbol to get order book for
   * @param depth Depth of the order book
   */
  protected async onGetOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    // Alpaca doesn't provide full order book data
    // We'll construct a simple order book from the latest quote
    const quote = await this.getQuote(symbol);
    
    return {
      symbol,
      bids: [{ price: quote.bidPrice, size: quote.bidSize }],
      asks: [{ price: quote.askPrice, size: quote.askSize }],
      timestamp: quote.timestamp
    };
  }
  
  /**
   * Connect to the Alpaca WebSocket
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create WebSocket
      this.dataWs = new WebSocket(this.wsUrl);
      
      // Set up event handlers
      this.dataWs.onopen = () => {
        // Authenticate
        const authMsg = {
          action: 'auth',
          key: this.apiKey,
          secret: this.apiSecret
        };
        
        this.dataWs!.send(JSON.stringify(authMsg));
      };
      
      this.dataWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          
          // Handle different message types
          if (Array.isArray(data)) {
            for (const msg of data) {
              this.handleWebSocketMessage(msg);
            }
          } else {
            this.handleWebSocketMessage(data);
          }
          
          // If we get an authentication response, resolve the promise
          if (data.T === 'success' && data.msg === 'authenticated') {
            resolve();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.dataWs.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emitEvent('ERROR', error);
        
        if (!this._isInitialized) {
          reject(error);
        }
      };
      
      this.dataWs.onclose = () => {
        console.log('WebSocket closed');
        this._status = ConnectionStatus.DISCONNECTED;
        this.emitEvent('DISCONNECTED', { providerId: this.id });
        
        // Attempt to reconnect
        this.attemptReconnect();
      };
      
      // Set a timeout for the connection
      const timeout = setTimeout(() => {
        if (this.dataWs?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
      
      // Clear the timeout when connected
      this.dataWs.addEventListener('open', () => {
        clearTimeout(timeout);
      });
    });
  }
  
  /**
   * Attempt to reconnect to the WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this._status = ConnectionStatus.ERROR;
      this.emitEvent('ERROR', new Error('Max reconnect attempts reached'));
      return;
    }
    
    this.reconnectAttempts++;
    this._status = ConnectionStatus.RECONNECTING;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connectWebSocket().catch(error => {
        console.error('Reconnect failed:', error);
      });
    }, this.reconnectInterval * this.reconnectAttempts);
  }
  
  /**
   * Send a ping message to keep the WebSocket connection alive
   */
  private sendPing(): void {
    if (this.dataWs && this.dataWs.readyState === WebSocket.OPEN) {
      this.dataWs.send(JSON.stringify({ action: 'ping' }));
    }
  }
  
  /**
   * Handle a WebSocket message
   * @param msg Message to handle
   */
  private handleWebSocketMessage(msg: any): void {
    // Handle different message types
    switch (msg.T) {
      case 'success':
        // Authentication or subscription success
        console.log('Alpaca WebSocket success:', msg.msg);
        break;
        
      case 'error':
        // Error message
        console.error('Alpaca WebSocket error:', msg.msg);
        this.emitEvent('ERROR', new Error(msg.msg));
        break;
        
      case 't':
        // Trade message
        this.handleTrade({
          symbol: msg.S,
          price: parseFloat(msg.p),
          size: parseInt(msg.s),
          timestamp: new Date(msg.t),
          tradeId: msg.i
        });
        break;
        
      case 'q':
        // Quote message
        this.handleQuote({
          symbol: msg.S,
          bidPrice: parseFloat(msg.bp),
          bidSize: parseInt(msg.bs),
          askPrice: parseFloat(msg.ap),
          askSize: parseInt(msg.as),
          timestamp: new Date(msg.t)
        });
        break;
        
      case 'b':
        // Bar message
        this.handleBar({
          symbol: msg.S,
          open: parseFloat(msg.o),
          high: parseFloat(msg.h),
          low: parseFloat(msg.l),
          close: parseFloat(msg.c),
          volume: parseInt(msg.v),
          timestamp: new Date(msg.t),
          timeframe: this.mapAlpacaToTimeframe(msg.timeframe)
        });
        break;
        
      default:
        // Unknown message type
        console.log('Unknown Alpaca WebSocket message type:', msg.T);
        break;
    }
  }
  
  /**
   * Map our timeframe format to Alpaca's
   * @param timeframe Our timeframe format
   * @returns Alpaca timeframe format
   */
  private mapTimeframeToAlpaca(timeframe: string): string {
    switch (timeframe) {
      case '1m':
        return '1Min';
      case '5m':
        return '5Min';
      case '15m':
        return '15Min';
      case '30m':
        return '30Min';
      case '1h':
        return '1Hour';
      case '1d':
        return '1Day';
      default:
        return '1Min';
    }
  }
  
  /**
   * Map Alpaca's timeframe format to ours
   * @param alpacaTimeframe Alpaca timeframe format
   * @returns Our timeframe format
   */
  private mapAlpacaToTimeframe(alpacaTimeframe: string): string {
    switch (alpacaTimeframe) {
      case '1Min':
        return '1m';
      case '5Min':
        return '5m';
      case '15Min':
        return '15m';
      case '30Min':
        return '30m';
      case '1Hour':
        return '1h';
      case '1Day':
        return '1d';
      default:
        return '1m';
    }
  }
}