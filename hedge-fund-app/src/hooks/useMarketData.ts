import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import marketDataService, { BarTimeframe, FinancialStatementType, FinancialPeriod } from '../services/market';
import { addToWatchedSymbols, removeFromWatchedSymbols } from '../store/slices/tradingSlice';
import { RootState } from '../store';

/**
 * Hook for accessing market data
 */
export const useMarketData = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get watched symbols from Redux store
  const watchedSymbols = useSelector((state: RootState) => state.trading.watchedSymbols);
  
  // Get real-time market data from Redux store
  const marketData = useSelector((state: RootState) => state.market);

  /**
   * Initialize market data service
   */
  useEffect(() => {
    marketDataService.initialize().catch(err => {
      console.error('Failed to initialize market data service:', err);
      setError('Failed to initialize market data service');
    });
    
    // Cleanup on unmount
    return () => {
      marketDataService.disconnectRealTimeData();
    };
  }, []);

  /**
   * Add a symbol to watch list
   */
  const addSymbolToWatchList = useCallback(async (symbol: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await marketDataService.addSymbolToWatchList(symbol);
      dispatch(addToWatchedSymbols(symbol));
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to add symbol to watch list');
      return false;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Remove a symbol from watch list
   */
  const removeSymbolFromWatchList = useCallback((symbol: string) => {
    try {
      setLoading(true);
      setError(null);
      
      marketDataService.removeSymbolFromWatchList(symbol);
      dispatch(removeFromWatchedSymbols(symbol));
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove symbol from watch list');
      return false;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Get quote for a symbol
   */
  const getQuote = useCallback(async (symbol: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const quote = await marketDataService.getQuote(symbol);
      return quote;
    } catch (err: any) {
      setError(err.message || `Failed to get quote for ${symbol}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get quotes for multiple symbols
   */
  const getQuotes = useCallback(async (symbols: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const quotes = await marketDataService.getQuotes(symbols);
      return quotes;
    } catch (err: any) {
      setError(err.message || 'Failed to get quotes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get historical bars for a symbol
   */
  const getBars = useCallback(async (
    symbol: string,
    timeframe: BarTimeframe = BarTimeframe.ONE_DAY,
    days: number = 30
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const bars = await marketDataService.getBars(symbol, timeframe, days);
      return bars;
    } catch (err: any) {
      setError(err.message || `Failed to get bars for ${symbol}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get company information
   */
  const getCompanyInfo = useCallback(async (symbol: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const companyInfo = await marketDataService.getCompanyInfo(symbol);
      return companyInfo;
    } catch (err: any) {
      setError(err.message || `Failed to get company info for ${symbol}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get news for a symbol
   */
  const getNews = useCallback(async (symbol: string, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const news = await marketDataService.getNews(symbol, limit);
      return news;
    } catch (err: any) {
      setError(err.message || `Failed to get news for ${symbol}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get financial statements
   */
  const getFinancials = useCallback(async (
    symbol: string,
    type: FinancialStatementType = FinancialStatementType.INCOME,
    period: FinancialPeriod = FinancialPeriod.QUARTER,
    limit: number = 4
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const financials = await marketDataService.getFinancials(symbol, type, period, limit);
      return financials;
    } catch (err: any) {
      setError(err.message || `Failed to get financials for ${symbol}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get market status
   */
  const getMarketStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await marketDataService.getMarketStatus();
      return status;
    } catch (err: any) {
      setError(err.message || 'Failed to get market status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    watchedSymbols,
    marketData,
    
    // Watch list methods
    addSymbolToWatchList,
    removeSymbolFromWatchList,
    
    // Data retrieval methods
    getQuote,
    getQuotes,
    getBars,
    getCompanyInfo,
    getNews,
    getFinancials,
    getMarketStatus
  };
};

export default useMarketData;