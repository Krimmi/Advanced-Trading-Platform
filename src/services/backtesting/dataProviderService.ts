import { DataFrequency } from '../../types/backtesting';
import axios from 'axios';

/**
 * Service for providing historical market data for backtesting
 */
export default class DataProviderService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Get historical price data for a ticker
   * @param ticker Ticker symbol
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param frequency Data frequency
   * @returns Historical price data
   */
  public async getHistoricalPriceData(
    ticker: string,
    startDate: string,
    endDate: string,
    frequency: DataFrequency
  ): Promise<{
    ticker: string;
    data: {
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      adjustedClose?: number;
    }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/historical-prices`, {
        params: {
          ticker,
          startDate,
          endDate,
          frequency
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting historical price data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical price data for multiple tickers
   * @param tickers Array of ticker symbols
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param frequency Data frequency
   * @returns Historical price data for each ticker
   */
  public async getBulkHistoricalPriceData(
    tickers: string[],
    startDate: string,
    endDate: string,
    frequency: DataFrequency
  ): Promise<
    {
      ticker: string;
      data: {
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        adjustedClose?: number;
      }[];
    }[]
  > {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/data/bulk-historical-prices`, {
        tickers,
        startDate,
        endDate,
        frequency
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting bulk historical price data:`, error);
      throw error;
    }
  }

  /**
   * Get historical fundamental data for a ticker
   * @param ticker Ticker symbol
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @returns Historical fundamental data
   */
  public async getHistoricalFundamentalData(
    ticker: string,
    startDate: string,
    endDate: string
  ): Promise<{
    ticker: string;
    data: {
      timestamp: string;
      eps: number;
      revenue: number;
      netIncome: number;
      grossMargin: number;
      operatingMargin: number;
      netMargin: number;
      peRatio: number;
      pbRatio: number;
      psRatio: number;
      debtToEquity: number;
      currentRatio: number;
      quickRatio: number;
      roe: number;
      roa: number;
      freeCashFlow: number;
      dividendYield?: number;
      dividendPayoutRatio?: number;
      [key: string]: any;
    }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/historical-fundamentals`, {
        params: {
          ticker,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting historical fundamental data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical sentiment data for a ticker
   * @param ticker Ticker symbol
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param source Sentiment data source ('news', 'social_media', 'all')
   * @returns Historical sentiment data
   */
  public async getHistoricalSentimentData(
    ticker: string,
    startDate: string,
    endDate: string,
    source: 'news' | 'social_media' | 'all' = 'all'
  ): Promise<{
    ticker: string;
    data: {
      timestamp: string;
      sentiment: number;
      volume: number;
      source: string;
      positiveScore: number;
      negativeScore: number;
      neutralScore: number;
    }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/historical-sentiment`, {
        params: {
          ticker,
          startDate,
          endDate,
          source
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting historical sentiment data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical technical indicators for a ticker
   * @param ticker Ticker symbol
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param frequency Data frequency
   * @param indicators Array of indicator names
   * @returns Historical technical indicators
   */
  public async getHistoricalTechnicalIndicators(
    ticker: string,
    startDate: string,
    endDate: string,
    frequency: DataFrequency,
    indicators: string[]
  ): Promise<{
    ticker: string;
    data: {
      timestamp: string;
      indicators: Record<string, number | number[] | null>;
    }[];
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/data/historical-indicators`, {
        ticker,
        startDate,
        endDate,
        frequency,
        indicators
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting historical technical indicators for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical economic data
   * @param indicators Array of economic indicator names
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @returns Historical economic data
   */
  public async getHistoricalEconomicData(
    indicators: string[],
    startDate: string,
    endDate: string
  ): Promise<{
    data: {
      timestamp: string;
      indicators: Record<string, number | null>;
    }[];
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/data/historical-economic`, {
        indicators,
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting historical economic data:`, error);
      throw error;
    }
  }

  /**
   * Get historical events for a ticker
   * @param ticker Ticker symbol
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param eventTypes Array of event types
   * @returns Historical events
   */
  public async getHistoricalEvents(
    ticker: string,
    startDate: string,
    endDate: string,
    eventTypes: ('earnings' | 'dividends' | 'splits' | 'news' | 'sec_filings' | 'insider_trades' | 'all')[]
  ): Promise<{
    ticker: string;
    events: {
      timestamp: string;
      type: string;
      title: string;
      description: string;
      impact?: number;
      url?: string;
      data?: Record<string, any>;
    }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/historical-events`, {
        params: {
          ticker,
          startDate,
          endDate,
          eventTypes: eventTypes.join(',')
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting historical events for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get available data frequencies
   * @returns Array of available data frequencies
   */
  public async getAvailableDataFrequencies(): Promise<{ value: DataFrequency; label: string }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/available-frequencies`);
      return response.data;
    } catch (error) {
      console.error('Error getting available data frequencies:', error);
      throw error;
    }
  }

  /**
   * Get available technical indicators
   * @returns Array of available technical indicators
   */
  public async getAvailableTechnicalIndicators(): Promise<
    {
      name: string;
      description: string;
      category: string;
      parameters: { name: string; type: string; default: any; min?: number; max?: number }[];
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/available-indicators`);
      return response.data;
    } catch (error) {
      console.error('Error getting available technical indicators:', error);
      throw error;
    }
  }

  /**
   * Get available economic indicators
   * @returns Array of available economic indicators
   */
  public async getAvailableEconomicIndicators(): Promise<
    {
      name: string;
      description: string;
      category: string;
      frequency: string;
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/available-economic-indicators`);
      return response.data;
    } catch (error) {
      console.error('Error getting available economic indicators:', error);
      throw error;
    }
  }

  /**
   * Check data availability for a list of tickers
   * @param tickers Array of ticker symbols
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param frequency Data frequency
   * @returns Data availability for each ticker
   */
  public async checkDataAvailability(
    tickers: string[],
    startDate: string,
    endDate: string,
    frequency: DataFrequency
  ): Promise<Record<string, { available: boolean; coverage: number; missingDates?: string[] }>> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/data/check-availability`, {
        tickers,
        startDate,
        endDate,
        frequency
      });
      return response.data;
    } catch (error) {
      console.error('Error checking data availability:', error);
      throw error;
    }
  }

  /**
   * Get market calendar (trading days, holidays, etc.)
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @returns Market calendar
   */
  public async getMarketCalendar(startDate: string, endDate: string): Promise<{
    tradingDays: string[];
    holidays: { date: string; name: string }[];
    earlyCloseDays: { date: string; closeTime: string }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/market-calendar`, {
        params: {
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting market calendar:', error);
      throw error;
    }
  }

  /**
   * Get corporate actions for a ticker
   * @param ticker Ticker symbol
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @returns Corporate actions
   */
  public async getCorporateActions(
    ticker: string,
    startDate: string,
    endDate: string
  ): Promise<{
    ticker: string;
    dividends: {
      exDate: string;
      paymentDate: string;
      recordDate: string;
      declaredDate: string;
      amount: number;
      type: string;
    }[];
    splits: {
      date: string;
      ratio: number;
      fromFactor: number;
      toFactor: number;
    }[];
    spinoffs: {
      date: string;
      ratio: number;
      newTicker: string;
      newCompanyName: string;
    }[];
    mergers: {
      date: string;
      acquiringCompany: string;
      acquiringTicker: string;
      ratio: number;
      cashComponent: number;
    }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data/corporate-actions`, {
        params: {
          ticker,
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting corporate actions for ${ticker}:`, error);
      throw error;
    }
  }
}