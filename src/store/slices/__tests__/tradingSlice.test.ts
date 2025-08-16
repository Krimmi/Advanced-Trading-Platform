import { configureStore } from '@reduxjs/toolkit';
import tradingReducer, { 
  fetchOrders, 
  fetchPositions, 
  submitOrder,
  cancelOrder,
  fetchAccountInfo,
  TradingState
} from '../tradingSlice';

// Mock the trading services
jest.mock('../../../services/api/trading', () => ({
  tradingService: {
    getOrders: jest.fn(),
    getPositions: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getAccount: jest.fn()
  },
  orderManagementService: {
    submitOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getOrders: jest.fn()
  },
  positionTrackingService: {
    getPositions: jest.fn(),
    getPortfolioSummary: jest.fn()
  }
}));

import { tradingService, orderManagementService, positionTrackingService } from '../../../services/api/trading';

describe('Trading Slice', () => {
  let store: any;
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        trading: tradingReducer
      }
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      const state = store.getState().trading;
      
      expect(state).toEqual({
        account: null,
        positions: [],
        orders: [],
        loading: {
          account: false,
          positions: false,
          orders: false,
          orderSubmission: false
        },
        error: null
      });
    });
  });
  
  describe('Fetch Account Info', () => {
    it('should handle fetchAccountInfo.pending', () => {
      store.dispatch({ type: fetchAccountInfo.pending.type });
      
      const state = store.getState().trading;
      
      expect(state.loading.account).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchAccountInfo.fulfilled', () => {
      const account = { 
        id: 'acc123', 
        currency: 'USD', 
        cash: 10000, 
        buyingPower: 20000, 
        equity: 15000,
        provider: 'alpaca'
      };
      
      store.dispatch({ 
        type: fetchAccountInfo.fulfilled.type, 
        payload: account 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.account).toBe(false);
      expect(state.account).toEqual(account);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchAccountInfo.rejected', () => {
      const error = 'Failed to fetch account info';
      
      store.dispatch({ 
        type: fetchAccountInfo.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.account).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call tradingService.getAccount', async () => {
      const account = { 
        id: 'acc123', 
        currency: 'USD', 
        cash: 10000, 
        buyingPower: 20000, 
        equity: 15000,
        provider: 'alpaca'
      };
      
      (tradingService.getAccount as jest.Mock).mockResolvedValue(account);
      
      await store.dispatch(fetchAccountInfo());
      
      expect(tradingService.getAccount).toHaveBeenCalled();
      
      const state = store.getState().trading;
      
      expect(state.account).toEqual(account);
    });
  });
  
  describe('Fetch Positions', () => {
    it('should handle fetchPositions.pending', () => {
      store.dispatch({ type: fetchPositions.pending.type });
      
      const state = store.getState().trading;
      
      expect(state.loading.positions).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchPositions.fulfilled', () => {
      const positions = [
        { 
          symbol: 'AAPL', 
          quantity: 10, 
          averageEntryPrice: 150, 
          marketValue: 1600, 
          unrealizedPnl: 100,
          unrealizedPnlPercent: 6.67,
          currentPrice: 160,
          provider: 'alpaca'
        },
        { 
          symbol: 'MSFT', 
          quantity: 5, 
          averageEntryPrice: 200, 
          marketValue: 1050, 
          unrealizedPnl: 50,
          unrealizedPnlPercent: 5.0,
          currentPrice: 210,
          provider: 'alpaca'
        }
      ];
      
      store.dispatch({ 
        type: fetchPositions.fulfilled.type, 
        payload: positions 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.positions).toBe(false);
      expect(state.positions).toEqual(positions);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchPositions.rejected', () => {
      const error = 'Failed to fetch positions';
      
      store.dispatch({ 
        type: fetchPositions.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.positions).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call positionTrackingService.getPositions', async () => {
      const positions = [
        { 
          symbol: 'AAPL', 
          quantity: 10, 
          averageEntryPrice: 150, 
          marketValue: 1600, 
          unrealizedPnl: 100,
          unrealizedPnlPercent: 6.67,
          currentPrice: 160,
          provider: 'alpaca'
        }
      ];
      
      (positionTrackingService.getPositions as jest.Mock).mockResolvedValue(positions);
      
      await store.dispatch(fetchPositions());
      
      expect(positionTrackingService.getPositions).toHaveBeenCalled();
      
      const state = store.getState().trading;
      
      expect(state.positions).toEqual(positions);
    });
  });
  
  describe('Fetch Orders', () => {
    it('should handle fetchOrders.pending', () => {
      store.dispatch({ type: fetchOrders.pending.type });
      
      const state = store.getState().trading;
      
      expect(state.loading.orders).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchOrders.fulfilled', () => {
      const orders = [
        { 
          id: 'order1', 
          symbol: 'AAPL', 
          side: 'buy', 
          type: 'market', 
          quantity: 10,
          filledQuantity: 10,
          status: 'filled',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:01:00Z',
          provider: 'alpaca'
        },
        { 
          id: 'order2', 
          symbol: 'MSFT', 
          side: 'buy', 
          type: 'limit', 
          quantity: 5,
          filledQuantity: 0,
          status: 'new',
          limitPrice: 200,
          createdAt: '2023-01-01T12:30:00Z',
          updatedAt: '2023-01-01T12:30:00Z',
          provider: 'alpaca'
        }
      ];
      
      store.dispatch({ 
        type: fetchOrders.fulfilled.type, 
        payload: orders 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.orders).toBe(false);
      expect(state.orders).toEqual(orders);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchOrders.rejected', () => {
      const error = 'Failed to fetch orders';
      
      store.dispatch({ 
        type: fetchOrders.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.orders).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call orderManagementService.getOrders with filter parameters', async () => {
      const orders = [
        { 
          id: 'order1', 
          symbol: 'AAPL', 
          side: 'buy', 
          type: 'market', 
          quantity: 10,
          filledQuantity: 10,
          status: 'filled',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:01:00Z',
          provider: 'alpaca'
        }
      ];
      
      (orderManagementService.getOrders as jest.Mock).mockResolvedValue(orders);
      
      await store.dispatch(fetchOrders({ status: 'filled', symbol: 'AAPL', limit: 10 }));
      
      expect(orderManagementService.getOrders).toHaveBeenCalledWith('filled', 'AAPL', 10);
      
      const state = store.getState().trading;
      
      expect(state.orders).toEqual(orders);
    });
  });
  
  describe('Submit Order', () => {
    it('should handle submitOrder.pending', () => {
      store.dispatch({ type: submitOrder.pending.type });
      
      const state = store.getState().trading;
      
      expect(state.loading.orderSubmission).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle submitOrder.fulfilled', () => {
      const order = { 
        id: 'order3', 
        symbol: 'GOOGL', 
        side: 'buy', 
        type: 'limit', 
        quantity: 2,
        filledQuantity: 0,
        status: 'new',
        limitPrice: 2500,
        createdAt: '2023-01-02T10:00:00Z',
        updatedAt: '2023-01-02T10:00:00Z',
        provider: 'alpaca'
      };
      
      store.dispatch({ 
        type: submitOrder.fulfilled.type, 
        payload: order 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.orderSubmission).toBe(false);
      expect(state.orders).toContainEqual(order);
      expect(state.error).toBe(null);
    });
    
    it('should handle submitOrder.rejected', () => {
      const error = 'Failed to submit order';
      
      store.dispatch({ 
        type: submitOrder.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().trading;
      
      expect(state.loading.orderSubmission).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call orderManagementService.submitOrder with order request', async () => {
      const orderRequest = { 
        symbol: 'GOOGL', 
        side: 'buy', 
        type: 'limit', 
        quantity: 2,
        limitPrice: 2500
      };
      
      const createdOrder = { 
        id: 'order3', 
        symbol: 'GOOGL', 
        side: 'buy', 
        type: 'limit', 
        quantity: 2,
        filledQuantity: 0,
        status: 'new',
        limitPrice: 2500,
        createdAt: '2023-01-02T10:00:00Z',
        updatedAt: '2023-01-02T10:00:00Z',
        provider: 'alpaca'
      };
      
      (orderManagementService.submitOrder as jest.Mock).mockResolvedValue(createdOrder);
      
      await store.dispatch(submitOrder(orderRequest));
      
      expect(orderManagementService.submitOrder).toHaveBeenCalledWith(orderRequest);
      
      const state = store.getState().trading;
      
      expect(state.orders).toContainEqual(createdOrder);
    });
  });
  
  describe('Cancel Order', () => {
    beforeEach(() => {
      // Set up initial state with orders
      const initialOrders = [
        { 
          id: 'order1', 
          symbol: 'AAPL', 
          side: 'buy', 
          type: 'market', 
          quantity: 10,
          filledQuantity: 10,
          status: 'filled',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:01:00Z',
          provider: 'alpaca'
        },
        { 
          id: 'order2', 
          symbol: 'MSFT', 
          side: 'buy', 
          type: 'limit', 
          quantity: 5,
          filledQuantity: 0,
          status: 'new',
          limitPrice: 200,
          createdAt: '2023-01-01T12:30:00Z',
          updatedAt: '2023-01-01T12:30:00Z',
          provider: 'alpaca'
        }
      ];
      
      store.dispatch({ 
        type: fetchOrders.fulfilled.type, 
        payload: initialOrders 
      });
    });
    
    it('should handle cancelOrder.fulfilled', async () => {
      (orderManagementService.cancelOrder as jest.Mock).mockResolvedValue(undefined);
      
      await store.dispatch(cancelOrder('order2'));
      
      expect(orderManagementService.cancelOrder).toHaveBeenCalledWith('order2');
      
      // Fetch orders is called after cancellation to refresh the list
      expect(orderManagementService.getOrders).toHaveBeenCalled();
    });
    
    it('should handle cancelOrder.rejected', () => {
      const error = 'Failed to cancel order';
      
      store.dispatch({ 
        type: cancelOrder.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().trading;
      
      expect(state.error).toBe(error);
    });
  });
});