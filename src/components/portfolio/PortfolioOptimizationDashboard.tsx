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
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
  Tune as TuneIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import portfolioOptimizationService, { 
  OptimizationResult,
  OptimizationObjective,
  OptimizationConstraint,
  EfficientFrontierPoint,
  AssetData
} from '../../frontend/src/services/portfolioOptimizationService';

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
      id={`portfolio-optimization-tabpanel-${index}`}
      aria-labelledby={`portfolio-optimization-tab-${index}`}
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

// Portfolio Optimization Dashboard component
const PortfolioOptimizationDashboard: React.FC = () => {
  // State variables
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B', 'JNJ', 'JPM', 'V']);
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [objective, setObjective] = useState<OptimizationObjective>({
    type: 'max_sharpe',
    parameters: {}
  });
  const [constraints, setConstraints] = useState<OptimizationConstraint[]>([
    { type: 'min_weight', parameters: { min_weight: 0.01 } },
    { type: 'max_weight', parameters: { max_weight: 0.3 } }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [efficientFrontier, setEfficientFrontier] = useState<EfficientFrontierPoint[]>([]);
  const [assetData, setAssetData] = useState<Record<string, AssetData>>({});
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.02);
  const [covarianceMethod, setCovarianceMethod] = useState<'sample' | 'shrinkage' | 'factor'>('shrinkage');
  const [returnEstimateMethod, setReturnEstimateMethod] = useState<'historical' | 'capm' | 'black_litterman' | 'custom'>('historical');
  const [useFactorModel, setUseFactorModel] = useState<boolean>(false);
  const [factorExposures, setFactorExposures] = useState<Record<string, Record<string, number>>>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [marketViews, setMarketViews] = useState<Array<{
    assets: string[];
    weights: number[];
    view_return: number;
    confidence: number;
  }>>([]);
  const [newMarketView, setNewMarketView] = useState<{
    assets: string[];
    weights: number[];
    view_return: number;
    confidence: number;
  }>({
    assets: [],
    weights: [],
    view_return: 0,
    confidence: 0.5
  });

  // Available objectives
  const objectives = [
    { value: 'max_sharpe', label: 'Maximum Sharpe Ratio' },
    { value: 'min_risk', label: 'Minimum Risk' },
    { value: 'max_return', label: 'Maximum Return' },
    { value: 'min_tracking_error', label: 'Minimum Tracking Error' },
    { value: 'max_diversification', label: 'Maximum Diversification' },
    { value: 'custom', label: 'Custom Objective' }
  ];

  // Available covariance methods
  const covarianceMethods = [
    { value: 'sample', label: 'Sample Covariance' },
    { value: 'shrinkage', label: 'Shrinkage Estimator' },
    { value: 'factor', label: 'Factor Model' }
  ];

  // Available return estimate methods
  const returnEstimateMethods = [
    { value: 'historical', label: 'Historical Returns' },
    { value: 'capm', label: 'Capital Asset Pricing Model' },
    { value: 'black_litterman', label: 'Black-Litterman Model' },
    { value: 'custom', label: 'Custom Returns' }
  ];

  // Load initial data on component mount
  useEffect(() => {
    fetchAssetData();
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load data based on selected tab
    if (newValue === 1 && efficientFrontier.length === 0) {
      generateEfficientFrontier();
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

  // Fetch asset data
  const fetchAssetData = async () => {
    if (symbols.length === 0) return;
    
    setLoading(true);
    try {
      const result = await portfolioOptimizationService.getAssetData(symbols, {
        end_date: new Date().toISOString().split('T')[0],
        frequency: 'daily'
      });
      
      setAssetData(result);
      showSnackbar('Asset data loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching asset data:', error);
      showSnackbar('Error fetching asset data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run portfolio optimization
  const runOptimization = async () => {
    setLoading(true);
    try {
      const params = {
        risk_free_rate: riskFreeRate,
        covariance_method: covarianceMethod,
        return_estimate_method: returnEstimateMethod
      };
      
      const result = await portfolioOptimizationService.optimizePortfolio(
        symbols,
        objective,
        constraints,
        params
      );
      
      setOptimizationResult(result);
      showSnackbar('Portfolio optimization completed successfully', 'success');
    } catch (error) {
      console.error('Error running optimization:', error);
      showSnackbar('Error running optimization', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate efficient frontier
  const generateEfficientFrontier = async () => {
    setLoading(true);
    try {
      const params = {
        points: 50,
        risk_free_rate: riskFreeRate,
        covariance_method: covarianceMethod,
        return_estimate_method: returnEstimateMethod
      };
      
      const result = await portfolioOptimizationService.generateEfficientFrontier(
        symbols,
        constraints,
        params
      );
      
      setEfficientFrontier(result);
      showSnackbar('Efficient frontier generated successfully', 'success');
    } catch (error) {
      console.error('Error generating efficient frontier:', error);
      showSnackbar('Error generating efficient frontier', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run Black-Litterman optimization
  const runBlackLittermanOptimization = async () => {
    if (marketViews.length === 0) {
      showSnackbar('Please add at least one market view', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const params = {
        risk_free_rate: riskFreeRate,
        tau: 0.025 // Uncertainty parameter
      };
      
      const result = await portfolioOptimizationService.runBlackLittermanOptimization(
        symbols,
        marketViews,
        constraints,
        params
      );
      
      setOptimizationResult(result);
      showSnackbar('Black-Litterman optimization completed successfully', 'success');
    } catch (error) {
      console.error('Error running Black-Litterman optimization:', error);
      showSnackbar('Error running Black-Litterman optimization', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run risk parity optimization
  const runRiskParityOptimization = async () => {
    setLoading(true);
    try {
      const params = {
        covariance_method: covarianceMethod,
        constraints: constraints
      };
      
      const result = await portfolioOptimizationService.runRiskParityOptimization(
        symbols,
        params
      );
      
      setOptimizationResult(result);
      showSnackbar('Risk parity optimization completed successfully', 'success');
    } catch (error) {
      console.error('Error running risk parity optimization:', error);
      showSnackbar('Error running risk parity optimization', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run hierarchical risk parity optimization
  const runHierarchicalRiskParity = async () => {
    setLoading(true);
    try {
      const params = {
        linkage_method: 'average' as 'single' | 'complete' | 'average' | 'weighted',
        constraints: constraints
      };
      
      const result = await portfolioOptimizationService.runHierarchicalRiskParity(
        symbols,
        params
      );
      
      setOptimizationResult(result);
      showSnackbar('Hierarchical risk parity optimization completed successfully', 'success');
    } catch (error) {
      console.error('Error running hierarchical risk parity optimization:', error);
      showSnackbar('Error running hierarchical risk parity optimization', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save optimized portfolio
  const saveOptimizedPortfolio = async () => {
    if (!optimizationResult || !optimizationResult.weights) {
      showSnackbar('No optimization result to save', 'error');
      return;
    }
    
    try {
      const result = await portfolioOptimizationService.saveOptimizedPortfolio(
        'Optimized Portfolio',
        `Portfolio optimized using ${objective.type} objective`,
        optimizationResult.weights,
        {
          objective: objective,
          constraints: constraints,
          risk_free_rate: riskFreeRate,
          covariance_method: covarianceMethod,
          return_estimate_method: returnEstimateMethod
        }
      );
      
      showSnackbar(`Portfolio saved with ID: ${result.portfolio_id}`, 'success');
    } catch (error) {
      console.error('Error saving portfolio:', error);
      showSnackbar('Error saving portfolio', 'error');
    }
  };

  // Add a market view
  const addMarketView = () => {
    if (newMarketView.assets.length === 0 || newMarketView.weights.length === 0) {
      showSnackbar('Please select assets and weights for the market view', 'error');
      return;
    }
    
    setMarketViews([...marketViews, { ...newMarketView }]);
    setNewMarketView({
      assets: [],
      weights: [],
      view_return: 0,
      confidence: 0.5
    });
  };

  // Remove a market view
  const removeMarketView = (index: number) => {
    const updatedViews = [...marketViews];
    updatedViews.splice(index, 1);
    setMarketViews(updatedViews);
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

  // Handle objective change
  const handleObjectiveChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const objectiveType = event.target.value as string;
    setObjective({
      type: objectiveType as OptimizationObjective['type'],
      parameters: {}
    });
  };

  // Add a constraint
  const addConstraint = (type: OptimizationConstraint['type'], parameters: Record<string, any>) => {
    setConstraints([...constraints, { type, parameters }]);
  };

  // Remove a constraint
  const removeConstraint = (index: number) => {
    const updatedConstraints = [...constraints];
    updatedConstraints.splice(index, 1);
    setConstraints(updatedConstraints);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Advanced Portfolio Optimization
      </Typography>
      
      <Grid container spacing={3}>
        {/* Portfolio Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Settings
            </Typography>
            
            <Grid container spacing={2}>
              {/* Objective Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="objective-select-label">Optimization Objective</InputLabel>
                  <Select
                    labelId="objective-select-label"
                    value={objective.type}
                    onChange={(e) => setObjective({
                      type: e.target.value as OptimizationObjective['type'],
                      parameters: {}
                    })}
                    label="Optimization Objective"
                  >
                    {objectives.map((obj) => (
                      <MenuItem key={obj.value} value={obj.value}>
                        {obj.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Covariance Method */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="covariance-method-label">Covariance Method</InputLabel>
                  <Select
                    labelId="covariance-method-label"
                    value={covarianceMethod}
                    onChange={(e) => setCovarianceMethod(e.target.value as 'sample' | 'shrinkage' | 'factor')}
                    label="Covariance Method"
                  >
                    {covarianceMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Return Estimate Method */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="return-estimate-method-label">Return Estimate Method</InputLabel>
                  <Select
                    labelId="return-estimate-method-label"
                    value={returnEstimateMethod}
                    onChange={(e) => setReturnEstimateMethod(e.target.value as 'historical' | 'capm' | 'black_litterman' | 'custom')}
                    label="Return Estimate Method"
                  >
                    {returnEstimateMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
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
              
              {/* Factor Model Toggle */}
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useFactorModel}
                      onChange={(e) => setUseFactorModel(e.target.checked)}
                    />
                  }
                  label="Use Factor Model"
                />
              </Grid>
              
              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={runOptimization}
                    disabled={loading || symbols.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  >
                    Run Optimization
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
                  
                  {returnEstimateMethod === 'black_litterman' && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={runBlackLittermanOptimization}
                      disabled={loading || symbols.length === 0 || marketViews.length === 0}
                      startIcon={<TuneIcon />}
                    >
                      Black-Litterman Optimization
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={runRiskParityOptimization}
                    disabled={loading || symbols.length === 0}
                    startIcon={<TrendingUpIcon />}
                  >
                    Risk Parity
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
        
        {/* Constraints Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Constraints
            </Typography>
            
            <Grid container spacing={2}>
              {/* Constraint List */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  {constraints.map((constraint, index) => (
                    <Chip
                      key={index}
                      label={`${constraint.type}: ${JSON.stringify(constraint.parameters)}`}
                      onDelete={() => removeConstraint(index)}
                      color="secondary"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
              
              {/* Add Constraint Controls */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => addConstraint('min_weight', { min_weight: 0.01 })}
                  >
                    Add Min Weight
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => addConstraint('max_weight', { max_weight: 0.3 })}
                  >
                    Add Max Weight
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => addConstraint('sector_weight', { sector: 'Technology', min_weight: 0.1, max_weight: 0.4 })}
                  >
                    Add Sector Constraint
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Black-Litterman Views (only if Black-Litterman is selected) */}
        {returnEstimateMethod === 'black_litterman' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Black-Litterman Market Views
              </Typography>
              
              <Grid container spacing={2}>
                {/* Market Views List */}
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    {marketViews.map((view, index) => (
                      <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>Assets:</strong> {view.assets.join(', ')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Weights:</strong> {view.weights.join(', ')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Expected Return:</strong> {(view.view_return * 100).toFixed(2)}%
                        </Typography>
                        <Typography variant="body2">
                          <strong>Confidence:</strong> {(view.confidence * 100).toFixed(0)}%
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => removeMarketView(index)}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                {/* Add Market View Controls */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Assets (comma-separated)"
                    value={newMarketView.assets.join(',')}
                    onChange={(e) => setNewMarketView({
                      ...newMarketView,
                      assets: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Weights (comma-separated)"
                    value={newMarketView.weights.join(',')}
                    onChange={(e) => setNewMarketView({
                      ...newMarketView,
                      weights: e.target.value.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w))
                    })}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Expected Return (%)"
                    type="number"
                    value={newMarketView.view_return * 100}
                    onChange={(e) => setNewMarketView({
                      ...newMarketView,
                      view_return: Number(e.target.value) / 100
                    })}
                    inputProps={{ step: 0.1 }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Confidence (%)"
                    type="number"
                    value={newMarketView.confidence * 100}
                    onChange={(e) => setNewMarketView({
                      ...newMarketView,
                      confidence: Number(e.target.value) / 100
                    })}
                    inputProps={{ step: 5, min: 0, max: 100 }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={addMarketView}
                    startIcon={<AddIcon />}
                  >
                    Add Market View
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
        
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
              <Tab label="Optimization Results" icon={<BarChartIcon />} iconPosition="start" />
              <Tab label="Efficient Frontier" icon={<TimelineIcon />} iconPosition="start" />
              <Tab label="Risk Analysis" icon={<AssessmentIcon />} iconPosition="start" />
              <Tab label="Factor Exposures" icon={<TuneIcon />} iconPosition="start" />
            </Tabs>
            
            <Divider />
            
            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Optimization Results Tab */}
            <TabPanel value={tabValue} index={0}>
              {!loading && optimizationResult && (
                <Grid container spacing={3}>
                  {/* Portfolio Weights Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Portfolio Weights
                      </Typography>
                      
                      <Box sx={{ height: 300 }}>
                        {/* Portfolio weights chart would go here */}
                        {/* For now, we'll use a placeholder */}
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Portfolio Weights Chart
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Portfolio Metrics */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Portfolio Metrics
                      </Typography>
                      
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Expected Return</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {(optimizationResult.expected_return * 100).toFixed(2)}%
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Expected Risk</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {(optimizationResult.expected_risk * 100).toFixed(2)}%
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Sharpe Ratio</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {optimizationResult.sharpe_ratio.toFixed(2)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Optimization Iterations</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {optimizationResult.optimization_metrics?.iterations || 'N/A'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Computation Time</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {optimizationResult.optimization_metrics?.computation_time?.toFixed(3) || 'N/A'} seconds
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Portfolio Weights Table */}
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
                            {Object.entries(optimizationResult.weights)
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
                  
                  {/* Risk Contributions */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Risk Contributions
                      </Typography>
                      
                      <Box sx={{ height: 300 }}>
                        {/* Risk contributions chart would go here */}
                        {/* For now, we'll use a placeholder */}
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Risk Contributions Chart
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Save Portfolio Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={saveOptimizedPortfolio}
                        startIcon={<SaveIcon />}
                      >
                        Save Portfolio
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
              
              {!loading && !optimizationResult && (
                <Alert severity="info">
                  No optimization results available yet. Click the "Run Optimization" button to optimize your portfolio.
                </Alert>
              )}
            </TabPanel>
            
            {/* Efficient Frontier Tab */}
            <TabPanel value={tabValue} index={1}>
              {!loading && efficientFrontier.length > 0 && (
                <Grid container spacing={3}>
                  {/* Efficient Frontier Chart */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Efficient Frontier
                      </Typography>
                      
                      <Box sx={{ height: 400 }}>
                        {/* Efficient frontier chart would go here */}
                        {/* For now, we'll use a placeholder */}
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Efficient Frontier Chart
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Efficient Frontier Portfolios */}
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
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Risk (%)</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Sharpe Ratio</th>
                              <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {efficientFrontier.map((portfolio, index) => (
                              <tr key={index}>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(portfolio.return * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {(portfolio.risk * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {portfolio.sharpe.toFixed(2)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setOptimizationResult({
                                        weights: portfolio.weights,
                                        expected_return: portfolio.return,
                                        expected_risk: portfolio.risk,
                                        sharpe_ratio: portfolio.sharpe,
                                        risk_contributions: {},
                                        factor_exposures: {},
                                        optimization_metrics: {
                                          objective_value: portfolio.sharpe,
                                          iterations: 0,
                                          convergence: true,
                                          computation_time: 0
                                        }
                                      });
                                      setTabValue(0);
                                    }}
                                  >
                                    Select
                                  </Button>
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
                </Alert>
              )}
            </TabPanel>
            
            {/* Risk Analysis Tab */}
            <TabPanel value={tabValue} index={2}>
              {!loading && optimizationResult && (
                <Grid container spacing={3}>
                  {/* Risk Decomposition */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Risk Decomposition
                      </Typography>
                      
                      <Box sx={{ height: 300 }}>
                        {/* Risk decomposition chart would go here */}
                        {/* For now, we'll use a placeholder */}
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Risk Decomposition Chart
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Correlation Matrix */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Correlation Matrix
                      </Typography>
                      
                      <Box sx={{ height: 300 }}>
                        {/* Correlation matrix chart would go here */}
                        {/* For now, we'll use a placeholder */}
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Correlation Matrix Heatmap
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Risk Metrics */}
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
                                <strong>Expected Return</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {(optimizationResult.expected_return * 100).toFixed(2)}%
                              </td>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                Expected annual return of the portfolio
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Expected Risk</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {(optimizationResult.expected_risk * 100).toFixed(2)}%
                              </td>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                Expected annual volatility of the portfolio
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Sharpe Ratio</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                {optimizationResult.sharpe_ratio.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                Risk-adjusted return (higher is better)
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <strong>Diversification Ratio</strong>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                N/A
                              </td>
                              <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                Measure of portfolio diversification
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {!loading && !optimizationResult && (
                <Alert severity="info">
                  No optimization results available yet. Run an optimization to view risk analysis.
                </Alert>
              )}
            </TabPanel>
            
            {/* Factor Exposures Tab */}
            <TabPanel value={tabValue} index={3}>
              {!loading && optimizationResult && optimizationResult.factor_exposures && (
                <Grid container spacing={3}>
                  {/* Factor Exposures Chart */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Factor Exposures
                      </Typography>
                      
                      <Box sx={{ height: 400 }}>
                        {/* Factor exposures chart would go here */}
                        {/* For now, we'll use a placeholder */}
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Factor Exposures Chart
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Factor Exposures Table */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Factor Exposures
                      </Typography>
                      
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Factor</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Exposure</th>
                              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Contribution to Risk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(optimizationResult.factor_exposures).map(([factor, exposure]) => (
                              <tr key={factor}>
                                <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <strong>{factor}</strong>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  {exposure.toFixed(2)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  N/A
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
              
              {!loading && (!optimizationResult || !optimizationResult.factor_exposures) && (
                <Alert severity="info">
                  No factor exposures available. Run an optimization with factor model enabled to view factor exposures.
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

export default PortfolioOptimizationDashboard;