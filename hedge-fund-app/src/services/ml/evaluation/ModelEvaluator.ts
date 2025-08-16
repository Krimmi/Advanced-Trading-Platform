import * as tf from '@tensorflow/tfjs';
import { TimeSeriesData } from '../preprocessing/TimeSeriesPreprocessor';

/**
 * Class for evaluating time series forecasting models
 */
export class ModelEvaluator {
  /**
   * Calculate Mean Absolute Error (MAE)
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns MAE value
   */
  calculateMAE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Actual and predicted arrays must have the same length');
    }
    
    const sum = actual.reduce((acc, val, i) => acc + Math.abs(val - predicted[i]), 0);
    return sum / actual.length;
  }

  /**
   * Calculate Mean Squared Error (MSE)
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns MSE value
   */
  calculateMSE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Actual and predicted arrays must have the same length');
    }
    
    const sum = actual.reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);
    return sum / actual.length;
  }

  /**
   * Calculate Root Mean Squared Error (RMSE)
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns RMSE value
   */
  calculateRMSE(actual: number[], predicted: number[]): number {
    return Math.sqrt(this.calculateMSE(actual, predicted));
  }

  /**
   * Calculate Mean Absolute Percentage Error (MAPE)
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns MAPE value
   */
  calculateMAPE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Actual and predicted arrays must have the same length');
    }
    
    const sum = actual.reduce((acc, val, i) => {
      // Avoid division by zero
      if (val === 0) return acc;
      return acc + Math.abs((val - predicted[i]) / val);
    }, 0);
    
    return (sum / actual.length) * 100;
  }

  /**
   * Calculate R-squared (coefficient of determination)
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns R-squared value
   */
  calculateRSquared(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Actual and predicted arrays must have the same length');
    }
    
    const mean = actual.reduce((acc, val) => acc + val, 0) / actual.length;
    
    const totalSumSquares = actual.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const residualSumSquares = actual.reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);
    
    return 1 - (residualSumSquares / totalSumSquares);
  }

  /**
   * Calculate Direction Accuracy (percentage of correct direction predictions)
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns Direction accuracy as a percentage
   */
  calculateDirectionAccuracy(actual: number[], predicted: number[]): number {
    if (actual.length <= 1 || predicted.length <= 1) {
      throw new Error('Arrays must have at least 2 elements');
    }
    
    if (actual.length !== predicted.length) {
      throw new Error('Actual and predicted arrays must have the same length');
    }
    
    let correctDirections = 0;
    
    for (let i = 1; i < actual.length; i++) {
      const actualDirection = actual[i] - actual[i - 1];
      const predictedDirection = predicted[i] - predicted[i - 1];
      
      if ((actualDirection >= 0 && predictedDirection >= 0) || 
          (actualDirection < 0 && predictedDirection < 0)) {
        correctDirections++;
      }
    }
    
    return (correctDirections / (actual.length - 1)) * 100;
  }

  /**
   * Calculate Sharpe Ratio (risk-adjusted return)
   * @param returns Array of returns
   * @param riskFreeRate Risk-free rate (default: 0)
   * @returns Sharpe ratio
   */
  calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
    const meanReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
    const excessReturns = returns.map(r => r - riskFreeRate);
    const meanExcessReturn = excessReturns.reduce((acc, val) => acc + val, 0) / excessReturns.length;
    
    const variance = excessReturns.reduce((acc, val) => acc + Math.pow(val - meanExcessReturn, 2), 0) / excessReturns.length;
    const stdDev = Math.sqrt(variance);
    
    return meanExcessReturn / stdDev;
  }

  /**
   * Calculate Maximum Drawdown
   * @param values Array of values (e.g., portfolio values)
   * @returns Maximum drawdown as a percentage
   */
  calculateMaxDrawdown(values: number[]): number {
    let maxValue = values[0];
    let maxDrawdown = 0;
    
    for (const value of values) {
      if (value > maxValue) {
        maxValue = value;
      }
      
      const drawdown = (maxValue - value) / maxValue;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown * 100;
  }

  /**
   * Calculate all evaluation metrics
   * @param actual Actual values
   * @param predicted Predicted values
   * @returns Object with all metrics
   */
  evaluateAll(actual: number[], predicted: number[]): EvaluationMetrics {
    // Calculate returns for Sharpe ratio
    const actualReturns = [];
    for (let i = 1; i < actual.length; i++) {
      actualReturns.push((actual[i] - actual[i - 1]) / actual[i - 1]);
    }
    
    return {
      mae: this.calculateMAE(actual, predicted),
      mse: this.calculateMSE(actual, predicted),
      rmse: this.calculateRMSE(actual, predicted),
      mape: this.calculateMAPE(actual, predicted),
      rSquared: this.calculateRSquared(actual, predicted),
      directionAccuracy: this.calculateDirectionAccuracy(actual, predicted),
      sharpeRatio: this.calculateSharpeRatio(actualReturns),
      maxDrawdown: this.calculateMaxDrawdown(actual)
    };
  }

  /**
   * Perform backtesting of a trading strategy
   * @param data Historical market data
   * @param predictedPrices Predicted prices
   * @param config Backtest configuration
   * @returns Backtest results
   */
  backtest(
    data: TimeSeriesData[],
    predictedPrices: number[],
    config: BacktestConfig = DEFAULT_BACKTEST_CONFIG
  ): BacktestResults {
    if (data.length !== predictedPrices.length) {
      throw new Error('Data and predicted prices arrays must have the same length');
    }
    
    // Initialize portfolio
    let cash = config.initialCapital;
    let shares = 0;
    let position: 'long' | 'short' | 'none' = 'none';
    const trades: Trade[] = [];
    const portfolioValues: number[] = [];
    const returns: number[] = [];
    
    // Track metrics
    let totalTrades = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    
    // Process each day
    for (let i = 1; i < data.length; i++) {
      const currentPrice = data[i].close as number;
      const previousPrice = data[i - 1].close as number;
      const predictedPrice = predictedPrices[i];
      const previousPredictedPrice = predictedPrices[i - 1];
      
      // Calculate predicted direction
      const predictedDirection = predictedPrice - previousPredictedPrice;
      
      // Portfolio value before trading
      const portfolioValue = cash + shares * currentPrice;
      portfolioValues.push(portfolioValue);
      
      // Calculate return
      if (i > 1) {
        const previousPortfolioValue = portfolioValues[portfolioValues.length - 2];
        returns.push((portfolioValue - previousPortfolioValue) / previousPortfolioValue);
      }
      
      // Trading logic based on predicted direction
      if (predictedDirection > config.threshold && position !== 'long') {
        // Buy signal
        if (position === 'short') {
          // Close short position
          const profit = shares * (previousPrice - currentPrice);
          cash += profit - config.transactionCost;
          
          // Record trade
          const trade: Trade = {
            type: 'close_short',
            date: data[i].timestamp,
            price: currentPrice,
            shares: Math.abs(shares),
            value: Math.abs(shares) * currentPrice,
            profit: profit - config.transactionCost
          };
          trades.push(trade);
          
          // Update metrics
          totalTrades++;
          if (profit > 0) winningTrades++;
          else losingTrades++;
          
          shares = 0;
        }
        
        // Open long position
        const sharesToBuy = Math.floor((cash * config.positionSize) / currentPrice);
        if (sharesToBuy > 0) {
          cash -= sharesToBuy * currentPrice + config.transactionCost;
          shares = sharesToBuy;
          position = 'long';
          
          // Record trade
          const trade: Trade = {
            type: 'open_long',
            date: data[i].timestamp,
            price: currentPrice,
            shares: sharesToBuy,
            value: sharesToBuy * currentPrice,
            profit: 0
          };
          trades.push(trade);
        }
      }
      else if (predictedDirection < -config.threshold && position !== 'short') {
        // Sell signal
        if (position === 'long') {
          // Close long position
          const profit = shares * (currentPrice - previousPrice);
          cash += shares * currentPrice - config.transactionCost;
          
          // Record trade
          const trade: Trade = {
            type: 'close_long',
            date: data[i].timestamp,
            price: currentPrice,
            shares: shares,
            value: shares * currentPrice,
            profit: profit - config.transactionCost
          };
          trades.push(trade);
          
          // Update metrics
          totalTrades++;
          if (profit > 0) winningTrades++;
          else losingTrades++;
          
          shares = 0;
        }
        
        // Open short position if allowed
        if (config.allowShort) {
          const sharesToShort = Math.floor((cash * config.positionSize) / currentPrice);
          if (sharesToShort > 0) {
            cash -= config.transactionCost;
            shares = -sharesToShort;
            position = 'short';
            
            // Record trade
            const trade: Trade = {
              type: 'open_short',
              date: data[i].timestamp,
              price: currentPrice,
              shares: sharesToShort,
              value: sharesToShort * currentPrice,
              profit: 0
            };
            trades.push(trade);
          }
        }
      }
    }
    
    // Calculate final portfolio value
    const finalPrice = data[data.length - 1].close as number;
    const finalPortfolioValue = cash + shares * finalPrice;
    
    // Close any open positions for final evaluation
    if (position === 'long') {
      cash += shares * finalPrice - config.transactionCost;
    } else if (position === 'short') {
      cash += shares * finalPrice - config.transactionCost;
    }
    
    // Calculate metrics
    const totalReturn = (finalPortfolioValue / config.initialCapital - 1) * 100;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const maxDrawdown = this.calculateMaxDrawdown(portfolioValues);
    
    return {
      initialCapital: config.initialCapital,
      finalPortfolioValue,
      totalReturn,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      sharpeRatio,
      maxDrawdown,
      trades,
      portfolioValues
    };
  }
}

