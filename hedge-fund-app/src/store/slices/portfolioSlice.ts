import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api/apiClient';

// Types
export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number;
  sector: string;
  industry: string;
  costBasis: number;
}

export interface PortfolioAllocation {
  sectors: {
    name: string;
    value: number;
    percentage: number;
  }[];
  assetClasses: {
    name: string;
    value: number;
    percentage: number;
  }[];
  regions: {
    name: string;
    value: number;
    percentage: number;
  }[];
}

export interface PortfolioPerformance {
  daily: {
    date: string;
    value: number;
    benchmarkValue: number;
  }[];
  weekly: {
    date: string;
    value: number;
    benchmarkValue: number;
  }[];
  monthly: {
    date: string;
    value: number;
    benchmarkValue: number;
  }[];
  yearly: {
    date: string;
    value: number;
    benchmarkValue: number;
  }[];
  allTime: {
    date: string;
    value: number;
    benchmarkValue: number;
  }[];
}

export interface PortfolioRisk {
  volatility: number;
  beta: number;
  sharpeRatio: number;
  drawdown: number;
  var: number;
  correlations: {
    symbol: string;
    correlation: number;
  }[];
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  cashBalance: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  positions: Position[];
  allocation: PortfolioAllocation;
  performance: PortfolioPerformance;
  risk: PortfolioRisk;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  positionCount: number;
  topPositions: {
    symbol: string;
    weight: number;
  }[];
}

