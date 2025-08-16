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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SecurityIcon from '@mui/icons-material/Security';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpIcon from '@mui/icons-material/Help';

import { 
  StrategyRiskAnalysisService, 
  RiskAnalysisConfig,
  RiskAnalysisResult,
  DrawdownAnalysis,
  VolatilityAnalysis,
  TailRiskAnalysis,
  StressTestResult,
  CorrelationAnalysis,
  RiskMetrics,
  RiskAttribution,
  LiquidityAnalysis,
  RiskDecomposition,
  StrategyType
} from '../../services/strategy';

// Mock chart components - in a real app, you would use a charting library like recharts or chart.js
const DrawdownChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Drawdown Chart (Mock)
    </Typography>
  </Paper>
);

const VolatilityChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Volatility Chart (Mock)
    </Typography>
  </Paper>
);

const CorrelationHeatmap = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Correlation Heatmap (Mock)
    </Typography>
  </Paper>
);

const StressTestChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Stress Test Chart (Mock)
    </Typography>
  </Paper>
);

const RiskDecompositionChart = ({ data }: { data: any }) => (
  <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Risk Decomposition Chart (Mock)
    </Typography>
  </Paper>
);

interface StrategyRiskAnalysisPanelProps {
  strategyType: StrategyType;
  strategyParameters: Record<string, any>;
  onRiskAnalysisComplete?: (result: RiskAnalysisResult) => void;
}