/**
 * Default backtest configuration
 */
export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 100000,
  positionSize: 0.95,
  threshold: 0.001,
  transactionCost: 5,
  allowShort: true
};

/**
 * Interface for evaluation metrics
 */
export interface EvaluationMetrics {
  mae: number;              // Mean Absolute Error
  mse: number;              // Mean Squared Error
  rmse: number;             // Root Mean Squared Error
  mape: number;             // Mean Absolute Percentage Error
  rSquared: number;         // R-squared (coefficient of determination)
  directionAccuracy: number; // Direction accuracy (percentage)
  sharpeRatio: number;      // Sharpe ratio
  maxDrawdown: number;      // Maximum drawdown (percentage)
}

/**
 * Interface for backtest configuration
 */
export interface BacktestConfig {
  initialCapital: number;   // Initial capital
  positionSize: number;     // Position size as fraction of capital
  threshold: number;        // Threshold for trading signals
  transactionCost: number;  // Cost per transaction
  allowShort: boolean;      // Whether to allow short positions
}

/**
 * Interface for trade information
 */
export interface Trade {
  type: 'open_long' | 'close_long' | 'open_short' | 'close_short';
  date: Date;
  price: number;
  shares: number;
  value: number;
  profit: number;
}

/**
 * Interface for backtest results
 */
export interface BacktestResults {
  initialCapital: number;
  finalPortfolioValue: number;
  totalReturn: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: Trade[];
  portfolioValues: number[];
}