export interface PortfolioState {
  portfolios: Record<string, Portfolio>;
  portfolioSummaries: PortfolioSummary[];
  activePortfolioId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: PortfolioState = {
  portfolios: {},
  portfolioSummaries: [],
  activePortfolioId: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Mock data for development
const mockPortfolioSummaries: PortfolioSummary[] = [
  {
    id: 'portfolio-1',
    name: 'Main Portfolio',
    totalValue: 1245678.90,
    dayChange: 24567.89,
    dayChangePercent: 2.1,
    totalGain: 245678.90,
    totalGainPercent: 24.5,
    positionCount: 28,
    topPositions: [
      { symbol: 'AAPL', weight: 12.5 },
      { symbol: 'MSFT', weight: 10.2 },
      { symbol: 'AMZN', weight: 8.7 },
      { symbol: 'GOOGL', weight: 7.3 },
      { symbol: 'NVDA', weight: 6.8 },
    ],
  },
  {
    id: 'portfolio-2',
    name: 'Tech Growth',
    totalValue: 567890.12,
    dayChange: 12345.67,
    dayChangePercent: 2.3,
    totalGain: 167890.12,
    totalGainPercent: 42.1,
    positionCount: 15,
    topPositions: [
      { symbol: 'NVDA', weight: 15.3 },
      { symbol: 'AMD', weight: 12.7 },
      { symbol: 'TSLA', weight: 10.5 },
      { symbol: 'AAPL', weight: 8.9 },
      { symbol: 'MSFT', weight: 8.2 },
    ],
  },
  {
    id: 'portfolio-3',
    name: 'Dividend Income',
    totalValue: 345678.90,
    dayChange: -4567.89,
    dayChangePercent: -1.3,
    totalGain: 45678.90,
    totalGainPercent: 15.2,
    positionCount: 22,
    topPositions: [
      { symbol: 'JNJ', weight: 8.5 },
      { symbol: 'PG', weight: 7.8 },
      { symbol: 'KO', weight: 7.2 },
      { symbol: 'VZ', weight: 6.9 },
      { symbol: 'T', weight: 6.5 },
    ],
  },
];

// Generate mock portfolio data
const generateMockPortfolio = (id: string): Portfolio => {
  const summary = mockPortfolioSummaries.find(p => p.id === id);
  
  if (!summary) {
    throw new Error(`Portfolio with id ${id} not found`);
  }
  
  // Generate positions
  const positions: Position[] = [];
  const sectorNames = ['Technology', 'Healthcare', 'Financials', 'Consumer', 'Energy', 'Utilities', 'Materials', 'Real Estate', 'Industrials', 'Communication'];
  const industryNames = ['Software', 'Hardware', 'Semiconductors', 'Biotech', 'Banking', 'Insurance', 'Retail', 'Oil & Gas', 'Telecom', 'Media'];
  
  // Add top positions from summary
  summary.topPositions.forEach(topPosition => {
    const sector = sectorNames[Math.floor(Math.random() * sectorNames.length)];
    const industry = industryNames[Math.floor(Math.random() * industryNames.length)];
    const quantity = Math.floor(Math.random() * 1000) + 10;
    const currentPrice = Math.random() * 500 + 50;
    const averageCost = currentPrice * (Math.random() * 0.4 + 0.8); // 80% to 120% of current price
    const marketValue = quantity * currentPrice;
    const costBasis = quantity * averageCost;
    const unrealizedPL = marketValue - costBasis;
    const unrealizedPLPercent = (unrealizedPL / costBasis) * 100;
    const dayChange = currentPrice * (Math.random() * 0.1 - 0.05); // -5% to +5%
    const dayChangePercent = (dayChange / (currentPrice - dayChange)) * 100;
    
    positions.push({
      symbol: topPosition.symbol,
      name: `${topPosition.symbol} Inc.`,
      quantity,
      averageCost,
      currentPrice,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent,
      dayChange,
      dayChangePercent,
      weight: topPosition.weight,
      sector,
      industry,
      costBasis,
    });
  });
  
  // Add more random positions
  const remainingPositions = summary.positionCount - summary.topPositions.length;
  const symbols = ['NFLX', 'META', 'PYPL', 'INTC', 'CRM', 'ADBE', 'CSCO', 'PEP', 'COST', 'DIS', 'V', 'MA', 'JPM', 'BAC', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'XOM', 'CVX', 'PFE', 'MRK', 'ABT', 'TMO'];
  
  for (let i = 0; i < remainingPositions; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const sector = sectorNames[Math.floor(Math.random() * sectorNames.length)];
    const industry = industryNames[Math.floor(Math.random() * industryNames.length)];
    const quantity = Math.floor(Math.random() * 500) + 5;
    const currentPrice = Math.random() * 300 + 20;
    const averageCost = currentPrice * (Math.random() * 0.4 + 0.8); // 80% to 120% of current price
    const marketValue = quantity * currentPrice;
    const costBasis = quantity * averageCost;
    const unrealizedPL = marketValue - costBasis;
    const unrealizedPLPercent = (unrealizedPL / costBasis) * 100;
    const dayChange = currentPrice * (Math.random() * 0.1 - 0.05); // -5% to +5%
    const dayChangePercent = (dayChange / (currentPrice - dayChange)) * 100;
    const weight = (marketValue / summary.totalValue) * 100;
    
    positions.push({
      symbol,
      name: `${symbol} Inc.`,
      quantity,
      averageCost,
      currentPrice,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent,
      dayChange,
      dayChangePercent,
      weight,
      sector,
      industry,
      costBasis,
    });
  }
  
  // Generate allocation data
  const sectorMap = new Map<string, number>();
  positions.forEach(position => {
    const currentValue = sectorMap.get(position.sector) || 0;
    sectorMap.set(position.sector, currentValue + position.marketValue);
  });
  
  const sectorAllocation = Array.from(sectorMap.entries()).map(([name, value]) => ({
    name,
    value,
    percentage: (value / summary.totalValue) * 100,
  }));
  
  // Generate performance data
  const generatePerformanceData = (days: number, startValue: number, volatility: number) => {
    const data = [];
    let currentValue = startValue;
    let benchmarkValue = startValue * 0.9; // Benchmark starts at 90% of portfolio value
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Random daily change with specified volatility
      const change = (Math.random() * 2 - 1) * volatility * currentValue;
      const benchmarkChange = (Math.random() * 2 - 1) * (volatility * 0.8) * benchmarkValue;
      
      currentValue += change;
      benchmarkValue += benchmarkChange;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: currentValue,
        benchmarkValue,
      });
    }
    
    return data;
  };
  
  // Generate portfolio
  return {
    id: summary.id,
    name: summary.name,
    description: `${summary.name} - A diversified portfolio of ${summary.positionCount} positions`,
    totalValue: summary.totalValue,
    cashBalance: summary.totalValue * 0.05, // 5% cash
    dayChange: summary.dayChange,
    dayChangePercent: summary.dayChangePercent,
    totalGain: summary.totalGain,
    totalGainPercent: summary.totalGainPercent,
    positions,
    allocation: {
      sectors: sectorAllocation,
      assetClasses: [
        { name: 'Stocks', value: summary.totalValue * 0.85, percentage: 85 },
        { name: 'Bonds', value: summary.totalValue * 0.05, percentage: 5 },
        { name: 'ETFs', value: summary.totalValue * 0.05, percentage: 5 },
        { name: 'Cash', value: summary.totalValue * 0.05, percentage: 5 },
      ],
      regions: [
        { name: 'North America', value: summary.totalValue * 0.7, percentage: 70 },
        { name: 'Europe', value: summary.totalValue * 0.15, percentage: 15 },
        { name: 'Asia', value: summary.totalValue * 0.1, percentage: 10 },
        { name: 'Other', value: summary.totalValue * 0.05, percentage: 5 },
      ],
    },
    performance: {
      daily: generatePerformanceData(30, summary.totalValue, 0.01),
      weekly: generatePerformanceData(52, summary.totalValue - summary.totalGain * 0.3, 0.02),
      monthly: generatePerformanceData(24, summary.totalValue - summary.totalGain * 0.6, 0.03),
      yearly: generatePerformanceData(5, summary.totalValue - summary.totalGain * 0.9, 0.05),
      allTime: generatePerformanceData(10, summary.totalValue - summary.totalGain, 0.05),
    },
    risk: {
      volatility: Math.random() * 10 + 10, // 10-20%
      beta: Math.random() * 0.5 + 0.8, // 0.8-1.3
      sharpeRatio: Math.random() * 1 + 1, // 1-2
      drawdown: Math.random() * 10 + 5, // 5-15%
      var: Math.random() * 3 + 2, // 2-5%
      correlations: [
        { symbol: 'SPY', correlation: Math.random() * 0.4 + 0.6 }, // 0.6-1.0
        { symbol: 'QQQ', correlation: Math.random() * 0.4 + 0.5 }, // 0.5-0.9
        { symbol: 'IWM', correlation: Math.random() * 0.4 + 0.4 }, // 0.4-0.8
        { symbol: 'DIA', correlation: Math.random() * 0.4 + 0.3 }, // 0.3-0.7
        { symbol: 'GLD', correlation: Math.random() * 0.4 - 0.2 }, // -0.2-0.2
      ],
    },
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Async thunks
export const fetchPortfolioSummary = createAsyncThunk(
  'portfolio/fetchPortfolioSummary',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockPortfolioSummaries;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch portfolio summary');
    }
  }
);

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async (portfolioId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll generate mock data
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return generateMockPortfolio(portfolioId);
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch portfolio ${portfolioId}`);
    }
  }
);

export const createPortfolio = createAsyncThunk(
  'portfolio/createPortfolio',
  async (portfolioData: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newId = `portfolio-${Date.now()}`;
      
      const newSummary: PortfolioSummary = {
        id: newId,
        name: portfolioData.name,
        totalValue: 0,
        dayChange: 0,
        dayChangePercent: 0,
        totalGain: 0,
        totalGainPercent: 0,
        positionCount: 0,
        topPositions: [],
      };
      
      // Generate a basic empty portfolio
      const newPortfolio: Portfolio = {
        id: newId,
        name: portfolioData.name,
        description: portfolioData.description,
        totalValue: 0,
        cashBalance: 0,
        dayChange: 0,
        dayChangePercent: 0,
        totalGain: 0,
        totalGainPercent: 0,
        positions: [],
        allocation: {
          sectors: [],
          assetClasses: [],
          regions: [],
        },
        performance: {
          daily: [],
          weekly: [],
          monthly: [],
          yearly: [],
          allTime: [],
        },
        risk: {
          volatility: 0,
          beta: 0,
          sharpeRatio: 0,
          drawdown: 0,
          var: 0,
          correlations: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return { summary: newSummary, portfolio: newPortfolio };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create portfolio');
    }
  }
);

export const updatePortfolio = createAsyncThunk(
  'portfolio/updatePortfolio',
  async ({ portfolioId, data }: { portfolioId: string; data: Partial<Portfolio> }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { portfolioId, data };
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to update portfolio ${portfolioId}`);
    }
  }
);

