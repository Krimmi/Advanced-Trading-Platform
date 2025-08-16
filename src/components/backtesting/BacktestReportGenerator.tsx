import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress, 
  Divider,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
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
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';
import { backtestingService } from '../../services/backtesting';

interface BacktestReportGeneratorProps {
  backtestId?: string;
  backtestResult?: any;
  strategy?: any;
  onReportGenerated?: (reportUrl: string) => void;
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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const BacktestReportGenerator: React.FC<BacktestReportGeneratorProps> = ({ 
  backtestId,
  backtestResult: initialBacktestResult,
  strategy,
  onReportGenerated
}) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backtestResult, setBacktestResult] = useState<any>(initialBacktestResult);
  const [reportTitle, setReportTitle] = useState<string>('Backtest Performance Report');
  const [reportDescription, setReportDescription] = useState<string>('Comprehensive analysis of strategy performance');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState<boolean>(true);
  const [includePerformanceMetrics, setIncludePerformanceMetrics] = useState<boolean>(true);
  const [includeTradeAnalysis, setIncludeTradeAnalysis] = useState<boolean>(true);
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState<boolean>(true);
  const [includeBenchmarkComparison, setIncludeBenchmarkComparison] = useState<boolean>(true);
  const [includeMonteCarloSimulation, setIncludeMonteCarloSimulation] = useState<boolean>(true);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Load backtest result if not provided
  useEffect(() => {
    if (!backtestResult && backtestId) {
      loadBacktestResult();
    }
  }, [backtestId]);

  // Load backtest result
  const loadBacktestResult = async () => {
    if (!backtestId) return;
    
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would call the backtesting service
      // For now, we'll simulate loading with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate simulated backtest result
      const result = generateSimulatedBacktestResult();
      setBacktestResult(result);
    } catch (err) {
      console.error('Error loading backtest result:', err);
      setError('Failed to load backtest result. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Generate simulated backtest result for demonstration
  const generateSimulatedBacktestResult = () => {
    // Generate dates for the past 3 years
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 3);
    
    // Generate equity curve
    const equity = [];
    const benchmark = [];
    let currentDate = new Date(startDate);
    let currentEquity = 10000;
    let currentBenchmark = 10000;
    
    while (currentDate <= endDate) {
      // Add some random daily return
      const dailyReturn = (Math.random() * 2 - 0.5) / 100;
      currentEquity *= (1 + dailyReturn);
      
      // Add some random benchmark return (slightly correlated with strategy)
      const benchmarkReturn = (dailyReturn * 0.3) + (Math.random() * 1.2 - 0.6) / 100;
      currentBenchmark *= (1 + benchmarkReturn);
      
      equity.push({
        date: currentDate.toISOString().split('T')[0],
        value: currentEquity
      });
      
      benchmark.push({
        date: currentDate.toISOString().split('T')[0],
        value: currentBenchmark
      });
      
      // Move to next day (skip weekends for simplicity)
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + (currentDate.getDay() === 0 ? 1 : 2));
      }
    }
    
    // Generate trades
    const trades = [];
    const numTrades = 120;
    const winRate = 0.55;
    
    for (let i = 0; i < numTrades; i++) {
      const entryDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      const holdingDays = Math.floor(Math.random() * 14) + 1;
      const exitDate = new Date(entryDate);
      exitDate.setDate(exitDate.getDate() + holdingDays);
      
      const isWin = Math.random() < winRate;
      const returnPct = isWin ? 
        Math.random() * 5 + 0.5 : // 0.5% to 5.5% for wins
        -(Math.random() * 4 + 0.5); // -0.5% to -4.5% for losses
      
      const entryPrice = 100 + Math.random() * 50;
      const exitPrice = entryPrice * (1 + returnPct / 100);
      
      trades.push({
        id: i + 1,
        entryDate: entryDate.toISOString().split('T')[0],
        exitDate: exitDate.toISOString().split('T')[0],
        entryPrice,
        exitPrice,
        quantity: Math.floor(Math.random() * 100) + 10,
        returnPct,
        pnl: (exitPrice - entryPrice) * (Math.floor(Math.random() * 100) + 10),
        holdingPeriod: holdingDays,
        side: Math.random() > 0.3 ? 'long' : 'short',
        symbol: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'][Math.floor(Math.random() * 5)]
      });
    }
    
    // Generate monthly returns
    const monthlyReturns = [];
    const months = 36;
    
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      const strategyReturn = (Math.random() * 8) - 2; // -2% to 6%
      const benchmarkReturn = (strategyReturn * 0.4) + (Math.random() * 6) - 3; // Somewhat correlated
      
      monthlyReturns.push({
        month: date.toISOString().split('T')[0].substring(0, 7),
        strategy: strategyReturn,
        benchmark: benchmarkReturn
      });
    }
    
    // Generate drawdowns
    const drawdowns = [];
    const numDrawdowns = 8;
    
    for (let i = 0; i < numDrawdowns; i++) {
      const startDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      const durationDays = Math.floor(Math.random() * 60) + 5;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      
      const depthPct = -(Math.random() * 15 + 1); // -1% to -16%
      const recoveryDays = Math.floor(Math.random() * 90) + 5;
      
      drawdowns.push({
        id: i + 1,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        durationDays,
        depthPct,
        recoveryDays
      });
    }
    
    // Sort drawdowns by depth
    drawdowns.sort((a, b) => a.depthPct - b.depthPct);
    
    // Calculate performance metrics
    const totalReturn = (equity[equity.length - 1].value / equity[0].value - 1) * 100;
    const benchmarkTotalReturn = (benchmark[benchmark.length - 1].value / benchmark[0].value - 1) * 100;
    const years = 3;
    const annualizedReturn = ((1 + totalReturn / 100) ** (1 / years) - 1) * 100;
    const benchmarkAnnualizedReturn = ((1 + benchmarkTotalReturn / 100) ** (1 / years) - 1) * 100;
    const volatility = 15; // Annualized volatility in percent
    const benchmarkVolatility = 18;
    const sharpeRatio = (annualizedReturn - 1.5) / volatility; // Assuming 1.5% risk-free rate
    const benchmarkSharpeRatio = (benchmarkAnnualizedReturn - 1.5) / benchmarkVolatility;
    const maxDrawdown = drawdowns[0].depthPct;
    const winningTrades = trades.filter(t => t.returnPct > 0).length;
    const winRate = winningTrades / trades.length;
    const averageWin = trades.filter(t => t.returnPct > 0).reduce((sum, t) => sum + t.returnPct, 0) / winningTrades;
    const averageLoss = trades.filter(t => t.returnPct < 0).reduce((sum, t) => sum + t.returnPct, 0) / (trades.length - winningTrades);
    const profitFactor = Math.abs(averageWin * winningTrades / (averageLoss * (trades.length - winningTrades)));
    const averageHoldingPeriod = trades.reduce((sum, t) => sum + t.holdingPeriod, 0) / trades.length;
    
    // Generate Monte Carlo simulation results
    const monteCarloSimulations = [];
    const numSimulations = 100;
    
    for (let i = 0; i < numSimulations; i++) {
      const simulationPoints = [];
      let currentValue = 10000;
      
      for (let j = 0; j <= 252; j++) { // 252 trading days in a year
        simulationPoints.push({
          day: j,
          value: currentValue
        });
        
        // Random daily return based on historical performance
        const dailyReturn = (annualizedReturn / 252 / 100) + (Math.random() * volatility / Math.sqrt(252) / 100) - (volatility / Math.sqrt(252) / 200);
        currentValue *= (1 + dailyReturn);
      }
      
      monteCarloSimulations.push({
        id: i + 1,
        finalValue: simulationPoints[simulationPoints.length - 1].value,
        maxDrawdown: Math.min(...simulationPoints.map((p, idx) => 
          idx > 0 ? (p.value / Math.max(...simulationPoints.slice(0, idx).map(p => p.value)) - 1) * 100 : 0
        )),
        points: simulationPoints
      });
    }
    
    // Sort simulations by final value
    monteCarloSimulations.sort((a, b) => a.finalValue - b.finalValue);
    
    // Calculate VaR and CVaR
    const var95Index = Math.floor(numSimulations * 0.05);
    const var95 = (monteCarloSimulations[var95Index].finalValue / 10000 - 1) * 100;
    const cvar95 = monteCarloSimulations.slice(0, var95Index + 1).reduce((sum, sim) => sum + (sim.finalValue / 10000 - 1) * 100, 0) / (var95Index + 1);
    
    return {
      strategy: {
        name: 'Momentum Strategy',
        description: 'A trend-following strategy that buys assets showing upward momentum and sells those showing downward momentum.',
        parameters: {
          lookbackPeriod: 20,
          entryThreshold: 1.5,
          exitThreshold: 0.8,
          stopLoss: 5,
          trailingStop: true
        }
      },
      summary: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        initialCapital: 10000,
        finalCapital: equity[equity.length - 1].value,
        totalReturn,
        annualizedReturn,
        volatility,
        sharpeRatio,
        sortino: sharpeRatio * 1.2, // Typically higher than Sharpe
        maxDrawdown,
        calmar: annualizedReturn / Math.abs(maxDrawdown),
        winRate,
        profitFactor,
        averageWin,
        averageLoss,
        expectancy: winRate * averageWin + (1 - winRate) * averageLoss,
        averageHoldingPeriod,
        totalTrades: trades.length,
        benchmarkReturn: benchmarkTotalReturn,
        benchmarkAnnualizedReturn,
        alpha: annualizedReturn - (benchmarkAnnualizedReturn + (sharpeRatio - benchmarkSharpeRatio) * volatility),
        beta: 0.85, // Correlation with market * (strategy volatility / market volatility)
        var95,
        cvar95
      },
      equity,
      benchmark,
      trades,
      monthlyReturns,
      drawdowns,
      monteCarloSimulations
    };
  };

  // Generate report
  const generateReport = async () => {
    if (!backtestResult) {
      setError('No backtest result available. Please run a backtest first.');
      return;
    }
    
    setGeneratingReport(true);
    try {
      // In a real implementation, this would call a service to generate the report
      // For now, we'll simulate report generation with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a report URL
      const reportUrl = `https://example.com/reports/backtest-report-${Date.now()}.pdf`;
      setReportUrl(reportUrl);
      
      // Notify parent component if callback is provided
      if (onReportGenerated) {
        onReportGenerated(reportUrl);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again later.');
    } finally {
      setGeneratingReport(false);
    }
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

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Render report configuration panel
  const renderReportConfigPanel = () => {
    return (
      <Card variant="outlined">
        <CardHeader title="Report Configuration" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Report Title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="report-format-label">Report Format</InputLabel>
                <Select
                  labelId="report-format-label"
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  label="Report Format"
                >
                  <MenuItem value="pdf">PDF Document</MenuItem>
                  <MenuItem value="html">HTML Report</MenuItem>
                  <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                  <MenuItem value="json">JSON Data</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Report Sections
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      label={includeExecutiveSummary ? "Included" : "Excluded"} 
                      color={includeExecutiveSummary ? "primary" : "default"} 
                      size="small" 
                      onClick={() => setIncludeExecutiveSummary(!includeExecutiveSummary)}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Executive Summary" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      label={includePerformanceMetrics ? "Included" : "Excluded"} 
                      color={includePerformanceMetrics ? "primary" : "default"} 
                      size="small" 
                      onClick={() => setIncludePerformanceMetrics(!includePerformanceMetrics)}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Performance Metrics" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      label={includeTradeAnalysis ? "Included" : "Excluded"} 
                      color={includeTradeAnalysis ? "primary" : "default"} 
                      size="small" 
                      onClick={() => setIncludeTradeAnalysis(!includeTradeAnalysis)}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Trade Analysis" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      label={includeRiskAnalysis ? "Included" : "Excluded"} 
                      color={includeRiskAnalysis ? "primary" : "default"} 
                      size="small" 
                      onClick={() => setIncludeRiskAnalysis(!includeRiskAnalysis)}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Risk Analysis" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      label={includeBenchmarkComparison ? "Included" : "Excluded"} 
                      color={includeBenchmarkComparison ? "primary" : "default"} 
                      size="small" 
                      onClick={() => setIncludeBenchmarkComparison(!includeBenchmarkComparison)}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Benchmark Comparison" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      label={includeMonteCarloSimulation ? "Included" : "Excluded"} 
                      color={includeMonteCarloSimulation ? "primary" : "default"} 
                      size="small" 
                      onClick={() => setIncludeMonteCarloSimulation(!includeMonteCarloSimulation)}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Monte Carlo Simulation" />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={generateReport}
                disabled={generatingReport || !backtestResult}
                startIcon={generatingReport ? <CircularProgress size={20} /> : <PdfIcon />}
                sx={{ mt: 2 }}
              >
                {generatingReport ? 'Generating Report...' : 'Generate Report'}
              </Button>
              
              {reportUrl && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    href={reportUrl}
                    target="_blank"
                  >
                    Download Report
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    startIcon={<ShareIcon />}
                  >
                    Share Report
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render executive summary
  const renderExecutiveSummary = () => {
    if (!backtestResult) return null;
    
    const { summary, strategy } = backtestResult;
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Executive Summary" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Strategy Overview
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Name:</strong> {strategy.name}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Description:</strong> {strategy.description}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Test Period:</strong> {formatDate(summary.startDate)} to {formatDate(summary.endDate)}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Initial Capital:</strong> {formatCurrency(summary.initialCapital)}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Final Capital:</strong> {formatCurrency(summary.finalCapital)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Key Performance Indicators
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Return:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: summary.totalReturn >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {formatPercent(summary.totalReturn)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Annualized Return:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: summary.annualizedReturn >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {formatPercent(summary.annualizedReturn)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Sharpe Ratio:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: summary.sharpeRatio >= 1 ? 'success.main' : summary.sharpeRatio >= 0 ? 'warning.main' : 'error.main' }}
                  >
                    {summary.sharpeRatio.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Maximum Drawdown:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: 'error.main' }}
                  >
                    {formatPercent(summary.maxDrawdown)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Win Rate:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: summary.winRate >= 0.5 ? 'success.main' : 'warning.main' }}
                  >
                    {formatPercent(summary.winRate * 100)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Profit Factor:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: summary.profitFactor >= 1.5 ? 'success.main' : summary.profitFactor >= 1 ? 'warning.main' : 'error.main' }}
                  >
                    {summary.profitFactor.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Alpha:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', color: summary.alpha >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {formatPercent(summary.alpha)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Executive Assessment
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {summary.sharpeRatio >= 1 ? (
                    <CheckCircleIcon color="success" />
                  ) : summary.sharpeRatio >= 0.5 ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                  <Typography variant="body2">
                    <strong>Risk-Adjusted Performance:</strong> The strategy {
                      summary.sharpeRatio >= 1 ? 'demonstrates strong risk-adjusted returns' :
                      summary.sharpeRatio >= 0.5 ? 'shows moderate risk-adjusted returns' :
                      'exhibits poor risk-adjusted returns'
                    } with a Sharpe ratio of {summary.sharpeRatio.toFixed(2)}.
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {summary.alpha >= 3 ? (
                    <CheckCircleIcon color="success" />
                  ) : summary.alpha >= 0 ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                  <Typography variant="body2">
                    <strong>Alpha Generation:</strong> The strategy {
                      summary.alpha >= 3 ? 'generates significant alpha' :
                      summary.alpha >= 0 ? 'generates positive alpha' :
                      'fails to generate alpha'
                    } with an alpha of {formatPercent(summary.alpha)} compared to the benchmark.
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {Math.abs(summary.maxDrawdown) <= 15 ? (
                    <CheckCircleIcon color="success" />
                  ) : Math.abs(summary.maxDrawdown) <= 25 ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                  <Typography variant="body2">
                    <strong>Drawdown Management:</strong> The strategy {
                      Math.abs(summary.maxDrawdown) <= 15 ? 'demonstrates good drawdown control' :
                      Math.abs(summary.maxDrawdown) <= 25 ? 'shows moderate drawdown control' :
                      'exhibits poor drawdown control'
                    } with a maximum drawdown of {formatPercent(summary.maxDrawdown)}.
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {summary.profitFactor >= 1.5 ? (
                    <CheckCircleIcon color="success" />
                  ) : summary.profitFactor >= 1 ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                  <Typography variant="body2">
                    <strong>Trade Efficiency:</strong> The strategy {
                      summary.profitFactor >= 1.5 ? 'shows excellent trade efficiency' :
                      summary.profitFactor >= 1 ? 'demonstrates adequate trade efficiency' :
                      'exhibits poor trade efficiency'
                    } with a profit factor of {summary.profitFactor.toFixed(2)}.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!backtestResult) return null;
    
    const { summary } = backtestResult;
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Return Metrics
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Return</TableCell>
                      <TableCell align="right" sx={{ color: summary.totalReturn >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPercent(summary.totalReturn)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Annualized Return</TableCell>
                      <TableCell align="right" sx={{ color: summary.annualizedReturn >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPercent(summary.annualizedReturn)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Benchmark Return</TableCell>
                      <TableCell align="right" sx={{ color: summary.benchmarkReturn >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPercent(summary.benchmarkReturn)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Benchmark Annualized Return</TableCell>
                      <TableCell align="right" sx={{ color: summary.benchmarkAnnualizedReturn >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPercent(summary.benchmarkAnnualizedReturn)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Alpha</TableCell>
                      <TableCell align="right" sx={{ color: summary.alpha >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPercent(summary.alpha)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Beta</TableCell>
                      <TableCell align="right">
                        {summary.beta.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Risk Metrics
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Volatility (Annualized)</TableCell>
                      <TableCell align="right">
                        {formatPercent(summary.volatility)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sharpe Ratio</TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.sharpeRatio >= 1 ? 'success.main' : 
                               summary.sharpeRatio >= 0.5 ? 'warning.main' : 
                               'error.main' 
                      }}>
                        {summary.sharpeRatio.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sortino Ratio</TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.sortino >= 1 ? 'success.main' : 
                               summary.sortino >= 0.5 ? 'warning.main' : 
                               'error.main' 
                      }}>
                        {summary.sortino.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maximum Drawdown</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatPercent(summary.maxDrawdown)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Calmar Ratio</TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.calmar >= 1 ? 'success.main' : 
                               summary.calmar >= 0.5 ? 'warning.main' : 
                               'error.main' 
                      }}>
                        {summary.calmar.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Value at Risk (95%)</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatPercent(summary.var95)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Trade Metrics
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Trades</TableCell>
                      <TableCell align="right">
                        {summary.totalTrades}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Win Rate</TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.winRate >= 0.5 ? 'success.main' : 'warning.main'
                      }}>
                        {formatPercent(summary.winRate * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Profit Factor</TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.profitFactor >= 1.5 ? 'success.main' : 
                               summary.profitFactor >= 1 ? 'warning.main' : 
                               'error.main' 
                      }}>
                        {summary.profitFactor.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average Win</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        {formatPercent(summary.averageWin)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average Loss</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatPercent(summary.averageLoss)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Expectancy</TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.expectancy >= 0 ? 'success.main' : 'error.main'
                      }}>
                        {formatPercent(summary.expectancy)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Strategy Parameters
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {Object.entries(backtestResult.strategy.parameters).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</TableCell>
                        <TableCell align="right">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render equity curve chart
  const renderEquityCurveChart = () => {
    if (!backtestResult || !backtestResult.equity || backtestResult.equity.length === 0) return null;
    
    // Combine equity and benchmark data
    const chartData = backtestResult.equity.map((equityPoint, index) => ({
      date: equityPoint.date,
      strategy: equityPoint.value,
      benchmark: backtestResult.benchmark[index]?.value || null
    }));
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Equity Curve
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={chartData}
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
                return [formatCurrency(value), name === 'strategy' ? 'Strategy' : 'Benchmark'];
              }}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="strategy"
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
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render monthly returns chart
  const renderMonthlyReturnsChart = () => {
    if (!backtestResult || !backtestResult.monthlyReturns || backtestResult.monthlyReturns.length === 0) return null;
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Monthly Returns
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={backtestResult.monthlyReturns}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getFullYear()}-${date.getMonth() + 1}`;
              }}
            />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <RechartsTooltip 
              formatter={(value: any, name: string) => {
                return [formatPercent(value), name === 'strategy' ? 'Strategy' : 'Benchmark'];
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="strategy" name="Strategy" fill={COLORS[0]} />
            <Bar dataKey="benchmark" name="Benchmark" fill={COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render trade analysis
  const renderTradeAnalysis = () => {
    if (!backtestResult || !backtestResult.trades || backtestResult.trades.length === 0) return null;
    
    // Calculate trade statistics
    const trades = backtestResult.trades;
    const winningTrades = trades.filter(t => t.returnPct > 0);
    const losingTrades = trades.filter(t => t.returnPct <= 0);
    const longTrades = trades.filter(t => t.side === 'long');
    const shortTrades = trades.filter(t => t.side === 'short');
    
    // Group trades by symbol
    const tradesBySymbol = trades.reduce((acc, trade) => {
      if (!acc[trade.symbol]) {
        acc[trade.symbol] = [];
      }
      acc[trade.symbol].push(trade);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Calculate symbol performance
    const symbolPerformance = Object.entries(tradesBySymbol).map(([symbol, trades]) => {
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.returnPct > 0).length;
      const winRate = winningTrades / totalTrades;
      const totalReturn = trades.reduce((sum, t) => sum + t.returnPct, 0);
      const averageReturn = totalReturn / totalTrades;
      
      return {
        symbol,
        totalTrades,
        winningTrades,
        winRate,
        totalReturn,
        averageReturn
      };
    });
    
    // Sort by total return
    symbolPerformance.sort((a, b) => b.totalReturn - a.totalReturn);
    
    // Prepare data for win/loss distribution chart
    const returnBuckets = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
    const returnDistribution = returnBuckets.map(bucket => {
      const nextBucket = bucket + 2;
      const count = trades.filter(t => t.returnPct > bucket && t.returnPct <= nextBucket).length;
      
      return {
        bucket: bucket < 0 ? `${bucket}% to ${nextBucket}%` : `${bucket}% to ${nextBucket}%`,
        count,
        bucketValue: bucket
      };
    });
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Trade Analysis" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Trade Statistics
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Trades</TableCell>
                      <TableCell align="right">{trades.length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Winning Trades</TableCell>
                      <TableCell align="right">{winningTrades.length} ({formatPercent(winningTrades.length / trades.length * 100)})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Losing Trades</TableCell>
                      <TableCell align="right">{losingTrades.length} ({formatPercent(losingTrades.length / trades.length * 100)})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Long Trades</TableCell>
                      <TableCell align="right">{longTrades.length} ({formatPercent(longTrades.length / trades.length * 100)})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Short Trades</TableCell>
                      <TableCell align="right">{shortTrades.length} ({formatPercent(shortTrades.length / trades.length * 100)})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average Holding Period</TableCell>
                      <TableCell align="right">{backtestResult.summary.averageHoldingPeriod.toFixed(1)} days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Win/Loss Distribution
              </Typography>
              
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={returnDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value} trades`, 'Count']}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Trades" 
                      fill={(data) => data.bucketValue < 0 ? COLORS[4] : COLORS[0]}
                    >
                      {returnDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.bucketValue < 0 ? COLORS[4] : COLORS[0]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Symbol Performance
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                      <TableCell align="right">Total Return</TableCell>
                      <TableCell align="right">Avg Return</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {symbolPerformance.map((perf) => (
                      <TableRow key={perf.symbol}>
                        <TableCell>{perf.symbol}</TableCell>
                        <TableCell align="right">{perf.totalTrades}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: perf.winRate >= 0.5 ? 'success.main' : 'warning.main' }}
                        >
                          {formatPercent(perf.winRate * 100)}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: perf.totalReturn >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatPercent(perf.totalReturn)}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: perf.averageReturn >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatPercent(perf.averageReturn)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Trade List</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Side</TableCell>
                          <TableCell>Entry Date</TableCell>
                          <TableCell>Exit Date</TableCell>
                          <TableCell align="right">Entry Price</TableCell>
                          <TableCell align="right">Exit Price</TableCell>
                          <TableCell align="right">Return</TableCell>
                          <TableCell align="right">P&L</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>{trade.id}</TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell>{trade.side}</TableCell>
                            <TableCell>{formatDate(trade.entryDate)}</TableCell>
                            <TableCell>{formatDate(trade.exitDate)}</TableCell>
                            <TableCell align="right">{formatCurrency(trade.entryPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(trade.exitPrice)}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: trade.returnPct >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {formatPercent(trade.returnPct)}
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: trade.pnl >= 0 ? 'success.main' : 'error.main' }}
                            >
                              {formatCurrency(trade.pnl)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render risk analysis
  const renderRiskAnalysis = () => {
    if (!backtestResult) return null;
    
    const { drawdowns, summary } = backtestResult;
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Risk Analysis" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Drawdown Analysis
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell align="right">Depth</TableCell>
                      <TableCell align="right">Duration</TableCell>
                      <TableCell align="right">Recovery</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drawdowns.slice(0, 5).map((drawdown) => (
                      <TableRow key={drawdown.id}>
                        <TableCell>{drawdown.id}</TableCell>
                        <TableCell>{formatDate(drawdown.startDate)}</TableCell>
                        <TableCell>{formatDate(drawdown.endDate)}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: 'error.main' }}
                        >
                          {formatPercent(drawdown.depthPct)}
                        </TableCell>
                        <TableCell align="right">{drawdown.durationDays} days</TableCell>
                        <TableCell align="right">{drawdown.recoveryDays} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Risk Metrics
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Volatility (Annualized)</TableCell>
                      <TableCell align="right">{formatPercent(summary.volatility)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maximum Drawdown</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{formatPercent(summary.maxDrawdown)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Value at Risk (95%)</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{formatPercent(summary.var95)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Conditional VaR (95%)</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{formatPercent(summary.cvar95)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Beta</TableCell>
                      <TableCell align="right">{summary.beta.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Calmar Ratio</TableCell>
                      <TableCell align="right">{summary.calmar.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Drawdown Chart
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={drawdowns}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                    <YAxis dataKey="id" type="category" />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'depthPct') return [formatPercent(value), 'Depth'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Drawdown #${label}`)
                    />
                    <Bar dataKey="depthPct" name="Depth" fill={COLORS[4]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render Monte Carlo simulation
  const renderMonteCarloSimulation = () => {
    if (!backtestResult || !backtestResult.monteCarloSimulations || backtestResult.monteCarloSimulations.length === 0) return null;
    
    const { monteCarloSimulations, summary } = backtestResult;
    
    // Sort simulations by final value
    const sortedSimulations = [...monteCarloSimulations].sort((a, b) => a.finalValue - b.finalValue);
    
    // Calculate percentiles
    const percentile5 = sortedSimulations[Math.floor(sortedSimulations.length * 0.05)].finalValue;
    const percentile25 = sortedSimulations[Math.floor(sortedSimulations.length * 0.25)].finalValue;
    const percentile50 = sortedSimulations[Math.floor(sortedSimulations.length * 0.5)].finalValue;
    const percentile75 = sortedSimulations[Math.floor(sortedSimulations.length * 0.75)].finalValue;
    const percentile95 = sortedSimulations[Math.floor(sortedSimulations.length * 0.95)].finalValue;
    
    // Prepare data for chart
    // We'll use a subset of simulations for the chart to avoid overcrowding
    const simulationsForChart = sortedSimulations.filter((_, index) => index % 10 === 0);
    
    // Prepare data for the chart
    const chartData = [];
    for (let day = 0; day <= 252; day += 5) { // Use every 5th day to reduce data points
      const dataPoint = {
        day,
        median: 0,
        percentile5: 0,
        percentile25: 0,
        percentile75: 0,
        percentile95: 0
      };
      
      // Add simulation lines
      simulationsForChart.forEach((sim, index) => {
        dataPoint[`sim${index}`] = sim.points.find(p => p.day === day)?.value || null;
      });
      
      // Calculate percentiles for this day
      const dayValues = sortedSimulations.map(sim => sim.points.find(p => p.day === day)?.value || 0);
      dayValues.sort((a, b) => a - b);
      
      dataPoint.percentile5 = dayValues[Math.floor(dayValues.length * 0.05)];
      dataPoint.percentile25 = dayValues[Math.floor(dayValues.length * 0.25)];
      dataPoint.median = dayValues[Math.floor(dayValues.length * 0.5)];
      dataPoint.percentile75 = dayValues[Math.floor(dayValues.length * 0.75)];
      dataPoint.percentile95 = dayValues[Math.floor(dayValues.length * 0.95)];
      
      chartData.push(dataPoint);
    }
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Monte Carlo Simulation" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Simulation Results (252 Trading Days)
              </Typography>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Trading Days', position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'median') return [formatCurrency(value), 'Median'];
                        if (name === 'percentile5') return [formatCurrency(value), '5th Percentile'];
                        if (name === 'percentile25') return [formatCurrency(value), '25th Percentile'];
                        if (name === 'percentile75') return [formatCurrency(value), '75th Percentile'];
                        if (name === 'percentile95') return [formatCurrency(value), '95th Percentile'];
                        if (name.startsWith('sim')) return [formatCurrency(value), `Simulation ${name.substring(3)}`];
                        return [formatCurrency(value), name];
                      }}
                    />
                    <Legend />
                    
                    {/* Percentile areas */}
                    <Area 
                      type="monotone" 
                      dataKey="percentile5" 
                      stackId="1" 
                      stroke="none" 
                      fill={COLORS[4]} 
                      fillOpacity={0.1} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="percentile25" 
                      stackId="1" 
                      stroke="none" 
                      fill={COLORS[4]} 
                      fillOpacity={0.1} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="percentile75" 
                      stackId="1" 
                      stroke="none" 
                      fill={COLORS[0]} 
                      fillOpacity={0.1} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="percentile95" 
                      stackId="1" 
                      stroke="none" 
                      fill={COLORS[0]} 
                      fillOpacity={0.1} 
                    />
                    
                    {/* Percentile lines */}
                    <Line 
                      type="monotone" 
                      dataKey="percentile5" 
                      name="5th Percentile" 
                      stroke={COLORS[4]} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentile25" 
                      name="25th Percentile" 
                      stroke={COLORS[4]} 
                      strokeDasharray="5 5" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="median" 
                      name="Median" 
                      stroke="#000" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentile75" 
                      name="75th Percentile" 
                      stroke={COLORS[0]} 
                      strokeDasharray="5 5" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentile95" 
                      name="95th Percentile" 
                      stroke={COLORS[0]} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    
                    {/* Individual simulation lines (light gray) */}
                    {simulationsForChart.map((_, index) => (
                      <Line 
                        key={`sim${index}`}
                        type="monotone" 
                        dataKey={`sim${index}`} 
                        stroke="#ccc" 
                        strokeWidth={0.5} 
                        dot={false}
                        activeDot={false}
                        legendType="none"
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Simulation Statistics
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Number of Simulations</TableCell>
                      <TableCell align="right">{monteCarloSimulations.length}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Initial Capital</TableCell>
                      <TableCell align="right">{formatCurrency(10000)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Median Final Value</TableCell>
                      <TableCell align="right">{formatCurrency(percentile50)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Median Return</TableCell>
                      <TableCell align="right" sx={{ color: percentile50 >= 10000 ? 'success.main' : 'error.main' }}>
                        {formatPercent((percentile50 / 10000 - 1) * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>5th Percentile (VaR 95%)</TableCell>
                      <TableCell align="right" sx={{ color: percentile5 >= 10000 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(percentile5)} ({formatPercent((percentile5 / 10000 - 1) * 100)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>95th Percentile</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        {formatCurrency(percentile95)} ({formatPercent((percentile95 / 10000 - 1) * 100)})
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Probability Analysis
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Probability of Profit</TableCell>
                      <TableCell align="right">
                        {formatPercent(monteCarloSimulations.filter(sim => sim.finalValue > 10000).length / monteCarloSimulations.length * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Probability of Loss</TableCell>
                      <TableCell align="right">
                        {formatPercent(monteCarloSimulations.filter(sim => sim.finalValue < 10000).length / monteCarloSimulations.length * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Probability of &gt;10% Return</TableCell>
                      <TableCell align="right">
                        {formatPercent(monteCarloSimulations.filter(sim => sim.finalValue > 11000).length / monteCarloSimulations.length * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Probability of &gt;20% Return</TableCell>
                      <TableCell align="right">
                        {formatPercent(monteCarloSimulations.filter(sim => sim.finalValue > 12000).length / monteCarloSimulations.length * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Probability of &gt;10% Loss</TableCell>
                      <TableCell align="right">
                        {formatPercent(monteCarloSimulations.filter(sim => sim.finalValue < 9000).length / monteCarloSimulations.length * 100)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Probability of &gt;20% Loss</TableCell>
                      <TableCell align="right">
                        {formatPercent(monteCarloSimulations.filter(sim => sim.finalValue < 8000).length / monteCarloSimulations.length * 100)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Backtest Report Generator
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderReportConfigPanel()}
        </Grid>
        
        <Grid item xs={12} md={8}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : backtestResult ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                  <Tab label="Executive Summary" icon={<AssessmentIcon />} iconPosition="start" />
                  <Tab label="Performance" icon={<ShowChartIcon />} iconPosition="start" />
                  <Tab label="Trades" icon={<TableChartIcon />} iconPosition="start" />
                  <Tab label="Risk" icon={<TrendingDownIcon />} iconPosition="start" />
                  <Tab label="Monte Carlo" icon={<TrendingUpIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
                {renderExecutiveSummary()}
                {renderEquityCurveChart()}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                {renderPerformanceMetrics()}
                {renderEquityCurveChart()}
                {renderMonthlyReturnsChart()}
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                {renderTradeAnalysis()}
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                {renderRiskAnalysis()}
              </TabPanel>
              
              <TabPanel value={tabValue} index={4}>
                {renderMonteCarloSimulation()}
              </TabPanel>
            </>
          ) : (
            <Paper sx={{ p: 3, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No Backtest Result Available
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please run a backtest first or provide a backtest ID to generate a report.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default BacktestReportGenerator;