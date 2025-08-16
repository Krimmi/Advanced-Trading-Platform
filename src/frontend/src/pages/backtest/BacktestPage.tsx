import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  History,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  TrendingDown,
  Timeline,
  BarChart,
  ShowChart,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';

// Charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  ComposedChart,
  Scatter
} from 'recharts';

// Redux
import { RootState } from '../../store';
import {
  fetchStrategies,
  createStrategy,
  updateStrategy,
  runBacktest,
  setCurrentStrategy,
  setCurrentBacktest,
  clearBacktestError
} from '../../store/slices/backtestSlice';

const BacktestPage: React.FC = () => {
  const dispatch = useDispatch();
  const { strategies, currentBacktest, loading, error } = useSelector((state: RootState) => state.backtest);
  
  // Local state
  const [activeStep, setActiveStep] = useState(0);
  const [strategyName, setStrategyName] = useState('');
  const [description, setDescription] = useState('');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState('');
  const [timeframe, setTimeframe] = useState('daily');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2023-01-01');
  const [initialCapital, setInitialCapital] = useState('100000');
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Effects
  useEffect(() => {
    // Fetch strategies when component mounts
    dispatch(fetchStrategies() as any);
    
    // Clear any previous backtest results
    dispatch(setCurrentBacktest(null));
    
    // Clear any errors
    dispatch(clearBacktestError());
  }, [dispatch]);
  
  // Handlers
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setStrategyName('');
    setDescription('');
    setSymbols([]);
    setTimeframe('daily');
    setStartDate('2020-01-01');
    setEndDate('2023-01-01');
    setInitialCapital('100000');
    setSelectedStrategy(null);
    dispatch(setCurrentBacktest(null));
  };
  
  const handleStrategySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedStrategy(event.target.value);
    
    // Find the selected strategy
    const strategy = strategies.find(s => s.id === event.target.value);
    if (strategy) {
      setStrategyName(strategy.name);
      setDescription(strategy.description);
      dispatch(setCurrentStrategy(strategy));
    }
  };
  
  const handleAddSymbol = () => {
    if (symbolInput && !symbols.includes(symbolInput)) {
      setSymbols([...symbols, symbolInput]);
      setSymbolInput('');
    }
  };
  
  const handleRemoveSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };
  
  const handleSaveStrategy = () => {
    if (!strategyName) return;
    
    const strategyData = {
      name: strategyName,
      description: description,
      parameters: {}
    };
    
    if (selectedStrategy) {
      // Update existing strategy
      dispatch(updateStrategy({ id: selectedStrategy, data: strategyData }) as any);
    } else {
      // Create new strategy
      dispatch(createStrategy(strategyData) as any).then((result: any) => {
        if (result.payload) {
          setSelectedStrategy(result.payload.id);
        }
      });
    }
  };
  
  const handleRunBacktest = () => {
    setIsRunning(true);
    
    const backtestConfig = {
      strategy_id: selectedStrategy || '',
      symbols: symbols,
      timeframe: timeframe,
      start_date: startDate,
      end_date: endDate,
      initial_capital: parseFloat(initialCapital),
    };
    
    dispatch(runBacktest(backtestConfig) as any)
      .then(() => {
        setIsRunning(false);
        handleNext();
      })
      .catch(() => {
        setIsRunning(false);
      });
  };
  
  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Strategy
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Trading Strategy</InputLabel>
              <Select
                value={selectedStrategy || ''}
                onChange={handleStrategySelect as any}
                label="Trading Strategy"
              >
                {strategies.map((strategy) => (
                  <MenuItem key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="h6" gutterBottom>
              Or Create a New Strategy
            </Typography>
            
            <TextField
              label="Strategy Name"
              fullWidth
              margin="normal"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
            />
            
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={handleSaveStrategy}
                startIcon={<SaveIcon />}
                disabled={!strategyName}
              >
                Save Strategy
              </Button>
              
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedStrategy && !strategyName}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add Assets to Backtest
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <TextField
                label="Symbol"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleAddSymbol}
                disabled={!symbolInput}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {symbols.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {symbols.map((symbol) => (
                    <Chip
                      key={symbol}
                      label={symbol}
                      onDelete={() => handleRemoveSymbol(symbol)}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No symbols added yet. Add at least one symbol to continue.
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={symbols.length === 0}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Backtest Parameters
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as string)}
                    label="Timeframe"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="hourly">Hourly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Initial Capital"
                  type="number"
                  fullWidth
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleRunBacktest}
                startIcon={<PlayArrowIcon />}
                disabled={!initialCapital || !startDate || !endDate || loading}
              >
                Run Backtest
              </Button>
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box>
            {isRunning || loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Running Backtest...</Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a few moments depending on the complexity of your strategy and the amount of data.
                </Typography>
              </Box>
            ) : currentBacktest ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Backtest Results
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Return
                        </Typography>
                        <Typography 
                          variant="h5" 
                          color={currentBacktest.summary.total_return >= 0 ? 'success.main' : 'error.main'}
                        >
                          {currentBacktest.summary.total_return >= 0 ? '+' : ''}
                          {currentBacktest.summary.total_return.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sharpe Ratio
                        </Typography>
                        <Typography variant="h5">
                          {currentBacktest.summary.sharpe_ratio.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Max Drawdown
                        </Typography>
                        <Typography variant="h5" color="error.main">
                          -{currentBacktest.summary.max_drawdown.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Typography variant="h5">
                          {currentBacktest.summary.win_rate.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Paper sx={{ p: 2, mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Equity Curve
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={currentBacktest.equity_curve}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(-2)}`;
                          }}
                        />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value: any) => [`$${value.toFixed(2)}`, 'Equity']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="equity" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Monthly Returns
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            data={currentBacktest.monthly_returns}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <RechartsTooltip formatter={(value: any) => [`${value}%`, 'Return']} />
                            <Bar 
                              dataKey="return" 
                              fill={(data: any) => (parseFloat(data.return) >= 0 ? '#4caf50' : '#f44336')}
                            />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Performance Metrics
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Total Return</TableCell>
                              <TableCell align="right">{currentBacktest.summary.total_return.toFixed(2)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Annualized Return</TableCell>
                              <TableCell align="right">{currentBacktest.summary.annualized_return.toFixed(2)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Sharpe Ratio</TableCell>
                              <TableCell align="right">{currentBacktest.summary.sharpe_ratio.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Max Drawdown</TableCell>
                              <TableCell align="right">-{currentBacktest.summary.max_drawdown.toFixed(2)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Win Rate</TableCell>
                              <TableCell align="right">{currentBacktest.summary.win_rate.toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Profit Factor</TableCell>
                              <TableCell align="right">{currentBacktest.summary.profit_factor.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Total Trades</TableCell>
                              <TableCell align="right">{currentBacktest.summary.total_trades}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Profitable Trades</TableCell>
                              <TableCell align="right">{currentBacktest.summary.profitable_trades}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Unprofitable Trades</TableCell>
                              <TableCell align="right">{currentBacktest.summary.unprofitable_trades}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Paper sx={{ p: 2, mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Trade List
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Entry Date</TableCell>
                          <TableCell>Exit Date</TableCell>
                          <TableCell>Entry Price</TableCell>
                          <TableCell>Exit Price</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>P&L ($)</TableCell>
                          <TableCell>P&L (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentBacktest.trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>{trade.id}</TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell>{trade.type}</TableCell>
                            <TableCell>{trade.entry_date}</TableCell>
                            <TableCell>{trade.exit_date}</TableCell>
                            <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                            <TableCell>${trade.exit_price.toFixed(2)}</TableCell>
                            <TableCell>{trade.quantity}</TableCell>
                            <TableCell 
                              sx={{ 
                                color: trade.pnl >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'bold'
                              }}
                            >
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </TableCell>
                            <TableCell
                              sx={{ 
                                color: trade.pnl_percent >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'bold'
                              }}
                            >
                              {trade.pnl_percent >= 0 ? '+' : ''}
                              {trade.pnl_percent.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    startIcon={<RefreshIcon />}
                  >
                    New Backtest
                  </Button>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      sx={{ mr: 1 }}
                    >
                      Save Results
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                    >
                      Export CSV
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography>No backtest results available.</Typography>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };
  
  // Steps for backtest creation
  const steps = [
    {
      label: 'Strategy Selection',
      description: 'Select or create a trading strategy',
    },
    {
      label: 'Asset Selection',
      description: 'Choose assets to include in your backtest',
    },
    {
      label: 'Backtest Configuration',
      description: 'Configure backtest parameters',
    },
    {
      label: 'Run Backtest',
      description: 'Execute backtest and view results',
    },
  ];
  
  return (
    <Box>
      <PageHeader 
        title="Strategy Backtesting" 
        subtitle="Test and optimize your trading strategies"
        icon={<History />}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="subtitle1">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                {getStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default BacktestPage;