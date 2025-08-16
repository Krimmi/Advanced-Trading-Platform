import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Label,
  ReferenceLine,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { backtestingService } from '../../services/backtesting';

interface WalkForwardAnalysisPanelProps {
  strategy?: any;
  symbol?: string;
  onAnalysisComplete?: (results: any) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wfa-tabpanel-${index}`}
      aria-labelledby={`wfa-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface WalkForwardResult {
  summary: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    robustness: number;
    consistency: number;
    adaptability: number;
    parameterSensitivity: number;
  };
  windows: Array<{
    id: number;
    inSampleStart: string;
    inSampleEnd: string;
    outOfSampleStart: string;
    outOfSampleEnd: string;
    inSampleReturn: number;
    outOfSampleReturn: number;
    inSampleSharpe: number;
    outOfSampleSharpe: number;
    optimalParameters: Record<string, any>;
    trades: number;
  }>;
  equity: Array<{
    date: string;
    equity: number;
    benchmark: number;
    window: number;
  }>;
  parameterStability: Array<{
    parameter: string;
    values: number[];
    mean: number;
    stdDev: number;
    coefficientOfVariation: number;
  }>;
  robustnessHeatmap: Array<{
    param1Value: number;
    param2Value: number;
    sharpeRatio: number;
    returnValue: number;
    maxDrawdown: number;
    winRate: number;
  }>;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const WalkForwardAnalysisPanel: React.FC<WalkForwardAnalysisPanelProps> = ({ 
  strategy,
  symbol,
  onAnalysisComplete
}) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [wfaResult, setWfaResult] = useState<WalkForwardResult | null>(null);
  
  // WFA Configuration
  const [windowSize, setWindowSize] = useState<number>(126); // ~6 months of trading days
  const [testSize, setTestSize] = useState<number>(42); // ~2 months of trading days
  const [stepSize, setStepSize] = useState<number>(21); // ~1 month of trading days
  const [startDate, setStartDate] = useState<string>('2018-01-01');
  const [endDate, setEndDate] = useState<string>('2023-12-31');
  const [anchorDate, setAnchorDate] = useState<boolean>(false);
  const [robustnessTests, setRobustnessTests] = useState<boolean>(true);
  const [parameterRanges, setParameterRanges] = useState<Record<string, [number, number, number]>>({
    entryThreshold: [0.5, 3.0, 0.5],
    exitThreshold: [0.5, 3.0, 0.5],
    stopLoss: [1.0, 10.0, 1.0],
    holdingPeriod: [1, 20, 1]
  });
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Run walk-forward analysis
  const runWalkForwardAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would call the backtesting service
      // For now, we'll simulate the analysis with a timeout
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate simulated WFA results
      const simulatedResult = generateSimulatedWfaResults();
      setWfaResult(simulatedResult);
      
