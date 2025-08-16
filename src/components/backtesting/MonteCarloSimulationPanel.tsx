import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import WarningIcon from '@mui/icons-material/Warning';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { BacktestResult } from '../../types/backtesting';
import { SimulationConfig, ScenarioType } from '../../types/backtesting/simulationTypes';
import { 
  MonteCarloParameters, 
  MonteCarloResult, 
  MonteCarloConfig,
  ValueAtRiskMetrics,
  DrawdownAnalysis
} from '../../types/backtesting/monteCarloTypes';
import { BacktestingService, MarketSimulationService } from '../../services';

// Import visualization components (assuming these exist or will be created)
import EquityCurveChart from '../charts/EquityCurveChart';
import DistributionHistogram from '../charts/DistributionHistogram';
import DrawdownChart from '../charts/DrawdownChart';
import HeatmapChart from '../charts/HeatmapChart';

interface MonteCarloSimulationPanelProps {
  backtestResult: BacktestResult | null;
  onSimulationRun?: (result: MonteCarloResult) => void;
  onConfigSaved?: (config: MonteCarloConfig) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monte-carlo-tabpanel-${index}`}
      aria-labelledby={`monte-carlo-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const MonteCarloSimulationPanel: React.FC<MonteCarloSimulationPanelProps> = ({
  backtestResult,
  onSimulationRun,
  onConfigSaved
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationName, setSimulationName] = useState<string>('');
  const [simulationDescription, setSimulationDescription] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<MonteCarloResult | null>(null);
  
  // Monte Carlo parameters
  const [monteCarloParams, setMonteCarloParams] = useState<MonteCarloParameters>({
    iterations: 1000,
    confidenceInterval: 0.95,
    returnDistribution: 'normal',
    volatilityModel: 'constant',
    correlationModel: 'constant',
    seed: Math.floor(Math.random() * 10000),
    pathCount: 100,
    timeHorizon: 252, // Trading days in a year
    riskFreeRate: 0.02,
    includeExtremeScenarios: true,
    bootstrapMethod: 'block'
  });
  
  // Advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [customParameters, setCustomParameters] = useState<Record<string, any>>({
    fatTailsAdjustment: false,
    degreesOfFreedom: 5,
    correlationDecay: 0.94,
    volatilityCluster: true,
    jumpDiffusion: false,
    jumpIntensity: 0.05,
    jumpSize: 0.1
  });
  
  const backtestingService = new BacktestingService();
  const simulationService = new MarketSimulationService();
  
  useEffect(() => {
    if (backtestResult) {
      setSimulationName(`${backtestResult.configId} - Monte Carlo`);
      setSimulationDescription(`Monte Carlo simulation based on backtest ${backtestResult.configId}`);
    }
  }, [backtestResult]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleMonteCarloParamChange = (param: keyof MonteCarloParameters, value: any) => {
    setMonteCarloParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleCustomParameterChange = (param: string, value: any) => {
    setCustomParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleRunSimulation = async () => {
    if (!backtestResult) {
      setError('No backtest result selected');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the Monte Carlo configuration
      const monteCarloConfig: MonteCarloConfig = {
        simulationMethod: monteCarloParams.bootstrapMethod === 'block' ? 'bootstrap' : 'parametric',
        returnModel: {
          distribution: monteCarloParams.returnDistribution as any,
          parameters: {
            degreesOfFreedom: customParameters.degreesOfFreedom,
            fatTailsAdjustment: customParameters.fatTailsAdjustment
          }
        },
        volatilityModel: {
          type: monteCarloParams.volatilityModel as any,
          parameters: {
            cluster: customParameters.volatilityCluster,
            decay: customParameters.correlationDecay
          }
        },
        correlationModel: {
          type: monteCarloParams.correlationModel as any,
          parameters: {}
        },
        timeHorizon: monteCarloParams.timeHorizon,
        iterations: monteCarloParams.iterations,
        confidenceLevels: [0.90, 0.95, 0.99],
        seed: monteCarloParams.seed,
        includeExtremeScenarios: monteCarloParams.includeExtremeScenarios,
        customSettings: {
          jumpDiffusion: customParameters.jumpDiffusion,
          jumpIntensity: customParameters.jumpIntensity,
          jumpSize: customParameters.jumpSize,
          riskFreeRate: monteCarloParams.riskFreeRate,
          pathCount: monteCarloParams.pathCount
        }
      };
      
      // Call the API to run the Monte Carlo simulation
      const result = await simulationService.runMonteCarloSimulation(
        backtestResult.id,
        monteCarloParams.iterations,
        [monteCarloParams.confidenceInterval]
      );
      
      // Transform the result to match our MonteCarloResult interface
      // This is a placeholder - in a real implementation, you'd map the API response to your interface
      const transformedResult: MonteCarloResult = {
        simulationId: `mc-${Date.now()}`,
        iterations: result.iterations.map((it: any) => ({
          iterationId: it.id,
          equityCurve: it.equity,
          finalValue: it.equity[it.equity.length - 1].value,
          totalReturn: (it.equity[it.equity.length - 1].value / it.equity[0].value) - 1,
          maxDrawdown: 0.1, // Placeholder
          volatility: 0.2, // Placeholder
          sharpeRatio: 1.5, // Placeholder
          sortinoRatio: 2.0, // Placeholder
          winRate: 0.6, // Placeholder
          profitFactor: 1.8, // Placeholder
          recoveryFactor: 3.0 // Placeholder
        })),
        statistics: {
          meanReturn: result.expectedReturn,
          medianReturn: result.expectedReturn * 0.9, // Placeholder
          standardDeviation: 0.15, // Placeholder
          skewness: -0.2, // Placeholder
          kurtosis: 3.5, // Placeholder
          minReturn: -0.2, // Placeholder
          maxReturn: 0.5, // Placeholder
          meanDrawdown: result.expectedDrawdown,
          medianDrawdown: result.expectedDrawdown * 0.8, // Placeholder
          maxDrawdown: result.expectedDrawdown * 1.5, // Placeholder
          meanSharpe: 1.2, // Placeholder
          meanSortino: 1.8, // Placeholder
          meanWinRate: 0.55, // Placeholder
          meanProfitFactor: 1.6, // Placeholder
          successProbability: result.probabilityOfProfit
        },
        confidenceIntervals: result.confidenceIntervals.map((ci: any) => ({
          level: ci.level,
          returnLowerBound: ci.lowerBound,
          returnUpperBound: ci.upperBound,
          drawdownLowerBound: -0.15, // Placeholder
          drawdownUpperBound: -0.05 // Placeholder
        })),
        valueAtRisk: {
          historicalVaR: { "95%": 0.15, "99%": 0.22 },
          parametricVaR: { "95%": 0.14, "99%": 0.20 },
          conditionalVaR: { "95%": 0.18, "99%": 0.25 },
          timeScaledVaR: { 
            "1d": { "95%": 0.03, "99%": 0.05 },
            "10d": { "95%": 0.09, "99%": 0.15 },
            "20d": { "95%": 0.12, "99%": 0.18 }
          }
        },
        drawdownAnalysis: {
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
        },
        returnDistribution: {
          histogram: Array.from({ length: 20 }, (_, i) => ({ 
            bin: -0.3 + i * 0.03, 
            frequency: Math.random() * 50 + 10 
          })),
          normalityTest: {
            jarqueBera: 15.8,
            pValue: 0.0004,
            isNormal: false
          },
          quantiles: {
            "1%": -0.25,
            "5%": -0.18,
            "10%": -0.15,
            "25%": -0.08,
            "50%": 0.03,
            "75%": 0.12,
            "90%": 0.18,
            "95%": 0.22,
            "99%": 0.28
          }
        },
        extremeScenarios: {
          bestCase: {
            iterationId: "best-1",
            equityCurve: Array.from({ length: 252 }, (_, i) => ({ 
              timestamp: new Date(Date.now() + i * 86400000).toISOString(),
              value: 10000 * (1 + 0.001 * i * 1.5)
            })),
            finalValue: 15000,
            totalReturn: 0.5,
            maxDrawdown: 0.05,
            volatility: 0.12,
            sharpeRatio: 3.2,
            sortinoRatio: 4.5,
            winRate: 0.75,
            profitFactor: 3.2,
            recoveryFactor: 10.0
          },
          worstCase: {
            iterationId: "worst-1",
            equityCurve: Array.from({ length: 252 }, (_, i) => ({ 
              timestamp: new Date(Date.now() + i * 86400000).toISOString(),
              value: 10000 * (1 - 0.001 * i)
            })),
            finalValue: 7500,
            totalReturn: -0.25,
            maxDrawdown: 0.25,
            volatility: 0.22,
            sharpeRatio: -1.0,
            sortinoRatio: -1.5,
            winRate: 0.35,
            profitFactor: 0.7,
            recoveryFactor: 0
          },
          highVolatility: {
            iterationId: "vol-1",
            equityCurve: Array.from({ length: 252 }, (_, i) => ({ 
              timestamp: new Date(Date.now() + i * 86400000).toISOString(),
              value: 10000 * (1 + 0.0015 * i * Math.sin(i/10))
            })),
            finalValue: 11200,
            totalReturn: 0.12,
            maxDrawdown: 0.15,
            volatility: 0.35,
            sharpeRatio: 0.8,
            sortinoRatio: 1.0,
            winRate: 0.52,
            profitFactor: 1.3,
            recoveryFactor: 0.8
          },
          lowVolatility: {
            iterationId: "lowvol-1",
            equityCurve: Array.from({ length: 252 }, (_, i) => ({ 
              timestamp: new Date(Date.now() + i * 86400000).toISOString(),
              value: 10000 * (1 + 0.0004 * i)
            })),
            finalValue: 10800,
            totalReturn: 0.08,
            maxDrawdown: 0.03,
            volatility: 0.06,
            sharpeRatio: 1.5,
            sortinoRatio: 2.2,
            winRate: 0.6,
            profitFactor: 1.8,
            recoveryFactor: 2.7
          },
          fastRecovery: {
            iterationId: "recovery-1",
            equityCurve: Array.from({ length: 252 }, (_, i) => {
              const value = i < 50 ? 10000 * (1 - 0.002 * i) : 10000 * (1 - 0.1 + 0.003 * (i - 50));
              return {
                timestamp: new Date(Date.now() + i * 86400000).toISOString(),
                value
              };
            }),
            finalValue: 11500,
            totalReturn: 0.15,
            maxDrawdown: 0.1,
            volatility: 0.18,
            sharpeRatio: 1.2,
            sortinoRatio: 1.8,
            winRate: 0.58,
            profitFactor: 1.7,
            recoveryFactor: 1.5
          },
          slowRecovery: {
            iterationId: "slow-recovery-1",
            equityCurve: Array.from({ length: 252 }, (_, i) => {
              const value = i < 80 ? 10000 * (1 - 0.0015 * i) : 10000 * (1 - 0.12 + 0.001 * (i - 80));
              return {
                timestamp: new Date(Date.now() + i * 86400000).toISOString(),
                value
              };
            }),
            finalValue: 9800,
            totalReturn: -0.02,
            maxDrawdown: 0.12,
            volatility: 0.15,
            sharpeRatio: 0.2,
            sortinoRatio: 0.3,
            winRate: 0.48,
            profitFactor: 1.1,
            recoveryFactor: 0.17
          }
        },
        createdAt: new Date().toISOString()
      };
      
      setSimulationResult(transformedResult);
      
      if (onSimulationRun) {
        onSimulationRun(transformedResult);
      }
      
      setLoading(false);
      setActiveTab(1); // Switch to Results tab
    } catch (err) {
      console.error('Error running Monte Carlo simulation:', err);
      setError('Failed to run simulation. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleSaveConfig = async () => {
    if (!backtestResult) {
      setError('No backtest result selected');
      return;
    }
    
    if (!simulationName) {
      setError('Simulation name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const simulationConfig: SimulationConfig = {
        name: simulationName,
        description: simulationDescription,
        backtestConfigId: backtestResult.configId,
        scenarioType: ScenarioType.MONTE_CARLO,
        parameters: {
          ...monteCarloParams,
          customParameters
        }
      };
      
      const createdConfig = await simulationService.createSimulationConfig(simulationConfig);
      
      if (onConfigSaved) {
        onConfigSaved(monteCarloConfig);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error saving simulation configuration:', err);
      setError('Failed to save configuration. Please try again later.');
      setLoading(false);
    }
  };
  
  const renderConfigurationTab = () => (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Monte Carlo Simulation Configuration" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Simulation Name"
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time Horizon (Trading Days)"
                type="number"
                value={monteCarloParams.timeHorizon}
                onChange={(e) => handleMonteCarloParamChange('timeHorizon', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1, max: 1000 } }}
                helperText="Projection period in trading days (252 days ≈ 1 year)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={simulationDescription}
                onChange={(e) => setSimulationDescription(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Simulation Parameters" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Iterations"
                type="number"
                value={monteCarloParams.iterations}
                onChange={(e) => handleMonteCarloParamChange('iterations', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 100, max: 10000 } }}
                helperText="Number of simulation runs (100-10000)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Path Count"
                type="number"
                value={monteCarloParams.pathCount}
                onChange={(e) => handleMonteCarloParamChange('pathCount', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 10, max: 1000 } }}
                helperText="Number of price paths per iteration"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Return Distribution</InputLabel>
                <Select
                  value={monteCarloParams.returnDistribution}
                  onChange={(e) => handleMonteCarloParamChange('returnDistribution', e.target.value)}
                  label="Return Distribution"
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="lognormal">Log-Normal</MenuItem>
                  <MenuItem value="student-t">Student-t</MenuItem>
                  <MenuItem value="empirical">Empirical</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
                <FormHelperText>Statistical distribution for returns</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Volatility Model</InputLabel>
                <Select
                  value={monteCarloParams.volatilityModel}
                  onChange={(e) => handleMonteCarloParamChange('volatilityModel', e.target.value)}
                  label="Volatility Model"
                >
                  <MenuItem value="constant">Constant</MenuItem>
                  <MenuItem value="garch">GARCH</MenuItem>
                  <MenuItem value="ewma">EWMA</MenuItem>
                  <MenuItem value="stochastic">Stochastic</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
                <FormHelperText>Model for estimating volatility</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Correlation Model</InputLabel>
                <Select
                  value={monteCarloParams.correlationModel}
                  onChange={(e) => handleMonteCarloParamChange('correlationModel', e.target.value)}
                  label="Correlation Model"
                >
                  <MenuItem value="constant">Constant</MenuItem>
                  <MenuItem value="dynamic">Dynamic</MenuItem>
                  <MenuItem value="regime-switching">Regime-Switching</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
                <FormHelperText>Model for asset correlations</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Bootstrap Method</InputLabel>
                <Select
                  value={monteCarloParams.bootstrapMethod}
                  onChange={(e) => handleMonteCarloParamChange('bootstrapMethod', e.target.value)}
                  label="Bootstrap Method"
                >
                  <MenuItem value="block">Block Bootstrap</MenuItem>
                  <MenuItem value="stationary">Stationary Bootstrap</MenuItem>
                  <MenuItem value="circular">Circular Block Bootstrap</MenuItem>
                </Select>
                <FormHelperText>Method for resampling historical returns</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Risk-Free Rate"
                type="number"
                value={monteCarloParams.riskFreeRate}
                onChange={(e) => handleMonteCarloParamChange('riskFreeRate', parseFloat(e.target.value))}
                InputProps={{ inputProps: { min: 0, max: 0.2, step: 0.001 } }}
                helperText="Annual risk-free rate (e.g., 0.02 = 2%)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Random Seed"
                type="number"
                value={monteCarloParams.seed}
                onChange={(e) => handleMonteCarloParamChange('seed', parseInt(e.target.value))}
                helperText="Seed for random number generation (for reproducibility)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Confidence Interval</Typography>
              <Slider
                value={monteCarloParams.confidenceInterval * 100}
                onChange={(e, newValue) => handleMonteCarloParamChange('confidenceInterval', (newValue as number) / 100)}
                valueLabelDisplay="auto"
                step={1}
                marks={[
                  { value: 90, label: '90%' },
                  { value: 95, label: '95%' },
                  { value: 99, label: '99%' }
                ]}
                min={80}
                max={99}
              />
              <FormHelperText>Statistical confidence level for results</FormHelperText>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={monteCarloParams.includeExtremeScenarios}
                    onChange={(e) => handleMonteCarloParamChange('includeExtremeScenarios', e.target.checked)}
                  />
                }
                label="Include Extreme Scenarios Analysis"
              />
              <FormHelperText>Generate best/worst case scenarios and stress tests</FormHelperText>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Accordion 
        expanded={showAdvancedSettings}
        onChange={() => setShowAdvancedSettings(!showAdvancedSettings)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            Advanced Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={customParameters.fatTailsAdjustment}
                    onChange={(e) => handleCustomParameterChange('fatTailsAdjustment', e.target.checked)}
                  />
                }
                label="Fat Tails Adjustment"
              />
              <FormHelperText>Adjust for fat tails in return distribution</FormHelperText>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Degrees of Freedom"
                type="number"
                value={customParameters.degreesOfFreedom}
                onChange={(e) => handleCustomParameterChange('degreesOfFreedom', parseInt(e.target.value))}
                disabled={!customParameters.fatTailsAdjustment || monteCarloParams.returnDistribution !== 'student-t'}
                InputProps={{ inputProps: { min: 3, max: 30 } }}
                helperText="Degrees of freedom for Student-t distribution"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={customParameters.volatilityCluster}
                    onChange={(e) => handleCustomParameterChange('volatilityCluster', e.target.checked)}
                  />
                }
                label="Volatility Clustering"
              />
              <FormHelperText>Model periods of high/low volatility</FormHelperText>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correlation Decay Factor"
                type="number"
                value={customParameters.correlationDecay}
                onChange={(e) => handleCustomParameterChange('correlationDecay', parseFloat(e.target.value))}
                InputProps={{ inputProps: { min: 0.5, max: 1, step: 0.01 } }}
                helperText="Decay factor for EWMA correlation (0.5-1.0)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={customParameters.jumpDiffusion}
                    onChange={(e) => handleCustomParameterChange('jumpDiffusion', e.target.checked)}
                  />
                }
                label="Jump Diffusion Model"
              />
              <FormHelperText>Include price jumps in the simulation</FormHelperText>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jump Intensity"
                type="number"
                value={customParameters.jumpIntensity}
                onChange={(e) => handleCustomParameterChange('jumpIntensity', parseFloat(e.target.value))}
                disabled={!customParameters.jumpDiffusion}
                InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                helperText="Average number of jumps per year (0-1)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jump Size"
                type="number"
                value={customParameters.jumpSize}
                onChange={(e) => handleCustomParameterChange('jumpSize', parseFloat(e.target.value))}
                disabled={!customParameters.jumpDiffusion}
                InputProps={{ inputProps: { min: 0, max: 0.5, step: 0.01 } }}
                helperText="Average jump size as fraction of price (0-0.5)"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleSaveConfig}
          disabled={loading || !simulationName}
        >
          Save Configuration
        </Button>
        
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleRunSimulation}
          disabled={loading || !backtestResult}
          color="primary"
        >
          Run Monte Carlo Simulation
        </Button>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Alert severity="info" icon={<WarningIcon />}>
          <Typography variant="body2">
            Monte Carlo simulations are hypothetical and do not guarantee future results. They are based on historical data and assumptions that may not hold in the future.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
  
  const renderResultsTab = () => {
    if (!simulationResult) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No simulation results yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Run a Monte Carlo simulation to see results here.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Monte Carlo Simulation Summary" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Performance Metrics</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Mean Return</TableCell>
                        <TableCell align="right">{(simulationResult.statistics.meanReturn * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Median Return</TableCell>
                        <TableCell align="right">{(simulationResult.statistics.medianReturn * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Standard Deviation</TableCell>
                        <TableCell align="right">{(simulationResult.statistics.standardDeviation * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Success Probability</TableCell>
                        <TableCell align="right">{(simulationResult.statistics.successProbability * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mean Sharpe Ratio</TableCell>
                        <TableCell align="right">{simulationResult.statistics.meanSharpe.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Risk Metrics</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Mean Drawdown</TableCell>
                        <TableCell align="right">{(simulationResult.statistics.meanDrawdown * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Drawdown</TableCell>
                        <TableCell align="right">{(simulationResult.statistics.maxDrawdown * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Value at Risk (95%)</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.historicalVaR["95%"] * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Expected Shortfall (95%)</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.conditionalVaR["95%"] * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Skewness</TableCell>
                        <TableCell align="right">{simulationResult.statistics.skewness.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Confidence Intervals</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Confidence Level</TableCell>
                        <TableCell align="right">Lower Return Bound</TableCell>
                        <TableCell align="right">Upper Return Bound</TableCell>
                        <TableCell align="right">Lower Drawdown Bound</TableCell>
                        <TableCell align="right">Upper Drawdown Bound</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationResult.confidenceIntervals.map((ci) => (
                        <TableRow key={ci.level}>
                          <TableCell>{(ci.level * 100).toFixed(0)}%</TableCell>
                          <TableCell align="right">{(ci.returnLowerBound * 100).toFixed(2)}%</TableCell>
                          <TableCell align="right">{(ci.returnUpperBound * 100).toFixed(2)}%</TableCell>
                          <TableCell align="right">{(ci.drawdownLowerBound * 100).toFixed(2)}%</TableCell>
                          <TableCell align="right">{(ci.drawdownUpperBound * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Equity Curves" />
          <Divider />
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This chart shows a sample of simulated equity curves, including best and worst case scenarios.
            </Typography>
            <Box sx={{ height: 400 }}>
              {/* Placeholder for EquityCurveChart component */}
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                Equity curve chart would be displayed here
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Return Distribution" />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Distribution of final returns across all simulations.
                </Typography>
                <Box sx={{ height: 300 }}>
                  {/* Placeholder for DistributionHistogram component */}
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                    Return distribution histogram would be displayed here
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Distribution Statistics</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Normality Test (p-value)</TableCell>
                          <TableCell align="right">{simulationResult.returnDistribution.normalityTest.pValue.toFixed(4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Is Normal Distribution</TableCell>
                          <TableCell align="right">{simulationResult.returnDistribution.normalityTest.isNormal ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Kurtosis</TableCell>
                          <TableCell align="right">{simulationResult.statistics.kurtosis.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Drawdown Analysis" />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Analysis of drawdowns across all simulations.
                </Typography>
                <Box sx={{ height: 300 }}>
                  {/* Placeholder for DrawdownChart component */}
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                    Drawdown analysis chart would be displayed here
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Drawdown Statistics</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Average Drawdown</TableCell>
                          <TableCell align="right">{(simulationResult.drawdownAnalysis.averageDrawdown * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Average Drawdown Duration</TableCell>
                          <TableCell align="right">{simulationResult.drawdownAnalysis.averageDrawdownDuration.toFixed(0)} days</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Average Recovery Time</TableCell>
                          <TableCell align="right">{simulationResult.drawdownAnalysis.recoveryStats.averageRecoveryTime.toFixed(0)} days</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const renderScenarioAnalysisTab = () => {
    if (!simulationResult) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No simulation results yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Run a Monte Carlo simulation to see scenario analysis here.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Extreme Scenarios Analysis" />
          <Divider />
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Analysis of best, worst, and other notable scenarios from the Monte Carlo simulation.
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                  <TrendingDownIcon sx={{ mr: 1, transform: 'rotate(180deg)' }} />
                  Best Case Scenario (+{(simulationResult.extremeScenarios.bestCase.totalReturn * 100).toFixed(2)}%)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ height: 250 }}>
                      {/* Placeholder for equity curve chart */}
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                        Best case equity curve would be displayed here
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Total Return</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.bestCase.totalReturn * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Max Drawdown</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.bestCase.maxDrawdown * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Sharpe Ratio</TableCell>
                            <TableCell align="right">{simulationResult.extremeScenarios.bestCase.sharpeRatio.toFixed(2)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Win Rate</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.bestCase.winRate * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Profit Factor</TableCell>
                            <TableCell align="right">{simulationResult.extremeScenarios.bestCase.profitFactor.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                  <TrendingDownIcon sx={{ mr: 1 }} />
                  Worst Case Scenario ({(simulationResult.extremeScenarios.worstCase.totalReturn * 100).toFixed(2)}%)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ height: 250 }}>
                      {/* Placeholder for equity curve chart */}
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                        Worst case equity curve would be displayed here
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Total Return</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.worstCase.totalReturn * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Max Drawdown</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.worstCase.maxDrawdown * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Sharpe Ratio</TableCell>
                            <TableCell align="right">{simulationResult.extremeScenarios.worstCase.sharpeRatio.toFixed(2)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Win Rate</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.worstCase.winRate * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Profit Factor</TableCell>
                            <TableCell align="right">{simulationResult.extremeScenarios.worstCase.profitFactor.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1 }} />
                  High Volatility Scenario
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ height: 250 }}>
                      {/* Placeholder for equity curve chart */}
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                        High volatility equity curve would be displayed here
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Total Return</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.highVolatility.totalReturn * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Volatility</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.highVolatility.volatility * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Max Drawdown</TableCell>
                            <TableCell align="right">{(simulationResult.extremeScenarios.highVolatility.maxDrawdown * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Sharpe Ratio</TableCell>
                            <TableCell align="right">{simulationResult.extremeScenarios.highVolatility.sharpeRatio.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1 }} />
                  Recovery Analysis
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Fast Recovery Scenario</Typography>
                    <Box sx={{ height: 200 }}>
                      {/* Placeholder for equity curve chart */}
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                        Fast recovery equity curve would be displayed here
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Slow Recovery Scenario</Typography>
                    <Box sx={{ height: 200 }}>
                      {/* Placeholder for equity curve chart */}
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                        Slow recovery equity curve would be displayed here
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Recovery Time Distribution</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Recovery Period (days)</TableCell>
                            {Object.keys(simulationResult.drawdownAnalysis.recoveryStats.recoveryTimeDistribution).map((period) => (
                              <TableCell key={period} align="right">{period}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Frequency</TableCell>
                            {Object.values(simulationResult.drawdownAnalysis.recoveryStats.recoveryTimeDistribution).map((value, index) => (
                              <TableCell key={index} align="right">{(value * 100).toFixed(1)}%</TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader title="Value at Risk (VaR) Analysis" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>VaR Comparison</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Method</TableCell>
                        <TableCell align="right">95% VaR</TableCell>
                        <TableCell align="right">99% VaR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Historical</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.historicalVaR["95%"] * 100).toFixed(2)}%</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.historicalVaR["99%"] * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Parametric</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.parametricVaR["95%"] * 100).toFixed(2)}%</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.parametricVaR["99%"] * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Expected Shortfall</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.conditionalVaR["95%"] * 100).toFixed(2)}%</TableCell>
                        <TableCell align="right">{(simulationResult.valueAtRisk.conditionalVaR["99%"] * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Time-Scaled VaR (95%)</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time Horizon</TableCell>
                        <TableCell align="right">95% VaR</TableCell>
                        <TableCell align="right">99% VaR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(simulationResult.valueAtRisk.timeScaledVaR).map((timeHorizon) => (
                        <TableRow key={timeHorizon}>
                          <TableCell>{timeHorizon}</TableCell>
                          <TableCell align="right">
                            {(simulationResult.valueAtRisk.timeScaledVaR[timeHorizon]["95%"] * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell align="right">
                            {(simulationResult.valueAtRisk.timeScaledVaR[timeHorizon]["99%"] * 100).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ height: 300 }}>
                  {/* Placeholder for VaR chart */}
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 10 }}>
                    Value at Risk visualization would be displayed here
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  if (!backtestResult) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No backtest result selected</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please run a backtest or select a result to create a Monte Carlo simulation.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Monte Carlo Simulation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and analyze Monte Carlo simulations based on backtest results
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {!loading && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab 
                icon={<SettingsIcon />} 
                iconPosition="start" 
                label="Configuration" 
                id="monte-carlo-tab-0" 
                aria-controls="monte-carlo-tabpanel-0" 
              />
              <Tab 
                icon={<BarChartIcon />} 
                iconPosition="start" 
                label="Results" 
                id="monte-carlo-tab-1" 
                aria-controls="monte-carlo-tabpanel-1" 
                disabled={!simulationResult}
              />
              <Tab 
                icon={<AssessmentIcon />} 
                iconPosition="start" 
                label="Scenario Analysis" 
                id="monte-carlo-tab-2" 
                aria-controls="monte-carlo-tabpanel-2" 
                disabled={!simulationResult}
              />
            </Tabs>
          </Box>
          
          <TabPanel value={activeTab} index={0}>
            {renderConfigurationTab()}
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            {renderResultsTab()}
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            {renderScenarioAnalysisTab()}
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};

export default MonteCarloSimulationPanel;