export const deletePortfolio = createAsyncThunk(
  'portfolio/deletePortfolio',
  async (portfolioId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the ID
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return portfolioId;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to delete portfolio ${portfolioId}`);
    }
  }
);

// Slice
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setActivePortfolio: (state, action: PayloadAction<string>) => {
      state.activePortfolioId = action.payload;
    },
    
    updatePortfolioData: (state, action: PayloadAction<any>) => {
      // Handle real-time portfolio updates from WebSocket
      const { portfolioId, data } = action.payload;
      
      if (state.portfolios[portfolioId]) {
        // Update specific portfolio data
        state.portfolios[portfolioId] = {
          ...state.portfolios[portfolioId],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        
        // Update corresponding summary if it exists
        const summaryIndex = state.portfolioSummaries.findIndex(s => s.id === portfolioId);
        if (summaryIndex !== -1) {
          state.portfolioSummaries[summaryIndex] = {
            ...state.portfolioSummaries[summaryIndex],
            totalValue: data.totalValue || state.portfolioSummaries[summaryIndex].totalValue,
            dayChange: data.dayChange || state.portfolioSummaries[summaryIndex].dayChange,
            dayChangePercent: data.dayChangePercent || state.portfolioSummaries[summaryIndex].dayChangePercent,
            positionCount: data.positions ? data.positions.length : state.portfolioSummaries[summaryIndex].positionCount,
          };
        }
      }
      
      state.lastUpdated = Date.now();
    },
    
    clearPortfolioData: (state) => {
      state.portfolios = {};
      state.portfolioSummaries = [];
      state.activePortfolioId = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch portfolio summary
    builder.addCase(fetchPortfolioSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPortfolioSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.portfolioSummaries = action.payload;
      
      // Set active portfolio if none is set
      if (!state.activePortfolioId && action.payload.length > 0) {
        state.activePortfolioId = action.payload[0].id;
      }
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchPortfolioSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch portfolio
    builder.addCase(fetchPortfolio.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPortfolio.fulfilled, (state, action) => {
      state.loading = false;
      state.portfolios[action.payload.id] = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchPortfolio.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Create portfolio
    builder.addCase(createPortfolio.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createPortfolio.fulfilled, (state, action) => {
      state.loading = false;
      state.portfolios[action.payload.portfolio.id] = action.payload.portfolio;
      state.portfolioSummaries.push(action.payload.summary);
      state.activePortfolioId = action.payload.portfolio.id;
      state.lastUpdated = Date.now();
    });
    builder.addCase(createPortfolio.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Update portfolio
    builder.addCase(updatePortfolio.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updatePortfolio.fulfilled, (state, action) => {
      state.loading = false;
      
      const { portfolioId, data } = action.payload;
      
      if (state.portfolios[portfolioId]) {
        state.portfolios[portfolioId] = {
          ...state.portfolios[portfolioId],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        
        // Update corresponding summary if needed
        if (data.name || data.totalValue || data.dayChange || data.dayChangePercent || data.positions) {
          const summaryIndex = state.portfolioSummaries.findIndex(s => s.id === portfolioId);
          
          if (summaryIndex !== -1) {
            state.portfolioSummaries[summaryIndex] = {
              ...state.portfolioSummaries[summaryIndex],
              name: data.name || state.portfolioSummaries[summaryIndex].name,
              totalValue: data.totalValue || state.portfolioSummaries[summaryIndex].totalValue,
              dayChange: data.dayChange || state.portfolioSummaries[summaryIndex].dayChange,
              dayChangePercent: data.dayChangePercent || state.portfolioSummaries[summaryIndex].dayChangePercent,
              positionCount: data.positions ? data.positions.length : state.portfolioSummaries[summaryIndex].positionCount,
            };
          }
        }
      }
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(updatePortfolio.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Delete portfolio
    builder.addCase(deletePortfolio.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deletePortfolio.fulfilled, (state, action) => {
      state.loading = false;
      
      const portfolioId = action.payload;
      
      // Remove from portfolios
      delete state.portfolios[portfolioId];
      
      // Remove from summaries
      state.portfolioSummaries = state.portfolioSummaries.filter(s => s.id !== portfolioId);
      
      // Update active portfolio if needed
      if (state.activePortfolioId === portfolioId) {
        state.activePortfolioId = state.portfolioSummaries.length > 0 ? state.portfolioSummaries[0].id : null;
      }
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(deletePortfolio.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setActivePortfolio, updatePortfolioData, clearPortfolioData } = portfolioSlice.actions;

export default portfolioSlice.reducer;