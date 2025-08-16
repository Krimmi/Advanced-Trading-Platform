import { apiRequest } from './api';

// Types
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface SectorPerformance {
  sector: string;
  performance: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// Market data service
const marketService = {
  // Get market indexes (S&P 500, Dow Jones, Nasdaq, etc.)
  getMarketIndexes: () => {
    return apiRequest<MarketIndex[]>({
      method: 'GET',
      url: '/api/market/market-indexes',
    });
  },

  // Get sector performance
  getSectorPerformance: () => {
    return apiRequest<SectorPerformance[]>({
      method: 'GET',
      url: '/api/market/sector-performance',
    });
  },

  // Get market movers (gainers, losers, most active)
  getMarketMovers: (type: 'gainers' | 'losers' | 'actives') => {
    return apiRequest<MarketMover[]>({
      method: 'GET',
      url: `/api/market/market-movers/${type}`,
    });
  },

  // Get stock quote
  getStockQuote: (symbol: string) => {
    return apiRequest<any>({
      method: 'GET',
      url: `/api/market/quote/${symbol}`,
    });
  },

  // Get historical price data
  getHistoricalPrices: (
    symbol: string,
    params?: {
      from_date?: string;
      to_date?: string;
      timeframe?: 'daily' | 'weekly' | 'monthly';
    }
  ) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/market/historical-price/${symbol}`,
      params,
    });
  },

  // Get forex data
  getForexData: () => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/market/forex',
    });
  },

  // Get commodities data
  getCommodities: () => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/market/commodities',
    });
  },

  // Get crypto data
  getCrypto: () => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/market/crypto',
    });
  },

  // Get economic calendar
  getEconomicCalendar: (params?: { from_date?: string; to_date?: string }) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/market/economic-calendar',
      params,
    });
  },
};

export default marketService;