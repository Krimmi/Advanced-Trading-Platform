import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpIcon from '@mui/icons-material/Help';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

import { 
  StrategyOptimizationService, 
  OptimizationConfig,
  OptimizationResult,
  OptimizationAlgorithm,
  ParameterDefinition,
  ParameterSensitivityResult,
  StrategyType,
  BacktestMetrics
} from '../../services/strategy';

// Mock chart components - in a real app, you would use a charting library like recharts or chart.js
const ConvergenceChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Convergence Chart (Mock)
    </Typography>
  </Paper>
);

const ParameterSensitivityChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Parameter Sensitivity Chart (Mock)
    </Typography>
  </Paper>
);

const PerformanceHeatmap = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Performance Heatmap (Mock)
    </Typography>
  </Paper>
);

interface StrategyOptimizationPanelProps {
  strategyType: StrategyType;
  initialParameters?: Record<string, any>;
  onOptimizationComplete?: (parameters: Record<string, any>) => void;
}

const StrategyOptimizationPanel: React.FC<StrategyOptimizationPanelProps> = ({
  strategyType,
  initialParameters = {},
  onOptimizationComplete
}) => {
  // State for optimization configuration
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    strategyType,
    baseConfig: {
      startDate: new Date(new Date().getFullYear() - 5, 0, 1),
      endDate: new Date(),
      initialCapital: 100000,
      symbols: ['SPY', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'],
    },
    parameters: [],
    algorithm: OptimizationAlgorithm.GRID_SEARCH,
    optimizationMetric: 'sharpeRatio',
    maximizeMetric: true,
    iterations: 100,
    crossValidation: {
      enabled: true,
      folds: 3
    }
  });

  // State for parameter definitions
  const [parameterDefinitions, setParameterDefinitions] = useState<ParameterDefinition[]>([]);

  // State for optimization results
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [sensitivityResults, setSensitivityResults] = useState<ParameterSensitivityResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Mock service for demo purposes
  const optimizationService = new StrategyOptimizationService(
    // @ts-ignore - These would be properly injected in a real app
    null, null
  );

  // Initialize parameter definitions based on strategy type
  useEffect(() => {
    generateParameterDefinitions();
  }, [strategyType]);

  const generateParameterDefinitions = () => {
    // In a real app, these would come from a service or API
    let definitions: ParameterDefinition[] = [];
    
    switch (strategyType) {
      case StrategyType.MOMENTUM:
        definitions = [
          {
            name: 'lookbackPeriods',
            type: 'integer',
            min: 5,
            max: 252,
            step: 5,
            default: initialParameters.lookbackPeriods || 20,
            description: 'Number of periods to look back for momentum calculation'
          },
          {
            name: 'topN',
            type: 'integer',
            min: 1,
            max: 20,
            step: 1,
            default: initialParameters.topN || 5,
            description: 'Number of top assets to select'
          },
          {
            name: 'momentumType',
            type: 'categorical',
            values: ['absolute', 'relative', 'risk_adjusted'],
            default: initialParameters.momentumType || 'relative',
            description: 'Method used to calculate momentum'
          },
          {
            name: 'rebalancePeriod',
            type: 'integer',
            min: 1,
            max: 30,
            step: 1,
            default: initialParameters.rebalancePeriod || 5,
            description: 'Number of days between rebalancing'
          }
        ];
        break;
        
      case StrategyType.MEAN_REVERSION:
        definitions = [
          {
            name: 'lookbackPeriod',
            type: 'integer',
            min: 5,
            max: 100,
            step: 5,
            default: initialParameters.lookbackPeriod || 20,
            description: 'Number of periods to calculate mean'
          },
          {
            name: 'entryThreshold',
            type: 'float',
            min: 0.5,
            max: 3.0,
            step: 0.1,
            default: initialParameters.entryThreshold || 2.0,
            description: 'Standard deviations from mean for entry'
          },
          {
            name: 'exitThreshold',
            type: 'float',
            min: 0.0,
            max: 1.0,
            step: 0.1,
            default: initialParameters.exitThreshold || 0.5,
            description: 'Standard deviations from mean for exit'
          },
          {
            name: 'maxHoldingPeriod',
            type: 'integer',
            min: 1,
            max: 20,
            step: 1,
            default: initialParameters.maxHoldingPeriod || 10,
            description: 'Maximum number of days to hold position'
          }
        ];
        break;
        
      case StrategyType.TREND_FOLLOWING:
        definitions = [
          {
            name: 'fastPeriod',
            type: 'integer',
            min: 5,
            max: 50,
            step: 5,
            default: initialParameters.fastPeriod || 10,
            description: 'Fast moving average period'
          },
          {
            name: 'slowPeriod',
            type: 'integer',
            min: 20,
            max: 200,
            step: 10,
            default: initialParameters.slowPeriod || 50,
            description: 'Slow moving average period'
          },
          {
            name: 'signalPeriod',
            type: 'integer',
            min: 5,
            max: 20,
            step: 1,
            default: initialParameters.signalPeriod || 9,
            description: 'Signal line period'
          },
          {
            name: 'trailStopPct',
            type: 'float',
            min: 0.01,
            max: 0.2,
            step: 0.01,
            default: initialParameters.trailStopPct || 0.05,
            description: 'Trailing stop percentage'
          }
        ];
        break;
        
      default:
        definitions = [
          {
            name: 'param1',
            type: 'float',
            min: 0,
            max: 10,
            step: 0.1,
            default: initialParameters.param1 || 5,
            description: 'Parameter 1'
          },
          {
            name: 'param2',
            type: 'integer',
            min: 1,
            max: 100,
            step: 1,
            default: initialParameters.param2 || 50,
            description: 'Parameter 2'
          }
        ];
    }
    
    setParameterDefinitions(definitions);
    
    // Update optimization config with these parameters
    setOptimizationConfig(prev => ({
      ...prev,
      parameters: definitions
    }));
  };

  const runOptimization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await optimizationService.optimizeParameters(optimizationConfig);
      setOptimizationResult(result);
      
      // Also run sensitivity analysis
      if (result.bestParameters) {
        const sensitivity = await optimizationService.analyzeParameterSensitivity(
          optimizationConfig,
          result.bestParameters
        );
        setSensitivityResults(sensitivity);
      }
      
      if (onOptimizationComplete && result.bestParameters) {
        onOptimizationComplete(result.bestParameters);
      }
    } catch (err) {
      setError('Failed to run optimization. Please check your configuration and try again.');
      console.error('Error running optimization:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = <K extends keyof OptimizationConfig>(
    field: K, 
    value: OptimizationConfig[K]
  ) => {
    setOptimizationConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBaseConfigChange = <K extends keyof OptimizationConfig['baseConfig']>(
    field: K, 
    value: OptimizationConfig['baseConfig'][K]
  ) => {
    setOptimizationConfig(prev => ({
      ...prev,
      baseConfig: {
        ...prev.baseConfig,
        [field]: value
      }
    }));
  };

  const handleSymbolsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const symbolsText = event.target.value;
    const symbolsArray = symbolsText.split(',').map(s => s.trim()).filter(s => s);
    
    setOptimizationConfig(prev => ({
      ...prev,
      baseConfig: {
        ...prev.baseConfig,
        symbols: symbolsArray
      }
    }));
  };

  const handleParameterDefinitionChange = (index: number, field: keyof ParameterDefinition, value: any) => {
    const updatedDefinitions = [...parameterDefinitions];
    updatedDefinitions[index] = {
      ...updatedDefinitions[index],
      [field]: value
    };
    
    setParameterDefinitions(updatedDefinitions);
    
    // Update optimization config with these parameters
    setOptimizationConfig(prev => ({
      ...prev,
      parameters: updatedDefinitions
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const applyOptimizedParameters = () => {
    if (optimizationResult && onOptimizationComplete) {
      onOptimizationComplete(optimizationResult.bestParameters);
    }
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const renderConfigurationPanel = () => (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Optimization Configuration</Typography>
          <Button
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            {showAdvancedSettings ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={optimizationConfig.baseConfig.startDate}
                onChange={(date) => date && handleBaseConfigChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={optimizationConfig.baseConfig.endDate}
                onChange={(date) => date && handleBaseConfigChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Initial Capital"
              type="number"
              fullWidth
              margin="normal"
              value={optimizationConfig.baseConfig.initialCapital}
              onChange={(e) => handleBaseConfigChange('initialCapital', Number(e.target.value))}
              InputProps={{
                startAdornment: <Typography color="text.secondary">$</Typography>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Optimization Algorithm</InputLabel>
              <Select
                value={optimizationConfig.algorithm}
                onChange={(e) => handleConfigChange('algorithm', e.target.value as OptimizationAlgorithm)}
              >
                <MenuItem value={OptimizationAlgorithm.GRID_SEARCH}>Grid Search</MenuItem>
                <MenuItem value={OptimizationAlgorithm.RANDOM_SEARCH}>Random Search</MenuItem>
                <MenuItem value={OptimizationAlgorithm.BAYESIAN_OPTIMIZATION}>Bayesian Optimization</MenuItem>
                <MenuItem value={OptimizationAlgorithm.GENETIC_ALGORITHM}>Genetic Algorithm</MenuItem>
                <MenuItem value={OptimizationAlgorithm.PARTICLE_SWARM}>Particle Swarm</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Symbols (comma separated)"
              fullWidth
              margin="normal"
              value={optimizationConfig.baseConfig.symbols.join(', ')}
              onChange={handleSymbolsChange}
              helperText="Enter ticker symbols separated by commas"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Optimization Metric</InputLabel>
              <Select
                value={optimizationConfig.optimizationMetric}
                onChange={(e) => handleConfigChange('optimizationMetric', e.target.value as keyof BacktestMetrics)}
              >
                <MenuItem value="sharpeRatio">Sharpe Ratio</MenuItem>
                <MenuItem value="sortinoRatio">Sortino Ratio</MenuItem>
                <MenuItem value="calmarRatio">Calmar Ratio</MenuItem>
                <MenuItem value="totalReturn">Total Return</MenuItem>
                <MenuItem value="annualizedReturn">Annualized Return</MenuItem>
                <MenuItem value="maxDrawdown">Max Drawdown</MenuItem>
                <MenuItem value="winRate">Win Rate</MenuItem>
                <MenuItem value="profitFactor">Profit Factor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={optimizationConfig.maximizeMetric}
                  onChange={(e) => handleConfigChange('maximizeMetric', e.target.checked)}
                />
              }
              label={`${optimizationConfig.maximizeMetric ? 'Maximize' : 'Minimize'} Metric`}
              sx={{ mt: 3 }}
            />
          </Grid>
          
          {showAdvancedSettings && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Advanced Settings" />
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Iterations"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={optimizationConfig.iterations || 100}
                  onChange={(e) => handleConfigChange('iterations', Number(e.target.value))}
                  helperText="Number of iterations for random search or Bayesian optimization"
                />
              </Grid>
              
              {optimizationConfig.algorithm === OptimizationAlgorithm.GENETIC_ALGORITHM && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Population Size"
                      type="number"
                      fullWidth
                      margin="normal"
                      value={optimizationConfig.populationSize || 20}
                      onChange={(e) => handleConfigChange('populationSize', Number(e.target.value))}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Generations"
                      type="number"
                      fullWidth
                      margin="normal"
                      value={optimizationConfig.generations || 10}
                      onChange={(e) => handleConfigChange('generations', Number(e.target.value))}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={optimizationConfig.crossValidation?.enabled || false}
                      onChange={(e) => handleConfigChange('crossValidation', {
                        enabled: e.target.checked,
                        folds: optimizationConfig.crossValidation?.folds || 3
                      })}
                    />
                  }
                  label="Enable Cross-Validation"
                />
              </Grid>
              
              {optimizationConfig.crossValidation?.enabled && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Cross-Validation Folds"
                    type="number"
                    fullWidth
                    margin="normal"
                    value={optimizationConfig.crossValidation?.folds || 3}
                    onChange={(e) => handleConfigChange('crossValidation', {
                      enabled: true,
                      folds: Number(e.target.value)
                    })}
                  />
                </Grid>
              )}
            </>
          )}
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Parameter Ranges for Optimization
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {parameterDefinitions.map((param, index) => (
                <Box key={index} mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    {param.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    <Tooltip title={param.description}>
                      <IconButton size="small">
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  
                  {param.type === 'categorical' ? (
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Values to Test</InputLabel>
                      <Select
                        multiple
                        value={param.values || []}
                        onChange={(e) => handleParameterDefinitionChange(
                          index, 
                          'values', 
                          e.target.value
                        )}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {(param.values || []).map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Min"
                          type="number"
                          fullWidth
                          size="small"
                          value={param.min}
                          onChange={(e) => handleParameterDefinitionChange(
                            index, 
                            'min', 
                            Number(e.target.value)
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Max"
                          type="number"
                          fullWidth
                          size="small"
                          value={param.max}
                          onChange={(e) => handleParameterDefinitionChange(
                            index, 
                            'max', 
                            Number(e.target.value)
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Step"
                          type="number"
                          fullWidth
                          size="small"
                          value={param.step}
                          onChange={(e) => handleParameterDefinitionChange(
                            index, 
                            'step', 
                            Number(e.target.value)
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Default"
                          type="number"
                          fullWidth
                          size="small"
                          value={param.default}
                          onChange={(e) => handleParameterDefinitionChange(
                            index, 
                            'default', 
                            Number(e.target.value)
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={runOptimization}
              startIcon={<TuneIcon />}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Optimizing...' : 'Run Optimization'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderResultsPanel = () => {
    if (loading) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1">
            Running optimization... This may take a few minutes.
          </Typography>
          <Box sx={{ width: '80%', mt: 2 }}>
            <LinearProgress />
          </Box>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      );
    }
    
    if (!optimizationResult) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Optimization Results Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your optimization parameters and click "Run Optimization" to see results.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runOptimization}
            startIcon={<TuneIcon />}
          >
            Run Optimization
          </Button>
        </Paper>
      );
    }
    
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Optimization Results</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={applyOptimizedParameters}
            startIcon={<CheckCircleIcon />}
          >
            Apply Optimized Parameters
          </Button>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Alert severity="success">
              <AlertTitle>Optimization Complete</AlertTitle>
              Optimization completed successfully in {(optimizationResult.executionTime / 1000).toFixed(1)} seconds.
              The best parameters achieved a {optimizationConfig.optimizationMetric} of{' '}
              {optimizationResult.bestMetricValue.toFixed(4)}.
            </Alert>
          </Grid>
        </Grid>
        
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Optimized Parameters
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(optimizationResult.bestParameters).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Typography variant="h6">
                    {Array.isArray(value) ? value.join(', ') : value.toString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="optimization results tabs">
            <Tab label="Parameter Sensitivity" />
            <Tab label="Convergence" />
            <Tab label="All Results" />
            <Tab label="Cross-Validation" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Parameter Sensitivity Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This analysis shows how sensitive the strategy performance is to changes in each parameter.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Parameter</TableCell>
                        <TableCell align="right">Sensitivity</TableCell>
                        <TableCell align="right">Optimal Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sensitivityResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.parameter}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              <LinearProgress 
                                variant="determinate" 
                                value={result.sensitivity * 100} 
                                sx={{ 
                                  width: 100, 
                                  mr: 1,
                                  height: 8,
                                  borderRadius: 5,
                                  bgcolor: 'grey.300',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: result.sensitivity > 0.7 ? 'error.main' : 
                                             result.sensitivity > 0.3 ? 'warning.main' : 
                                             'success.main'
                                  }
                                }} 
                              />
                              <Typography variant="body2">
                                {(result.sensitivity * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{result.optimalValue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ParameterSensitivityChart data={sensitivityResults} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Sensitivity Analysis Insights
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <ul>
                    {sensitivityResults.map((result, index) => (
                      <li key={index}>
                        <Typography variant="body2">
                          <strong>{result.parameter}:</strong> {result.description}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Optimization Convergence
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This chart shows how the optimization algorithm converged to the best solution over time.
            </Typography>
            
            {optimizationResult.convergenceHistory ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <ConvergenceChart data={optimizationResult.convergenceHistory} />
                </Grid>
                
                <Grid item xs={12}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Iteration</TableCell>
                          <TableCell align="right">{optimizationConfig.optimizationMetric}</TableCell>
                          <TableCell align="right">Improvement</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {optimizationResult.convergenceHistory.map((point, index) => {
                          const prevValue = index > 0 
                            ? optimizationResult.convergenceHistory[index - 1].bestMetricValue 
                            : null;
                          const improvement = prevValue !== null 
                            ? point.bestMetricValue - prevValue 
                            : 0;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{point.iteration}</TableCell>
                              <TableCell align="right">{point.bestMetricValue.toFixed(4)}</TableCell>
                              <TableCell 
                                align="right"
                                sx={{ 
                                  color: improvement > 0 
                                    ? 'success.main' 
                                    : improvement < 0 
                                      ? 'error.main' 
                                      : 'text.primary'
                                }}
                              >
                                {index > 0 ? (improvement > 0 ? '+' : '') + improvement.toFixed(4) : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                Convergence history is not available for this optimization algorithm.
              </Alert>
            )}
          </Box>
        )}
        
        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              All Optimization Results
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This table shows all parameter combinations tested during optimization, sorted by performance.
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    {Object.keys(optimizationResult.bestParameters).map(param => (
                      <TableCell key={param}>{param}</TableCell>
                    ))}
                    <TableCell align="right">{optimizationConfig.optimizationMetric}</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {optimizationResult.allResults.slice(0, 50).map((result, index) => (
                    <TableRow key={index} sx={{ 
                      bgcolor: index === 0 ? 'success.light' : 'inherit'
                    }}>
                      <TableCell>{result.rank}</TableCell>
                      {Object.keys(optimizationResult.bestParameters).map(param => (
                        <TableCell key={param}>
                          {Array.isArray(result.parameters[param]) 
                            ? result.parameters[param].join(', ') 
                            : result.parameters[param].toString()}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        {result.metrics[optimizationConfig.optimizationMetric].toFixed(4)}
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          onClick={() => onOptimizationComplete && onOptimizationComplete(result.parameters)}
                        >
                          Apply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {optimizationResult.allResults.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={Object.keys(optimizationResult.bestParameters).length + 3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Showing top 50 of {optimizationResult.allResults.length} results
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {activeTab === 3 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Cross-Validation Results
            </Typography>
            
            {optimizationResult.crossValidationResults ? (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Cross-validation tests the optimized parameters on different time periods to ensure robustness.
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fold</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">{optimizationConfig.optimizationMetric}</TableCell>
                        <TableCell align="right">Total Return</TableCell>
                        <TableCell align="right">Max Drawdown</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {optimizationResult.crossValidationResults.map((cv, index) => (
                        <TableRow key={index}>
                          <TableCell>{cv.fold}</TableCell>
                          <TableCell>Fold {cv.fold}</TableCell>
                          <TableCell align="right">
                            {cv.metrics[optimizationConfig.optimizationMetric].toFixed(4)}
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            color: cv.metrics.totalReturn >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {formatPercent(cv.metrics.totalReturn)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {formatPercent(cv.metrics.maxDrawdown)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell colSpan={2}><strong>Average</strong></TableCell>
                        <TableCell align="right"><strong>
                          {(optimizationResult.crossValidationResults.reduce(
                            (sum, cv) => sum + cv.metrics[optimizationConfig.optimizationMetric], 0
                          ) / optimizationResult.crossValidationResults.length).toFixed(4)}
                        </strong></TableCell>
                        <TableCell align="right"><strong>
                          {formatPercent(optimizationResult.crossValidationResults.reduce(
                            (sum, cv) => sum + cv.metrics.totalReturn, 0
                          ) / optimizationResult.crossValidationResults.length)}
                        </strong></TableCell>
                        <TableCell align="right"><strong>
                          {formatPercent(optimizationResult.crossValidationResults.reduce(
                            (sum, cv) => sum + cv.metrics.maxDrawdown, 0
                          ) / optimizationResult.crossValidationResults.length)}
                        </strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cross-Validation Insights
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" paragraph>
                      The optimized parameters show {
                        optimizationResult.crossValidationResults.every(cv => cv.metrics.totalReturn > 0)
                          ? 'consistent positive performance'
                          : 'mixed performance'
                      } across different time periods.
                    </Typography>
                    
                    <Typography variant="body2">
                      {
                        optimizationResult.crossValidationResults.every(cv => cv.metrics.totalReturn > 0)
                          ? 'This suggests the strategy is robust and not overfitted to a specific market regime.'
                          : 'The inconsistent performance across folds suggests the strategy may be sensitive to market conditions.'
                      }
                    </Typography>
                  </Paper>
                </Box>
              </>
            ) : (
              <Alert severity="info">
                Cross-validation was not enabled for this optimization run. Enable it in advanced settings to see results.
              </Alert>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderConfigurationPanel()}
        </Grid>
        <Grid item xs={12} md={8}>
          {renderResultsPanel()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrategyOptimizationPanel;