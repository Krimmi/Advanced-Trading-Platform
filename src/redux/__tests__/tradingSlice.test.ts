import { configureStore } from '@reduxjs/toolkit';
import tradingReducer, {
  fetchOrders,
  fetchOrderDetails,
  createOrder,
  cancelOrder,
  fetchPositions,
  fetchTradeHistory,
  TradingState
} from '../slices/tradingSlice';

describe('Trading Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        trading: tradingReducer
      }
    });
  });
  
  it('should handle initial state', () => {
    const state = store.getState().trading;
    expect(state.orders).toEqual([]);
    expect(state.currentOrder).toBeNull();
    expect(state.positions).toEqual([]);
    expect(state.tradeHistory).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchOrders.pending', () => {
    store.dispatch({ type: fetchOrders.pending.type });
    const state = store.getState().trading;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchOrders.fulfilled', () => {
    const mockOrders = [
      { id: 'order1', symbol: 'AAPL', side: 'buy', type: 'market', quantity: 10, status: 'filled' },
      { id: 'order2', symbol: 'MSFT', side: 'sell', type: 'limit', quantity: 5, price: 300, status: 'open' }
    ];
    
    store.dispatch({
      type: fetchOrders.fulfilled.type,
      payload: mockOrders
    });
    
    const state = store.getState().trading;
    expect(state.orders).toEqual(mockOrders);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchOrders.rejected', () => {
    const errorMessage = 'Failed to fetch orders';
    
    store.dispatch({
      type: fetchOrders.rejected.type,
      payload: errorMessage
    });
    
    const state = store.getState().trading;
    expect(state.loading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
  
  it('should handle fetchOrderDetails.fulfilled', () => {
    const mockOrder = {
      id: 'order1',
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 10,
      status: 'filled',
      filledAt: '2023-01-01T12:00:00Z',
      filledPrice: 150,
      totalValue: 1500
    };
    
    store.dispatch({
      type: fetchOrderDetails.fulfilled.type,
      payload: mockOrder,
      meta: { arg: 'order1' }
    });
    
    const state = store.getState().trading;
    expect(state.currentOrder).toEqual(mockOrder);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle createOrder.fulfilled', () => {
    const mockOrder = {
      id: 'order3',
      symbol: 'GOOGL',
      side: 'buy',
      type: 'limit',
      quantity: 2,
      price: 2500,
      status: 'open'
    };
    
    // First set some existing orders
    store.dispatch({
      type: fetchOrders.fulfilled.type,
      payload: [
        { id: 'order1', symbol: 'AAPL', side: 'buy', type: 'market', quantity: 10, status: 'filled' },
        { id: 'order2', symbol: 'MSFT', side: 'sell', type: 'limit', quantity: 5, price: 300, status: 'open' }
      ]
    });
    
    // Then create a new one
    store.dispatch({
      type: createOrder.fulfilled.type,
      payload: mockOrder
    });
    
    const state = store.getState().trading;
    expect(state.orders).toHaveLength(3);
    expect(state.orders[2]).toEqual(mockOrder);
    expect(state.currentOrder).toEqual(mockOrder);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle cancelOrder.fulfilled', () => {
    const mockCancelledOrder = {
      id: 'order2',
      symbol: 'MSFT',
      side: 'sell',
      type: 'limit',
      quantity: 5,
      price: 300,
      status: 'cancelled'
    };
    
    // First set some existing orders
    store.dispatch({
      type: fetchOrders.fulfilled.type,
      payload: [
        { id: 'order1', symbol: 'AAPL', side: 'buy', type: 'market', quantity: 10, status: 'filled' },
        { id: 'order2', symbol: 'MSFT', side: 'sell', type: 'limit', quantity: 5, price: 300, status: 'open' }
      ]
    });
    
    // Then cancel one
    store.dispatch({
      type: cancelOrder.fulfilled.type,
      payload: mockCancelledOrder,
      meta: { arg: 'order2' }
    });
    
    const state = store.getState().trading;
    expect(state.orders[1].status).toBe('cancelled');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchPositions.fulfilled', () => {
    const mockPositions = [
      { symbol: 'AAPL', quantity: 100, averagePrice: 150, currentPrice: 170, marketValue: 17000, unrealizedPnL: 2000 },
      { symbol: 'MSFT', quantity: 50, averagePrice: 300, currentPrice: 310, marketValue: 15500, unrealizedPnL: 500 }
    ];
    
    store.dispatch({
      type: fetchPositions.fulfilled.type,
      payload: mockPositions
    });
    
    const state = store.getState().trading;
    expect(state.positions).toEqual(mockPositions);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchTradeHistory.fulfilled', () => {
    const mockTradeHistory = [
      { id: 'trade1', symbol: 'AAPL', side: 'buy', quantity: 10, price: 150, timestamp: '2023-01-01T12:00:00Z', value: 1500 },
      { id: 'trade2', symbol: 'MSFT', side: 'sell', quantity: 5, price: 290, timestamp: '2023-01-02T14:30:00Z', value: 1450 }
    ];
    
    store.dispatch({
      type: fetchTradeHistory.fulfilled.type,
      payload: mockTradeHistory
    });
    
    const state = store.getState().trading;
    expect(state.tradeHistory).toEqual(mockTradeHistory);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});