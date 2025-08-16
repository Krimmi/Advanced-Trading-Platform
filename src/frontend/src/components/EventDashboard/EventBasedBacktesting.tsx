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
  Tab
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
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
  ComposedChart,
  Area
} from 'recharts';
import eventService from '../../services/eventService';
import correlationAnalysisService from '../../services/correlationAnalysisService';

interface EventBasedBacktestingProps {
  symbol: string;
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
      id={`backtest-tabpanel-${index}`}
      aria-labelledby={`backtest-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface EventType {
  value: string;
  label: string;
  description: string;
}

interface BacktestResult {
  summary: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    averageHoldingPeriod: number;
    benchmarkReturn: number;
    benchmarkSharpeRatio: number;
    alpha: number;
    beta: number;
  };
  trades: Array<{
    entryDate: string;
    entryPrice: number;
    exitDate: string;
    exitPrice: number;
    returnPct: number;
    holdingPeriod: number;
    eventId: string;
    eventType: string;
    eventDate: string;
  }>;
  equity: Array<{
    date: string;
    strategy: number;
    benchmark: number;
  }>;
  monthlyReturns: Array<{
    month: string;
    strategy: number;
    benchmark: number;
  }>;
  drawdowns: Array<{
    startDate: string;
    endDate: string;
    durationDays: number;
    depthPct: number;
    recoveryDays: number;
  }>;
}

// Event types with descriptions
const eventTypes: EventType[] = [
  { value: 'earnings', label: 'Earnings Announcements', description: 'Quarterly or annual earnings reports released by the company' },
  { value: 'earnings_beat', label: 'Earnings Beat', description: 'When reported earnings exceed analyst expectations' },
  { value: 'earnings_miss', label: 'Earnings Miss', description: 'When reported earnings fall short of analyst expectations' },
  { value: 'dividend', label: 'Dividend Announcements', description: 'Declarations of dividend payments to shareholders' },
  { value: 'dividend_increase', label: 'Dividend Increase', description: 'Announcement of an increase in dividend payment' },
  { value: 'dividend_decrease', label: 'Dividend Decrease', description: 'Announcement of a decrease in dividend payment' },
  { value: 'split', label: 'Stock Splits', description: 'Division of existing shares into multiple shares' },
  { value: 'merger_acquisition', label: 'Mergers & Acquisitions', description: 'Announcements of company mergers or acquisitions' },
  { value: 'executive_change', label: 'Executive Changes', description: 'Changes in key executive positions like CEO or CFO' },
  { value: 'product_launch', label: 'Product Launches', description: 'Announcements of new product releases' },
  { value: 'legal_regulatory', label: 'Legal & Regulatory Events', description: 'Legal proceedings or regulatory decisions affecting the company' },
  { value: 'analyst_upgrade', label: 'Analyst Upgrades', description: 'When analysts improve their rating or price target for the stock' },
  { value: 'analyst_downgrade', label: 'Analyst Downgrades', description: 'When analysts lower their rating or price target for the stock' }
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EventBasedBacktesting: React.FC<EventBasedBacktestingProps> = ({ symbol }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedEventType, setSelectedEventType] = useState<string>('earnings');
  const [entryDelay, setEntryDelay] = useState<number>(1);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(5);
  const [positionSize, setPositionSize] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>('2018-01-01');
  const [endDate, setEndDate] = useState<string>('2023-12-31');
  const [useStopLoss, setUseStopLoss] = useState<boolean>(false);
  const [stopLossPercent, setStopLossPercent] = useState<number>(5);
  const [useTakeProfit, setUseTakeProfit] = useState<boolean>(false);
  const [takeProfitPercent, setTakeProfitPercent] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState<string>('');
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await eventService.runEventBacktest(symbol, {
        eventType: selectedEventType,
        entryDelay,
        holdingPeriod,
        positionSize,
        startDate,
        endDate,
        stopLoss: useStopLoss ? stopLossPercent : undefined,
        takeProfit: useTakeProfit ? takeProfitPercent : undefined
      });
      setBacktestResult(result);
    } catch (err) {
      console.error('Error running backtest:', err);
      setError('Failed to run backtest. Please try again later.');
      setBacktestResult(null);
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!strategyName || !backtestResult) return;
    
    try {
      await eventService.saveEventStrategy({
        name: strategyName,
        symbol,
        eventType: selectedEventType,
        entryDelay,
        holdingPeriod,
        positionSize,
        stopLoss: useStopLoss ? stopLossPercent : undefined,
        takeProfit: useTakeProfit ? takeProfitPercent : undefined,
        performance: {
          totalReturn: backtestResult.summary.totalReturn,
          sharpeRatio: backtestResult.summary.sharpeRatio,
          maxDrawdown: backtestResult.summary.maxDrawdown,
          winRate: backtestResult.summary.winRate
        }
      });
      
      // Show success message or notification
      alert('Strategy saved successfully!');
    } catch (err) {
      console.error('Error saving strategy:', err);
      alert('Failed to save strategy. Please try again.');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Render strategy configuration panel
  const renderStrategyConfigPanel = () => {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Event-Based Strategy Configuration
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="event-type-select-label">Event Type</InputLabel>
            <Select
              labelId="event-type-select-label"
              id="event-type-select"
              value={selectedEventType}
              label="Event Type"
              onChange={(e) => setSelectedEventType(e.target.value)}
            >
              {eventTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Tooltip title={type.description} placement="right">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {type.label}
                    </Box>
                  </Tooltip>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Entry Delay (Days after Event)
            </Typography>
            <Slider
              value={entryDelay}
              min={0}
              max={10}
              step={1}
              marks
              onChange={(_, value) => setEntryDelay(value as number)}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Holding Period (Days)
            </Typography>
            <Slider
              value={holdingPeriod}
              min={1}
              max={30}
              step={1}
              onChange={(_, value) => setHoldingPeriod(value as number)}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <TextField
            label="Position Size ($)"
            type="number"
            value={positionSize}
            onChange={(e) => setPositionSize(Number(e.target.value))}
            fullWidth
            margin="normal"
            InputProps={{ inputProps: { min: 100 } }}
          />
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Risk Management
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={useStopLoss}
                onChange={(e) => setUseStopLoss(e.target.checked)}
              />
            }
            label="Use Stop Loss"
          />
          
          {useStopLoss && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Stop Loss (%)
              </Typography>
              <Slider
                value={stopLossPercent}
                min={1}
                max={20}
                step={0.5}
                onChange={(_, value) => setStopLossPercent(value as number)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
          )}
          
          <FormControlLabel
            control={
              <Switch
                checked={useTakeProfit}
                onChange={(e) => setUseTakeProfit(e.target.checked)}
              />
            }
            label="Use Take Profit"
          />
          
          {useTakeProfit && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Take Profit (%)
              </Typography>
              <Slider
                value={takeProfitPercent}
                min={1}
                max={50}
                step={0.5}
                onChange={(_, value) => setTakeProfitPercent(value as number)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
          )}
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={runBacktest}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            sx={{ mt: 2 }}
          >
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
          
          {backtestResult && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Strategy Name"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={saveStrategy}
                disabled={!strategyName}
                startIcon={<SaveIcon />}
              >
                Save Strategy
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render backtest summary
  const renderBacktestSummary = () => {
    if (!backtestResult) return null;
    
    const { summary } = backtestResult;
    
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backtest Summary
          </Typography>
          
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
              <Typography variant="body2" color="text.secondary">Benchmark Return</Typography>
              <Typography 
                variant="h6" 
                color={summary.benchmarkReturn >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercent(summary.benchmarkReturn)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Alpha</Typography>
              <Typography 
                variant="h6" 
                color={summary.alpha >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercent(summary.alpha)}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
              <Typography variant="h6">{summary.sharpeRatio.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
              <Typography variant="h6" color="error.main">{formatPercent(summary.maxDrawdown)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Win Rate</Typography>
              <Typography variant="h6">{formatPercent(summary.winRate)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Profit Factor</Typography>
              <Typography variant="h6">{summary.profitFactor.toFixed(2)}</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Total Trades</Typography>
              <Typography variant="h6">{summary.totalTrades}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Avg Holding Period</Typography>
              <Typography variant="h6">{summary.averageHoldingPeriod.toFixed(1)} days</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Beta</Typography>
              <Typography variant="h6">{summary.beta.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Benchmark Sharpe</Typography>
              <Typography variant="h6">{summary.benchmarkSharpeRatio.toFixed(2)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render equity curve chart
  const renderEquityCurveChart = () => {
    if (!backtestResult || !backtestResult.equity || backtestResult.equity.length === 0) return null;
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Equity Curve
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={backtestResult.equity}
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
                return [formatPercent(value), name === 'strategy' ? 'Strategy' : 'Benchmark'];
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
            <XAxis dataKey="month" />
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

  // Render drawdowns chart
  const renderDrawdownsChart = () => {
    if (!backtestResult || !backtestResult.drawdowns || backtestResult.drawdowns.length === 0) return null;
    
    // Transform data for chart
    const drawdownData = backtestResult.drawdowns.map((dd, index) => ({
      id: index + 1,
      startDate: formatDate(dd.startDate),
      endDate: formatDate(dd.endDate),
      depth: dd.depthPct,
      duration: dd.durationDays,
      recovery: dd.recoveryDays
    }));
    
    return (
      <Paper sx={{ p: 2, height: '400px', mb: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Drawdowns
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={drawdownData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `${Math.abs(value)}%`} />
            <YAxis dataKey="id" type="category" />
            <RechartsTooltip 
              formatter={(value: any, name: string) => {
                if (name === 'depth') return [formatPercent(Math.abs(value)), 'Depth'];
                return [value, name];
              }}
              labelFormatter={(label) => `Drawdown #${label}`)
            />
            <Legend />
            <Bar dataKey="depth" name="Depth" fill={COLORS[2]}>
              {drawdownData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[2]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render trades table
  const renderTradesTable = () => {
    if (!backtestResult || !backtestResult.trades || backtestResult.trades.length === 0) return null;
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Entry Date</TableCell>
              <TableCell>Exit Date</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell align="right">Entry Price</TableCell>
              <TableCell align="right">Exit Price</TableCell>
              <TableCell align="right">Return</TableCell>
              <TableCell align="right">Holding Period</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backtestResult.trades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(trade.entryDate)}</TableCell>
                <TableCell>{formatDate(trade.exitDate)}</TableCell>
                <TableCell>{eventTypes.find(e => e.value === trade.eventType)?.label || trade.eventType}</TableCell>
                <TableCell align="right">{formatCurrency(trade.entryPrice)}</TableCell>
                <TableCell align="right">{formatCurrency(trade.exitPrice)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{ color: trade.returnPct >= 0 ? 'success.main' : 'error.main' }}
                >
                  {formatPercent(trade.returnPct)}
                </TableCell>
                <TableCell align="right">{trade.holdingPeriod} days</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render drawdowns table
  const renderDrawdownsTable = () => {
    if (!backtestResult || !backtestResult.drawdowns || backtestResult.drawdowns.length === 0) return null;
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="right">Depth</TableCell>
              <TableCell align="right">Duration (Days)</TableCell>
              <TableCell align="right">Recovery (Days)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backtestResult.drawdowns.map((drawdown, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{formatDate(drawdown.startDate)}</TableCell>
                <TableCell>{formatDate(drawdown.endDate)}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>
                  {formatPercent(drawdown.depthPct)}
                </TableCell>
                <TableCell align="right">{drawdown.durationDays}</TableCell>
                <TableCell align="right">{drawdown.recoveryDays}</TableCell>
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
        Event-Based Strategy Backtesting
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderStrategyConfigPanel()}
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
              {renderBacktestSummary()}
              
              <Box sx={{ mt: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="backtest results tabs">
                  <Tab label="Performance" />
                  <Tab label="Monthly Returns" />
                  <Tab label="Drawdowns" />
                  <Tab label="Trades" />
                </Tabs>
                
                <TabPanel value={tabValue} index={0}>
                  {renderEquityCurveChart()}
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  {renderMonthlyReturnsChart()}
                </TabPanel>
                
                <TabPanel value={tabValue} index={2}>
                  {renderDrawdownsChart()}
                  {renderDrawdownsTable()}
                </TabPanel>
                
                <TabPanel value={tabValue} index={3}>
                  {renderTradesTable()}
                </TabPanel>
              </Box>
            </>
          ) : (
            <Paper sx={{ p: 3, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Configure your event-based strategy
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Select an event type and parameters, then run the backtest to see results.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventBasedBacktesting;