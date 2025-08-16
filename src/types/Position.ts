/**
 * Position Type Definitions
 * 
 * These types define the structure of portfolio positions.
 */

export interface Position {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  currentMarketPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  costBasis: number;
  openedAt: Date;
  updatedAt: Date;
  side: 'long' | 'short';
  exchange?: string;
  assetClass: 'equity' | 'option' | 'future' | 'crypto' | 'forex';
  
  // Additional metadata
  tags?: string[];
  strategyId?: string;
  notes?: string;
}

export interface PositionSummary {
  totalPositions: number;
  totalLongPositions: number;
  totalShortPositions: number;
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
}