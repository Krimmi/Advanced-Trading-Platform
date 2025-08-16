import { apiRequest } from './api';

// Types
export interface Portfolio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  positions: Position[];
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  companyName: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  sector: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  initialPositions?: {
    symbol: string;
    shares: number;
    averageCost: number;
    purchaseDate?: string;
  }[];
}

export interface AddPositionRequest {
  portfolioId: string;
  symbol: string;
  shares: number;
  averageCost: number;
  purchaseDate?: string;
}

export interface UpdatePositionRequest {
  portfolioId: string;
  positionId: string;
  shares?: number;
  averageCost?: number;
}

export interface PortfolioPerformance {
  portfolioId: string;
  timeframe: string;
  data: {
    date: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
}

// Portfolio service
const portfolioService = {
  // Get all portfolios for current user
  getPortfolios: () => {
    return apiRequest<Portfolio[]>({
      method: 'GET',
      url: '/api/portfolio',
    });
  },

  // Get portfolio by ID
  getPortfolio: (portfolioId: string) => {
    return apiRequest<Portfolio>({
      method: 'GET',
      url: `/api/portfolio/${portfolioId}`,
    });
  },

  // Create new portfolio
  createPortfolio: (data: CreatePortfolioRequest) => {
    return apiRequest<Portfolio>({
      method: 'POST',
      url: '/api/portfolio',
      data,
    });
  },

  // Update portfolio
  updatePortfolio: (portfolioId: string, data: { name?: string; description?: string }) => {
    return apiRequest<Portfolio>({
      method: 'PUT',
      url: `/api/portfolio/${portfolioId}`,
      data,
    });
  },

  // Delete portfolio
  deletePortfolio: (portfolioId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/portfolio/${portfolioId}`,
    });
  },

  // Add position to portfolio
  addPosition: (data: AddPositionRequest) => {
    return apiRequest<Position>({
      method: 'POST',
      url: `/api/portfolio/${data.portfolioId}/positions`,
      data: {
        symbol: data.symbol,
        shares: data.shares,
        averageCost: data.averageCost,
        purchaseDate: data.purchaseDate,
      },
    });
  },

  // Update position
  updatePosition: (data: UpdatePositionRequest) => {
    return apiRequest<Position>({
      method: 'PUT',
      url: `/api/portfolio/${data.portfolioId}/positions/${data.positionId}`,
      data: {
        shares: data.shares,
        averageCost: data.averageCost,
      },
    });
  },

  // Delete position
  deletePosition: (portfolioId: string, positionId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/portfolio/${portfolioId}/positions/${positionId}`,
    });
  },

  // Get portfolio performance
  getPortfolioPerformance: (
    portfolioId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    startDate?: string,
    endDate?: string
  ) => {
    return apiRequest<PortfolioPerformance>({
      method: 'GET',
      url: `/api/portfolio/${portfolioId}/performance`,
      params: {
        timeframe,
        start_date: startDate,
        end_date: endDate,
      },
    });
  },

  // Get portfolio allocation
  getPortfolioAllocation: (portfolioId: string) => {
    return apiRequest<any>({
      method: 'GET',
      url: `/api/portfolio/${portfolioId}/allocation`,
    });
  },

  // Get portfolio risk metrics
  getPortfolioRiskMetrics: (portfolioId: string) => {
    return apiRequest<any>({
      method: 'GET',
      url: `/api/portfolio/${portfolioId}/risk`,
    });
  },

  // Get portfolio optimization suggestions
  getPortfolioOptimization: (portfolioId: string, targetReturn?: number, maxRisk?: number) => {
    return apiRequest<any>({
      method: 'GET',
      url: `/api/portfolio/${portfolioId}/optimize`,
      params: {
        target_return: targetReturn,
        max_risk: maxRisk,
      },
    });
  },
};

export default portfolioService;