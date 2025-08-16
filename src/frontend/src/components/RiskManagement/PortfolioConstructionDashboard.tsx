import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Compare as CompareIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import riskManagementService, { 
  PortfolioWeights, 
  RiskMetrics, 
  PortfolioConstraints,
  EfficientFrontierPortfolio
} from '../../api/riskManagementService';
import PortfolioAllocationChart from './PortfolioAllocationChart';
import RiskMetricsChart from './RiskMetricsChart';
import EfficientFrontierChart from './EfficientFrontierChart';
import StressTestChart from './StressTestChart';
import StrategyComparisonChart from './StrategyComparisonChart';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`portfolio-construction-tabpanel-${index}`}
      aria-labelledby={`portfolio-construction-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Portfolio Construction Dashboard component
const PortfolioConstructionDashboard: React.FC = () => {
  // State variables
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'BRK.B', 'JNJ', 'JPM', 'V']);
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('maximum_sharpe');
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [portfolioWeights, setPortfolioWeights] = useState<PortfolioWeights>({});
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [efficientFrontier, setEfficientFrontier] = useState<EfficientFrontierPortfolio[]>([]);
  const [stressTestResults, setStressTestResults] = useState<any>(null);
  const [strategyComparison, setStrategyComparison] = useState<any[]>([]);
  const [lookbackDays, setLookbackDays] = useState<number>(252);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.02);
  const [targetReturn, setTargetReturn] = useState<number | null>(null);
  const [targetVolatility, setTargetVolatility] = useState<number | null>(null);
  const [maxTurnover, setMaxTurnover] = useState<number | null>(null);
  const [useConstraints, setUseConstraints] = useState<boolean>(false);
  const [minWeight, setMinWeight] = useState<number>(0);
  const [maxWeight, setMaxWeight] = useState<number>(1);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Available strategies
  const strategies = [
    { value: 'maximum_sharpe', label: 'Maximum Sharpe Ratio' },
    { value: 'minimum_volatility', label: 'Minimum Volatility' },
    { value: 'maximum_return', label: 'Maximum Return' },
    { value: 'risk_parity', label: 'Risk Parity' },
    { value: 'maximum_diversification', label: 'Maximum Diversification' },
    { value: 'minimum_cvar', label: 'Minimum CVaR' },
    { value: 'hierarchical_risk_parity', label: 'Hierarchical Risk Parity' },
    { value: 'equal_weight', label: 'Equal Weight' },
    { value: 'inverse_volatility', label: 'Inverse Volatility' }
  ];

  // Load initial portfolio on component mount
  useEffect(() => {
    constructPortfolio();
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load data based on selected tab
    if (newValue === 1 && efficientFrontier.length === 0) {
      generateEfficientFrontier();
    } else if (newValue === 2 && !stressTestResults) {
      runStressTest();
    } else if (newValue === 3 && strategyComparison.length === 0) {
      compareStrategies();
    }
  };

  // Add a symbol to the list
  const addSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol)) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  // Remove a symbol from the list
  const removeSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };

  // Construct portfolio
  const constructPortfolio = async () => {
    setLoading(true);
    try {
      // Prepare constraints if enabled
      let constraints: PortfolioConstraints | undefined = undefined;
      if (useConstraints) {
        constraints = {
          bounds: [minWeight, maxWeight]
        };
      }

      // Construct portfolio
      const result = await riskManagementService.constructPortfolio(
        symbols,
        strategy,
        lookbackDays,
        riskFreeRate,
        constraints,
        targetReturn,
        targetVolatility,
        undefined,
        true
      );

      // Update state
      setPortfolioWeights(result.weights);
      setRiskMetrics(result.metrics);
      setStressTestResults(result.stress_test);

      // Show success message
      showSnackbar('Portfolio constructed successfully', 'success');
    } catch (error) {
      console.error('Error constructing portfolio:', error);
      showSnackbar('Error constructing portfolio', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate efficient frontier
  const generateEfficientFrontier = async () => {
    setLoading(true);
    try {
      // Prepare constraints if enabled
      let bounds: [number, number] | undefined = undefined;
      if (useConstraints) {
        bounds = [minWeight, maxWeight];
      }

      // Generate efficient frontier
      const result = await riskManagementService.generateEfficientFrontier(
        symbols,
        50, // Number of portfolios
        lookbackDays,
        riskFreeRate,
        bounds
      );

      // Update state
      setEfficientFrontier(result);

      // Show success message
      showSnackbar('Efficient frontier generated successfully', 'success');
    } catch (error) {
      console.error('Error generating efficient frontier:', error);
      showSnackbar('Error generating efficient frontier', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run stress test
  const runStressTest = async () => {
    setLoading(true);
    try {
      // Run stress test
      const result = await riskManagementService.runStressTest(
        symbols,
        portfolioWeights,
        lookbackDays,
        ['historical', 'monte_carlo', 'custom']
      );

      // Update state
      setStressTestResults(result);

      // Show success message
      showSnackbar('Stress test completed successfully', 'success');
    } catch (error) {
      console.error('Error running stress test:', error);
      showSnackbar('Error running stress test', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Compare strategies
  const compareStrategies = async () => {
    setLoading(true);
    try {
      // Prepare constraints if enabled
      let constraints: PortfolioConstraints | undefined = undefined;
      if (useConstraints) {
        constraints = {
          bounds: [minWeight, maxWeight]
        };
      }

      // Compare strategies
      const result = await riskManagementService.compareStrategies(
        symbols,
        ['maximum_sharpe', 'minimum_volatility', 'risk_parity', 'maximum_diversification', 'minimum_cvar', 'equal_weight', 'inverse_volatility'],
        lookbackDays,
        riskFreeRate,
        constraints
      );

      // Update state
      setStrategyComparison(result);

      // Show success message
      showSnackbar('Strategy comparison completed successfully', 'success');
    } catch (error) {
      console.error('Error comparing strategies:', error);
      showSnackbar('Error comparing strategies', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Portfolio Construction & Risk Management
      </Typography>
      
      <Grid container spacing={3}>
        {/* Portfolio Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Settings
            </Typography>
            
            <Grid container spacing={2}>
              {/* Strategy Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="strategy-select-label">Strategy</InputLabel>
                  <Select
                    labelId="strategy-select-label"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as string)}
                    label="Strategy"
                  >
                    {strategies.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Lookback Period */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="lookback-select-label">Lookback Period</InputLabel>
                  <Select
                    labelId="lookback-select-label"
                    value={lookbackDays}
                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                    label="Lookback Period"
                  >
                    <MenuItem value={63}>3 Months</MenuItem>
                    <MenuItem value={126}>6 Months</MenuItem>
                    <MenuItem value={252}>1 Year</MenuItem>
                    <MenuItem value={504}>2 Years</MenuItem>
                    <MenuItem value={756}>3 Years</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Risk-Free Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Risk-Free Rate (%)"
                  type="number"
                  value={riskFreeRate * 100}
                  onChange={(e) => setRiskFreeRate(Number(e.target.value) / 100)}
                  inputProps={{ step: 0.1, min: 0, max: 10 }}
                  fullWidth
                />
              </Grid>
              
              {/* Target Return (for Minimum Volatility) */}
              {strategy === 'minimum_volatility' && (
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Target Return (%)"
                    type="number"
                    value={targetReturn !== null ? targetReturn * 100 : ''}
                    onChange={(e) => setTargetReturn(e.target.value === '' ? null : Number(e.target.value) / 100)}
                    inputProps={{ step: 0.1 }}
                    fullWidth
                  />
                </Grid>
              )}
              
              {/* Target Volatility (for Maximum Return) */}
              {strategy === 'maximum_return' && (
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Target Volatility (%)"
                    type="number"
                    value={targetVolatility !== null ? targetVolatility * 100 : ''}
                    onChange={(e) => setTargetVolatility(e.target.value === '' ? null : Number(e.target.value) / 100)}
                    inputProps={{ step: 0.1, min: 0 }}
                    fullWidth
                  />
                </Grid>
              )}
              
              {/* Constraints Toggle */}
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useConstraints}
                      onChange={(e) => setUseConstraints(e.target.checked)}
                    />
                  }
                  label="Use Weight Constraints"
                />
              </Grid>
              
              {/* Weight Constraints */}
              {useConstraints && (
                <>
                  <Grid item xs={12} md={4}>
                    <Typography gutterBottom>
                      Min/Max Weight: {minWeight.toFixed(2)} / {maxWeight.toFixed(2)}
                    </Typography>
                    <Box sx={{ px: 2 }}>
                      <Slider
                        value={[minWeight, maxWeight]}
                        onChange={(e, newValue) => {
                          const [newMin, newMax] = newValue as number[];
                          setMinWeight(newMin);
                          setMaxWeight(newMax);
                        }}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Max Turnover (%)"
                      type="number"
                      value={maxTurnover !== null ? maxTurnover * 100 : ''}
                      onChange={(e) => setMaxTurnover(e.target.value === '' ? null : Number(e.target.value) / 100)}
                      inputProps={{ step: 5, min: 0, max: 100 }}
                      fullWidth
                      helperText="For portfolio rebalancing"
                    />
                  </Grid>
                </>
              )}
              
              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={constructPortfolio}
                    disabled={loading || symbols.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  >
                    Construct Portfolio
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={generateEfficientFrontier}
                    disabled={loading || symbols.length === 0}
                    startIcon={<TimelineIcon />}
                  >
                    Generate Efficient Frontier
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={compareStrategies}
                    disabled={loading || symbols.length === 0}
                    startIcon={<CompareIcon />}
                  >
                    Compare Strategies
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Symbols Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Assets
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Add Symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                size="small"
                sx={{ mr: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={addSymbol}
                disabled={!newSymbol}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {symbols.map((symbol) => (
                <Chip
                  key={symbol}
                  label={symbol}
                  onDelete={() => removeSymbol(symbol)}
                  color="primary"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* Portfolio Analysis Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Portfolio Allocation" icon={<BarChartIcon />} iconPosition="start" />
              <Tab label="Efficient Frontier" icon={<TimelineIcon />} iconPosition="start" />
              <Tab label="Stress Testing" icon={<AssessmentIcon />} iconPosition="start" />
              <Tab label="Strategy Comparison" icon={<CompareIcon />} iconPosition="start" />
            </Tabs>
            
            <Divider />
            
            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Portfolio Allocation Tab */}
            <TabPanel value={tabValue} index={0}>
              {!loading && portfolioWeights && Object.keys(portfolioWeights).length > 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <PortfolioAllocationChart weights={portfolioWeights} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    {riskMetrics && <RiskMetricsChart metrics={riskMetrics} />}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Portfolio Weights
                      </Typography>
                      
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Symbol</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Weight (%)</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Allocation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(portfolioWeights)
                              .sort(([, weightA], [, weightB]) => weightB - weightA)
                              .map(([symbol, weight]) => (
                                <tr key={symbol}>
                                  <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <strong>{symbol}</strong>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {(weight * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                    <Box sx={{ width: '100%', height: 10, bgcolor: '#eee', borderRadius: 1 }}>
                                      <Box
                                        sx={{
                                          width: `${weight * 100}%`,
                                          height: '100%',
                                          bgcolor: 'primary.main',
                                          borderRadius: 1
                                        }}
                                      />
                                    </Box>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {riskMetrics && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Risk Metrics
                        </Typography>
                        
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Metric</th>
                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Value</th>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Expected Return (Annual)</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(riskMetrics.annualized_return * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Expected annual return of the portfolio
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Volatility (Annual)</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(riskMetrics.annualized_volatility * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Annual standard deviation of returns
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Sharpe Ratio</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {riskMetrics.sharpe_ratio.toFixed(2)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Risk-adjusted return (higher is better)
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Sortino Ratio</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {riskMetrics.sortino_ratio.toFixed(2)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Return per unit of downside risk
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Maximum Drawdown</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(riskMetrics.max_drawdown * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Maximum observed loss from peak to trough
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Value at Risk (95%)</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(riskMetrics.var_95 * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Maximum expected daily loss with 95% confidence
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Conditional VaR (95%)</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(riskMetrics.cvar_95 * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  Expected loss when losses exceed VaR
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
              
              {!loading && (!portfolioWeights || Object.keys(portfolioWeights).length === 0) && (
                <Alert severity="info">
                  No portfolio constructed yet. Click the "Construct Portfolio" button to create a portfolio.
                </Alert>
              )}
            </TabPanel>
            
            {/* Efficient Frontier Tab */}
            <TabPanel value={tabValue} index={1}>
              {!loading && efficientFrontier.length > 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <EfficientFrontierChart 
                      efficientFrontier={efficientFrontier} 
                      currentPortfolio={riskMetrics ? {
                        return: riskMetrics.annualized_return,
                        volatility: riskMetrics.annualized_volatility,
                        sharpe_ratio: riskMetrics.sharpe_ratio
                      } : undefined}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Efficient Frontier Portfolios
                      </Typography>
                      
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Return (%)</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Volatility (%)</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Sharpe Ratio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {efficientFrontier.map((portfolio, index) => (
                              <tr key={index}>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(portfolio.return * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(portfolio.volatility * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {portfolio.sharpe_ratio.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {!loading && efficientFrontier.length === 0 && (
                <Alert severity="info">
                  No efficient frontier generated yet. Click the "Generate Efficient Frontier" button to create the efficient frontier.
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={generateEfficientFrontier}
                      startIcon={<TimelineIcon />}
                    >
                      Generate Efficient Frontier
                    </Button>
                  </Box>
                </Alert>
              )}
            </TabPanel>
            
            {/* Stress Testing Tab */}
            <TabPanel value={tabValue} index={2}>
              {!loading && stressTestResults && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <StressTestChart stressTestResults={stressTestResults} />
                  </Grid>
                  
                  {stressTestResults.monte_carlo && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Monte Carlo Simulation Results
                        </Typography>
                        
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Mean Final Value</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {stressTestResults.monte_carlo.mean_final_value.toFixed(4)}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Median Final Value</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {stressTestResults.monte_carlo.median_final_value.toFixed(4)}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Minimum Final Value</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {stressTestResults.monte_carlo.min_final_value.toFixed(4)}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Maximum Final Value</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {stressTestResults.monte_carlo.max_final_value.toFixed(4)}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Value at Risk (95%)</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(stressTestResults.monte_carlo.var * 100).toFixed(2)}%
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Conditional VaR (95%)</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(stressTestResults.monte_carlo.cvar * 100).toFixed(2)}%
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>Probability of Loss</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(stressTestResults.monte_carlo.probability_of_loss * 100).toFixed(2)}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {stressTestResults.historical_scenarios && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Historical Scenario Analysis
                        </Typography>
                        
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Scenario</th>
                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Return (%)</th>
                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Volatility (%)</th>
                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Max Drawdown (%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stressTestResults.historical_scenarios.map((scenario: any, index: number) => (
                                <tr key={index}>
                                  <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <strong>{scenario.scenario}</strong>
                                  </td>
                                  <td style={{ 
                                    padding: '8px', 
                                    textAlign: 'right', 
                                    borderBottom: '1px solid #ddd',
                                    color: scenario.return > 0 ? 'green' : 'red'
                                  }}>
                                    {(scenario.return * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {(scenario.volatility * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {(scenario.max_drawdown * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {stressTestResults.custom_scenarios && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Custom Scenario Analysis
                        </Typography>
                        
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Scenario</th>
                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Portfolio Impact (%)</th>
                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Final Portfolio Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stressTestResults.custom_scenarios.map((scenario: any, index: number) => (
                                <tr key={index}>
                                  <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <strong>{scenario.scenario}</strong>
                                  </td>
                                  <td style={{ 
                                    padding: '8px', 
                                    textAlign: 'right', 
                                    borderBottom: '1px solid #ddd',
                                    color: scenario.portfolio_impact > 0 ? 'green' : 'red'
                                  }}>
                                    {(scenario.portfolio_impact * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {scenario.final_portfolio_value.toFixed(4)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
              
              {!loading && !stressTestResults && (
                <Alert severity="info">
                  No stress test results available yet. Click the button below to run stress tests on your portfolio.
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={runStressTest}
                      startIcon={<AssessmentIcon />}
                      disabled={!portfolioWeights || Object.keys(portfolioWeights).length === 0}
                    >
                      Run Stress Tests
                    </Button>
                  </Box>
                </Alert>
              )}
            </TabPanel>
            
            {/* Strategy Comparison Tab */}
            <TabPanel value={tabValue} index={3}>
              {!loading && strategyComparison.length > 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <StrategyComparisonChart comparison={strategyComparison} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Strategy Comparison
                      </Typography>
                      
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Strategy</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Return (%)</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Volatility (%)</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Sharpe Ratio</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Max Drawdown (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {strategyComparison
                              .sort((a, b) => b.sharpe_ratio - a.sharpe_ratio)
                              .map((strategy, index) => (
                                <tr key={index}>
                                  <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    <strong>{strategies.find(s => s.value === strategy.method)?.label || strategy.method}</strong>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {(strategy.expected_return * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {(strategy.volatility * 100).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {strategy.sharpe_ratio.toFixed(2)}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                    {strategy.max_drawdown ? (strategy.max_drawdown * 100).toFixed(2) + '%' : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {!loading && strategyComparison.length === 0 && (
                <Alert severity="info">
                  No strategy comparison available yet. Click the button below to compare different portfolio construction strategies.
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={compareStrategies}
                      startIcon={<CompareIcon />}
                    >
                      Compare Strategies
                    </Button>
                  </Box>
                </Alert>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PortfolioConstructionDashboard;