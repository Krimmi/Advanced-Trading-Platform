import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  RiskScenario,
  RiskFactorShift,
  StressTestResult,
  PositionStressResult,
  AssetClass
} from './models/RiskModels';
import { FinancialDataService } from '../api/FinancialDataService';
import { FinancialDataServiceFactory } from '../api/FinancialDataServiceFactory';

/**
 * Service for running stress tests on portfolios
 */
export class StressTestingService extends EventEmitter {
  private financialDataService: FinancialDataService;
  private assetClassBetas: Map<AssetClass, number> = new Map();
  private sectorBetas: Map<string, number> = new Map();
  private assetClassCorrelations: Map<string, number> = new Map();
  
  /**
   * Creates a new StressTestingService
   * @param financialDataService Financial data service
   */
  constructor(financialDataService?: FinancialDataService) {
    super();
    this.financialDataService = financialDataService || FinancialDataServiceFactory.getService();
    this.initializeDefaultBetas();
    this.initializeDefaultCorrelations();
  }
  
  /**
   * Runs a stress test on a portfolio
   * @param portfolio Portfolio to test
   * @param scenario Stress test scenario
   * @returns Stress test result
   */
  public async runStressTest(portfolio: Portfolio, scenario: RiskScenario): Promise<StressTestResult> {
    // Calculate portfolio value before stress test
    const portfolioValueBefore = portfolio.totalValue;
    
    // Apply scenario to each position
    const positionResults: PositionStressResult[] = [];
    let portfolioValueAfter = portfolio.cash; // Start with cash (assumed to be unaffected)
    
    for (const position of portfolio.positions) {
      const positionResult = await this.applyScenarioToPosition(position, scenario);
      positionResults.push(positionResult);
      portfolioValueAfter += positionResult.valueAfter;
    }
    
    // Calculate changes
    const absoluteChange = portfolioValueAfter - portfolioValueBefore;
    const percentageChange = absoluteChange / portfolioValueBefore;
    
    // Create result
    const result: StressTestResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      portfolioId: portfolio.id,
      portfolioValueBefore,
      portfolioValueAfter,
      absoluteChange,
      percentageChange,
      positionResults,
      timestamp: Date.now(),
      metadata: {
        scenarioDescription: scenario.description,
        scenarioFactors: scenario.factors,
        isHistorical: scenario.isHistorical,
        scenarioDate: scenario.date,
        scenarioProbability: scenario.probability
      }
    };
    
