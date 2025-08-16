import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer, { 
  fetchPortfolios, 
  fetchPortfolioDetails, 
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  updateHolding,
  removeHolding,
  PortfolioState
} from '../portfolioSlice';

// Mock the portfolio service
jest.mock('../../../services/portfolio', () => ({
  portfolioService: {
    getPortfolios: jest.fn(),
    getPortfolioById: jest.fn(),
    createPortfolio: jest.fn(),
    updatePortfolio: jest.fn(),
    deletePortfolio: jest.fn(),
    addHolding: jest.fn(),
    updateHolding: jest.fn(),
    removeHolding: jest.fn()
  }
}));

import { portfolioService } from '../../../services/portfolio';

describe('Portfolio Slice', () => {
  let store: any;
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        portfolio: portfolioReducer
      }
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      const state = store.getState().portfolio;
      
      expect(state).toEqual({
        portfolios: [],
        selectedPortfolio: null,
        loading: false,
        error: null
      });
    });
  });
  
  describe('Fetch Portfolios', () => {
    it('should handle fetchPortfolios.pending', () => {
      store.dispatch({ type: fetchPortfolios.pending.type });
      
      const state = store.getState().portfolio;
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchPortfolios.fulfilled', () => {
      const portfolios = [
        { id: '1', name: 'Growth Portfolio', description: 'High growth stocks', holdings: [] },
        { id: '2', name: 'Income Portfolio', description: 'Dividend stocks', holdings: [] }
      ];
      
      store.dispatch({ 
        type: fetchPortfolios.fulfilled.type, 
        payload: portfolios 
      });
      
      const state = store.getState().portfolio;
      
      expect(state.loading).toBe(false);
      expect(state.portfolios).toEqual(portfolios);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchPortfolios.rejected', () => {
      const error = 'Failed to fetch portfolios';
      
      store.dispatch({ 
        type: fetchPortfolios.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().portfolio;
      
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call portfolioService.getPortfolios', async () => {
      const portfolios = [
        { id: '1', name: 'Growth Portfolio', description: 'High growth stocks', holdings: [] },
        { id: '2', name: 'Income Portfolio', description: 'Dividend stocks', holdings: [] }
      ];
      
      (portfolioService.getPortfolios as jest.Mock).mockResolvedValue(portfolios);
      
      await store.dispatch(fetchPortfolios());
      
      expect(portfolioService.getPortfolios).toHaveBeenCalled();
      
      const state = store.getState().portfolio;
      
      expect(state.portfolios).toEqual(portfolios);
    });
  });
  
  describe('Fetch Portfolio Details', () => {
    it('should handle fetchPortfolioDetails.fulfilled', async () => {
      const portfolio = { 
        id: '1', 
        name: 'Growth Portfolio', 
        description: 'High growth stocks', 
        holdings: [
          { id: '1', symbol: 'AAPL', quantity: 10, costBasis: 150 },
          { id: '2', symbol: 'MSFT', quantity: 5, costBasis: 200 }
        ]
      };
      
      (portfolioService.getPortfolioById as jest.Mock).mockResolvedValue(portfolio);
      
      await store.dispatch(fetchPortfolioDetails('1'));
      
      expect(portfolioService.getPortfolioById).toHaveBeenCalledWith('1');
      
      const state = store.getState().portfolio;
      
      expect(state.selectedPortfolio).toEqual(portfolio);
    });
  });
  
  describe('Create Portfolio', () => {
    it('should handle createPortfolio.fulfilled', async () => {
      const newPortfolio = { 
        name: 'New Portfolio', 
        description: 'Test portfolio' 
      };
      
      const createdPortfolio = { 
        id: '3', 
        name: 'New Portfolio', 
        description: 'Test portfolio',
        holdings: []
      };
      
      (portfolioService.createPortfolio as jest.Mock).mockResolvedValue(createdPortfolio);
      
      await store.dispatch(createPortfolio(newPortfolio));
      
      expect(portfolioService.createPortfolio).toHaveBeenCalledWith(newPortfolio);
      
      const state = store.getState().portfolio;
      
      expect(state.portfolios).toContainEqual(createdPortfolio);
    });
  });
  
  describe('Update Portfolio', () => {
    it('should handle updatePortfolio.fulfilled', async () => {
      // Set up initial state with portfolios
      const initialPortfolios = [
        { id: '1', name: 'Growth Portfolio', description: 'High growth stocks', holdings: [] },
        { id: '2', name: 'Income Portfolio', description: 'Dividend stocks', holdings: [] }
      ];
      
      store.dispatch({ 
        type: fetchPortfolios.fulfilled.type, 
        payload: initialPortfolios 
      });
      
      // Update a portfolio
      const updatedPortfolio = { 
        id: '1', 
        name: 'Updated Portfolio', 
        description: 'Updated description',
        holdings: []
      };
      
      (portfolioService.updatePortfolio as jest.Mock).mockResolvedValue(updatedPortfolio);
      
      await store.dispatch(updatePortfolio(updatedPortfolio));
      
      expect(portfolioService.updatePortfolio).toHaveBeenCalledWith(updatedPortfolio);
      
      const state = store.getState().portfolio;
      
      // Check that the portfolio was updated
      expect(state.portfolios.find(p => p.id === '1')).toEqual(updatedPortfolio);
      
      // Check that other portfolios remain unchanged
      expect(state.portfolios.find(p => p.id === '2')).toEqual(initialPortfolios[1]);
    });
  });
  
  describe('Delete Portfolio', () => {
    it('should handle deletePortfolio.fulfilled', async () => {
      // Set up initial state with portfolios
      const initialPortfolios = [
        { id: '1', name: 'Growth Portfolio', description: 'High growth stocks', holdings: [] },
        { id: '2', name: 'Income Portfolio', description: 'Dividend stocks', holdings: [] }
      ];
      
      store.dispatch({ 
        type: fetchPortfolios.fulfilled.type, 
        payload: initialPortfolios 
      });
      
      // Delete a portfolio
      (portfolioService.deletePortfolio as jest.Mock).mockResolvedValue({ id: '1' });
      
      await store.dispatch(deletePortfolio('1'));
      
      expect(portfolioService.deletePortfolio).toHaveBeenCalledWith('1');
      
      const state = store.getState().portfolio;
      
      // Check that the portfolio was removed
      expect(state.portfolios.find(p => p.id === '1')).toBeUndefined();
      
      // Check that other portfolios remain
      expect(state.portfolios).toHaveLength(1);
      expect(state.portfolios[0].id).toBe('2');
    });
  });
  
  describe('Holdings Management', () => {
    beforeEach(() => {
      // Set up initial state with a selected portfolio
      const portfolio = { 
        id: '1', 
        name: 'Growth Portfolio', 
        description: 'High growth stocks', 
        holdings: [
          { id: '1', symbol: 'AAPL', quantity: 10, costBasis: 150 },
          { id: '2', symbol: 'MSFT', quantity: 5, costBasis: 200 }
        ]
      };
      
      store.dispatch({ 
        type: fetchPortfolioDetails.fulfilled.type, 
        payload: portfolio 
      });
    });
    
    it('should handle addHolding.fulfilled', async () => {
      const newHolding = { symbol: 'GOOGL', quantity: 2, costBasis: 2500 };
      const updatedPortfolio = { 
        id: '1', 
        name: 'Growth Portfolio', 
        description: 'High growth stocks', 
        holdings: [
          { id: '1', symbol: 'AAPL', quantity: 10, costBasis: 150 },
          { id: '2', symbol: 'MSFT', quantity: 5, costBasis: 200 },
          { id: '3', symbol: 'GOOGL', quantity: 2, costBasis: 2500 }
        ]
      };
      
      (portfolioService.addHolding as jest.Mock).mockResolvedValue(updatedPortfolio);
      
      await store.dispatch(addHolding({ portfolioId: '1', holding: newHolding }));
      
      expect(portfolioService.addHolding).toHaveBeenCalledWith('1', newHolding);
      
      const state = store.getState().portfolio;
      
      expect(state.selectedPortfolio).toEqual(updatedPortfolio);
    });
    
    it('should handle updateHolding.fulfilled', async () => {
      const updatedHolding = { id: '1', symbol: 'AAPL', quantity: 15, costBasis: 155 };
      const updatedPortfolio = { 
        id: '1', 
        name: 'Growth Portfolio', 
        description: 'High growth stocks', 
        holdings: [
          { id: '1', symbol: 'AAPL', quantity: 15, costBasis: 155 },
          { id: '2', symbol: 'MSFT', quantity: 5, costBasis: 200 }
        ]
      };
      
      (portfolioService.updateHolding as jest.Mock).mockResolvedValue(updatedPortfolio);
      
      await store.dispatch(updateHolding({ 
        portfolioId: '1', 
        holdingId: '1', 
        holding: updatedHolding 
      }));
      
      expect(portfolioService.updateHolding).toHaveBeenCalledWith('1', '1', updatedHolding);
      
      const state = store.getState().portfolio;
      
      expect(state.selectedPortfolio).toEqual(updatedPortfolio);
    });
    
    it('should handle removeHolding.fulfilled', async () => {
      const updatedPortfolio = { 
        id: '1', 
        name: 'Growth Portfolio', 
        description: 'High growth stocks', 
        holdings: [
          { id: '2', symbol: 'MSFT', quantity: 5, costBasis: 200 }
        ]
      };
      
      (portfolioService.removeHolding as jest.Mock).mockResolvedValue(updatedPortfolio);
      
      await store.dispatch(removeHolding({ portfolioId: '1', holdingId: '1' }));
      
      expect(portfolioService.removeHolding).toHaveBeenCalledWith('1', '1');
      
      const state = store.getState().portfolio;
      
      expect(state.selectedPortfolio).toEqual(updatedPortfolio);
    });
  });
});