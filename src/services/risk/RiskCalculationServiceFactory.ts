import { IRiskCalculationService } from './RiskCalculationService';
import { HistoricalVaRService } from './HistoricalVaRService';
import { FinancialDataServiceFactory } from '../api/FinancialDataServiceFactory';

/**
 * Factory for creating risk calculation services
 */
export class RiskCalculationServiceFactory {
  private static instance: IRiskCalculationService;
  
  /**
   * Gets the default risk calculation service
   * @returns Risk calculation service
   */
  public static getService(): IRiskCalculationService {
    if (!RiskCalculationServiceFactory.instance) {
      const financialDataService = FinancialDataServiceFactory.getService();
      RiskCalculationServiceFactory.instance = new HistoricalVaRService(financialDataService);
    }
    
    return RiskCalculationServiceFactory.instance;
  }
  
  /**
   * Creates a new risk calculation service
   * @param type Service type
   * @returns Risk calculation service
   */
  public static createService(type: 'historical' | 'parametric' | 'monte_carlo' = 'historical'): IRiskCalculationService {
    const financialDataService = FinancialDataServiceFactory.getService();
    
    switch (type) {
      case 'historical':
      default:
        return new HistoricalVaRService(financialDataService);
    }
  }
  
  /**
   * Sets the default risk calculation service
   * @param service Risk calculation service
   */
  public static setDefaultService(service: IRiskCalculationService): void {
    RiskCalculationServiceFactory.instance = service;
  }
}