    return result;
  }
  
  /**
   * Applies a scenario to a position
   * @param position Position to test
   * @param scenario Stress test scenario
   * @returns Position stress result
   */
  private async applyScenarioToPosition(position: Position, scenario: RiskScenario): Promise<PositionStressResult> {
    const valueBefore = position.value;
    
    // Calculate impact of each factor on the position
    let totalImpact = 0;
    
    for (const factor of scenario.factors) {
      const impact = this.calculateFactorImpact(position, factor);
      totalImpact += impact;
    }
    
    // Calculate new value
    const valueAfter = valueBefore * (1 + totalImpact);
    const absoluteChange = valueAfter - valueBefore;
    const percentageChange = absoluteChange / valueBefore;
    
    return {
      symbol: position.symbol,
      valueBefore,
      valueAfter,
      absoluteChange,
      percentageChange
    };
  }
  
  /**
   * Calculates the impact of a risk factor on a position
   * @param position Position to analyze
   * @param factor Risk factor shift
   * @returns Impact as a decimal (e.g., -0.05 for -5%)
   */
  private calculateFactorImpact(position: Position, factor: RiskFactorShift): number {
    // Get base shift value
    let shiftValue = factor.shiftValue;
    
    // Adjust for shift type
    if (factor.shiftType === 'percentage') {
      // Already a decimal
    } else if (factor.shiftType === 'absolute') {
      // Convert basis points or absolute values to percentage impact
      // This is a simplified approach - in reality, the conversion would depend on the factor type
      shiftValue = this.convertAbsoluteShiftToPercentage(factor.factorId, shiftValue);
    }
    
    // Apply sensitivity based on asset class and factor
    const sensitivity = this.calculateSensitivity(position, factor.factorId);
    
    // Calculate impact
    return shiftValue * sensitivity;
  }
  
  /**
   * Converts an absolute shift to a percentage impact
   * @param factorId Factor ID
   * @param shiftValue Shift value
   * @returns Percentage impact
   */
  private convertAbsoluteShiftToPercentage(factorId: string, shiftValue: number): number {
    // This is a simplified conversion - in reality, it would be more complex
    switch (factorId) {
      case 'interest_rate':
        // Convert basis points to percentage impact on equities
        // Rough approximation: 100bp increase in rates = -5% impact on equities
        return -0.05 * (shiftValue / 1.0);
      
      case 'credit':
        // Convert credit spread change to percentage impact
        // Rough approximation: 100bp increase in spreads = -3% impact on equities
        return -0.03 * (shiftValue / 1.0);
      
      case 'inflation':
        // Convert inflation change to percentage impact
        // Rough approximation: 1% increase in inflation = -2% impact on equities
        return -0.02 * shiftValue;
      
      default:
        // Default conversion
        return shiftValue * 0.01;
    }
  }
  
  /**
   * Calculates the sensitivity of a position to a risk factor
   * @param position Position to analyze
   * @param factorId Factor ID
   * @returns Sensitivity (multiplier)
   */
  private calculateSensitivity(position: Position, factorId: string): number {
    // Get base sensitivity based on asset class
    let sensitivity = 1.0;
    
    // Adjust based on asset class
    if (factorId === 'market') {
      // Use beta for market factor
      sensitivity = this.assetClassBetas.get(position.assetClass) || 1.0;
      
      // Adjust for sector if available
      if (position.sector && this.sectorBetas.has(position.sector)) {
        sensitivity *= this.sectorBetas.get(position.sector)! / 1.0;
      }
    } else {
      // Use correlation for other factors
      const correlationKey = `${position.assetClass}-${factorId}`;
      sensitivity = this.assetClassCorrelations.get(correlationKey) || 0.5;
    }
    
    return sensitivity;
  }
  
  /**
   * Initializes default betas for asset classes and sectors
   */
  private initializeDefaultBetas(): void {
    // Asset class betas (relative to market)
    this.assetClassBetas.set(AssetClass.EQUITY, 1.0);
    this.assetClassBetas.set(AssetClass.FIXED_INCOME, 0.2);
    this.assetClassBetas.set(AssetClass.COMMODITY, 0.6);
    this.assetClassBetas.set(AssetClass.CURRENCY, 0.3);
    this.assetClassBetas.set(AssetClass.CRYPTO, 2.5);
    this.assetClassBetas.set(AssetClass.OPTION, 1.5);
    this.assetClassBetas.set(AssetClass.FUTURE, 1.2);
    this.assetClassBetas.set(AssetClass.ETF, 0.9);
    this.assetClassBetas.set(AssetClass.MUTUAL_FUND, 0.8);
    this.assetClassBetas.set(AssetClass.OTHER, 1.0);
    
    // Sector betas (relative to market)
    this.sectorBetas.set('Technology', 1.2);
    this.sectorBetas.set('Financial Services', 1.1);
    this.sectorBetas.set('Healthcare', 0.8);
    this.sectorBetas.set('Consumer Cyclical', 1.1);
    this.sectorBetas.set('Consumer Defensive', 0.6);
    this.sectorBetas.set('Energy', 1.3);
    this.sectorBetas.set('Industrials', 1.0);
    this.sectorBetas.set('Basic Materials', 1.2);
    this.sectorBetas.set('Communication Services', 0.9);
    this.sectorBetas.set('Utilities', 0.5);
    this.sectorBetas.set('Real Estate', 0.7);
  }
  
  /**
   * Initializes default correlations between asset classes and risk factors
   */
  private initializeDefaultCorrelations(): void {
    // Equity correlations
    this.assetClassCorrelations.set(`${AssetClass.EQUITY}-interest_rate`, -0.7);
    this.assetClassCorrelations.set(`${AssetClass.EQUITY}-credit`, -0.8);
    this.assetClassCorrelations.set(`${AssetClass.EQUITY}-volatility`, -0.6);
    this.assetClassCorrelations.set(`${AssetClass.EQUITY}-inflation`, -0.3);
    this.assetClassCorrelations.set(`${AssetClass.EQUITY}-foreign_exchange`, 0.2);
    
    // Fixed Income correlations
    this.assetClassCorrelations.set(`${AssetClass.FIXED_INCOME}-interest_rate`, -0.9);
    this.assetClassCorrelations.set(`${AssetClass.FIXED_INCOME}-credit`, -0.7);
    this.assetClassCorrelations.set(`${AssetClass.FIXED_INCOME}-volatility`, -0.3);
    this.assetClassCorrelations.set(`${AssetClass.FIXED_INCOME}-inflation`, -0.7);
    this.assetClassCorrelations.set(`${AssetClass.FIXED_INCOME}-foreign_exchange`, 0.1);
    
    // Commodity correlations
    this.assetClassCorrelations.set(`${AssetClass.COMMODITY}-interest_rate`, -0.3);
    this.assetClassCorrelations.set(`${AssetClass.COMMODITY}-credit`, -0.2);
    this.assetClassCorrelations.set(`${AssetClass.COMMODITY}-volatility`, 0.4);
    this.assetClassCorrelations.set(`${AssetClass.COMMODITY}-inflation`, 0.7);
    this.assetClassCorrelations.set(`${AssetClass.COMMODITY}-foreign_exchange`, 0.5);
    
    // Crypto correlations
    this.assetClassCorrelations.set(`${AssetClass.CRYPTO}-interest_rate`, -0.4);
    this.assetClassCorrelations.set(`${AssetClass.CRYPTO}-credit`, -0.3);
    this.assetClassCorrelations.set(`${AssetClass.CRYPTO}-volatility`, 0.7);
    this.assetClassCorrelations.set(`${AssetClass.CRYPTO}-inflation`, 0.2);
    this.assetClassCorrelations.set(`${AssetClass.CRYPTO}-foreign_exchange`, 0.3);
  }
  
  /**
   * Gets the beta for an asset class
   * @param assetClass Asset class
   * @returns Beta value
   */
  public getAssetClassBeta(assetClass: AssetClass): number {
    return this.assetClassBetas.get(assetClass) || 1.0;
  }
  
  /**
   * Gets the beta for a sector
   * @param sector Sector
   * @returns Beta value
   */
  public getSectorBeta(sector: string): number {
    return this.sectorBetas.get(sector) || 1.0;
  }
  
  /**
   * Gets the correlation between an asset class and a risk factor
   * @param assetClass Asset class
   * @param factorId Factor ID
   * @returns Correlation value
   */
  public getAssetClassFactorCorrelation(assetClass: AssetClass, factorId: string): number {
    const correlationKey = `${assetClass}-${factorId}`;
    return this.assetClassCorrelations.get(correlationKey) || 0.5;
  }
  
  /**
   * Sets the beta for an asset class
   * @param assetClass Asset class
   * @param beta Beta value
   */
  public setAssetClassBeta(assetClass: AssetClass, beta: number): void {
    this.assetClassBetas.set(assetClass, beta);
  }
  
  /**
   * Sets the beta for a sector
   * @param sector Sector
   * @param beta Beta value
   */
  public setSectorBeta(sector: string, beta: number): void {
    this.sectorBetas.set(sector, beta);
  }
  
  /**
   * Sets the correlation between an asset class and a risk factor
   * @param assetClass Asset class
   * @param factorId Factor ID
   * @param correlation Correlation value
   */
  public setAssetClassFactorCorrelation(assetClass: AssetClass, factorId: string, correlation: number): void {
    const correlationKey = `${assetClass}-${factorId}`;
    this.assetClassCorrelations.set(correlationKey, correlation);
  }
}