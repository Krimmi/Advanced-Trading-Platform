import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer, {
  fetchPortfolios,
  fetchPortfolioDetails,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addPosition,
  updatePosition,
  removePosition,
  PortfolioState
} from '../slices/portfolioSlice';

describe('Portfolio Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        portfolio: portfolioReducer
      }
    });
  });
  
  it('should handle initial state', () => {
    const state = store.getState().portfolio;
    expect(state.portfolios).toEqual([]);
    expect(state.currentPortfolio).toBeNull();
    expect(state.positions).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchPortfolios.pending', () => {
    store.dispatch({ type: fetchPortfolios.pending.type });
    const state = store.getState().portfolio;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchPortfolios.fulfilled', () => {
    const mockPortfolios = [
      { id: '1', name: 'Growth Portfolio', value: 100000, positions: 10 },
      { id: '2', name: 'Income Portfolio', value: 50000, positions: 5 }
    ];
    
    store.dispatch({
      type: fetchPortfolios.fulfilled.type,
      payload: mockPortfolios
    });
    
    const state = store.getState().portfolio;
    expect(state.portfolios).toEqual(mockPortfolios);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchPortfolios.rejected', () => {
    const errorMessage = 'Failed to fetch portfolios';
    
    store.dispatch({
      type: fetchPortfolios.rejected.type,
      payload: errorMessage
    });
    
    const state = store.getState().portfolio;
    expect(state.loading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
  
  it('should handle fetchPortfolioDetails.fulfilled', () => {
    const mockPortfolio = {
      id: '1',
      name: 'Growth Portfolio',
      value: 100000,
      positions: [
        { id: 'pos1', symbol: 'AAPL', quantity: 100, averagePrice: 150 },
        { id: 'pos2', symbol: 'MSFT', quantity: 50, averagePrice: 300 }
      ],
      performance: {
        daily: 1.5,
        weekly: 3.2,
        monthly: 5.7,
        yearly: 15.3
      }
    };
    
    store.dispatch({
      type: fetchPortfolioDetails.fulfilled.type,
      payload: mockPortfolio,
      meta: { arg: '1' }
    });
    
    const state = store.getState().portfolio;
    expect(state.currentPortfolio).toEqual(mockPortfolio);
    expect(state.positions['1']).toEqual(mockPortfolio.positions);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle createPortfolio.fulfilled', () => {
    const mockPortfolio = {
      id: '3',
      name: 'New Portfolio',
      value: 0,
      positions: 0
    };
    
    // First set some existing portfolios
    store.dispatch({
      type: fetchPortfolios.fulfilled.type,
      payload: [
        { id: '1', name: 'Growth Portfolio', value: 100000, positions: 10 },
        { id: '2', name: 'Income Portfolio', value: 50000, positions: 5 }
      ]
    });
    
    // Then create a new one
    store.dispatch({
      type: createPortfolio.fulfilled.type,
      payload: mockPortfolio
    });
    
    const state = store.getState().portfolio;
    expect(state.portfolios).toHaveLength(3);
    expect(state.portfolios[2]).toEqual(mockPortfolio);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle updatePortfolio.fulfilled', () => {
    // First set some existing portfolios
    store.dispatch({
      type: fetchPortfolios.fulfilled.type,
      payload: [
        { id: '1', name: 'Growth Portfolio', value: 100000, positions: 10 },
        { id: '2', name: 'Income Portfolio', value: 50000, positions: 5 }
      ]
    });
    
    const updatedPortfolio = {
      id: '1',
      name: 'Updated Growth Portfolio',
      value: 110000,
      positions: 12
    };
    
    store.dispatch({
      type: updatePortfolio.fulfilled.type,
      payload: updatedPortfolio
    });
    
    const state = store.getState().portfolio;
    expect(state.portfolios[0]).toEqual(updatedPortfolio);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle deletePortfolio.fulfilled', () => {
    // First set some existing portfolios
    store.dispatch({
      type: fetchPortfolios.fulfilled.type,
      payload: [
        { id: '1', name: 'Growth Portfolio', value: 100000, positions: 10 },
        { id: '2', name: 'Income Portfolio', value: 50000, positions: 5 }
      ]
    });
    
    store.dispatch({
      type: deletePortfolio.fulfilled.type,
      payload: '1',
      meta: { arg: '1' }
    });
    
    const state = store.getState().portfolio;
    expect(state.portfolios).toHaveLength(1);
    expect(state.portfolios[0].id).toBe('2');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle addPosition.fulfilled', () => {
    // First set current portfolio
    store.dispatch({
      type: fetchPortfolioDetails.fulfilled.type,
      payload: {
        id: '1',
        name: 'Growth Portfolio',
        value: 100000,
        positions: [
          { id: 'pos1', symbol: 'AAPL', quantity: 100, averagePrice: 150 }
        ]
      },
      meta: { arg: '1' }
    });
    
    const newPosition = {
      id: 'pos2',
      symbol: 'MSFT',
      quantity: 50,
      averagePrice: 300
    };
    
    store.dispatch({
      type: addPosition.fulfilled.type,
      payload: {
        portfolioId: '1',
        position: newPosition
      }
    });
    
    const state = store.getState().portfolio;
    expect(state.positions['1']).toHaveLength(2);
    expect(state.positions['1'][1]).toEqual(newPosition);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle updatePosition.fulfilled', () => {
    // First set current portfolio
    store.dispatch({
      type: fetchPortfolioDetails.fulfilled.type,
      payload: {
        id: '1',
        name: 'Growth Portfolio',
        value: 100000,
        positions: [
          { id: 'pos1', symbol: 'AAPL', quantity: 100, averagePrice: 150 }
        ]
      },
      meta: { arg: '1' }
    });
    
    const updatedPosition = {
      id: 'pos1',
      symbol: 'AAPL',
      quantity: 150,
      averagePrice: 155
    };
    
    store.dispatch({
      type: updatePosition.fulfilled.type,
      payload: {
        portfolioId: '1',
        position: updatedPosition
      }
    });
    
    const state = store.getState().portfolio;
    expect(state.positions['1'][0]).toEqual(updatedPosition);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle removePosition.fulfilled', () => {
    // First set current portfolio
    store.dispatch({
      type: fetchPortfolioDetails.fulfilled.type,
      payload: {
        id: '1',
        name: 'Growth Portfolio',
        value: 100000,
        positions: [
          { id: 'pos1', symbol: 'AAPL', quantity: 100, averagePrice: 150 },
          { id: 'pos2', symbol: 'MSFT', quantity: 50, averagePrice: 300 }
        ]
      },
      meta: { arg: '1' }
    });
    
    store.dispatch({
      type: removePosition.fulfilled.type,
      payload: {
        portfolioId: '1',
        positionId: 'pos1'
      }
    });
    
    const state = store.getState().portfolio;
    expect(state.positions['1']).toHaveLength(1);
    expect(state.positions['1'][0].id).toBe('pos2');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});