import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  DateRange as DateRangeIcon,
  AttachMoney as AttachMoneyIcon,
  Speed as SpeedIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, addMonths, subYears } from 'date-fns';

import BacktestingService from '../../services/backtesting/backtestingService';
import StrategyExecutionService from '../../services/backtesting/strategyExecutionService';
import { 
  BacktestConfig, 
  BacktestResult, 
  BacktestStatus,
  CommissionType,
  SlippageModel,
  DataSource,
  Strategy
} from '../../types/backtesting/backtestingTypes';
import { TimeFrame } from '../../types/common/timeFrameTypes';

interface BacktestRunnerProps {
  strategy?: Strategy;
  onBacktestComplete?: (result: BacktestResult) => void;
  onBacktestStart?: (config: BacktestConfig) => void;
}

const BacktestRunner: React.FC<BacktestRunnerProps> = ({
  strategy,
  onBacktestComplete,
  onBacktestStart
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [backtestConfig, setBacktestConfig] = useState<Partial<BacktestConfig>>({
    name: '',
    description: '',
    symbols: [],
    startDate: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    initialCapital: 100000,
    timeFrame: TimeFrame.DAILY,
    commissionType: CommissionType.PERCENTAGE,
    commissionValue: 0.1,
    slippageModel: SlippageModel.PERCENTAGE,
    slippageValue: 0.05,
    dataSource: DataSource.YAHOO_FINANCE,
    includeDividends: true,
    includeCorporateActions: true,
    executionDelay: 0,
    tags: []
  });
  
  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);
  const [availableTimeFrames, setAvailableTimeFrames] = useState<{ value: TimeFrame; label: string }[]>([]);
  const [availableDataSources, setAvailableDataSources] = useState<{ value: DataSource; label: string }[]>([]);
  
  const [symbolInput, setSymbolInput] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentBacktestId, setCurrentBacktestId] = useState<string | null>(null);
  const [currentBacktestResult, setCurrentBacktestResult] = useState<BacktestResult | null>(null);
  
  const [recentBacktests, setRecentBacktests] = useState<BacktestResult[]>([]);
  const [dataAvailability, setDataAvailability] = useState<Record<string, boolean>>({});
  
  const backtestingService = new BacktestingService();
  const strategyService = new StrategyExecutionService();
  
  // Initialize with strategy if provided
  useEffect(() => {
    if (strategy) {
      setBacktestConfig(prev => ({
        ...prev,
        strategyId: strategy.id,
        name: `${strategy.name} Backtest`,
        description: `Backtest for strategy: ${strategy.name}`
      }));
    }
  }, [strategy]);
  
  // Load available strategies, time frames, and data sources
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load strategies
        const strategies = await strategyService.getStrategies();
        setAvailableStrategies(strategies);
        
        // Load time frames
        const timeFrames = [
          { value: TimeFrame.ONE_MINUTE, label: '1 Minute' },
          { value: TimeFrame.FIVE_MINUTES, label: '5 Minutes' },
          { value: TimeFrame.FIFTEEN_MINUTES, label: '15 Minutes' },
          { value: TimeFrame.THIRTY_MINUTES, label: '30 Minutes' },
          { value: TimeFrame.ONE_HOUR, label: '1 Hour' },
          { value: TimeFrame.FOUR_HOURS, label: '4 Hours' },
          { value: TimeFrame.DAILY, label: 'Daily' },
          { value: TimeFrame.WEEKLY, label: 'Weekly' },
          { value: TimeFrame.MONTHLY, label: 'Monthly' }
        ];
        setAvailableTimeFrames(timeFrames);
        
        // Load data sources
        const dataSources = [
          { value: DataSource.YAHOO_FINANCE, label: 'Yahoo Finance' },
          { value: DataSource.ALPHA_VANTAGE, label: 'Alpha Vantage' },
          { value: DataSource.FINANCIAL_MODELING_PREP, label: 'Financial Modeling Prep' },
          { value: DataSource.CUSTOM, label: 'Custom Data Source' }
        ];
        setAvailableDataSources(dataSources);
        
        // Load recent backtests
        const recentResults = await backtestingService.getBacktestResults();
        setRecentBacktests(recentResults.slice(0, 5)); // Show only the 5 most recent
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load initial data. Please try again later.');
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Check data availability when symbols or date range changes
  useEffect(() => {
    const checkDataAvailability = async () => {
      if (backtestConfig.symbols && backtestConfig.symbols.length > 0 && 
          backtestConfig.startDate && backtestConfig.endDate && backtestConfig.timeFrame) {
        try {
          const availability = await backtestingService.checkDataAvailability(
            backtestConfig.symbols,
            backtestConfig.startDate,
            backtestConfig.endDate,
            backtestConfig.timeFrame
          );
          setDataAvailability(availability);
        } catch (err) {
          console.error('Error checking data availability:', err);
        }
      }
    };
    
    checkDataAvailability();
  }, [backtestConfig.symbols, backtestConfig.startDate, backtestConfig.endDate, backtestConfig.timeFrame]);
  
  // Poll for backtest progress when a backtest is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning && currentBacktestId) {
      intervalId = setInterval(async () => {
        try {
          const result = await backtestingService.getBacktestResult(currentBacktestId);
          
          if (result.status === BacktestStatus.COMPLETED || 
              result.status === BacktestStatus.FAILED || 
              result.status === BacktestStatus.CANCELLED) {
            setIsRunning(false);
            setCurrentBacktestResult(result);
            setProgress(100);
            
            if (result.status === BacktestStatus.COMPLETED) {
              setSuccess('Backtest completed successfully!');
              if (onBacktestComplete) {
                onBacktestComplete(result);
              }
            } else if (result.status === BacktestStatus.FAILED) {
              setError(`Backtest failed: ${result.errorMessage || 'Unknown error'}`);
            } else {
              setError('Backtest was cancelled.');
            }
            
            // Refresh recent backtests
            const recentResults = await backtestingService.getBacktestResults();
            setRecentBacktests(recentResults.slice(0, 5));
            
            clearInterval(intervalId);
          } else if (result.status === BacktestStatus.RUNNING) {
            // Estimate progress based on date range
            const startDate = new Date(result.startDate);
            const endDate = new Date(result.endDate);
            const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // This is a simplified progress estimation
            // In a real implementation, you would get this from the backend
            const progressEstimate = Math.min(95, Math.random() * 10 + progress);
            setProgress(progressEstimate);
          }
        } catch (err) {
          console.error('Error polling backtest status:', err);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, currentBacktestId, progress, onBacktestComplete]);
  
  const handleConfigChange = (field: keyof BacktestConfig, value: any) => {
    setBacktestConfig({
      ...backtestConfig,
      [field]: value
    });
  };
  
  const handleAddSymbol = () => {
    if (symbolInput && !backtestConfig.symbols?.includes(symbolInput.toUpperCase())) {
      const updatedSymbols = [...(backtestConfig.symbols || []), symbolInput.toUpperCase()];
      handleConfigChange('symbols', updatedSymbols);
      setSymbolInput('');
    }
  };
  
  const handleRemoveSymbol = (symbol: string) => {
    const updatedSymbols = backtestConfig.symbols?.filter(s => s !== symbol) || [];
    handleConfigChange('symbols', updatedSymbols);
  };
  
  const handleAddTag = () => {
    if (tagInput && !backtestConfig.tags?.includes(tagInput)) {
      const updatedTags = [...(backtestConfig.tags || []), tagInput];
      handleConfigChange('tags', updatedTags);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    const updatedTags = backtestConfig.tags?.filter(t => t !== tag) || [];
    handleConfigChange('tags', updatedTags);
  };
  
  const validateConfig = (): boolean => {
    if (!backtestConfig.name) {
      setError('Backtest name is required.');
      return false;
    }
    
    if (!backtestConfig.strategyId) {
      setError('Please select a strategy.');
      return false;
    }
    
    if (!backtestConfig.symbols || backtestConfig.symbols.length === 0) {
      setError('At least one symbol is required.');
      return false;
    }
    
    if (!backtestConfig.startDate || !backtestConfig.endDate) {
      setError('Start and end dates are required.');
      return false;
    }
    
    const startDate = new Date(backtestConfig.startDate);
    const endDate = new Date(backtestConfig.endDate);
    
    if (startDate >= endDate) {
      setError('Start date must be before end date.');
      return false;
    }
    
    if (backtestConfig.initialCapital <= 0) {
      setError('Initial capital must be greater than zero.');
      return false;
    }
    
    // Check data availability
    const unavailableSymbols = backtestConfig.symbols.filter(symbol => !dataAvailability[symbol]);
    if (unavailableSymbols.length > 0) {
      setError(`Data not available for symbols: ${unavailableSymbols.join(', ')}`);
      return false;
    }
    
    return true;
  };
  
  const handleRunBacktest = async () => {
    if (!validateConfig()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create backtest configuration
      const config = await backtestingService.createBacktestConfig(backtestConfig as BacktestConfig);
      
      // Start backtest execution
      const result = await backtestingService.executeBacktest(config.id!);
      
      setCurrentBacktestId(result.id);
      setIsRunning(true);
      setProgress(0);
      
      if (onBacktestStart) {
        onBacktestStart(config);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error running backtest:', err);
      setError('Failed to run backtest. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleCancelBacktest = async () => {
    if (!currentBacktestId) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, you would have an API endpoint to cancel a running backtest
      // For now, we'll just simulate it
      setIsRunning(false);
      setProgress(0);
      setError('Backtest cancelled by user.');
      
      setLoading(false);
    } catch (err) {
      console.error('Error cancelling backtest:', err);
      setError('Failed to cancel backtest.');
      setLoading(false);
    }
  };
  
  const handleSaveConfig = async () => {
    if (!validateConfig()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create or update backtest configuration
      let config;
      if (backtestConfig.id) {
        config = await backtestingService.updateBacktestConfig(
          backtestConfig.id,
          backtestConfig
        );
        setSuccess('Backtest configuration updated successfully!');
      } else {
        config = await backtestingService.createBacktestConfig(
          backtestConfig as BacktestConfig
        );
        setSuccess('Backtest configuration saved successfully!');
      }
      
      setBacktestConfig(config);
      setLoading(false);
    } catch (err) {
      console.error('Error saving backtest configuration:', err);
      setError('Failed to save backtest configuration. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleLoadRecentBacktest = async (resultId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await backtestingService.getBacktestResult(resultId);
      const config = await backtestingService.getBacktestConfig(result.configId);
      
      setBacktestConfig(config);
      setCurrentBacktestResult(result);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading recent backtest:', err);
      setError('Failed to load backtest. Please try again later.');
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Backtest Runner
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveConfig}
            disabled={loading || isRunning}
            sx={{ mr: 1 }}
          >
            Save Config
          </Button>
          
          {isRunning ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleCancelBacktest}
              disabled={loading}
            >
              Cancel Backtest
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleRunBacktest}
              disabled={loading}
            >
              Run Backtest
            </Button>
          )}
        </Box>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {isRunning && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Running backtest...
            </Typography>
            <Typography variant="body2">{Math.round(progress)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Configuration
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Backtest Name"
                  value={backtestConfig.name || ''}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  disabled={isRunning}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={backtestConfig.description || ''}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                  disabled={isRunning}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth disabled={isRunning || !!strategy}>
                  <InputLabel>Strategy</InputLabel>
                  <Select
                    value={backtestConfig.strategyId || ''}
                    label="Strategy"
                    onChange={(e) => handleConfigChange('strategyId', e.target.value)}
                  >
                    {availableStrategies.map((strategy) => (
                      <MenuItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Symbols</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <TextField
                    fullWidth
                    label="Add Symbol"
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                    disabled={isRunning}
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddSymbol}
                    disabled={isRunning || !symbolInput}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {backtestConfig.symbols?.map((symbol) => (
                    <Chip
                      key={symbol}
                      label={symbol}
                      onDelete={isRunning ? undefined : () => handleRemoveSymbol(symbol)}
                      color={dataAvailability[symbol] === false ? 'error' : 'default'}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={backtestConfig.startDate ? new Date(backtestConfig.startDate) : null}
                    onChange={(date) => handleConfigChange('startDate', date ? format(date, 'yyyy-MM-dd') : null)}
                    disabled={isRunning}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={backtestConfig.endDate ? new Date(backtestConfig.endDate) : null}
                    onChange={(date) => handleConfigChange('endDate', date ? format(date, 'yyyy-MM-dd') : null)}
                    disabled={isRunning}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Initial Capital"
                  type="number"
                  value={backtestConfig.initialCapital || 100000}
                  onChange={(e) => handleConfigChange('initialCapital', parseFloat(e.target.value))}
                  disabled={isRunning}
                  InputProps={{
                    startAdornment: <AttachMoneyIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isRunning}>
                  <InputLabel>Time Frame</InputLabel>
                  <Select
                    value={backtestConfig.timeFrame || TimeFrame.DAILY}
                    label="Time Frame"
                    onChange={(e) => handleConfigChange('timeFrame', e.target.value)}
                  >
                    {availableTimeFrames.map((tf) => (
                      <MenuItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', mb: 1 }}>
              <TextField
                fullWidth
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                disabled={isRunning}
                sx={{ mr: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={isRunning || !tagInput}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {backtestConfig.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={isRunning ? undefined : () => handleRemoveTag(tag)}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Advanced Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Commission & Slippage</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={isRunning}>
                      <InputLabel>Commission Type</InputLabel>
                      <Select
                        value={backtestConfig.commissionType || CommissionType.PERCENTAGE}
                        label="Commission Type"
                        onChange={(e) => handleConfigChange('commissionType', e.target.value)}
                      >
                        <MenuItem value={CommissionType.FIXED}>Fixed</MenuItem>
                        <MenuItem value={CommissionType.PERCENTAGE}>Percentage</MenuItem>
                        <MenuItem value={CommissionType.PER_SHARE}>Per Share</MenuItem>
                        <MenuItem value={CommissionType.TIERED}>Tiered</MenuItem>
                        <MenuItem value={CommissionType.CUSTOM}>Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Commission Value"
                      type="number"
                      value={backtestConfig.commissionValue || 0}
                      onChange={(e) => handleConfigChange('commissionValue', parseFloat(e.target.value))}
                      disabled={isRunning}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={isRunning}>
                      <InputLabel>Slippage Model</InputLabel>
                      <Select
                        value={backtestConfig.slippageModel || SlippageModel.PERCENTAGE}
                        label="Slippage Model"
                        onChange={(e) => handleConfigChange('slippageModel', e.target.value)}
                      >
                        <MenuItem value={SlippageModel.NONE}>None</MenuItem>
                        <MenuItem value={SlippageModel.FIXED}>Fixed</MenuItem>
                        <MenuItem value={SlippageModel.PERCENTAGE}>Percentage</MenuItem>
                        <MenuItem value={SlippageModel.MARKET_IMPACT}>Market Impact</MenuItem>
                        <MenuItem value={SlippageModel.CUSTOM}>Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Slippage Value"
                      type="number"
                      value={backtestConfig.slippageValue || 0}
                      onChange={(e) => handleConfigChange('slippageValue', parseFloat(e.target.value))}
                      disabled={isRunning}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Data Source & Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={isRunning}>
                      <InputLabel>Data Source</InputLabel>
                      <Select
                        value={backtestConfig.dataSource || DataSource.YAHOO_FINANCE}
                        label="Data Source"
                        onChange={(e) => handleConfigChange('dataSource', e.target.value)}
                      >
                        {availableDataSources.map((ds) => (
                          <MenuItem key={ds.value} value={ds.value}>
                            {ds.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={isRunning}>
                      <InputLabel>Include Dividends</InputLabel>
                      <Select
                        value={backtestConfig.includeDividends ? 'true' : 'false'}
                        label="Include Dividends"
                        onChange={(e) => handleConfigChange('includeDividends', e.target.value === 'true')}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={isRunning}>
                      <InputLabel>Include Corporate Actions</InputLabel>
                      <Select
                        value={backtestConfig.includeCorporateActions ? 'true' : 'false'}
                        label="Include Corporate Actions"
                        onChange={(e) => handleConfigChange('includeCorporateActions', e.target.value === 'true')}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Execution Delay (ms)"
                      type="number"
                      value={backtestConfig.executionDelay || 0}
                      onChange={(e) => handleConfigChange('executionDelay', parseInt(e.target.value))}
                      disabled={isRunning}
                      helperText="Simulates execution delay in milliseconds"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Backtests
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentBacktests.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No recent backtests found.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {recentBacktests.map((backtest) => (
                  <Grid item xs={12} key={backtest.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {backtest.configId} {/* In a real app, you'd show the backtest name */}
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              <DateRangeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              <AttachMoneyIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              Return: {(backtest.totalReturn * 100).toFixed(2)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              <TimelineIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              Sharpe: {backtest.sharpeRatio.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              <ShowChartIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              Max DD: {(backtest.maxDrawdown * 100).toFixed(2)}%
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => handleLoadRecentBacktest(backtest.id)}
                          startIcon={<HistoryIcon />}
                        >
                          Load Config
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BacktestRunner;