const StrategyRiskAnalysisPanel: React.FC<StrategyRiskAnalysisPanelProps> = ({
  strategyType,
  strategyParameters,
  onRiskAnalysisComplete
}) => {
  // State for risk analysis configuration
  const [riskConfig, setRiskConfig] = useState<RiskAnalysisConfig>({
    strategyType,
    strategyParameters,
    startDate: new Date(new Date().getFullYear() - 5, 0, 1),
    endDate: new Date(),
    initialCapital: 100000,
    symbols: ['SPY', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'],
    benchmark: 'SPY',
    confidenceLevel: 0.95,
    stressScenarios: [
      '2008 Financial Crisis',
      'COVID-19 Crash',
      '2018 Q4 Selloff'
    ],
    rollingWindowSize: 20,
    includeFactorAnalysis: true,
    includeLiquidityAnalysis: true
  });

  // State for risk analysis results
  const [riskAnalysisResult, setRiskAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Mock service for demo purposes
  const riskAnalysisService = new StrategyRiskAnalysisService(
    // @ts-ignore - These would be properly injected in a real app
    null, null
  );

  // Update config when props change
  useEffect(() => {
    setRiskConfig(prev => ({
      ...prev,
      strategyType,
      strategyParameters
    }));
  }, [strategyType, strategyParameters]);

  const runRiskAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await riskAnalysisService.analyzeRisk(riskConfig);
      setRiskAnalysisResult(result);
      
      if (onRiskAnalysisComplete) {
        onRiskAnalysisComplete(result);
      }
    } catch (err) {
      setError('Failed to run risk analysis. Please check your configuration and try again.');
      console.error('Error running risk analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = <K extends keyof RiskAnalysisConfig>(
    field: K, 
    value: RiskAnalysisConfig[K]
  ) => {
    setRiskConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSymbolsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const symbolsText = event.target.value;
    const symbolsArray = symbolsText.split(',').map(s => s.trim()).filter(s => s);
    
    setRiskConfig(prev => ({
      ...prev,
      symbols: symbolsArray
    }));
  };

  const handleStressScenariosChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setRiskConfig(prev => ({
      ...prev,
      stressScenarios: event.target.value as string[]
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'success.main';
      case 'medium':
        return 'warning.main';
      case 'high':
        return 'error.main';
      case 'very_high':
        return 'error.dark';
      default:
        return 'text.primary';
    }
  };

  const renderConfigurationPanel = () => (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Analysis Configuration
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={riskConfig.startDate}
                onChange={(date) => date && handleConfigChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={riskConfig.endDate}
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
              value={riskConfig.initialCapital}
              onChange={(e) => handleConfigChange('initialCapital', Number(e.target.value))}
              InputProps={{
                startAdornment: <Typography color="text.secondary">$</Typography>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Benchmark"
              fullWidth
              margin="normal"
              value={riskConfig.benchmark}
              onChange={(e) => handleConfigChange('benchmark', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Symbols (comma separated)"
              fullWidth
              margin="normal"
              value={riskConfig.symbols.join(', ')}
              onChange={handleSymbolsChange}
              helperText="Enter ticker symbols separated by commas"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Confidence Level for VaR/CVaR: {(riskConfig.confidenceLevel * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={riskConfig.confidenceLevel}
              min={0.9}
              max={0.99}
              step={0.01}
              marks={[
                { value: 0.9, label: '90%' },
                { value: 0.95, label: '95%' },
                { value: 0.99, label: '99%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              onChange={(_, value) => handleConfigChange('confidenceLevel', value as number)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Rolling Window Size (days)"
              type="number"
              fullWidth
              margin="normal"
              value={riskConfig.rollingWindowSize}
              onChange={(e) => handleConfigChange('rollingWindowSize', Number(e.target.value))}
              helperText="For rolling volatility and correlation calculations"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Stress Test Scenarios</InputLabel>
              <Select
                multiple
                value={riskConfig.stressScenarios}
                onChange={handleStressScenariosChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="2008 Financial Crisis">2008 Financial Crisis</MenuItem>
                <MenuItem value="COVID-19 Crash">COVID-19 Crash</MenuItem>
                <MenuItem value="2018 Q4 Selloff">2018 Q4 Selloff</MenuItem>
                <MenuItem value="2010 Flash Crash">2010 Flash Crash</MenuItem>
                <MenuItem value="2011 Debt Ceiling Crisis">2011 Debt Ceiling Crisis</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={riskConfig.includeFactorAnalysis}
                  onChange={(e) => handleConfigChange('includeFactorAnalysis', e.target.checked)}
                />
              }
              label="Include Factor Analysis"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={riskConfig.includeLiquidityAnalysis}
                  onChange={(e) => handleConfigChange('includeLiquidityAnalysis', e.target.checked)}
                />
              }
              label="Include Liquidity Analysis"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={runRiskAnalysis}
              startIcon={<AssessmentIcon />}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Analyzing...' : 'Run Risk Analysis'}
            </Button>
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
    
    if (!riskAnalysisResult) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Risk Analysis Results Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your risk analysis parameters and click "Run Risk Analysis" to see results.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runRiskAnalysis}
            startIcon={<AssessmentIcon />}
          >
            Run Risk Analysis
          </Button>
        </Paper>
      );
    }
    
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Risk Analysis Results</Typography>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Max Drawdown
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(riskAnalysisResult.drawdownAnalysis.maxDrawdown)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Value at Risk (95%)
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(riskAnalysisResult.tailRiskAnalysis.valueAtRisk.var95)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Annualized Volatility
              </Typography>
              <Typography variant="h6">
                {formatPercent(riskAnalysisResult.volatilityAnalysis.annualizedVolatility)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sharpe Ratio
              </Typography>
              <Typography variant="h6">
                {riskAnalysisResult.riskMetrics.sharpeRatio.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="risk analysis tabs">
            <Tab icon={<TrendingDownIcon />} label="Drawdown" />
            <Tab icon={<ShowChartIcon />} label="Volatility" />
            <Tab icon={<ErrorIcon />} label="Tail Risk" />
            <Tab icon={<SecurityIcon />} label="Stress Tests" />
            <Tab icon={<CompareArrowsIcon />} label="Correlations" />
            <Tab icon={<BarChartIcon />} label="Risk Attribution" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && renderDrawdownTab(riskAnalysisResult.drawdownAnalysis)}
        {activeTab === 1 && renderVolatilityTab(riskAnalysisResult.volatilityAnalysis)}
        {activeTab === 2 && renderTailRiskTab(riskAnalysisResult.tailRiskAnalysis)}
        {activeTab === 3 && renderStressTestTab(riskAnalysisResult.stressTestResults)}
        {activeTab === 4 && renderCorrelationTab(riskAnalysisResult.correlationAnalysis)}
        {activeTab === 5 && renderRiskAttributionTab(riskAnalysisResult.riskAttribution, riskAnalysisResult.riskDecomposition)}
      </Box>
    );
  };

  const renderDrawdownTab = (drawdownAnalysis: DrawdownAnalysis) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <DrawdownChart data={drawdownAnalysis} />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Drawdown Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Maximum Drawdown
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(drawdownAnalysis.maxDrawdown)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Maximum Drawdown Duration
              </Typography>
              <Typography variant="h6">
                {drawdownAnalysis.maxDrawdownDuration} days
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Average Drawdown
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(drawdownAnalysis.averageDrawdown)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Average Drawdown Duration
              </Typography>
              <Typography variant="h6">
                {drawdownAnalysis.averageDrawdownDuration.toFixed(1)} days
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Drawdown Frequency
              </Typography>
              <Typography variant="h6">
                {drawdownAnalysis.drawdownFrequency.toFixed(1)} per year
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Recovery Factor
              </Typography>
              <Typography variant="h6">
                {drawdownAnalysis.recoveryFactor.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Pain Index
              </Typography>
              <Typography variant="h6">
                {formatPercent(drawdownAnalysis.painIndex)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Ulcer Index
              </Typography>
              <Typography variant="h6">
                {formatPercent(drawdownAnalysis.ulcerIndex)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Drawdown Distribution
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Drawdown Range</TableCell>
                  <TableCell align="right">Frequency</TableCell>
                  <TableCell align="right">Avg. Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drawdownAnalysis.drawdownDistribution.map((dist, index) => (
                  <TableRow key={index}>
                    <TableCell>{dist.range}</TableCell>
                    <TableCell align="right">{dist.frequency}</TableCell>
                    <TableCell align="right">{dist.averageDuration.toFixed(1)} days</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Major Drawdown Periods
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="right">Depth</TableCell>
                  <TableCell align="right">Duration</TableCell>
                  <TableCell>Recovery Date</TableCell>
                  <TableCell align="right">Recovery Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drawdownAnalysis.drawdownPeriods
                  .sort((a, b) => b.depth - a.depth)
                  .slice(0, 5)
                  .map((period, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(period.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {period.endDate ? new Date(period.endDate).toLocaleDateString() : 'Ongoing'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatPercent(period.depth)}
                      </TableCell>
                      <TableCell align="right">{period.duration} days</TableCell>
                      <TableCell>
                        {period.recoveryDate ? new Date(period.recoveryDate).toLocaleDateString() : 'Not Recovered'}
                      </TableCell>
                      <TableCell align="right">
                        {period.recoveryDuration ? `${period.recoveryDuration} days` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderVolatilityTab = (volatilityAnalysis: VolatilityAnalysis) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <VolatilityChart data={volatilityAnalysis.rollingVolatility} />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Volatility Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Annualized Volatility
              </Typography>
              <Typography variant="h6">
                {formatPercent(volatilityAnalysis.annualizedVolatility)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Comparison to Benchmark
              </Typography>
              <Typography variant="body1">
                {volatilityAnalysis.impliedVsRealized.comparisonToBenchmark}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Volatility Trend
              </Typography>
              <Typography variant="body1">
                {volatilityAnalysis.volatilityTrend}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                GARCH Model Parameters
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Alpha
              </Typography>
              <Typography variant="body1">
                {volatilityAnalysis.garch.alpha.toFixed(3)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Beta
              </Typography>
              <Typography variant="body1">
                {volatilityAnalysis.garch.beta.toFixed(3)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Persistence
              </Typography>
              <Typography variant="body1">
                {volatilityAnalysis.garch.persistence.toFixed(3)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Half-Life
              </Typography>
              <Typography variant="body1">
                {volatilityAnalysis.garch.halfLife.toFixed(1)} days
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Forecasted Volatility
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatPercent(volatilityAnalysis.garch.forecastedVolatility)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Volatility Regimes
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Volatility Level</TableCell>
                  <TableCell align="right">Avg. Volatility</TableCell>
                  <TableCell align="right">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {volatilityAnalysis.volatilityRegimes.map((regime, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(regime.startDate).toLocaleDateString()} - {new Date(regime.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={regime.volatilityLevel.toUpperCase()} 
                        size="small"
                        sx={{ 
                          bgcolor: 
                            regime.volatilityLevel === 'low' ? 'success.main' :
                            regime.volatilityLevel === 'medium' ? 'warning.main' :
                            'error.main',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(regime.averageVolatility)}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      color: regime.performance >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}>
                      {formatPercent(regime.performance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Volatility Distribution
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Volatility Range</TableCell>
                      <TableCell align="right">Frequency</TableCell>
                      <TableCell align="right">% of Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {volatilityAnalysis.volatilityDistribution.map((dist, index) => {
                      const totalFrequency = volatilityAnalysis.volatilityDistribution.reduce(
                        (sum, d) => sum + d.frequency, 0
                      );
                      const percentage = dist.frequency / totalFrequency;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{dist.range}</TableCell>
                          <TableCell align="right">{dist.frequency}</TableCell>
                          <TableCell align="right">{formatPercent(percentage)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Implied vs. Realized Volatility
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Average Implied Volatility
                  </Typography>
                  <Typography variant="body1">
                    {formatPercent(volatilityAnalysis.impliedVsRealized.averageImplied)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Average Realized Volatility
                  </Typography>
                  <Typography variant="body1">
                    {formatPercent(volatilityAnalysis.impliedVsRealized.averageRealized)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Correlation
                  </Typography>
                  <Typography variant="body1">
                    {volatilityAnalysis.impliedVsRealized.correlation.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Volatility Risk Premium
                  </Typography>
                  <Typography variant="body1">
                    {formatPercent(volatilityAnalysis.impliedVsRealized.volatilityRiskPremium)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTailRiskTab = (tailRiskAnalysis: TailRiskAnalysis) => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Value at Risk (VaR) Analysis
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                VaR (95%)
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(tailRiskAnalysis.valueAtRisk.var95)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                There is a 5% chance of losing more than this amount in a single day.
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                VaR (99%)
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(tailRiskAnalysis.valueAtRisk.var99)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                There is a 1% chance of losing more than this amount in a single day.
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Conditional VaR (95%)
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(tailRiskAnalysis.valueAtRisk.cvar95)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Expected loss when losses exceed the 95% VaR.
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Conditional VaR (99%)
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(tailRiskAnalysis.valueAtRisk.cvar99)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Expected loss when losses exceed the 99% VaR.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Modified VaR (adjusts for skewness and kurtosis)
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPercent(tailRiskAnalysis.valueAtRisk.modifiedVar)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Return Distribution Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Skewness
              </Typography>
              <Typography variant="body1">
                {tailRiskAnalysis.skewness.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {tailRiskAnalysis.skewness < -0.5 ? 'Negative skew: More extreme negative returns than positive.' :
                 tailRiskAnalysis.skewness > 0.5 ? 'Positive skew: More extreme positive returns than negative.' :
                 'Near-symmetric return distribution.'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Kurtosis
              </Typography>
              <Typography variant="body1">
                {tailRiskAnalysis.kurtosis.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {tailRiskAnalysis.kurtosis > 3 ? 'Fat tails: More extreme events than normal distribution.' :
                 tailRiskAnalysis.kurtosis < 3 ? 'Thin tails: Fewer extreme events than normal distribution.' :
                 'Similar to normal distribution.'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Tail Ratio
              </Typography>
              <Typography variant="body1">
                {tailRiskAnalysis.tailRatio.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ratio of right tail to left tail. Higher is better.
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Jarque-Bera Test
              </Typography>
              <Typography variant="body1">
                {tailRiskAnalysis.jarqueBera.isNormal ? 'Normal' : 'Non-normal'} (p-value: {tailRiskAnalysis.jarqueBera.pValue.toFixed(4)})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tests if returns follow a normal distribution.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Extreme Events
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">Z-Score</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tailRiskAnalysis.extremeEvents.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: event.return >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}>
                      {formatPercent(event.return)}
                    </TableCell>
                    <TableCell align="right">
                      {event.zscore.toFixed(2)}
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Market Capture Analysis
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Upside Capture
              </Typography>
              <Typography variant="body1">
                {formatPercent(tailRiskAnalysis.upCapture)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                How much the strategy captures of benchmark's positive returns.
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Downside Capture
              </Typography>
              <Typography variant="body1">
                {formatPercent(tailRiskAnalysis.downCapture)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                How much the strategy captures of benchmark's negative returns.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Capture Ratio
              </Typography>
              <Typography variant="body1">
                {(Math.abs(tailRiskAnalysis.upCapture / tailRiskAnalysis.downCapture)).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ratio of upside to downside capture. Higher is better.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Worst Drawdowns
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Depth</TableCell>
                  <TableCell align="right">Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tailRiskAnalysis.worstDrawdowns.map((drawdown, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(drawdown.startDate).toLocaleDateString()} - {new Date(drawdown.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      {formatPercent(drawdown.depth)}
                    </TableCell>
                    <TableCell align="right">
                      {drawdown.duration} days
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderStressTestTab = (stressTestResults: StressTestResult[]) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <StressTestChart data={stressTestResults} />
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Stress Test Results
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Scenario</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Strategy Return</TableCell>
                  <TableCell align="right">Benchmark Return</TableCell>
                  <TableCell align="right">Relative Performance</TableCell>
                  <TableCell align="right">Max Drawdown</TableCell>
                  <TableCell align="right">Recovery Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stressTestResults.map((test, index) => {
                  const relativePerformance = test.strategyReturn - test.benchmarkReturn;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Tooltip title={test.scenarioDescription}>
                          <Box display="flex" alignItems="center">
                            {test.scenarioName}
                            <IconButton size="small">
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {test.scenarioPeriod ? 
                          `${new Date(test.scenarioPeriod.startDate).toLocaleDateString()} - ${new Date(test.scenarioPeriod.endDate).toLocaleDateString()}` : 
                          'N/A'}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: test.strategyReturn >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}>
                        {formatPercent(test.strategyReturn)}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: test.benchmarkReturn >= 0 ? 'success.main' : 'error.main'
                      }}>
                        {formatPercent(test.benchmarkReturn)}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: relativePerformance >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}>
                        {relativePerformance >= 0 ? '+' : ''}{formatPercent(relativePerformance)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatPercent(test.maxDrawdown)}
                      </TableCell>
                      <TableCell align="right">
                        {test.recoveryTime ? `${test.recoveryTime} days` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Alert severity="info">
          <AlertTitle>Stress Test Interpretation</AlertTitle>
          <Typography variant="body2">
            Stress tests simulate how the strategy would perform during historical market crises. 
            A robust strategy should either outperform the benchmark during these periods or demonstrate 
            acceptable drawdowns with reasonable recovery times.
          </Typography>
        </Alert>
      </Grid>
      
      {stressTestResults.map((test, index) => (
        test.dailyPerformance && (
          <Grid item xs={12} md={6} key={index}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {test.scenarioName} - Detailed Performance
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {test.scenarioDescription}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Strategy Return
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: test.strategyReturn >= 0 ? 'success.main' : 'error.main'
                  }}>
                    {formatPercent(test.strategyReturn)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Benchmark Return
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: test.benchmarkReturn >= 0 ? 'success.main' : 'error.main'
                  }}>
                    {formatPercent(test.benchmarkReturn)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Maximum Drawdown
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatPercent(test.maxDrawdown)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Volatility
                  </Typography>
                  <Typography variant="h6">
                    {formatPercent(test.volatility)}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Chart would go here in a real implementation */}
              <Box sx={{ height: 200, bgcolor: 'grey.100', mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Performance Chart (Mock)
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )
      ))}
    </Grid>
  );

  const renderCorrelationTab = (correlationAnalysis: CorrelationAnalysis) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <CorrelationHeatmap data={correlationAnalysis.correlationMatrix} />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Benchmark Correlation
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Overall Correlation
              </Typography>
              <Typography variant="h6">
                {correlationAnalysis.benchmarkCorrelation.toFixed(2)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Rating 
                  value={Math.abs(correlationAnalysis.benchmarkCorrelation) * 5} 
                  precision={0.5} 
                  readOnly 
                />
                <Typography variant="body2" color="text.secondary">
                  {Math.abs(correlationAnalysis.benchmarkCorrelation) > 0.8 ? 'Very Strong' :
                   Math.abs(correlationAnalysis.benchmarkCorrelation) > 0.6 ? 'Strong' :
                   Math.abs(correlationAnalysis.benchmarkCorrelation) > 0.4 ? 'Moderate' :
                   Math.abs(correlationAnalysis.benchmarkCorrelation) > 0.2 ? 'Weak' :
                   'Very Weak'} {correlationAnalysis.benchmarkCorrelation >= 0 ? 'Positive' : 'Negative'} Correlation
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Beta Analysis
              </Typography>
            </Grid>
            
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Full Period Beta
              </Typography>
              <Typography variant="body1">
                {correlationAnalysis.betaAnalysis.fullPeriodBeta.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Up Market Beta
              </Typography>
              <Typography variant="body1">
                {correlationAnalysis.betaAnalysis.upMarketBeta.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Down Market Beta
              </Typography>
              <Typography variant="body1">
                {correlationAnalysis.betaAnalysis.downMarketBeta.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Market Regime Correlations
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Market Regime</TableCell>
                  <TableCell align="right">Correlation</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {correlationAnalysis.marketRegimeCorrelations.map((regime, index) => (
                  <TableRow key={index}>
                    <TableCell>{regime.regime}</TableCell>
                    <TableCell align="right">
                      {regime.correlation.toFixed(2)}
                    </TableCell>
                    <TableCell>{regime.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Asset Class Correlations
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Asset Class</TableCell>
                  <TableCell align="right">Correlation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(correlationAnalysis.assetClassCorrelations).map(([assetClass, correlation], index) => (
                  <TableRow key={index}>
                    <TableCell>{assetClass.replace('_', ' ')}</TableCell>
                    <TableCell align="right">
                      {correlation.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Factor Correlations
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Factor</TableCell>
                  <TableCell align="right">Correlation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(correlationAnalysis.factorCorrelations).map(([factor, correlation], index) => (
                  <TableRow key={index}>
                    <TableCell>{factor.replace('_', ' ')}</TableCell>
                    <TableCell align="right">
                      {correlation.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderRiskAttributionTab = (riskAttribution: RiskAttribution, riskDecomposition: RiskDecomposition) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <RiskDecompositionChart data={riskDecomposition} />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Factor Risk Contribution
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Factor</TableCell>
                  <TableCell align="right">Contribution</TableCell>
                  <TableCell align="right">t-Statistic</TableCell>
                  <TableCell align="right">p-Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskAttribution.factorContribution.map((factor, index) => (
                  <TableRow key={index}>
                    <TableCell>{factor.factor}</TableCell>
                    <TableCell align="right">
                      {formatPercent(factor.contribution)}
                    </TableCell>
                    <TableCell align="right">
                      {factor.tStatistic.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {factor.pValue.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Sector Contribution
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sector</TableCell>
                  <TableCell align="right">Allocation</TableCell>
                  <TableCell align="right">Risk Contribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskAttribution.sectorContribution.map((sector, index) => (
                  <TableRow key={index}>
                    <TableCell>{sector.sector}</TableCell>
                    <TableCell align="right">
                      {formatPercent(sector.allocation)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(sector.contribution)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Risk Decomposition
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Systematic vs. Specific Risk
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Systematic Risk
                  </Typography>
                  <Typography variant="body1">
                    {formatPercent(riskAttribution.riskDecomposition.systematic)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Specific Risk
                  </Typography>
                  <Typography variant="body1">
                    {formatPercent(riskAttribution.riskDecomposition.specific)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Risk by Category
              </Typography>
            </Grid>
            
            {Object.entries(riskDecomposition).map(([category, values], index) => (
              <Grid item xs={12} key={index}>
                <Typography variant="body2" color="text.secondary">
                  {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('By ', '')}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(values).map(([subCategory, value], subIndex) => (
                        <TableRow key={subIndex}>
                          <TableCell>{subCategory.replace('_', ' ')}</TableCell>
                          <TableCell align="right">
                            {formatPercent(value as number)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Top Asset Contributions
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell align="right">Allocation</TableCell>
                  <TableCell align="right">Risk Contribution</TableCell>
                  <TableCell align="right">Marginal Contribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskAttribution.assetContribution.map((asset, index) => (
                  <TableRow key={index}>
                    <TableCell>{asset.asset}</TableCell>
                    <TableCell align="right">
                      {formatPercent(asset.allocation)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(asset.contribution)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(asset.marginalContribution)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      {riskAnalysisResult?.liquidityAnalysis && (
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Liquidity Analysis
              </Typography>
              <Chip 
                label={`Liquidity Risk: ${riskAnalysisResult.liquidityAnalysis.liquidityRisk.toUpperCase()}`}
                sx={{ 
                  bgcolor: getRiskLevelColor(riskAnalysisResult.liquidityAnalysis.liquidityRisk),
                  color: 'white'
                }}
              />
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Liquidity Score
                </Typography>
                <Typography variant="h6">
                  {riskAnalysisResult.liquidityAnalysis.liquidityScore.toFixed(1)}/100
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Higher scores indicate better liquidity.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Concentration Risk
                </Typography>
                <Typography variant="h6">
                  {formatPercent(riskAnalysisResult.liquidityAnalysis.concentrationRisk)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Measures position concentration. Lower is better.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Average Days to Liquidate
                </Typography>
                <Typography variant="h6">
                  {Object.values(riskAnalysisResult.liquidityAnalysis.daysToLiquidate).reduce((sum, val) => sum + val, 0) / 
                   Object.values(riskAnalysisResult.liquidityAnalysis.daysToLiquidate).length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Average time to exit positions without market impact.
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell align="right">Position</TableCell>
                        <TableCell align="right">ADV</TableCell>
                        <TableCell align="right">Days to Liquidate</TableCell>
                        <TableCell align="right">Market Impact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riskAnalysisResult.liquidityAnalysis.liquidityByPosition.map((position, index) => (
                        <TableRow key={index}>
                          <TableCell>{position.asset}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(position.position)}
                          </TableCell>
                          <TableCell align="right">
                            {position.adv.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{
                            color: position.daysToLiquidate > 5 ? 'error.main' :
                                  position.daysToLiquidate > 2 ? 'warning.main' :
                                  'success.main'
                          }}>
                            {position.daysToLiquidate.toFixed(1)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent(position.marketImpact)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}
    </Grid>
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
    </Box>
  );
};

export default StrategyRiskAnalysisPanel;