      // Notify parent component if callback is provided
      if (onAnalysisComplete) {
        onAnalysisComplete(simulatedResult);
      }
    } catch (err) {
      console.error('Error running walk-forward analysis:', err);
      setError('Failed to run walk-forward analysis. Please try again later.');
      setWfaResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate simulated WFA results for demonstration
  const generateSimulatedWfaResults = (): WalkForwardResult => {
    // Calculate number of windows based on date range and step size
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const totalDays = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const numWindows = Math.floor((totalDays - windowSize) / stepSize) + 1;
    
    // Generate windows
    const windows = [];
    for (let i = 0; i < numWindows; i++) {
      const inSampleStart = new Date(startDateObj.getTime() + i * stepSize * 24 * 60 * 60 * 1000);
      const inSampleEnd = new Date(inSampleStart.getTime() + windowSize * 24 * 60 * 60 * 1000);
      const outOfSampleStart = new Date(inSampleEnd.getTime() + 24 * 60 * 60 * 1000);
      const outOfSampleEnd = new Date(outOfSampleStart.getTime() + testSize * 24 * 60 * 60 * 1000);
      
      // Generate random performance metrics
      const inSampleReturn = Math.random() * 20 - 5; // -5% to 15%
      const outOfSampleReturn = inSampleReturn * (0.7 + Math.random() * 0.6); // Some correlation with in-sample
      const inSampleSharpe = (inSampleReturn + 5) / 10 + Math.random(); // Roughly correlated with return
      const outOfSampleSharpe = (outOfSampleReturn + 5) / 10 + Math.random() * 0.8; // Roughly correlated with return
      
      // Generate random optimal parameters
      const optimalParameters = {
        entryThreshold: 1.0 + Math.random() * 1.5,
        exitThreshold: 0.8 + Math.random() * 1.2,
        stopLoss: 3.0 + Math.random() * 5.0,
        holdingPeriod: 3 + Math.floor(Math.random() * 10)
      };
      
      windows.push({
        id: i + 1,
        inSampleStart: inSampleStart.toISOString().split('T')[0],
        inSampleEnd: inSampleEnd.toISOString().split('T')[0],
        outOfSampleStart: outOfSampleStart.toISOString().split('T')[0],
        outOfSampleEnd: outOfSampleEnd.toISOString().split('T')[0],
        inSampleReturn,
        outOfSampleReturn,
        inSampleSharpe,
        outOfSampleSharpe,
        optimalParameters,
        trades: 10 + Math.floor(Math.random() * 40)
      });
    }
    
    // Generate equity curve
    const equity = [];
    let currentDate = new Date(startDate);
    let currentEquity = 100;
    let currentBenchmark = 100;
    let currentWindow = 1;
    
    while (currentDate <= endDateObj) {
      // Find which window this date belongs to
      const windowIndex = windows.findIndex(w => 
        currentDate >= new Date(w.outOfSampleStart) && 
        currentDate <= new Date(w.outOfSampleEnd)
      );
      
      if (windowIndex !== -1) {
        currentWindow = windowIndex + 1;
        
        // Add some random daily return
        const dailyReturn = (windows[windowIndex].outOfSampleReturn / testSize) + (Math.random() * 1 - 0.5);
        currentEquity *= (1 + dailyReturn / 100);
        
        // Add some random benchmark return (slightly correlated with strategy)
        const benchmarkReturn = (dailyReturn * 0.3) + (Math.random() * 0.8 - 0.4);
        currentBenchmark *= (1 + benchmarkReturn / 100);
        
        equity.push({
          date: currentDate.toISOString().split('T')[0],
          equity: currentEquity,
          benchmark: currentBenchmark,
          window: currentWindow
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate parameter stability data
    const parameterStability = Object.keys(parameterRanges).map(param => {
      const values = windows.map(w => w.optimalParameters[param]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;
      
      return {
        parameter: param,
        values,
        mean,
        stdDev,
        coefficientOfVariation
      };
    });
    
    // Generate robustness heatmap data
    const robustnessHeatmap = [];
    const param1Range = parameterRanges.entryThreshold;
    const param2Range = parameterRanges.exitThreshold;
    
    for (let p1 = param1Range[0]; p1 <= param1Range[1]; p1 += param1Range[2]) {
      for (let p2 = param2Range[0]; p2 <= param2Range[1]; p2 += param2Range[2]) {
        // Generate performance metrics based on parameter values
        const baseReturn = 5 + (p1 - param1Range[0]) * 2 - (p2 - param2Range[0]) * 1;
        const randomFactor = Math.random() * 10 - 5;
        const returnValue = baseReturn + randomFactor;
        const sharpeRatio = (returnValue / 10) + Math.random() * 0.5;
        const maxDrawdown = 5 + Math.random() * 10;
        const winRate = 45 + Math.random() * 15;
        
        robustnessHeatmap.push({
          param1Value: p1,
          param2Value: p2,
          sharpeRatio,
          returnValue,
          maxDrawdown,
          winRate
        });
      }
    }
    
    // Calculate overall summary metrics
    const totalReturn = equity.length > 0 ? (equity[equity.length - 1].equity / equity[0].equity - 1) * 100 : 0;
    const years = totalDays / 365;
    const annualizedReturn = ((1 + totalReturn / 100) ** (1 / years) - 1) * 100;
    const sharpeRatio = annualizedReturn / 15; // Assuming 15% volatility
    const maxDrawdown = 10 + Math.random() * 15;
    const winRate = 50 + Math.random() * 10;
    const profitFactor = 1.2 + Math.random() * 0.8;
    const totalTrades = windows.reduce((sum, w) => sum + w.trades, 0);
    
    // Calculate robustness metrics
    const isRatio = windows.map(w => w.outOfSampleReturn / w.inSampleReturn);
    const robustness = isRatio.filter(r => r > 0).length / isRatio.length;
    const consistency = windows.filter(w => w.outOfSampleReturn > 0).length / windows.length;
    const adaptability = parameterStability.reduce((sum, p) => sum + (1 - p.coefficientOfVariation), 0) / parameterStability.length;
    const parameterSensitivity = robustnessHeatmap.reduce((sum, point) => sum + point.sharpeRatio, 0) / robustnessHeatmap.length;
    
    return {
      summary: {
        totalReturn,
        annualizedReturn,
        sharpeRatio,
        maxDrawdown,
        winRate,
        profitFactor,
        totalTrades,
        robustness,
        consistency,
        adaptability,
        parameterSensitivity
      },
      windows,
      equity,
      parameterStability,
      robustnessHeatmap
    };
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format percent
  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Render configuration panel
  const renderConfigPanel = () => {
    return (
      <Card variant="outlined">
        <CardHeader title="Walk-Forward Analysis Configuration" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="In-Sample Window Size (Days)"
                type="number"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 21 } }}
                helperText="Training period length (e.g., 126 days ≈ 6 months)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Out-of-Sample Test Size (Days)"
                type="number"
                value={testSize}
                onChange={(e) => setTestSize(Number(e.target.value))}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 5 } }}
                helperText="Testing period length (e.g., 42 days ≈ 2 months)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Step Size (Days)"
                type="number"
                value={stepSize}
                onChange={(e) => setStepSize(Number(e.target.value))}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
                helperText="Days to advance window (e.g., 21 days ≈ 1 month)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={anchorDate}
                    onChange={(e) => setAnchorDate(e.target.checked)}
                  />
                }
                label="Anchor Start Date"
                sx={{ mt: 2 }}
              />
              <Tooltip title="When enabled, all windows will start from the same date but have increasing in-sample periods">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={robustnessTests}
                    onChange={(e) => setRobustnessTests(e.target.checked)}
                  />
                }
                label="Include Robustness Tests"
              />
              <Tooltip title="Performs additional tests to evaluate strategy robustness across parameter variations">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Parameter Ranges for Optimization
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Parameter Optimization Ranges</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {Object.entries(parameterRanges).map(([param, [min, max, step]]) => (
                      <Grid item xs={12} key={param}>
                        <Typography variant="body2" gutterBottom>
                          {param.charAt(0).toUpperCase() + param.slice(1)}: {min} to {max} (step: {step})
                        </Typography>
                        <Slider
                          value={[min, max]}
                          min={0}
                          max={param.includes('Period') ? 30 : 20}
                          step={step}
                          marks
                          valueLabelDisplay="auto"
                          onChange={(_, value) => {
                            const [newMin, newMax] = value as number[];
                            setParameterRanges({
                              ...parameterRanges,
                              [param]: [newMin, newMax, step]
                            });
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={runWalkForwardAnalysis}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                sx={{ mt: 2 }}
              >
                {loading ? 'Running Analysis...' : 'Run Walk-Forward Analysis'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render summary panel
  const renderSummaryPanel = () => {
    if (!wfaResult) return null;
    
    const { summary } = wfaResult;
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Walk-Forward Analysis Summary" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Total Return</Typography>
              <Typography 
                variant="h6" 
                color={summary.totalReturn >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercent(summary.totalReturn)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Annualized Return</Typography>
              <Typography 
                variant="h6" 
                color={summary.annualizedReturn >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercent(summary.annualizedReturn)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
              <Typography variant="h6">{summary.sharpeRatio.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
              <Typography variant="h6" color="error.main">{formatPercent(summary.maxDrawdown)}</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Win Rate</Typography>
              <Typography variant="h6">{formatPercent(summary.winRate)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Profit Factor</Typography>
              <Typography variant="h6">{summary.profitFactor.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Total Trades</Typography>
              <Typography variant="h6">{summary.totalTrades}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Windows</Typography>
              <Typography variant="h6">{wfaResult.windows.length}</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Robustness Metrics
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Tooltip title="Ratio of windows with positive out-of-sample returns to total windows">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Consistency <InfoIcon fontSize="inherit" />
                  </Typography>
                  <Typography variant="h6">{(summary.consistency * 100).toFixed(0)}%</Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid item xs={6} md={3}>
              <Tooltip title="Ratio of out-of-sample to in-sample performance">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Robustness <InfoIcon fontSize="inherit" />
                  </Typography>
                  <Typography variant="h6">{(summary.robustness * 100).toFixed(0)}%</Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid item xs={6} md={3}>
              <Tooltip title="Stability of optimal parameters across windows">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Adaptability <InfoIcon fontSize="inherit" />
                  </Typography>
                  <Typography variant="h6">{(summary.adaptability * 100).toFixed(0)}%</Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid item xs={6} md={3}>
              <Tooltip title="Average performance across parameter space">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Parameter Sensitivity <InfoIcon fontSize="inherit" />
                  </Typography>
                  <Typography variant="h6">{summary.parameterSensitivity.toFixed(2)}</Typography>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render equity curve chart
  const renderEquityCurveChart = () => {
    if (!wfaResult || !wfaResult.equity || wfaResult.equity.length === 0) return null;
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Walk-Forward Equity Curve
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={wfaResult.equity}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getFullYear()}-${date.getMonth() + 1}`;
              }}
            />
            <YAxis />
            <RechartsTooltip 
              formatter={(value: any, name: string) => {
                return [value.toFixed(2), name === 'equity' ? 'Strategy' : 'Benchmark'];
              }}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="equity"
              name="Strategy"
              stroke={COLORS[0]}
              dot={false}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="Benchmark"
              stroke={COLORS[1]}
              dot={false}
              activeDot={{ r: 8 }}
            />
            
            {/* Add vertical lines for window boundaries */}
            {wfaResult.windows.map((window, index) => (
              <ReferenceLine
                key={`window-${index}`}
                x={window.outOfSampleStart}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: `W${window.id}`, position: 'top', fill: '#666' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render windows performance chart
  const renderWindowsPerformanceChart = () => {
    if (!wfaResult || !wfaResult.windows || wfaResult.windows.length === 0) return null;
    
    // Transform data for chart
    const windowData = wfaResult.windows.map(window => ({
      id: window.id,
      inSampleReturn: window.inSampleReturn,
      outOfSampleReturn: window.outOfSampleReturn,
      inSampleSharpe: window.inSampleSharpe,
      outOfSampleSharpe: window.outOfSampleSharpe
    }));
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          In-Sample vs Out-of-Sample Performance
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={windowData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="id" label={{ value: 'Window', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip 
              formatter={(value: any, name: string) => {
                if (name.includes('Return')) {
                  return [formatPercent(value), name.includes('inSample') ? 'In-Sample Return' : 'Out-of-Sample Return'];
                }
                return [value.toFixed(2), name.includes('inSample') ? 'In-Sample Sharpe' : 'Out-of-Sample Sharpe'];
              }}
            />
            <Legend />
            <Bar dataKey="inSampleReturn" name="In-Sample Return" fill={COLORS[0]} />
            <Bar dataKey="outOfSampleReturn" name="Out-of-Sample Return" fill={COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render parameter stability chart
  const renderParameterStabilityChart = () => {
    if (!wfaResult || !wfaResult.parameterStability || wfaResult.parameterStability.length === 0) return null;
    
    // Transform data for chart
    const paramData = [];
    wfaResult.windows.forEach(window => {
      Object.entries(window.optimalParameters).forEach(([param, value]) => {
        paramData.push({
          window: window.id,
          parameter: param,
          value: value
        });
      });
    });
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Parameter Stability Across Windows
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={paramData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="window" label={{ value: 'Window', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <RechartsTooltip 
              formatter={(value: any, name: string) => {
                return [value.toFixed(2), name];
              }}
            />
            <Legend />
            {wfaResult.parameterStability.map((param, index) => (
              <Line
                key={param.parameter}
                type="monotone"
                dataKey="value"
                data={paramData.filter(d => d.parameter === param.parameter)}
                name={param.parameter}
                stroke={COLORS[index % COLORS.length]}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render robustness heatmap
  const renderRobustnessHeatmap = () => {
    if (!wfaResult || !wfaResult.robustnessHeatmap || wfaResult.robustnessHeatmap.length === 0) return null;
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Parameter Robustness Heatmap
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <ScatterChart
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="param1Value" 
              name="Entry Threshold" 
              label={{ value: 'Entry Threshold', position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              type="number" 
              dataKey="param2Value" 
              name="Exit Threshold" 
              label={{ value: 'Exit Threshold', angle: -90, position: 'insideLeft' }} 
            />
            <ZAxis 
              type="number" 
              dataKey="sharpeRatio" 
              range={[50, 400]} 
              name="Sharpe Ratio" 
            />
            <RechartsTooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: any, name: string) => {
                if (name === 'Sharpe Ratio') return [value.toFixed(2), name];
                if (name === 'Return') return [formatPercent(value), name];
                if (name === 'Max Drawdown') return [formatPercent(value), name];
                if (name === 'Win Rate') return [formatPercent(value), name];
                return [value, name];
              }}
            />
            <Legend />
            <Scatter 
              name="Parameter Combinations" 
              data={wfaResult.robustnessHeatmap} 
              fill={COLORS[0]}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render windows table
  const renderWindowsTable = () => {
    if (!wfaResult || !wfaResult.windows || wfaResult.windows.length === 0) return null;
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Window</TableCell>
              <TableCell>In-Sample Period</TableCell>
              <TableCell>Out-of-Sample Period</TableCell>
              <TableCell align="right">In-Sample Return</TableCell>
              <TableCell align="right">Out-of-Sample Return</TableCell>
              <TableCell align="right">IS/OS Ratio</TableCell>
              <TableCell align="right">Trades</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wfaResult.windows.map((window) => (
              <TableRow key={window.id}>
                <TableCell>{window.id}</TableCell>
                <TableCell>{formatDate(window.inSampleStart)} to {formatDate(window.inSampleEnd)}</TableCell>
                <TableCell>{formatDate(window.outOfSampleStart)} to {formatDate(window.outOfSampleEnd)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{ color: window.inSampleReturn >= 0 ? 'success.main' : 'error.main' }}
                >
                  {formatPercent(window.inSampleReturn)}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ color: window.outOfSampleReturn >= 0 ? 'success.main' : 'error.main' }}
                >
                  {formatPercent(window.outOfSampleReturn)}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: window.outOfSampleReturn / window.inSampleReturn >= 0.7 ? 
                      'success.main' : 
                      window.outOfSampleReturn / window.inSampleReturn >= 0 ? 
                        'warning.main' : 
                        'error.main' 
                  }}
                >
                  {(window.outOfSampleReturn / window.inSampleReturn).toFixed(2)}
                </TableCell>
                <TableCell align="right">{window.trades}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render parameter stability table
  const renderParameterStabilityTable = () => {
    if (!wfaResult || !wfaResult.parameterStability || wfaResult.parameterStability.length === 0) return null;
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Parameter</TableCell>
              <TableCell align="right">Mean</TableCell>
              <TableCell align="right">Std Dev</TableCell>
              <TableCell align="right">Coeff of Variation</TableCell>
              <TableCell align="right">Stability</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wfaResult.parameterStability.map((param) => (
              <TableRow key={param.parameter}>
                <TableCell>{param.parameter}</TableCell>
                <TableCell align="right">{param.mean.toFixed(2)}</TableCell>
                <TableCell align="right">{param.stdDev.toFixed(2)}</TableCell>
                <TableCell align="right">{param.coefficientOfVariation.toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: param.coefficientOfVariation < 0.3 ? 
                      'success.main' : 
                      param.coefficientOfVariation < 0.7 ? 
                        'warning.main' : 
                        'error.main' 
                  }}
                >
                  {param.coefficientOfVariation < 0.3 ? 'High' : param.coefficientOfVariation < 0.7 ? 'Medium' : 'Low'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Walk-Forward Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderConfigPanel()}
        </Grid>
        
        <Grid item xs={12} md={8}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : wfaResult ? (
            <>
              {renderSummaryPanel()}
              
              <Box sx={{ mt: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="walk-forward analysis tabs">
                  <Tab label="Performance" icon={<TimelineIcon />} iconPosition="start" />
                  <Tab label="Windows" icon={<AssessmentIcon />} iconPosition="start" />
                  <Tab label="Parameter Stability" icon={<TuneIcon />} iconPosition="start" />
                </Tabs>
                
                <TabPanel value={tabValue} index={0}>
                  {renderEquityCurveChart()}
                  {renderWindowsPerformanceChart()}
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  {renderWindowsTable()}
                </TabPanel>
                
                <TabPanel value={tabValue} index={2}>
                  {renderParameterStabilityChart()}
                  {renderParameterStabilityTable()}
                  {robustnessTests && renderRobustnessHeatmap()}
                </TabPanel>
              </Box>
            </>
          ) : (
            <Paper sx={{ p: 3, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Configure Walk-Forward Analysis
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Walk-forward analysis helps validate strategy robustness by testing on out-of-sample data.
                  Configure the parameters and run the analysis to see results.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default WalkForwardAnalysisPanel;