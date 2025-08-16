import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Divider,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  TradingStrategy, 
  StrategyBacktestResult,
  Timeframe,
  MarketCondition
} from '../../models/strategy/StrategyTypes';
import { StrategyBacktestService } from '../../services/strategy/StrategyBacktestService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

// Mock icons (replace with actual imports in a real implementation)
const DownloadIcon = () => <Box>📥</Box>;
const OptimizeIcon = () => <Box>⚙️</Box>;
const InfoIcon = () => <Box>ℹ️</Box>;
const DateIcon = () => <Box>📅</Box>;

interface StrategyBacktestPanelProps {
  apiKey: string;
  baseUrl?: string;
  strategy: TradingStrategy;
  ticker: string;
  initialParameters?: Record<string, any>;
  onOptimizeRequest?: (strategy: TradingStrategy, ticker: string) => void;
}

const StrategyBacktestPanel: React.FC<StrategyBacktestPanelProps> = ({
  apiKey,
  baseUrl,
  strategy,
  ticker,
  initialParameters,
  onOptimizeRequest
}) => {
  const theme = useTheme();
  const [parameters, setParameters] = useState<Record<string, any>>(
    initialParameters || strategy.parameters.reduce((params, param) => {
      params[param.id] = param.defaultValue;
      return params;
    }, {} as Record<string, any>)
  );
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // 1 year ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [backtestResult, setBacktestResult] = useState<StrategyBacktestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showDrawdown, setShowDrawdown] = useState<boolean>(false);
  const [backtestService] = useState<StrategyBacktestService>(
    new StrategyBacktestService(apiKey, baseUrl)
  );

  // Run backtest when component mounts
  useEffect(() => {
    runBacktest();
  }, []);

  // Handle parameter change
  const handleParameterChange = (parameterId: string, value: any) => {
    setParameters({
      ...parameters,
      [parameterId]: value
    });
  };

  // Handle date change
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(event.target.value));
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(event.target.value));
  };

  // Handle initial capital change
  const handleInitialCapitalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInitialCapital(Number(event.target.value));
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle drawdown toggle
  const handleDrawdownToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowDrawdown(event.target.checked);
  };

  // Run backtest
  const runBacktest = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await backtestService.runBacktest(
        strategy.id,
        ticker,
        parameters,
        startDate,
        endDate,
        initialCapital
      );
      
      setBacktestResult(result);
    } catch (err) {
      console.error('Error running backtest:', err);
      setError('Failed to run backtest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle optimize request
  const handleOptimizeRequest = () => {
    if (onOptimizeRequest) {
      onOptimizeRequest(strategy, ticker);
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!backtestResult) return null;
    
    const equityCurve = backtestResult.equityCurve;
    const dates = equityCurve.map(point => new Date(point.date).toLocaleDateString());
    
    const datasets = [
      {
        label: 'Portfolio Value',
        data: equityCurve.map(point => point.equity),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        fill: false,
        tension: 0.1
      }
    ];
    
    if (showDrawdown) {
      datasets.push({
        label: 'Drawdown',
        data: equityCurve.map(point => -point.drawdown * initialCapital),
        borderColor: theme.palette.error.main,
        backgroundColor: theme.palette.error.main,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1'
      });
    }
    
    return {
      labels: dates,
      datasets
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Portfolio Value ($)'
        }
      },
      ...(showDrawdown ? {
        y1: {
          position: 'right' as const,
          title: {
            display: true,
            text: 'Drawdown ($)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      } : {})
    },
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    }
  };

  // Get market condition label
  const getMarketConditionLabel = (condition: MarketCondition): string => {
    return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Backtest: {strategy.name} on {ticker}
        </Typography>
        <Box>
          <Tooltip title="Optimize Strategy">
            <IconButton 
              size="small" 
              onClick={handleOptimizeRequest}
              sx={{ mr: 1 }}
            >
              <OptimizeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Results">
            <IconButton size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        {/* Backtest Configuration */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Backtest Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={handleStartDateChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={handleEndDateChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Initial Capital"
                    type="number"
                    value={initialCapital}
                    onChange={handleInitialCapitalChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                    }}
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Strategy Parameters
              </Typography>
              
              <Grid container spacing={2}>
                {strategy.parameters.map(param => (
                  <Grid item xs={12} key={param.id}>
                    {param.type === 'number' ? (
                      <TextField
                        label={param.name}
                        type="number"
                        value={parameters[param.id]}
                        onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                        fullWidth
                        margin="dense"
                        InputProps={{
                          inputProps: {
                            min: param.minValue,
                            max: param.maxValue,
                            step: param.step
                          }
                        }}
                        helperText={param.description}
                      />
                    ) : param.type === 'boolean' ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={parameters[param.id]}
                            onChange={(e) => handleParameterChange(param.id, e.target.checked)}
                          />
                        }
                        label={param.name}
                      />
                    ) : param.type === 'enum' ? (
                      <FormControl fullWidth margin="dense">
                        <InputLabel id={`param-${param.id}-label`}>{param.name}</InputLabel>
                        <Select
                          labelId={`param-${param.id}-label`}
                          value={parameters[param.id]}
                          onChange={(e) => handleParameterChange(param.id, e.target.value)}
                          label={param.name}
                        >
                          {param.options?.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        label={param.name}
                        value={parameters[param.id]}
                        onChange={(e) => handleParameterChange(param.id, e.target.value)}
                        fullWidth
                        margin="dense"
                        helperText={param.description}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={runBacktest}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Run Backtest'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Backtest Results */}
        <Grid item xs={12} md={8}>
          {loading && (
            <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Running backtest...
              </Typography>
            </Box>
          )}
          
          {error && (
            <Box sx={{ p: 2, bgcolor: theme.palette.error.light, borderRadius: 1, mt: 2, mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {backtestResult && (
            <Card variant="outlined">
              <CardContent>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 2 }}
                >
                  <Tab label="Performance" />
                  <Tab label="Trades" />
                  <Tab label="Market Conditions" />
                  <Tab label="Statistics" />
                </Tabs>
                
                {/* Performance Tab */}
                {activeTab === 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        Performance Summary
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showDrawdown}
                            onChange={handleDrawdownToggle}
                            size="small"
                          />
                        }
                        label="Show Drawdown"
                      />
                    </Box>
                    
                    <Box sx={{ height: 300, mb: 2 }}>
                      {prepareChartData() && (
                        <Line data={prepareChartData()!} options={chartOptions} />
                      )}
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Initial Capital
                            </Typography>
                            <Typography variant="h6">
                              {formatCurrency(backtestResult.initialCapital)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Final Capital
                            </Typography>
                            <Typography variant="h6">
                              {formatCurrency(backtestResult.finalCapital)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Total Return
                            </Typography>
                            <Typography 
                              variant="h6"
                              color={backtestResult.totalReturn >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercentage(backtestResult.totalReturn)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Annualized Return
                            </Typography>
                            <Typography 
                              variant="h6"
                              color={backtestResult.annualizedReturn >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercentage(backtestResult.annualizedReturn)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Key Metrics
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">Sharpe Ratio</TableCell>
                                <TableCell>{backtestResult.metrics.sharpeRatio.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Sortino Ratio</TableCell>
                                <TableCell>{backtestResult.metrics.sortino.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Max Drawdown</TableCell>
                                <TableCell sx={{ color: theme.palette.error.main }}>
                                  {formatPercentage(backtestResult.metrics.maxDrawdown)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Win Rate</TableCell>
                                <TableCell>{formatPercentage(backtestResult.metrics.winRate)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Profit Factor</TableCell>
                                <TableCell>{backtestResult.metrics.profitFactor.toFixed(2)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">Volatility</TableCell>
                                <TableCell>{formatPercentage(backtestResult.metrics.volatility)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Beta</TableCell>
                                <TableCell>{backtestResult.metrics.beta.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Alpha</TableCell>
                                <TableCell>{formatPercentage(backtestResult.metrics.alpha)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Calmar Ratio</TableCell>
                                <TableCell>{backtestResult.metrics.calmarRatio.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">Information Ratio</TableCell>
                                <TableCell>{backtestResult.metrics.informationRatio.toFixed(2)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                  </>
                )}
                
                {/* Trades Tab */}
                {activeTab === 1 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Trade Analysis
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Total Trades
                            </Typography>
                            <Typography variant="h6">
                              {backtestResult.trades.length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Win Rate
                            </Typography>
                            <Typography variant="h6">
                              {formatPercentage(backtestResult.metrics.winRate)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Avg. Profit
                            </Typography>
                            <Typography 
                              variant="h6"
                              color="success.main"
                            >
                              {formatPercentage(backtestResult.metrics.averageWin)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Avg. Loss
                            </Typography>
                            <Typography 
                              variant="h6"
                              color="error.main"
                            >
                              {formatPercentage(backtestResult.metrics.averageLoss)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Entry Date</TableCell>
                            <TableCell>Exit Date</TableCell>
                            <TableCell>Direction</TableCell>
                            <TableCell>Entry Price</TableCell>
                            <TableCell>Exit Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>P&L</TableCell>
                            <TableCell>P&L %</TableCell>
                            <TableCell>Holding Period</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backtestResult.trades.map((trade, index) => (
                            <TableRow 
                              key={index}
                              sx={{ 
                                bgcolor: trade.pnl > 0 ? 
                                  `${theme.palette.success.main}10` : 
                                  trade.pnl < 0 ? 
                                    `${theme.palette.error.main}10` : 
                                    'inherit'
                              }}
                            >
                              <TableCell>{formatDate(new Date(trade.entryDate))}</TableCell>
                              <TableCell>{formatDate(new Date(trade.exitDate))}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={trade.direction.toUpperCase()} 
                                  size="small"
                                  color={trade.direction === 'long' ? 'primary' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                              <TableCell>{formatCurrency(trade.exitPrice)}</TableCell>
                              <TableCell>{trade.quantity}</TableCell>
                              <TableCell 
                                sx={{ 
                                  color: trade.pnl > 0 ? 
                                    theme.palette.success.main : 
                                    trade.pnl < 0 ? 
                                      theme.palette.error.main : 
                                      'inherit'
                                }}
                              >
                                {formatCurrency(trade.pnl)}
                              </TableCell>
                              <TableCell
                                sx={{ 
                                  color: trade.pnlPercentage > 0 ? 
                                    theme.palette.success.main : 
                                    trade.pnlPercentage < 0 ? 
                                      theme.palette.error.main : 
                                      'inherit'
                                }}
                              >
                                {formatPercentage(trade.pnlPercentage)}
                              </TableCell>
                              <TableCell>{trade.holdingPeriod} days</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
                
                {/* Market Conditions Tab */}
                {activeTab === 2 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Performance by Market Condition
                    </Typography>
                    
                    {backtestResult.marketConditions.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Market Condition</TableCell>
                              <TableCell>Start Date</TableCell>
                              <TableCell>End Date</TableCell>
                              <TableCell>Performance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {backtestResult.marketConditions.map((condition, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Chip 
                                    label={getMarketConditionLabel(condition.condition)} 
                                    size="small"
                                    color={
                                      condition.condition === MarketCondition.BULL ? 'success' :
                                      condition.condition === MarketCondition.BEAR ? 'error' :
                                      condition.condition === MarketCondition.VOLATILE ? 'warning' :
                                      'default'
                                    }
                                  />
                                </TableCell>
                                <TableCell>{formatDate(new Date(condition.startDate))}</TableCell>
                                <TableCell>{formatDate(new Date(condition.endDate))}</TableCell>
                                <TableCell
                                  sx={{ 
                                    color: condition.performance > 0 ? 
                                      theme.palette.success.main : 
                                      condition.performance < 0 ? 
                                        theme.palette.error.main : 
                                        'inherit'
                                  }}
                                >
                                  {formatPercentage(condition.performance)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No market condition data available for this backtest period.
                      </Typography>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Strategy Suitability Analysis
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {strategy.suitableMarketConditions.map((condition, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>
                                {getMarketConditionLabel(condition)}
                              </Typography>
                              
                              <Typography variant="body2" paragraph>
                                {condition === MarketCondition.BULL ? 
                                  `This strategy is designed to perform well in bull markets by capitalizing on upward price momentum.` :
                                 condition === MarketCondition.BEAR ?
                                  `This strategy is designed to perform well in bear markets by identifying short opportunities or defensive positions.` :
                                 condition === MarketCondition.SIDEWAYS ?
                                  `This strategy is designed to perform well in sideways markets by capturing range-bound price movements.` :
                                 condition === MarketCondition.VOLATILE ?
                                  `This strategy is designed to perform well in volatile markets by adapting to rapid price changes.` :
                                  `This strategy is designed to perform well in ${getMarketConditionLabel(condition)} markets.`
                                }
                              </Typography>
                              
                              {backtestResult.marketConditions.find(mc => mc.condition === condition) && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ mr: 1 }}>
                                    Actual Performance:
                                  </Typography>
                                  <Typography 
                                    variant="body2"
                                    sx={{ 
                                      fontWeight: 'bold',
                                      color: backtestResult.marketConditions.find(mc => mc.condition === condition)!.performance > 0 ? 
                                        theme.palette.success.main : 
                                        backtestResult.marketConditions.find(mc => mc.condition === condition)!.performance < 0 ? 
                                          theme.palette.error.main : 
                                          'inherit'
                                    }}
                                  >
                                    {formatPercentage(backtestResult.marketConditions.find(mc => mc.condition === condition)!.performance)}
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
                
                {/* Statistics Tab */}
                {activeTab === 3 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Detailed Statistics
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Return Metrics
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Total Return</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.totalReturn)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Annualized Return</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.annualizedReturn)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Alpha</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.metrics.alpha)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Beta</TableCell>
                                    <TableCell>{backtestResult.metrics.beta.toFixed(2)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Information Ratio</TableCell>
                                    <TableCell>{backtestResult.metrics.informationRatio.toFixed(2)}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Risk Metrics
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Max Drawdown</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.metrics.maxDrawdown)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Volatility</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.metrics.volatility)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Sharpe Ratio</TableCell>
                                    <TableCell>{backtestResult.metrics.sharpeRatio.toFixed(2)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Sortino Ratio</TableCell>
                                    <TableCell>{backtestResult.metrics.sortino.toFixed(2)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Calmar Ratio</TableCell>
                                    <TableCell>{backtestResult.metrics.calmarRatio.toFixed(2)}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Trade Metrics
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Total Trades</TableCell>
                                    <TableCell>{backtestResult.trades.length}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Win Rate</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.metrics.winRate)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Profit Factor</TableCell>
                                    <TableCell>{backtestResult.metrics.profitFactor.toFixed(2)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Average Win</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.metrics.averageWin)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Average Loss</TableCell>
                                    <TableCell>{formatPercentage(backtestResult.metrics.averageLoss)}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ bgcolor: theme.palette.background.default }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Timing Metrics
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableBody>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Average Holding Period</TableCell>
                                    <TableCell>{backtestResult.metrics.averageHoldingPeriod.toFixed(1)} days</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Trades Per Month</TableCell>
                                    <TableCell>{backtestResult.metrics.tradesPerMonth.toFixed(1)}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Time In Market</TableCell>
                                    <TableCell>
                                      {formatPercentage(
                                        backtestResult.trades.reduce(
                                          (sum, trade) => sum + trade.holdingPeriod, 0
                                        ) / (
                                          (new Date(backtestResult.endDate).getTime() - new Date(backtestResult.startDate).getTime()) / 
                                          (1000 * 60 * 60 * 24)
                                        )
                                      )}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Longest Winning Streak</TableCell>
                                    <TableCell>
                                      {(() => {
                                        let maxStreak = 0;
                                        let currentStreak = 0;
                                        backtestResult.trades.forEach(trade => {
                                          if (trade.pnl > 0) {
                                            currentStreak++;
                                            maxStreak = Math.max(maxStreak, currentStreak);
                                          } else {
                                            currentStreak = 0;
                                          }
                                        });
                                        return maxStreak;
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell component="th" scope="row">Longest Losing Streak</TableCell>
                                    <TableCell>
                                      {(() => {
                                        let maxStreak = 0;
                                        let currentStreak = 0;
                                        backtestResult.trades.forEach(trade => {
                                          if (trade.pnl < 0) {
                                            currentStreak++;
                                            maxStreak = Math.max(maxStreak, currentStreak);
                                          } else {
                                            currentStreak = 0;
                                          }
                                        });
                                        return maxStreak;
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {!loading && !backtestResult && !error && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Configure backtest parameters and click "Run Backtest" to see results.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StrategyBacktestPanel;