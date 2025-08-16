/**
 * Black-Litterman Model Service
 * Implements the Black-Litterman model for portfolio optimization
 */

import { injectable, inject } from 'inversify';
import { 
  Asset, 
  AssetAllocation,
  OptimizationConstraint,
  OptimizationObjective,
  OptimizationRequest,
  OptimizationResult,
  Portfolio
} from './models/OptimizationModels';
import { PortfolioOptimizationService } from './PortfolioOptimizationService';
import { MarketDataService } from '../market/MarketDataService';
import { LoggerService } from '../common/LoggerService';

export interface InvestorView {
  id: string;
  assets: string[];
  weights: number[];
  expectedReturn: number;
  confidence: number;
}

export interface BlackLittermanParameters {
  tau: number;
  marketEquilibriumReturns?: number[];
  riskAversionCoefficient?: number;
  views: InvestorView[];
  constraints?: OptimizationConstraint[];
  riskFreeRate?: number;
}

export interface BlackLittermanResult {
  portfolioId: string;
  timestamp: Date;
  priorReturns: number[];
  posteriorReturns: number[];
  optimalAllocations: AssetAllocation[];
  covarianceMatrix: number[][];
  metrics: {
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
  };
}

@injectable()
export class BlackLittermanService {
  constructor(
    @inject(PortfolioOptimizationService) private optimizationService: PortfolioOptimizationService,
    @inject(MarketDataService) private marketDataService: MarketDataService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Runs the Black-Litterman model to generate optimal portfolio allocations
   * @param portfolioId The portfolio ID
   * @param parameters Black-Litterman model parameters
   * @returns The Black-Litterman model results
   */
  public async runBlackLittermanModel(
    portfolioId: string,
    parameters: BlackLittermanParameters
  ): Promise<BlackLittermanResult> {
    this.logger.info('Running Black-Litterman model', { portfolioId });
    
    try {
      // Get portfolio data
      const portfolio = await this.getPortfolio(portfolioId);
      
      // Get historical returns for assets
      const returns = await this.getAssetReturns(portfolio.assets, 252);
      
      // Calculate covariance matrix
      const covarianceMatrix = this.calculateCovarianceMatrix(returns);
      
      // Get market capitalization weights if not using existing portfolio weights
      const marketCapWeights = await this.getMarketCapWeights(portfolio.assets);
      
      // Calculate market equilibrium returns (prior)
      const priorReturns = parameters.marketEquilibriumReturns || 
        this.calculateEquilibriumReturns(
          covarianceMatrix,
          marketCapWeights,
          parameters.riskAversionCoefficient || 2.5,
          parameters.riskFreeRate || 0.02
        );
      
      // Process investor views
      const { P, Q, omega } = this.processInvestorViews(
        parameters.views,
        portfolio.assets,
        covarianceMatrix,
        parameters.tau
      );
      
      // Calculate posterior returns using Black-Litterman formula
      const posteriorReturns = this.calculatePosteriorReturns(
        priorReturns,
        covarianceMatrix,
        P,
        Q,
        omega,
        parameters.tau
      );
      
      // Run mean-variance optimization with posterior returns
      const optimizationRequest: OptimizationRequest = {
        portfolioId,
        objective: {
          type: 'MAXIMIZE_SHARPE',
          parameters: {}
        },
        constraints: parameters.constraints || [],
        riskFreeRate: parameters.riskFreeRate
      };
      
      // Use the optimization service with our posterior returns
      const optimalAllocations = await this.optimizeWithPosteriorReturns(
        portfolio,
        posteriorReturns,
        covarianceMatrix,
        optimizationRequest
      );
      
      // Calculate metrics
      const metrics = this.calculatePortfolioMetrics(
        optimalAllocations,
        posteriorReturns,
        covarianceMatrix,
        parameters.riskFreeRate || 0.02
      );
      
      // Create and return the result
      const result: BlackLittermanResult = {
        portfolioId,
        timestamp: new Date(),
        priorReturns,
        posteriorReturns,
        optimalAllocations,
        covarianceMatrix,
        metrics
      };
      
      this.logger.info('Black-Litterman model completed successfully', { 
        portfolioId,
        sharpeRatio: metrics.sharpeRatio,
        expectedReturn: metrics.expectedReturn,
        expectedRisk: metrics.expectedRisk
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error running Black-Litterman model', { 
        portfolioId, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Calculates equilibrium returns using reverse optimization
   */
  private calculateEquilibriumReturns(
    covarianceMatrix: number[][],
    marketWeights: number[],
    riskAversionCoefficient: number,
    riskFreeRate: number
  ): number[] {
    // Π = δΣw
    // where:
    // Π = equilibrium returns
    // δ = risk aversion coefficient
    // Σ = covariance matrix
    // w = market weights
    
    const n = marketWeights.length;
    const equilibriumReturns = new Array(n).fill(0);
    
    // Matrix multiplication: Σw
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        equilibriumReturns[i] += covarianceMatrix[i][j] * marketWeights[j];
      }
      
      // Multiply by risk aversion coefficient
      equilibriumReturns[i] *= riskAversionCoefficient;
      
      // Add risk-free rate
      equilibriumReturns[i] += riskFreeRate;
    }
    
    return equilibriumReturns;
  }

  /**
   * Processes investor views into matrices P, Q, and Ω
   */
  private processInvestorViews(
    views: InvestorView[],
    assets: Asset[],
    covarianceMatrix: number[][],
    tau: number
  ): { P: number[][], Q: number[], omega: number[][] } {
    const n = assets.length;
    const k = views.length;
    
    // Initialize matrices
    const P = Array(k).fill(0).map(() => Array(n).fill(0));
    const Q = Array(k).fill(0);
    const omega = Array(k).fill(0).map(() => Array(k).fill(0));
    
    // Process each view
    for (let i = 0; i < k; i++) {
      const view = views[i];
      
      // Set up P matrix (view weights)
      for (let j = 0; j < n; j++) {
        const asset = assets[j];
        const viewAssetIndex = view.assets.indexOf(asset.id);
        
        if (viewAssetIndex >= 0) {
          P[i][j] = view.weights[viewAssetIndex];
        }
      }
      
      // Set up Q matrix (view expected returns)
      Q[i] = view.expectedReturn;
      
      // Set up diagonal of omega matrix (view uncertainty)
      // Using the formula: ω_i = (p_i' Σ p_i) / c_i
      // where c_i is the confidence in the view (1-10 scale)
      let uncertainty = 0;
      
      for (let j = 0; j < n; j++) {
        for (let l = 0; l < n; l++) {
          uncertainty += P[i][j] * covarianceMatrix[j][l] * P[i][l];
        }
      }
      
      // Scale by tau and confidence
      uncertainty *= tau / view.confidence;
      omega[i][i] = uncertainty;
    }
    
    return { P, Q, omega };
  }

  /**
   * Calculates posterior returns using the Black-Litterman formula
   */
  private calculatePosteriorReturns(
    priorReturns: number[],
    covarianceMatrix: number[][],
    P: number[][],
    Q: number[],
    omega: number[][],
    tau: number
  ): number[] {
    const n = priorReturns.length;
    const k = Q.length;
    
    // Calculate posterior returns using the formula:
    // E[R] = [(τΣ)^(-1) + P'Ω^(-1)P]^(-1) * [(τΣ)^(-1)π + P'Ω^(-1)Q]
    
    // Step 1: Calculate (τΣ)^(-1)
    const tauSigmaInv = this.invertMatrix(
      this.scaleMatrix(covarianceMatrix, tau)
    );
    
    // Step 2: Calculate Ω^(-1)
    const omegaInv = this.invertMatrix(omega);
    
    // Step 3: Calculate P'Ω^(-1)
    const pTransposeOmegaInv = this.transposeMatrixMultiply(P, omegaInv);
    
    // Step 4: Calculate P'Ω^(-1)P
    const pTransposeOmegaInvP = this.matrixMultiply(pTransposeOmegaInv, P);
    
    // Step 5: Calculate [(τΣ)^(-1) + P'Ω^(-1)P]
    const sumMatrix = this.addMatrices(tauSigmaInv, pTransposeOmegaInvP);
    
    // Step 6: Calculate [(τΣ)^(-1) + P'Ω^(-1)P]^(-1)
    const sumMatrixInv = this.invertMatrix(sumMatrix);
    
    // Step 7: Calculate (τΣ)^(-1)π
    const tauSigmaInvPi = this.matrixVectorMultiply(tauSigmaInv, priorReturns);
    
    // Step 8: Calculate P'Ω^(-1)Q
    const pTransposeOmegaInvQ = this.matrixVectorMultiply(pTransposeOmegaInv, Q);
    
    // Step 9: Calculate [(τΣ)^(-1)π + P'Ω^(-1)Q]
    const sumVector = this.addVectors(tauSigmaInvPi, pTransposeOmegaInvQ);
    
    // Step 10: Calculate [(τΣ)^(-1) + P'Ω^(-1)P]^(-1) * [(τΣ)^(-1)π + P'Ω^(-1)Q]
    const posteriorReturns = this.matrixVectorMultiply(sumMatrixInv, sumVector);
    
    return posteriorReturns;
  }

  /**
   * Optimizes portfolio using posterior returns
   */
  private async optimizeWithPosteriorReturns(
    portfolio: Portfolio,
    posteriorReturns: number[],
    covarianceMatrix: number[][],
    request: OptimizationRequest
  ): Promise<AssetAllocation[]> {
    // In a real implementation, this would call the optimization service
    // with the posterior returns
    
    // For now, we'll return a simplified allocation based on the returns
    
    // Normalize returns to get weights
    const totalReturn = posteriorReturns.reduce((sum, ret) => sum + Math.max(ret, 0), 0);
    
    if (totalReturn <= 0) {
      // If all returns are negative, use equal weights
      return portfolio.assets.map((asset, i) => ({
        assetId: asset.id,
        weight: 1 / portfolio.assets.length
      }));
    }
    
    // Calculate weights based on positive returns
    const weights = posteriorReturns.map(ret => Math.max(ret, 0) / totalReturn);
    
    // Create allocations
    return portfolio.assets.map((asset, i) => ({
      assetId: asset.id,
      weight: weights[i]
    }));
  }

  /**
   * Calculates portfolio metrics
   */
  private calculatePortfolioMetrics(
    allocations: AssetAllocation[],
    expectedReturns: number[],
    covarianceMatrix: number[][],
    riskFreeRate: number
  ): { expectedReturn: number, expectedRisk: number, sharpeRatio: number } {
    // Map allocations to weights array
    const weights = expectedReturns.map((_, i) => {
      const allocation = allocations.find(a => a.assetId === `asset${i + 1}`);
      return allocation ? allocation.weight : 0;
    });
    
    // Calculate expected portfolio return
    const expectedReturn = weights.reduce(
      (sum, weight, i) => sum + weight * expectedReturns[i],
      0
    );
    
    // Calculate portfolio variance
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    
    // Calculate portfolio risk (standard deviation)
    const expectedRisk = Math.sqrt(portfolioVariance);
    
    // Calculate Sharpe ratio
    const sharpeRatio = (expectedReturn - riskFreeRate) / expectedRisk;
    
    return {
      expectedReturn,
      expectedRisk,
      sharpeRatio
    };
  }

  /**
   * Retrieves a portfolio by ID
   */
  private async getPortfolio(portfolioId: string): Promise<Portfolio> {
    // In a real implementation, this would fetch from a database or API
    // For now, we'll return a mock portfolio
    
    return {
      id: portfolioId,
      name: 'Sample Portfolio',
      createdAt: new Date(),
      updatedAt: new Date(),
      assets: [
        {
          id: 'asset1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          assetClass: 'EQUITY',
          sector: 'Technology',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset2',
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          assetClass: 'EQUITY',
          sector: 'Technology',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset3',
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          assetClass: 'EQUITY',
          sector: 'Consumer Cyclical',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset4',
          symbol: 'BND',
          name: 'Vanguard Total Bond Market ETF',
          assetClass: 'FIXED_INCOME',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset5',
          symbol: 'GLD',
          name: 'SPDR Gold Shares',
          assetClass: 'COMMODITY',
          country: 'US',
          currency: 'USD'
        }
      ],
      allocations: [
        { assetId: 'asset1', weight: 0.2 },
        { assetId: 'asset2', weight: 0.2 },
        { assetId: 'asset3', weight: 0.2 },
        { assetId: 'asset4', weight: 0.3 },
        { assetId: 'asset5', weight: 0.1 }
      ],
      benchmarkId: 'SPY'
    };
  }

  /**
   * Retrieves historical returns for a list of assets
   */
  private async getAssetReturns(assets: Asset[], lookbackPeriod: number): Promise<number[][]> {
    // In a real implementation, this would fetch from a market data service
    // For now, we'll return mock data
    
    // Create mock returns for each asset
    return assets.map(asset => {
      const returns: number[] = [];
      
      // Generate random returns
      for (let i = 0; i < lookbackPeriod; i++) {
        returns.push(this.generateRandomReturn(asset.assetClass));
      }
      
      return returns;
    });
  }

  /**
   * Generates a random return based on asset class
   */
  private generateRandomReturn(assetClass: string): number {
    // Different asset classes have different return distributions
    switch (assetClass) {
      case 'EQUITY':
        return (Math.random() - 0.48) * 0.02; // Higher volatility
      case 'FIXED_INCOME':
        return (Math.random() - 0.45) * 0.005; // Lower volatility
      case 'COMMODITY':
        return (Math.random() - 0.47) * 0.015; // Medium volatility
      default:
        return (Math.random() - 0.5) * 0.01;
    }
  }

  /**
   * Retrieves market capitalization weights for assets
   */
  private async getMarketCapWeights(assets: Asset[]): Promise<number[]> {
    // In a real implementation, this would fetch from a market data service
    // For now, we'll return mock weights
    
    // Generate random market caps
    const marketCaps = assets.map(asset => {
      // Generate a random market cap based on asset class
      switch (asset.assetClass) {
        case 'EQUITY':
          return Math.random() * 1000 + 100; // 100-1100 billion
        case 'FIXED_INCOME':
          return Math.random() * 500 + 200; // 200-700 billion
        case 'COMMODITY':
          return Math.random() * 200 + 50; // 50-250 billion
        default:
          return Math.random() * 300 + 100; // 100-400 billion
      }
    });
    
    // Calculate total market cap
    const totalMarketCap = marketCaps.reduce((sum, cap) => sum + cap, 0);
    
    // Calculate weights
    return marketCaps.map(cap => cap / totalMarketCap);
  }

  /**
   * Calculates covariance matrix from historical returns
   */
  private calculateCovarianceMatrix(returns: number[][]): number[][] {
    const numAssets = returns.length;
    
    // Calculate means
    const means = returns.map(assetReturns => {
      const sum = assetReturns.reduce((total, ret) => total + ret, 0);
      return sum / assetReturns.length;
    });
    
    // Initialize covariance matrix
    const covMatrix: number[][] = Array(numAssets).fill(0).map(() => Array(numAssets).fill(0));
    
    // Calculate covariances
    for (let i = 0; i < numAssets; i++) {
      for (let j = i; j < numAssets; j++) {
        let covariance = 0;
        const n = Math.min(returns[i].length, returns[j].length);
        
        for (let k = 0; k < n; k++) {
          covariance += (returns[i][k] - means[i]) * (returns[j][k] - means[j]);
        }
        
        covariance /= (n - 1);
        
        // Fill both sides of the matrix (it's symmetric)
        covMatrix[i][j] = covariance;
        covMatrix[j][i] = covariance;
      }
    }
    
    return covMatrix;
  }

  /**
   * Matrix operations for Black-Litterman calculations
   */

  // Scale matrix by a constant
  private scaleMatrix(matrix: number[][], scalar: number): number[][] {
    return matrix.map(row => row.map(val => val * scalar));
  }

  // Invert matrix (simplified for 2x2 matrices)
  private invertMatrix(matrix: number[][]): number[][] {
    // For simplicity, we'll implement a basic matrix inversion
    // In a real implementation, use a proper linear algebra library
    
    const n = matrix.length;
    
    if (n === 1) {
      return [[1 / matrix[0][0]]];
    }
    
    if (n === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      
      if (Math.abs(det) < 1e-10) {
        throw new Error('Matrix is singular and cannot be inverted');
      }
      
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];
    }
    
    // For larger matrices, we would need a more sophisticated algorithm
    // This is a placeholder for demonstration purposes
    return matrix.map(row => row.map(() => 0));
  }

  // Transpose matrix
  private transposeMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }
    
    return result;
  }

  // Multiply matrices
  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const rowsA = a.length;
    const colsA = a[0].length;
    const colsB = b[0].length;
    const result: number[][] = Array(rowsA).fill(0).map(() => Array(colsB).fill(0));
    
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    
    return result;
  }

  // Transpose and multiply matrices
  private transposeMatrixMultiply(a: number[][], b: number[][]): number[][] {
    return this.matrixMultiply(this.transposeMatrix(a), b);
  }

  // Add matrices
  private addMatrices(a: number[][], b: number[][]): number[][] {
    const rows = a.length;
    const cols = a[0].length;
    const result: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[i][j] = a[i][j] + b[i][j];
      }
    }
    
    return result;
  }

  // Multiply matrix by vector
  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[] = Array(rows).fill(0);
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    
    return result;
  }

  // Add vectors
  private addVectors(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + b[i]);
  }
}