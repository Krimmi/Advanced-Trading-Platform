import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { alpacaTradingApi } from '../services/api/providers';
import { AlpacaOrderSide, AlpacaOrderType, AlpacaTimeInForce } from '../services/api/providers/AlpacaApiService';
import { fetchOrders, fetchTrades, placeOrder as placeOrderAction, cancelOrder as cancelOrderAction } from '../store/slices/tradingSlice';
import { RootState } from '../store';

/**
 * Order parameters interface
 */
export interface OrderParams {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  extendedHours?: boolean;
  clientOrderId?: string;
}

/**
 * Hook for trading operations
 */
export const useTrading = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get trading state from Redux store
  const tradingState = useSelector((state: RootState) => state.trading);
  const { orders, trades } = tradingState;

  /**
   * Get account information
   */
  const getAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const account = await alpacaTradingApi.getAccount();
      return account;
    } catch (err: any) {
      setError(err.message || 'Failed to get account information');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get positions
   */
  const getPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const positions = await alpacaTradingApi.getPositions();
      return positions;
    } catch (err: any) {
      setError(err.message || 'Failed to get positions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get position for a specific symbol
   */
  const getPosition = useCallback(async (symbol: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const position = await alpacaTradingApi.getPosition(symbol);
      return position;
    } catch (err: any) {
      // 404 means no position, which is a valid state
      if (err.response && err.response.status === 404) {
        return null;
      }
      
      setError(err.message || `Failed to get position for ${symbol}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get orders
   */
  const getOrders = useCallback(async (
    status?: string,
    limit?: number,
    after?: string,
    until?: string,
    direction?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Redux action to fetch and store orders
      await dispatch(fetchOrders('default') as any);
      
      // For more specific queries, use the API directly
      if (status || limit || after || until || direction) {
        const orders = await alpacaTradingApi.getOrders(status, limit, after, until, direction);
        return orders;
      }
      
      return Object.values(tradingState.orders);
    } catch (err: any) {
      setError(err.message || 'Failed to get orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch, tradingState.orders]);

  /**
   * Get a specific order
   */
  const getOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if order is in Redux store
      if (orders[orderId]) {
        return orders[orderId];
      }
      
      // Otherwise fetch from API
      const order = await alpacaTradingApi.getOrder(orderId);
      return order;
    } catch (err: any) {
      setError(err.message || `Failed to get order ${orderId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orders]);

  /**
   * Get trades
   */
  const getTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Redux action to fetch and store trades
      await dispatch(fetchTrades('default') as any);
      
      return Object.values(tradingState.trades);
    } catch (err: any) {
      setError(err.message || 'Failed to get trades');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch, tradingState.trades]);

  /**
   * Place an order
   */
  const placeOrder = useCallback(async (params: OrderParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const {
        symbol,
        quantity,
        side,
        type,
        timeInForce,
        limitPrice,
        stopPrice,
        extendedHours,
        clientOrderId
      } = params;
      
      // Use Redux action to place order and update store
      const resultAction = await dispatch(placeOrderAction({
        portfolioId: 'default',
        symbol,
        quantity,
        side,
        type,
        timeInForce,
        price: limitPrice,
        stopPrice,
        notes: clientOrderId
      }) as any);
      
      if (placeOrderAction.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to place order');
      }
      
      // Also place the order with the real API
      const order = await alpacaTradingApi.placeOrder(
        symbol,
        quantity,
        side as AlpacaOrderSide,
        type as AlpacaOrderType,
        timeInForce as AlpacaTimeInForce,
        limitPrice,
        stopPrice,
        clientOrderId,
        extendedHours
      );
      
      return order;
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Cancel an order
   */
  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Redux action to cancel order and update store
      const resultAction = await dispatch(cancelOrderAction(orderId) as any);
      
      if (cancelOrderAction.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || `Failed to cancel order ${orderId}`);
      }
      
      // Also cancel the order with the real API
      await alpacaTradingApi.cancelOrder(orderId);
      
      return true;
    } catch (err: any) {
      // 404 means order doesn't exist or was already cancelled
      if (err.response && err.response.status === 404) {
        return true;
      }
      
      setError(err.message || `Failed to cancel order ${orderId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Get market clock
   */
  const getMarketClock = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clock = await alpacaTradingApi.getClock();
      return clock;
    } catch (err: any) {
      setError(err.message || 'Failed to get market clock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get market calendar
   */
  const getMarketCalendar = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const calendar = await alpacaTradingApi.getCalendar(start, end);
      return calendar;
    } catch (err: any) {
      setError(err.message || 'Failed to get market calendar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate order value
   */
  const calculateOrderValue = useCallback((params: {
    quantity: number;
    price?: number;
    side: 'buy' | 'sell';
  }) => {
    const { quantity, price, side } = params;
    
    if (!price) {
      return null; // Can't calculate without price
    }
    
    const value = quantity * price;
    
    // Add estimated commission (this is just an example, real commission calculation would depend on the broker)
    const commission = value * 0.0005; // 0.05% commission
    
    return {
      value,
      commission,
      total: side === 'buy' ? value + commission : value - commission
    };
  }, []);

  return {
    // State
    loading,
    error,
    orders: Object.values(orders),
    trades: Object.values(trades),
    
    // Account methods
    getAccount,
    getPositions,
    getPosition,
    
    // Order methods
    getOrders,
    getOrder,
    getTrades,
    placeOrder,
    cancelOrder,
    
    // Market methods
    getMarketClock,
    getMarketCalendar,
    
    // Utility methods
    calculateOrderValue
  };
};

export default useTrading;