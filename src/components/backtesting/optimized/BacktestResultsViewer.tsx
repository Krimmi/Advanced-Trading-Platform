import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  TableChart as TableChartIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

// Import recharts components for visualizations
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import BacktestingService from '../../services/backtesting/backtestingService';
import {
  BacktestResult,
  BacktestConfig,
  Trade,
  TradeDirection,
  TradeStatus,
  EquityPoint,
  DrawdownPoint,
  PerformanceMetrics
} from '../../types/backtesting/backtestingTypes';

interface BacktestResultsViewerProps {
  backtestId?: string;
  backtestResult?: BacktestResult;
  onClose?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Memoized TabPanel component
const TabPanel = memo(({ children, value, index, ...other }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`backtest-tabpanel-${index}`}
      aria-labelledby={`backtest-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
});

// Memoized BacktestSummary component
const BacktestSummary = memo(({ 
  backtestConfig, 
  backtestResult, 
  formatCurrency, 
  formatPercentage 
}: { 
  backtestConfig: BacktestConfig | null;
  backtestResult: BacktestResult;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}) => (
  <Grid item xs={12} md={6}>
    <Typography variant="h6" gutterBottom>
      Backtest Summary
    </Typography>
    <Divider sx={{ mb: 2 }} />
    
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Strategy
        </Typography>
        <Typography variant="body1">
          {backtestConfig?.name || 'N/A'}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Period
        </Typography>
        <Typography variant="body1">
          {backtestResult.startDate ? format(new Date(backtestResult.startDate), 'MMM d, yyyy') : 'N/A'} - 
          {backtestResult.endDate ? format(new Date(backtestResult.endDate), 'MMM d, yyyy') : 'N/A'}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Initial Capital
        </Typography>
        <Typography variant="body1">
          {formatCurrency(backtestResult.initialCapital)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Final Capital
        </Typography>
        <Typography variant="body1">
          {formatCurrency(backtestResult.finalCapital)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Total Return
        </Typography>
        <Typography variant="body1" color={backtestResult.totalReturn >= 0 ? 'success.main' : 'error.main'}>
          {formatPercentage(backtestResult.totalReturn)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Annualized Return
        </Typography>
        <Typography variant="body1" color={backtestResult.annualizedReturn >= 0 ? 'success.main' : 'error.main'}>
          {formatPercentage(backtestResult.annualizedReturn)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Max Drawdown
        </Typography>
        <Typography variant="body1" color="error.main">
          {formatPercentage(backtestResult.maxDrawdown)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Sharpe Ratio
        </Typography>
        <Typography variant="body1" color={backtestResult.sharpeRatio >= 1 ? 'success.main' : 'warning.main'}>
          {backtestResult.sharpeRatio.toFixed(2)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Sortino Ratio
        </Typography>
        <Typography variant="body1" color={backtestResult.sortinoRatio >= 1 ? 'success.main' : 'warning.main'}>
          {backtestResult.sortinoRatio.toFixed(2)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Calmar Ratio
        </Typography>
        <Typography variant="body1" color={backtestResult.calmarRatio >= 1 ? 'success.main' : 'warning.main'}>
          {backtestResult.calmarRatio.toFixed(2)}
        </Typography>
      </Grid>
    </Grid>
  </Grid>
));

// Memoized TradeStatistics component
const TradeStatistics = memo(({ 
  tradeStats, 
  formatCurrency, 
  formatPercentage 
}: { 
  tradeStats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    profitFactor: number;
    averageHoldingPeriod: number;
  };
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}) => (
  <Grid item xs={12} md={6}>
    <Typography variant="h6" gutterBottom>
      Trade Statistics
    </Typography>
    <Divider sx={{ mb: 2 }} />
    
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Total Trades
        </Typography>
        <Typography variant="body1">
          {tradeStats.totalTrades}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Win Rate
        </Typography>
        <Typography variant="body1" color={tradeStats.winRate >= 0.5 ? 'success.main' : 'warning.main'}>
          {formatPercentage(tradeStats.winRate)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Winning Trades
        </Typography>
        <Typography variant="body1" color="success.main">
          {tradeStats.winningTrades}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Losing Trades
        </Typography>
        <Typography variant="body1" color="error.main">
          {tradeStats.losingTrades}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Average Win
        </Typography>
        <Typography variant="body1" color="success.main">
          {formatCurrency(tradeStats.averageWin)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Average Loss
        </Typography>
        <Typography variant="body1" color="error.main">
          {formatCurrency(tradeStats.averageLoss)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Largest Win
        </Typography>
        <Typography variant="body1" color="success.main">
          {formatCurrency(tradeStats.largestWin)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Largest Loss
        </Typography>
        <Typography variant="body1" color="error.main">
          {formatCurrency(tradeStats.largestLoss)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Profit Factor
        </Typography>
        <Typography variant="body1" color={tradeStats.profitFactor >= 1.5 ? 'success.main' : 'warning.main'}>
          {tradeStats.profitFactor.toFixed(2)}
        </Typography>
      </Grid>
      
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          Avg Holding Period
        </Typography>
        <Typography variant="body1">
          {tradeStats.averageHoldingPeriod.toFixed(1)} days
        </Typography>
      </Grid>
    </Grid>
  </Grid>
));

// Memoized EquityCurveChart component
const EquityCurveChart = memo(({ 
  equityCurve, 
  formatCurrency, 
  theme 
}: { 
  equityCurve: EquityPoint[];
  formatCurrency: (value: number) => string;
  theme: any;
}) => (
  <Box sx={{ height: '400px' }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={equityCurve}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'MMM dd')}
        />
        <YAxis />
        <RechartsTooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={theme.palette.primary.main}
          fill={theme.palette.primary.light}
          fillOpacity={0.3}
          name="Portfolio Value"
        />
      </AreaChart>
    </ResponsiveContainer>
  </Box>
));

// Memoized DrawdownChart component
const DrawdownChart = memo(({ 
  drawdownCurve, 
  formatPercentage, 
  theme 
}: { 
  drawdownCurve: DrawdownPoint[];
  formatPercentage: (value: number) => string;
  theme: any;
}) => (
  <Box sx={{ height: '400px' }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={drawdownCurve}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'MMM dd')}
        />
        <YAxis />
        <RechartsTooltip
          formatter={(value: number) => formatPercentage(value)}
          labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
        />
        <Area
          type="monotone"
          dataKey="drawdownPercentage"
          stroke={theme.palette.error.main}
          fill={theme.palette.error.light}
          fillOpacity={0.3}
          name="Drawdown"
        />
      </AreaChart>
    </ResponsiveContainer>
  </Box>
));

// Memoized MonthlyReturnsTable component
const MonthlyReturnsTable = memo(({ 
  monthlyReturnsData, 
  formatPercentage 
}: { 
  monthlyReturnsData: any[];
  formatPercentage: (value: number) => string;
}) => (
  <Box sx={{ height: '400px', overflowX: 'auto' }}>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Year</TableCell>
            <TableCell>Jan</TableCell>
            <TableCell>Feb</TableCell>
            <TableCell>Mar</TableCell>
            <TableCell>Apr</TableCell>
            <TableCell>May</TableCell>
            <TableCell>Jun</TableCell>
            <TableCell>Jul</TableCell>
            <TableCell>Aug</TableCell>
            <TableCell>Sep</TableCell>
            <TableCell>Oct</TableCell>
            <TableCell>Nov</TableCell>
            <TableCell>Dec</TableCell>
            <TableCell>YTD</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {monthlyReturnsData.map((yearData) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const ytd = months.reduce((sum, month) => sum + (yearData[month] || 0), 0);
            
            return (
              <TableRow key={yearData.year}>
                <TableCell>{yearData.year}</TableCell>
                {months.map((month) => (
                  <TableCell
                    key={month}
                    sx={{
                      bgcolor: yearData[month] > 0
                        ? 'success.light'
                        : yearData[month] < 0
                          ? 'error.light'
                          : 'inherit',
                      color: yearData[month] !== undefined
                        ? 'white'
                        : 'text.secondary'
                    }}
                  >
                    {yearData[month] !== undefined ? formatPercentage(yearData[month]) : '-'}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    bgcolor: ytd > 0 ? 'success.main' : ytd < 0 ? 'error.main' : 'inherit',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {formatPercentage(ytd)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
));

// Memoized TradeDistributionChart component
const TradeDistributionChart = memo(({ 
  tradeDistributionData, 
  COLORS 
}: { 
  tradeDistributionData: { name: string; value: number }[];
  COLORS: string[];
}) => (
  <Box sx={{ height: '300px' }}>
    <Typography variant="h6" gutterBottom align="center">
      Trade Distribution
    </Typography>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={tradeDistributionData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {tradeDistributionData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip formatter={(value: number) => value} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </Box>
));

// Memoized ProfitLossChart component
const ProfitLossChart = memo(({ 
  trades, 
  formatCurrency, 
  theme 
}: { 
  trades: Trade[];
  formatCurrency: (value: number) => string;
  theme: any;
}) => (
  <Box sx={{ height: '300px' }}>
    <Typography variant="h6" gutterBottom align="center">
      Profit/Loss Distribution
    </Typography>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={trades.filter(t => t.pnl !== undefined).map(t => ({
          symbol: t.symbol,
          pnl: t.pnl,
          direction: t.direction
        }))}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="symbol" />
        <YAxis />
        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Bar
          dataKey="pnl"
          name="Profit/Loss"
          fill={theme.palette.primary.main}
          shape={(props: any) => {
            const { x, y, width, height, pnl } = props;
            return (
              <rect
                x={x}
                y={pnl >= 0 ? y : y + height}
                width={width}
                height={Math.abs(height)}
                fill={pnl >= 0 ? theme.palette.success.main : theme.palette.error.main}
              />
            );
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  </Box>
));

// Memoized TradeList component
const TradeList = memo(({ 
  trades, 
  formatCurrency, 
  formatPercentage 
}: { 
  trades: Trade[];
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}) => (
  <Grid item xs={12}>
    <Typography variant="h6" gutterBottom>
      Trade List
    </Typography>
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell>Entry Date</TableCell>
            <TableCell>Entry Price</TableCell>
            <TableCell>Exit Date</TableCell>
            <TableCell>Exit Price</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>P&L</TableCell>
            <TableCell>P&L %</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trades.map((trade) => (
            <TableRow
              key={trade.id}
              sx={{
                bgcolor:
                  trade.status === TradeStatus.OPEN
                    ? 'action.hover'
                    : trade.pnl && trade.pnl > 0
                      ? 'success.light'
                      : trade.pnl && trade.pnl < 0
                        ? 'error.light'
                        : 'inherit'
              }}
            >
              <TableCell>{trade.symbol}</TableCell>
              <TableCell>
                <Chip
                  label={trade.direction}
                  color={trade.direction === TradeDirection.LONG ? 'primary' : 'secondary'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {trade.entryDate ? format(new Date(trade.entryDate), 'MM/dd/yyyy') : '-'}
              </TableCell>
              <TableCell>{trade.entryPrice?.toFixed(2)}</TableCell>
              <TableCell>
                {trade.exitDate ? format(new Date(trade.exitDate), 'MM/dd/yyyy') : '-'}
              </TableCell>
              <TableCell>{trade.exitPrice?.toFixed(2) || '-'}</TableCell>
              <TableCell>{trade.quantity}</TableCell>
              <TableCell>
                {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
              </TableCell>
              <TableCell>
                {trade.pnlPercentage !== undefined ? formatPercentage(trade.pnlPercentage) : '-'}
              </TableCell>
              <TableCell>
                <Chip
                  label={trade.status}
                  color={
                    trade.status === TradeStatus.OPEN
                      ? 'info'
                      : trade.status === TradeStatus.CLOSED
                        ? 'default'
                        : 'error'
                  }
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Grid>
));

// Memoized PerformanceMetricsCard component
const PerformanceMetricsCard = memo(({ 
  title, 
  metrics 
}: { 
  title: string;
  metrics: React.ReactNode;
}) => (
  <Grid item xs={12} md={6}>
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {metrics}
      </CardContent>
    </Card>
  </Grid>
));

// Main component
const BacktestResultsViewer: React.FC<BacktestResultsViewerProps> = ({
  backtestId,
  backtestResult: initialResult,
  onClose
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(initialResult || null);
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [drawdownCurve, setDrawdownCurve] = useState<DrawdownPoint[]>([]);
  
  const [tabValue, setTabValue] = useState<number>(0);
  
  const backtestingService = useMemo(() => new BacktestingService(), []);
  
  // Colors for charts
  const COLORS = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.info.main
  ], [theme]);
  
  // Load backtest result data
  useEffect(() => {
    const loadBacktestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let result = backtestResult;
        
        // If we have an ID but no result, fetch the result
        if (backtestId && !result) {
          result = await backtestingService.getBacktestResult(backtestId);
          setBacktestResult(result);
        }
        
        if (!result) {
          setError('No backtest result provided.');
          setLoading(false);
          return;
        }
        
        // Load backtest configuration
        const config = await backtestingService.getBacktestConfig(result.configId);
        setBacktestConfig(config);
        
        // Load trades
        const trades = await backtestingService.getBacktestTrades(result.id);
        setTrades(trades);
        
        // Load equity curve
        const equityCurve = await backtestingService.getBacktestEquityCurve(result.id);
        setEquityCurve(equityCurve.map(point => ({
          date: point.timestamp,
          equity: point.value,
          drawdown: 0, // This would be calculated from the backend
          cash: 0,     // This would be calculated from the backend
          positions: 0 // This would be calculated from the backend
        })));
        
        // Load drawdown curve
        const drawdownCurve = await backtestingService.getBacktestDrawdownCurve(result.id);
        setDrawdownCurve(drawdownCurve.map(point => ({
          date: point.timestamp,
          drawdown: point.value,
          drawdownPercentage: point.value / result.initialCapital * 100
        })));
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading backtest data:', err);
        setError('Failed to load backtest data. Please try again later.');
        setLoading(false);
      }
    };
    
    loadBacktestData();
  }, [backtestId, backtestResult, backtestingService]);
  
  // Calculate trade statistics
  const tradeStats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        averageHoldingPeriod: 0
      };
    }
    
    const closedTrades = trades.filter(trade => trade.status === TradeStatus.CLOSED);
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const totalWinAmount = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const holdingPeriods = closedTrades.map(trade => {
      if (!trade.entryDate || !trade.exitDate) return 0;
      const entryDate = new Date(trade.entryDate);
      const exitDate = new Date(trade.exitDate);
      return (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24); // days
    });
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0,
      averageWin: winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(trade => trade.pnl || 0)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(trade => trade.pnl || 0)) : 0,
      profitFactor: totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0,
      averageHoldingPeriod: holdingPeriods.length > 0 ? holdingPeriods.reduce((sum, days) => sum + days, 0) / holdingPeriods.length : 0
    };
  }, [trades]);
  
  // Format currency values
  const formatCurrency = useMemo(() => (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);
  
  // Format percentage values
  const formatPercentage = useMemo(() => (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle export to CSV
  const handleExportToCsv = async () => {
    if (!backtestResult) return;
    
    try {
      setLoading(true);
      const csvData = await backtestingService.exportBacktestResultToCsv(backtestResult.id);
      
      // Create a download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtest_${backtestResult.id}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setLoading(false);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setError('Failed to export backtest results to CSV.');
      setLoading(false);
    }
  };
  
  // Handle export to JSON
  const handleExportToJson = async () => {
    if (!backtestResult) return;
    
    try {
      setLoading(true);
      const jsonData = await backtestingService.exportBacktestResultToJson(backtestResult.id);
      
      // Create a download link
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtest_${backtestResult.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setLoading(false);
    } catch (err) {
      console.error('Error exporting to JSON:', err);
      setError('Failed to export backtest results to JSON.');
      setLoading(false);
    }
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Prepare monthly returns data for heatmap
  const monthlyReturnsData = useMemo(() => {
    if (!backtestResult || !backtestResult.monthlyReturns) return [];
    
    // Group by year
    const yearGroups = backtestResult.monthlyReturns.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = [];
      }
      acc[item.year].push(item);
      return acc;
    }, {} as Record<number, typeof backtestResult.monthlyReturns>);
    
    // Sort and format
    return Object.keys(yearGroups)
      .sort()
      .map(year => {
        const months = yearGroups[parseInt(year)];
        const monthData: Record<string, number> = {
          year: parseInt(year)
        };
        
        months.forEach(month => {
          const monthName = new Date(parseInt(year), month.month - 1, 1).toLocaleString('default', { month: 'short' });
          monthData[monthName] = month.return;
        });
        
        return monthData;
      });
  }, [backtestResult]);
  
  // Prepare trade distribution data
  const tradeDistributionData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    const longWins = trades.filter(t => t.direction === TradeDirection.LONG && (t.pnl || 0) > 0).length;
    const longLosses = trades.filter(t => t.direction === TradeDirection.LONG && (t.pnl || 0) < 0).length;
    const shortWins = trades.filter(t => t.direction === TradeDirection.SHORT && (t.pnl || 0) > 0).length;
    const shortLosses = trades.filter(t => t.direction === TradeDirection.SHORT && (t.pnl || 0) < 0).length;
    
    return [
      { name: 'Long Wins', value: longWins },
      { name: 'Long Losses', value: longLosses },
      { name: 'Short Wins', value: shortWins },
      { name: 'Short Losses', value: shortLosses }
    ];
  }, [trades]);
  
  if (!backtestResult) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Typography variant="h6" color="text.secondary">
            No backtest result available.
          </Typography>
        )}
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Backtest Results
        </Typography>
        
        <Box>
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExportToCsv} disabled={loading}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to JSON">
            <IconButton onClick={handleExportToJson} disabled={loading}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Results">
            <IconButton onClick={handlePrint} disabled={loading}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Button variant="outlined" onClick={onClose} sx={{ ml: 1 }}>
              Close
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
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {backtestResult && (
            <BacktestSummary 
              backtestConfig={backtestConfig} 
              backtestResult={backtestResult} 
              formatCurrency={formatCurrency} 
              formatPercentage={formatPercentage} 
            />
          )}
          
          <TradeStatistics 
            tradeStats={tradeStats} 
            formatCurrency={formatCurrency} 
            formatPercentage={formatPercentage} 
          />
        </Grid>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="backtest results tabs">
          <Tab label="Equity Curve" />
          <Tab label="Drawdown" />
          <Tab label="Monthly Returns" />
          <Tab label="Trade Analysis" />
          <Tab label="Performance Metrics" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <EquityCurveChart 
            equityCurve={equityCurve} 
            formatCurrency={formatCurrency} 
            theme={theme} 
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <DrawdownChart 
            drawdownCurve={drawdownCurve} 
            formatPercentage={formatPercentage} 
            theme={theme} 
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MonthlyReturnsTable 
            monthlyReturnsData={monthlyReturnsData} 
            formatPercentage={formatPercentage} 
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TradeDistributionChart 
                tradeDistributionData={tradeDistributionData} 
                COLORS={COLORS} 
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ProfitLossChart 
                trades={trades} 
                formatCurrency={formatCurrency} 
                theme={theme} 
              />
            </Grid>
            
            <TradeList 
              trades={trades} 
              formatCurrency={formatCurrency} 
              formatPercentage={formatPercentage} 
            />
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <PerformanceMetricsCard
              title="Return Metrics"
              metrics={
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Return
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(backtestResult.totalReturn)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Annualized Return
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(backtestResult.annualizedReturn)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Alpha
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.alpha?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Beta
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.beta?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Information Ratio
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.informationRatio?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Treynor Ratio
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.treynorRatio?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
            
            <PerformanceMetricsCard
              title="Risk Metrics"
              metrics={
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Drawdown
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(backtestResult.maxDrawdown)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Drawdown Duration
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.maxDrawdownDuration || 'N/A'} days
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sortino Ratio
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.sortinoRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Calmar Ratio
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.calmarRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Volatility
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(backtestResult.performanceMetrics?.volatility || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Downside
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(backtestResult.performanceMetrics?.downside || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ulcer Index
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.ulcerIndex?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
            
            <PerformanceMetricsCard
              title="Trade Metrics"
              metrics={
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                    <Typography variant="body1">
                      {formatPercentage(backtestResult.performanceMetrics?.winRate || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Profit Factor
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.profitFactor?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expectancy
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(backtestResult.performanceMetrics?.expectancy || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Payoff Ratio
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.payoffRatio?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average Win
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(backtestResult.performanceMetrics?.averageWin || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average Loss
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(backtestResult.performanceMetrics?.averageLoss || 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Consecutive Wins
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.maxConsecutiveWins || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Consecutive Losses
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.maxConsecutiveLosses || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
            
            <PerformanceMetricsCard
              title="Other Metrics"
              metrics={
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Trades
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.totalTrades || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Winning Trades
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.winningTrades || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Losing Trades
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.losingTrades || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Break-Even Trades
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.breakEvenTrades || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average Holding Period
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.averageHoldingPeriod?.toFixed(1) || 'N/A'} days
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Market Correlation
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.marketCorrelation?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Recovery Factor
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.recoveryFactor?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Return on Max Drawdown
                    </Typography>
                    <Typography variant="body1">
                      {backtestResult.performanceMetrics?.returnOnMaxDrawdown?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              }
            />
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default memo(BacktestResultsViewer);