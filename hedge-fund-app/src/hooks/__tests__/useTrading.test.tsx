import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import useTrading from '../useTrading';
import { alpacaTradingApi } from '../../services/api/providers';
import tradingReducer, { fetchOrders, fetchTrades, placeOrder, cancelOrder } from '../../store/slices/tradingSlice';

// Mock the Alpaca API
jest.mock('../../services/api/providers', () => ({
  alpacaTradingApi: {
    getAccount: jest.fn(),
    getPositions: jest.fn(),
    getPosition: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    placeOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getClock: jest.fn(),
    getCalendar: jest.fn()
  }
}));

// Mock the Redux actions
jest.mock('../../store/slices/tradingSlice', () => ({
  fetchOrders: jest.fn().mockReturnValue({ type: 'trading/fetchOrders' }),
  fetchTrades: jest.fn().mockReturnValue({ type: 'trading/fetchTrades' }),
  placeOrder: jest.fn().mockReturnValue({ type: 'trading/placeOrder' }),
  cancelOrder: jest.fn().mockReturnValue({ type: 'trading/cancelOrder' })
}));

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      trading: tradingReducer
    },
    preloadedState: initialState
  });
};

// Create a wrapper component with Redux provider
const createWrapper = (store: any) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useTrading', () => {
  let store: any;
  let wrapper: any;

  beforeEach(() => {
    // Create a fresh store for each test
    store = createTestStore({
      trading: {
        orders: {
          'order-1': {
            id: 'order-1',
            portfolioId: 'default',
            symbol: 'AAPL',
            type: 'market',
            side: 'buy',
            quantity: 10,
            status: 'filled',
            filledQuantity: 10,
            timeInForce: 'day',
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:01:00Z'
          },
          'order-2': {
            id: 'order-2',
            portfolioId: 'default',
            symbol: 'MSFT',
            type: 'limit',
            side: 'sell',
            quantity: 5,
            price: 300,
            status: 'open',
            filledQuantity: 0,
            timeInForce: 'gtc',
            createdAt: '2023-01-01T12:30:00Z',
            updatedAt: '2023-01-01T12:30:00Z'
          }
        },
        trades: {
          'trade-1': {
            id: 'trade-1',
            orderId: 'order-1',
            portfolioId: 'default',
            symbol: 'AAPL',
            side: 'buy',
            quantity: 10,
            price: 150,
            timestamp: '2023-01-01T12:01:00Z',
            commission: 0.75,
            total: 1500.75
          }
        },
        orderBooks: {},
        watchedSymbols: ['AAPL', 'MSFT', 'GOOGL'],
        loading: false,
        error: null,
        lastUpdated: null
      }
    });
    wrapper = createWrapper(store);
    jest.clearAllMocks();
  });

  it('should return the initial state', () => {
    const { result } = renderHook(() => useTrading(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.orders).toHaveLength(2);
    expect(result.current.trades).toHaveLength(1);
  });

  describe('getAccount', () => {
    it('should get account information', async () => {
      const mockAccount = {
        id: 'account-123',
        status: 'ACTIVE',
        currency: 'USD',
        buying_power: '100000',
        cash: '50000',
        portfolio_value: '150000',
        equity: '150000'
      };
      (alpacaTradingApi.getAccount as jest.Mock).mockResolvedValue(mockAccount);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let account;
      await act(async () => {
        account = await result.current.getAccount();
      });

      expect(alpacaTradingApi.getAccount).toHaveBeenCalled();
      expect(account).toEqual(mockAccount);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors when getting account information', async () => {
      const error = new Error('Failed to get account');
      (alpacaTradingApi.getAccount as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useTrading(), { wrapper });

      await act(async () => {
        try {
          await result.current.getAccount();
          fail('Should have thrown an error');
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(alpacaTradingApi.getAccount).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(error.message);
    });
  });

  describe('getPositions', () => {
    it('should get positions', async () => {
      const mockPositions = [
        {
          symbol: 'AAPL',
          qty: '10',
          avg_entry_price: '150',
          market_value: '1600',
          unrealized_pl: '100',
          unrealized_plpc: '0.0667',
          current_price: '160'
        },
        {
          symbol: 'MSFT',
          qty: '5',
          avg_entry_price: '280',
          market_value: '1500',
          unrealized_pl: '100',
          unrealized_plpc: '0.0714',
          current_price: '300'
        }
      ];
      (alpacaTradingApi.getPositions as jest.Mock).mockResolvedValue(mockPositions);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let positions;
      await act(async () => {
        positions = await result.current.getPositions();
      });

      expect(alpacaTradingApi.getPositions).toHaveBeenCalled();
      expect(positions).toEqual(mockPositions);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getPosition', () => {
    it('should get a position for a symbol', async () => {
      const mockPosition = {
        symbol: 'AAPL',
        qty: '10',
        avg_entry_price: '150',
        market_value: '1600',
        unrealized_pl: '100',
        unrealized_plpc: '0.0667',
        current_price: '160'
      };
      (alpacaTradingApi.getPosition as jest.Mock).mockResolvedValue(mockPosition);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let position;
      await act(async () => {
        position = await result.current.getPosition('AAPL');
      });

      expect(alpacaTradingApi.getPosition).toHaveBeenCalledWith('AAPL');
      expect(position).toEqual(mockPosition);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should return null if position does not exist', async () => {
      const error = { response: { status: 404 } };
      (alpacaTradingApi.getPosition as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let position;
      await act(async () => {
        position = await result.current.getPosition('TSLA');
      });

      expect(alpacaTradingApi.getPosition).toHaveBeenCalledWith('TSLA');
      expect(position).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getOrders', () => {
    it('should get orders from Redux store', async () => {
      (fetchOrders as jest.Mock).mockReturnValue({
        type: 'trading/fetchOrders',
        payload: Promise.resolve({
          'order-1': {
            id: 'order-1',
            portfolioId: 'default',
            symbol: 'AAPL',
            type: 'market',
            side: 'buy',
            quantity: 10,
            status: 'filled',
            filledQuantity: 10,
            timeInForce: 'day',
            createdAt: '2023-01-01T12:00:00Z',
            updatedAt: '2023-01-01T12:01:00Z'
          },
          'order-2': {
            id: 'order-2',
            portfolioId: 'default',
            symbol: 'MSFT',
            type: 'limit',
            side: 'sell',
            quantity: 5,
            price: 300,
            status: 'open',
            filledQuantity: 0,
            timeInForce: 'gtc',
            createdAt: '2023-01-01T12:30:00Z',
            updatedAt: '2023-01-01T12:30:00Z'
          }
        })
      });

      const { result } = renderHook(() => useTrading(), { wrapper });

      let orders;
      await act(async () => {
        orders = await result.current.getOrders();
      });

      expect(fetchOrders).toHaveBeenCalledWith('default');
      expect(orders).toHaveLength(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should get orders with specific parameters from API', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          symbol: 'AAPL',
          type: 'market',
          side: 'buy',
          qty: '10',
          status: 'filled',
          filled_qty: '10',
          time_in_force: 'day',
          created_at: '2023-01-01T12:00:00Z',
          updated_at: '2023-01-01T12:01:00Z'
        }
      ];
      (alpacaTradingApi.getOrders as jest.Mock).mockResolvedValue(mockOrders);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let orders;
      await act(async () => {
        orders = await result.current.getOrders('filled', 10);
      });

      expect(fetchOrders).toHaveBeenCalledWith('default');
      expect(alpacaTradingApi.getOrders).toHaveBeenCalledWith('filled', 10, undefined, undefined, undefined);
      expect(orders).toEqual(mockOrders);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getOrder', () => {
    it('should get an order from Redux store if available', async () => {
      const { result } = renderHook(() => useTrading(), { wrapper });

      let order;
      await act(async () => {
        order = await result.current.getOrder('order-1');
      });

      expect(alpacaTradingApi.getOrder).not.toHaveBeenCalled();
      expect(order).toEqual({
        id: 'order-1',
        portfolioId: 'default',
        symbol: 'AAPL',
        type: 'market',
        side: 'buy',
        quantity: 10,
        status: 'filled',
        filledQuantity: 10,
        timeInForce: 'day',
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:01:00Z'
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should get an order from API if not in Redux store', async () => {
      const mockOrder = {
        id: 'order-3',
        symbol: 'GOOGL',
        type: 'limit',
        side: 'buy',
        qty: '3',
        price: '2800',
        status: 'open',
        filled_qty: '0',
        time_in_force: 'gtc',
        created_at: '2023-01-01T13:00:00Z',
        updated_at: '2023-01-01T13:00:00Z'
      };
      (alpacaTradingApi.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let order;
      await act(async () => {
        order = await result.current.getOrder('order-3');
      });

      expect(alpacaTradingApi.getOrder).toHaveBeenCalledWith('order-3');
      expect(order).toEqual(mockOrder);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getTrades', () => {
    it('should get trades from Redux store', async () => {
      (fetchTrades as jest.Mock).mockReturnValue({
        type: 'trading/fetchTrades',
        payload: Promise.resolve({
          'trade-1': {
            id: 'trade-1',
            orderId: 'order-1',
            portfolioId: 'default',
            symbol: 'AAPL',
            side: 'buy',
            quantity: 10,
            price: 150,
            timestamp: '2023-01-01T12:01:00Z',
            commission: 0.75,
            total: 1500.75
          }
        })
      });

      const { result } = renderHook(() => useTrading(), { wrapper });

      let trades;
      await act(async () => {
        trades = await result.current.getTrades();
      });

      expect(fetchTrades).toHaveBeenCalledWith('default');
      expect(trades).toHaveLength(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('placeOrder', () => {
    it('should place an order', async () => {
      const orderParams = {
        symbol: 'GOOGL',
        quantity: 3,
        side: 'buy' as const,
        type: 'limit' as const,
        timeInForce: 'gtc' as const,
        limitPrice: 2800
      };
      
      const mockOrder = {
        id: 'order-3',
        symbol: 'GOOGL',
        type: 'limit',
        side: 'buy',
        qty: '3',
        price: '2800',
        status: 'new',
        filled_qty: '0',
        time_in_force: 'gtc',
        created_at: '2023-01-01T13:00:00Z',
        updated_at: '2023-01-01T13:00:00Z'
      };
      
      (placeOrder as jest.Mock).mockReturnValue({
        type: 'trading/placeOrder',
        payload: Promise.resolve(mockOrder)
      });
      
      (alpacaTradingApi.placeOrder as jest.Mock).mockResolvedValue(mockOrder);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let order;
      await act(async () => {
        order = await result.current.placeOrder(orderParams);
      });

      expect(placeOrder).toHaveBeenCalled();
      expect(alpacaTradingApi.placeOrder).toHaveBeenCalledWith(
        'GOOGL',
        3,
        'buy',
        'limit',
        'gtc',
        2800,
        undefined,
        undefined,
        undefined
      );
      expect(order).toEqual(mockOrder);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors when placing an order', async () => {
      const orderParams = {
        symbol: 'GOOGL',
        quantity: 3,
        side: 'buy' as const,
        type: 'limit' as const,
        timeInForce: 'gtc' as const,
        limitPrice: 2800
      };
      
      const error = new Error('Failed to place order');
      
      (placeOrder as jest.Mock).mockReturnValue({
        type: 'trading/placeOrder',
        payload: Promise.reject(error)
      });

      const { result } = renderHook(() => useTrading(), { wrapper });

      await act(async () => {
        try {
          await result.current.placeOrder(orderParams);
          fail('Should have thrown an error');
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(placeOrder).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(error.message);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      (cancelOrder as jest.Mock).mockReturnValue({
        type: 'trading/cancelOrder',
        payload: Promise.resolve('order-2')
      });

      const { result } = renderHook(() => useTrading(), { wrapper });

      let success;
      await act(async () => {
        success = await result.current.cancelOrder('order-2');
      });

      expect(cancelOrder).toHaveBeenCalledWith('order-2');
      expect(alpacaTradingApi.cancelOrder).toHaveBeenCalledWith('order-2');
      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle 404 errors when canceling an order', async () => {
      (cancelOrder as jest.Mock).mockReturnValue({
        type: 'trading/cancelOrder',
        payload: Promise.resolve('order-3')
      });
      
      const error = { response: { status: 404 } };
      (alpacaTradingApi.cancelOrder as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let success;
      await act(async () => {
        success = await result.current.cancelOrder('order-3');
      });

      expect(cancelOrder).toHaveBeenCalledWith('order-3');
      expect(alpacaTradingApi.cancelOrder).toHaveBeenCalledWith('order-3');
      expect(success).toBe(true); // Should still return true for 404 errors
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle other errors when canceling an order', async () => {
      (cancelOrder as jest.Mock).mockReturnValue({
        type: 'trading/cancelOrder',
        payload: Promise.reject(new Error('Failed to cancel order'))
      });

      const { result } = renderHook(() => useTrading(), { wrapper });

      await act(async () => {
        try {
          await result.current.cancelOrder('order-2');
          fail('Should have thrown an error');
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
        }
      });

      expect(cancelOrder).toHaveBeenCalledWith('order-2');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to cancel order');
    });
  });

  describe('getMarketClock', () => {
    it('should get market clock', async () => {
      const mockClock = {
        is_open: true,
        next_open: '2023-01-02T09:30:00Z',
        next_close: '2023-01-01T16:00:00Z',
        timestamp: '2023-01-01T12:00:00Z'
      };
      (alpacaTradingApi.getClock as jest.Mock).mockResolvedValue(mockClock);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let clock;
      await act(async () => {
        clock = await result.current.getMarketClock();
      });

      expect(alpacaTradingApi.getClock).toHaveBeenCalled();
      expect(clock).toEqual(mockClock);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getMarketCalendar', () => {
    it('should get market calendar', async () => {
      const mockCalendar = [
        {
          date: '2023-01-02',
          open: '09:30',
          close: '16:00',
          session_open: '09:30',
          session_close: '16:00',
          status: 'open'
        },
        {
          date: '2023-01-03',
          open: '09:30',
          close: '16:00',
          session_open: '09:30',
          session_close: '16:00',
          status: 'open'
        }
      ];
      (alpacaTradingApi.getCalendar as jest.Mock).mockResolvedValue(mockCalendar);

      const { result } = renderHook(() => useTrading(), { wrapper });

      let calendar;
      await act(async () => {
        calendar = await result.current.getMarketCalendar('2023-01-01', '2023-01-05');
      });

      expect(alpacaTradingApi.getCalendar).toHaveBeenCalledWith('2023-01-01', '2023-01-05');
      expect(calendar).toEqual(mockCalendar);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('calculateOrderValue', () => {
    it('should calculate order value for buy order', () => {
      const { result } = renderHook(() => useTrading(), { wrapper });

      const orderValue = result.current.calculateOrderValue({
        quantity: 10,
        price: 150,
        side: 'buy'
      });

      expect(orderValue).toEqual({
        value: 1500,
        commission: 0.75,
        total: 1500.75
      });
    });

    it('should calculate order value for sell order', () => {
      const { result } = renderHook(() => useTrading(), { wrapper });

      const orderValue = result.current.calculateOrderValue({
        quantity: 10,
        price: 150,
        side: 'sell'
      });

      expect(orderValue).toEqual({
        value: 1500,
        commission: 0.75,
        total: 1499.25
      });
    });

    it('should return null if price is not provided', () => {
      const { result } = renderHook(() => useTrading(), { wrapper });

      const orderValue = result.current.calculateOrderValue({
        quantity: 10,
        side: 'buy'
      });

      expect(orderValue).toBeNull();
    });
  });
});