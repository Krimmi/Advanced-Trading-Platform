import axios from 'axios';
import MonteCarloService from '../monteCarloService';
import { MonteCarloConfig } from '../../../types/backtesting/monteCarloTypes';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MonteCarloService', () => {
  let monteCarloService: MonteCarloService;
  
  beforeEach(() => {
    monteCarloService = new MonteCarloService();
    jest.clearAllMocks();
  });
  
  describe('runAdvancedMonteCarloSimulation', () => {
    const backtestId = 'backtest-123';
    const config: MonteCarloConfig = {
      simulationMethod: 'bootstrap',
      returnModel: {
        distribution: 'normal'
      },
      volatilityModel: {
        type: 'constant'
      },
      correlationModel: {
        type: 'constant'
      },
      timeHorizon: 252,
      iterations: 1000,
      confidenceLevels: [0.95],
      includeExtremeScenarios: true
    };
    
    const mockResponse = {
      data: {
        simulationId: 'sim-123',
        iterations: [],
        statistics: {
          meanReturn: 0.12,
          medianReturn: 0.10,
          standardDeviation: 0.15,
          skewness: -0.2,
          kurtosis: 3.5,
          minReturn: -0.2,
          maxReturn: 0.5,
          meanDrawdown: 0.08,
          medianDrawdown: 0.06,
          maxDrawdown: 0.15,
          meanSharpe: 1.2,
          meanSortino: 1.8,
          meanWinRate: 0.55,
          meanProfitFactor: 1.6,
          successProbability: 0.65
        },
        confidenceIntervals: [],
        valueAtRisk: {},
        drawdownAnalysis: {},
        returnDistribution: {},
        extremeScenarios: {},
        createdAt: '2025-01-01T00:00:00Z'
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.runAdvancedMonteCarloSimulation(backtestId, config);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/monte-carlo/advanced',
        {
          backtestId,
          config
        }
      );
    });
    
    it('should return the simulation result', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.runAdvancedMonteCarloSimulation(backtestId, config);
      
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors', async () => {
      const errorMessage = 'API error';
      mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(monteCarloService.runAdvancedMonteCarloSimulation(backtestId, config))
        .rejects.toThrow(errorMessage);
    });
  });
  
  describe('calculateValueAtRisk', () => {
    const backtestId = 'backtest-123';
    const confidenceLevels = [0.95, 0.99];
    const timeHorizons = [1, 5, 10];
    
    const mockResponse = {
      data: {
        historicalVaR: { "95%": 0.15, "99%": 0.22 },
        parametricVaR: { "95%": 0.14, "99%": 0.20 },
        conditionalVaR: { "95%": 0.18, "99%": 0.25 },
        timeScaledVaR: { 
          "1d": { "95%": 0.03, "99%": 0.05 },
          "5d": { "95%": 0.07, "99%": 0.11 },
          "10d": { "95%": 0.09, "99%": 0.15 }
        }
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.calculateValueAtRisk(backtestId, confidenceLevels, timeHorizons);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/risk/var',
        {
          backtestId,
          confidenceLevels,
          timeHorizons
        }
      );
    });
    
    it('should return the VaR metrics', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.calculateValueAtRisk(backtestId, confidenceLevels, timeHorizons);
      
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should use default parameters if not provided', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.calculateValueAtRisk(backtestId);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/risk/var',
        {
          backtestId,
          confidenceLevels: [0.95, 0.99],
          timeHorizons: [1, 5, 10, 20]
        }
      );
    });
  });
  
  describe('analyzeDrawdowns', () => {
    const backtestId = 'backtest-123';
    
    const mockResponse = {
      data: {
        averageDrawdown: 0.08,
        averageDrawdownDuration: 15,
        maxDrawdown: 0.18,
        maxDrawdownDuration: 45,
        drawdownFrequency: 0.3,
        recoveryStats: {
          averageRecoveryTime: 22,
          maxRecoveryTime: 65,
          recoveryTimeDistribution: { "0-10": 0.2, "11-20": 0.3, "21-30": 0.25, "31+": 0.25 }
        }
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.analyzeDrawdowns(backtestId);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:8000/api/backtesting/risk/drawdowns/${backtestId}`
      );
    });
    
    it('should return the drawdown analysis', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.analyzeDrawdowns(backtestId);
      
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('generateExtremeScenarios', () => {
    const backtestId = 'backtest-123';
    const scenarioTypes = ['best', 'worst'];
    
    const mockResponse = {
      data: {
        best: {
          iterationId: "best-1",
          equityCurve: [],
          finalValue: 15000,
          totalReturn: 0.5
        },
        worst: {
          iterationId: "worst-1",
          equityCurve: [],
          finalValue: 7500,
          totalReturn: -0.25
        }
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.generateExtremeScenarios(backtestId, scenarioTypes);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/monte-carlo/extreme-scenarios',
        {
          backtestId,
          scenarioTypes
        }
      );
    });
    
    it('should return the extreme scenarios', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.generateExtremeScenarios(backtestId, scenarioTypes);
      
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should use default scenario types if not provided', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.generateExtremeScenarios(backtestId);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/monte-carlo/extreme-scenarios',
        {
          backtestId,
          scenarioTypes: ['best', 'worst', 'highVol', 'lowVol', 'fastRecovery', 'slowRecovery']
        }
      );
    });
  });
  
  describe('saveMonteCarloConfig', () => {
    const config: MonteCarloConfig = {
      simulationMethod: 'bootstrap',
      returnModel: {
        distribution: 'normal'
      },
      volatilityModel: {
        type: 'constant'
      },
      correlationModel: {
        type: 'constant'
      },
      timeHorizon: 252,
      iterations: 1000,
      confidenceLevels: [0.95],
      includeExtremeScenarios: true
    };
    const name = 'Test Config';
    const description = 'Test description';
    
    const mockResponse = {
      data: {
        id: 'config-123',
        name: 'Test Config',
        config,
        createdAt: '2025-01-01T00:00:00Z'
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.saveMonteCarloConfig(config, name, description);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/monte-carlo/configs',
        {
          name,
          description,
          config
        }
      );
    });
    
    it('should return the saved config', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.saveMonteCarloConfig(config, name, description);
      
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('getMonteCarloConfigs', () => {
    const mockResponse = {
      data: [
        {
          id: 'config-123',
          name: 'Test Config 1',
          description: 'Test description 1',
          config: {},
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'config-456',
          name: 'Test Config 2',
          description: 'Test description 2',
          config: {},
          createdAt: '2025-01-02T00:00:00Z'
        }
      ]
    };
    
    it('should call the API correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.getMonteCarloConfigs();
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/monte-carlo/configs'
      );
    });
    
    it('should return the configs', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.getMonteCarloConfigs();
      
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('getMonteCarloResult', () => {
    const resultId = 'result-123';
    
    const mockResponse = {
      data: {
        simulationId: 'sim-123',
        iterations: [],
        statistics: {},
        confidenceIntervals: [],
        valueAtRisk: {},
        drawdownAnalysis: {},
        returnDistribution: {},
        extremeScenarios: {},
        createdAt: '2025-01-01T00:00:00Z'
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.getMonteCarloResult(resultId);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:8000/api/backtesting/monte-carlo/results/${resultId}`
      );
    });
    
    it('should return the result', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.getMonteCarloResult(resultId);
      
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('compareMonteCarloResults', () => {
    const resultIds = ['result-123', 'result-456'];
    
    const mockResponse = {
      data: {
        comparison: {
          returnComparison: {},
          riskComparison: {},
          efficiencyComparison: {}
        }
      }
    };
    
    it('should call the API with correct parameters', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      await monteCarloService.compareMonteCarloResults(resultIds);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/backtesting/monte-carlo/compare',
        {
          resultIds
        }
      );
    });
    
    it('should return the comparison results', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await monteCarloService.compareMonteCarloResults(resultIds);
      
      expect(result).toEqual(mockResponse.data);
    });
  });
});