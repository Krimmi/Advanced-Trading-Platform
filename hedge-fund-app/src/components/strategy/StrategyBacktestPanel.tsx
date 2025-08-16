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
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { 
  StrategyBacktestService, 
  BacktestConfig, 
  BacktestResult,
  BacktestMetrics,
  BacktestTrade,
  StrategyType,
  StrategyRecommendation
} from '../../services/strategy';

// Mock chart components - in a real app, you would use a charting library like recharts or chart.js
const EquityCurveChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Equity Curve Chart (Mock)
    </Typography>
  </Paper>
);

const DrawdownChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Drawdown Chart (Mock)
    </Typography>
  </Paper>
);

const MonthlyReturnsHeatmap = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Monthly Returns Heatmap (Mock)
    </Typography>
  </Paper>
);

interface StrategyBacktestPanelProps {
  initialStrategy?: StrategyRecommendation;
  onBacktestComplete?: (result: BacktestResult) => void;
  onCompareStrategies?: (results: BacktestResult[]) => void;
}

const StrategyBacktestPanel: React.FC<StrategyBacktestPanelProps> = ({
  initialStrategy,
  onBacktestComplete,
  onCompareStrategies
}) => {
  // State for backtest configuration
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
    startDate: new Date(new Date().getFullYear() - 5, 0, 1),
    endDate: new Date(),
    initialCapital: 100000,
    symbols: ['SPY', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'],
    strategyType: initialStrategy?.type || StrategyType.MOMENTUM,
    strategyParameters: initialStrategy?.parameters || {},
    benchmark: 'SPY',
    rebalanceFrequency: 'monthly',
    includeDividends: true,
    includeCorporateActions: true,
    commissionModel: {
      percentage: 0.001,
      fixed: 0,
      minCommission: 1
    },
    slippageModel: {
      percentage: 0.001
    }
  });

  // State for backtest results
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState<boolean>(false);
  const [savedBacktests, setSavedBacktests] = useState<Array<{
    id: string;
    name: string;
    result: BacktestResult;
    date: Date;
  }>>([]);
  const [selectedBacktestsForComparison, setSelectedBacktestsForComparison] = useState<string[]>([]);

  // Mock service for demo purposes
  const backtestService = new StrategyBacktestService(
    // @ts-ignore - These would be properly injected in a real app
    null
  );

  // Initialize with initial strategy if provided
  useEffect(() => {
    if (initialStrategy) {
      setBacktestConfig(prev => ({
        ...prev,
        strategyType: initialStrategy.type,
        strategyParameters: initialStrategy.parameters
      }));
    }
  }, [initialStrategy]);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await backtestService.runBacktest(backtestConfig);
      setBacktestResult(result);
      
      if (onBacktestComplete) {
        onBacktestComplete(result);
      }
    } catch (err) {
      setError('Failed to run backtest. Please check your configuration and try again.');
      console.error('Error running backtest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof BacktestConfig, value: any) => {
    setBacktestConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setBacktestConfig(prev => ({
      ...prev,
      strategyParameters: {
        ...prev.strategyParameters,
        [paramName]: value
      }
    }));
  };

  const handleSymbolsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const symbolsText = event.target.value;
    const symbolsArray = symbolsText.split(',').map(s => s.trim()).filter(s => s);
    
    setBacktestConfig(prev => ({
      ...prev,
      symbols: symbolsArray
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const saveBacktest = () => {
    if (!backtestResult) return;
    
    const newSavedBacktest = {
      id: `backtest-${Date.now()}`,
      name: `${backtestConfig.strategyType} - ${new Date().toLocaleDateString()}`,
      result: backtestResult,
      date: new Date()
    };
    
    setSavedBacktests(prev => [...prev, newSavedBacktest]);
  };

  const handleCompareBacktests = () => {
    const selectedResults = savedBacktests
      .filter(bt => selectedBacktestsForComparison.includes(bt.id))
      .map(bt => bt.result);
    
    if (backtestResult) {
      selectedResults.push(backtestResult);
    }
    
    if (onCompareStrategies && selectedResults.length > 0) {
      onCompareStrategies(selectedResults);
    }
    
    setCompareDialogOpen(false);
  };

  const toggleBacktestSelection = (id: string) => {
    setSelectedBacktestsForComparison(prev => 
      prev.includes(id)
        ? prev.filter(btId => btId !== id)
        : [...prev, id]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
          <Typography variant="h6">Backtest Configuration</Typography>
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
                value={backtestConfig.startDate}
                onChange={(date) => date && handleConfigChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={backtestConfig.endDate}
                onChange={(date) => date && handleConfigChange('endDate', date)}
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
              value={backtestConfig.initialCapital}
              onChange={(e) => handleConfigChange('initialCapital', Number(e.target.value))}
              InputProps={{
                startAdornment: <Typography color="text.secondary">$</Typography>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Strategy Type</InputLabel>
              <Select
                value={backtestConfig.strategyType}
                onChange={(e) => handleConfigChange('strategyType', e.target.value)}
              >
                {Object.values(StrategyType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Symbols (comma separated)"
              fullWidth
              margin="normal"
              value={backtestConfig.symbols.join(', ')}
              onChange={handleSymbolsChange}
              helperText="Enter ticker symbols separated by commas"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Benchmark"
              fullWidth
              margin="normal"
              value={backtestConfig.benchmark}
              onChange={(e) => handleConfigChange('benchmark', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Rebalance Frequency</InputLabel>
              <Select
                value={backtestConfig.rebalanceFrequency}
                onChange={(e) => handleConfigChange('rebalanceFrequency', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {showAdvancedSettings && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Advanced Settings" />
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={backtestConfig.includeDividends}
                      onChange={(e) => handleConfigChange('includeDividends', e.target.checked)}
                    />
                  }
                  label="Include Dividends"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={backtestConfig.includeCorporateActions}
                      onChange={(e) => handleConfigChange('includeCorporateActions', e.target.checked)}
                    />
                  }
                  label="Include Corporate Actions"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Commission (%)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={backtestConfig.commissionModel?.percentage || 0}
                  onChange={(e) => handleConfigChange('commissionModel', {
                    ...backtestConfig.commissionModel,
                    percentage: Number(e.target.value)
                  })}
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">%</Typography>
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Slippage (%)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={backtestConfig.slippageModel?.percentage || 0}
                  onChange={(e) => handleConfigChange('slippageModel', {
                    ...backtestConfig.slippageModel,
                    percentage: Number(e.target.value)
                  })}
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">%</Typography>
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Strategy Parameters
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {Object.entries(backtestConfig.strategyParameters).length > 0 ? (
                    <Grid container spacing={2}>
                      {Object.entries(backtestConfig.strategyParameters).map(([key, value]) => (
                        <Grid item xs={12} md={6} key={key}>
                          <TextField
                            label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            fullWidth
                            margin="normal"
                            value={value}
                            onChange={(e) => {
                              // Try to parse as number if possible
                              const newValue = !isNaN(Number(e.target.value)) 
                                ? Number(e.target.value) 
                                : e.target.value;
                              handleParameterChange(key, newValue);
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No parameters available for this strategy type
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button 
                variant="outlined" 
                startIcon={<CompareArrowsIcon />}
                onClick={() => setCompareDialogOpen(true)}
                disabled={savedBacktests.length === 0 && !backtestResult}
              >
                Compare
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={runBacktest}
                startIcon={<PlayArrowIcon />}
                disabled={loading}
              >
                {loading ? 'Running...' : 'Run Backtest'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderResultsPanel = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
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
    
    if (!backtestResult) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Backtest Results Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your backtest parameters and click "Run Backtest" to see results.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runBacktest}
            startIcon={<PlayArrowIcon />}
          >
            Run Backtest
          </Button>
        </Paper>
      );
    }
    
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Backtest Results</Typography>
          <Box>
            <Button
              startIcon={<SaveIcon />}
              onClick={saveBacktest}
              sx={{ mr: 1 }}
            >
              Save
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
            >
              Export
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Return
              </Typography>
              <Typography variant="h6" color={backtestResult.metrics.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                {formatPercent(backtestResult.metrics.totalReturn)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Annualized Return
              </Typography>
              <Typography variant="h6" color={backtestResult.metrics.annualizedReturn >= 0 ? 'success.main' : 'error.main'}>
                {formatPercent(backtestResult.metrics.annualizedReturn)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sharpe Ratio
              </Typography>
              <Typography variant="h6">
                {backtestResult.metrics.sharpeRatio.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Max Drawdown
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(backtestResult.metrics.maxDrawdown)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="backtest results tabs">
            <Tab label="Performance" />
            <Tab label="Trades" />
            <Tab label="Metrics" />
            <Tab label="Analysis" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Equity Curve
                </Typography>
                <EquityCurveChart data={backtestResult.dailyPerformance} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Drawdown
                </Typography>
                <DrawdownChart data={backtestResult.dailyPerformance} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly Returns
                </Typography>
                <MonthlyReturnsHeatmap data={backtestResult.dailyPerformance} />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {activeTab === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entry Date</TableCell>
                  <TableCell>Exit Date</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Entry Price</TableCell>
                  <TableCell align="right">Exit Price</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backtestResult.trades.slice(0, 20).map((trade: BacktestTrade, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'Open'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={trade.side} 
                        color={trade.side === 'long' ? 'success' : 'error'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(trade.entryPrice)}</TableCell>
                    <TableCell align="right">
                      {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                    </TableCell>
                    <TableCell align="right">{trade.quantity}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: trade.pnl >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(trade.pnl)}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      color: trade.pnlPercentage >= 0 ? 'success.main' : 'error.main' 
                    }}>
                      {formatPercent(trade.pnlPercentage)}
                    </TableCell>
                    <TableCell>{trade.holdingPeriod} days</TableCell>
                  </TableRow>
                ))}
                {backtestResult.trades.length > 20 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Showing 20 of {backtestResult.trades.length} trades
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Return Metrics</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Return</TableCell>
                      <TableCell align="right">{formatPercent(backtestResult.metrics.totalReturn)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Annualized Return</TableCell>
                      <TableCell align="right">{formatPercent(backtestResult.metrics.annualizedReturn)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Volatility</TableCell>
                      <TableCell align="right">{formatPercent(backtestResult.metrics.volatility)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sharpe Ratio</TableCell>
                      <TableCell align="right">{backtestResult.metrics.sharpeRatio.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sortino Ratio</TableCell>
                      <TableCell align="right">{backtestResult.metrics.sortinoRatio.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Calmar Ratio</TableCell>
                      <TableCell align="right">{backtestResult.metrics.calmarRatio.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Risk Metrics</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Max Drawdown</TableCell>
                      <TableCell align="right">{formatPercent(backtestResult.metrics.maxDrawdown)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Max Drawdown Duration</TableCell>
                      <TableCell align="right">{backtestResult.metrics.maxDrawdownDuration} days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Win Rate</TableCell>
                      <TableCell align="right">{formatPercent(backtestResult.metrics.winRate)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Profit Factor</TableCell>
                      <TableCell align="right">{backtestResult.metrics.profitFactor.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average Win</TableCell>
                      <TableCell align="right">{formatCurrency(backtestResult.metrics.averageWin)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average Loss</TableCell>
                      <TableCell align="right">{formatCurrency(backtestResult.metrics.averageLoss)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Trade Metrics</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Trades</TableCell>
                      <TableCell align="right">{backtestResult.metrics.tradeCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Profitable Trades</TableCell>
                      <TableCell align="right">{backtestResult.metrics.profitableTradeCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Unprofitable Trades</TableCell>
                      <TableCell align="right">{backtestResult.metrics.unprofitableTradeCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Best Trade</TableCell>
                      <TableCell align="right">{formatCurrency(backtestResult.metrics.bestTrade)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Worst Trade</TableCell>
                      <TableCell align="right">{formatCurrency(backtestResult.metrics.worstTrade)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 3 && (
          <Grid container spacing={3}>
            {backtestResult.benchmarkPerformance && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Benchmark Comparison
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Strategy Return
                      </Typography>
                      <Typography variant="h6" color={backtestResult.metrics.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercent(backtestResult.metrics.totalReturn)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Benchmark Return
                      </Typography>
                      <Typography variant="h6" color={backtestResult.benchmarkPerformance.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercent(backtestResult.benchmarkPerformance.totalReturn)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Outperformance
                      </Typography>
                      <Typography variant="h6" color={(backtestResult.metrics.totalReturn - backtestResult.benchmarkPerformance.totalReturn) >= 0 ? 'success.main' : 'error.main'}>
                        {formatPercent(backtestResult.metrics.totalReturn - backtestResult.benchmarkPerformance.totalReturn)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Beta
                      </Typography>
                      <Typography variant="h6">
                        {(0.8).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
            
            {backtestResult.walkForwardResults && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Walk-Forward Analysis
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell>Train Period</TableCell>
                          <TableCell>Test Period</TableCell>
                          <TableCell align="right">Return</TableCell>
                          <TableCell align="right">Sharpe</TableCell>
                          <TableCell align="right">Max DD</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backtestResult.walkForwardResults.map((wf, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {new Date(wf.trainPeriod.startDate).toLocaleDateString()} - {new Date(wf.trainPeriod.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(wf.testPeriod.startDate).toLocaleDateString()} - {new Date(wf.testPeriod.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: wf.testMetrics.totalReturn >= 0 ? 'success.main' : 'error.main' 
                            }}>
                              {formatPercent(wf.testMetrics.totalReturn)}
                            </TableCell>
                            <TableCell align="right">
                              {wf.testMetrics.sharpeRatio.toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main' }}>
                              {formatPercent(wf.testMetrics.maxDrawdown)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Monte Carlo Simulation
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Monte Carlo Simulation Chart (Mock)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  const renderCompareDialog = () => (
    <Dialog
      open={compareDialogOpen}
      onClose={() => setCompareDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Compare Backtests</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select backtests to compare:
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Return</TableCell>
                <TableCell align="right">Sharpe</TableCell>
                <TableCell align="right">Max DD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savedBacktests.map((bt) => (
                <TableRow key={bt.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedBacktestsForComparison.includes(bt.id)}
                      onChange={() => toggleBacktestSelection(bt.id)}
                    />
                  </TableCell>
                  <TableCell>{bt.name}</TableCell>
                  <TableCell>{bt.date.toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ 
                    color: bt.result.metrics.totalReturn >= 0 ? 'success.main' : 'error.main' 
                  }}>
                    {formatPercent(bt.result.metrics.totalReturn)}
                  </TableCell>
                  <TableCell align="right">
                    {bt.result.metrics.sharpeRatio.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    {formatPercent(bt.result.metrics.maxDrawdown)}
                  </TableCell>
                </TableRow>
              ))}
              {backtestResult && (
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={true}
                      disabled
                    />
                  </TableCell>
                  <TableCell>Current Backtest</TableCell>
                  <TableCell>{new Date().toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ 
                    color: backtestResult.metrics.totalReturn >= 0 ? 'success.main' : 'error.main' 
                  }}>
                    {formatPercent(backtestResult.metrics.totalReturn)}
                  </TableCell>
                  <TableCell align="right">
                    {backtestResult.metrics.sharpeRatio.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    {formatPercent(backtestResult.metrics.maxDrawdown)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCompareDialogOpen(false)}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleCompareBacktests}
          disabled={selectedBacktestsForComparison.length === 0 && !backtestResult}
        >
          Compare
        </Button>
      </DialogActions>
    </Dialog>
  );

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
      
      {renderCompareDialog()}
    </Box>
  );
};

export default StrategyBacktestPanel;