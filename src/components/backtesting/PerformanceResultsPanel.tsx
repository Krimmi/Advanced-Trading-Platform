import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

import BacktestingService from '../../services/backtesting/backtestingService';
import PerformanceAnalyticsService from '../../services/backtesting/performanceAnalyticsService';
import { BacktestResult, PerformanceMetrics, BacktestTrade } from '../../types/backtesting';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

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
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface PerformanceResultsPanelProps {
  backtestResult: BacktestResult | null;
}

const PerformanceResultsPanel: React.FC<PerformanceResultsPanelProps> = ({ backtestResult }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [equityCurve, setEquityCurve] = useState<{ timestamp: string; value: number }[]>([]);
  const [drawdownCurve, setDrawdownCurve] = useState<{ timestamp: string; value: number }[]>([]);
  const [monthlyReturns, setMonthlyReturns] = useState<{ year: number; month: number; return: number }[]>([]);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [tradeStatistics, setTradeStatistics] = useState<any>(null);
  const [tradeDistribution, setTradeDistribution] = useState<any>(null);
  
  const backtestingService = new BacktestingService();
  const performanceService = new PerformanceAnalyticsService();
  
  useEffect(() => {
    if (backtestResult) {
      fetchPerformanceData();
    }
  }, [backtestResult]);
  
  const fetchPerformanceData = async () => {
    if (!backtestResult) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all performance data in parallel
      const [equityCurveData, drawdownCurveData, monthlyReturnsData, tradesData, tradeStatsData, tradeDistData] = await Promise.all([
        performanceService.getEquityCurve(backtestResult.id),
        performanceService.getDrawdownCurve(backtestResult.id),
        performanceService.getMonthlyReturns(backtestResult.id),
        backtestingService.getBacktestTrades(backtestResult.id),
        performanceService.getTradeStatistics(backtestResult.id),
        performanceService.getTradeDistribution(backtestResult.id)
      ]);
      
      setEquityCurve(equityCurveData);
      setDrawdownCurve(drawdownCurveData);
      setMonthlyReturns(monthlyReturnsData);
      setTrades(tradesData);
      setTradeStatistics(tradeStatsData);
      setTradeDistribution(tradeDistData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleExportReport = async (format: 'pdf' | 'html' | 'json') => {
    if (!backtestResult) return;
    
    try {
      setLoading(true);
      const reportUrl = await performanceService.exportPerformanceReport(backtestResult.id, format);
      
      // Open the report in a new tab
      window.open(reportUrl, '_blank');
      
      setLoading(false);
    } catch (err) {
      console.error(`Error exporting report as ${format}:`, err);
      setError(`Failed to export report as ${format}. Please try again later.`);
      setLoading(false);
    }
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getReturnColor = (value: number): string => {
    return value >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };
  
  const getReturnIcon = (value: number) => {
    return value >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };
  
  const renderEquityCurveChart = () => {
    if (equityCurve.length === 0) return null;
    
    const data = {
      labels: equityCurve.map(point => new Date(point.timestamp)),
      datasets: [
        {
          label: 'Equity',
          data: equityCurve.map(point => point.value),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light + '40',
          fill: true,
          tension: 0.1
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'day' as const
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Equity ($)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => `Equity: ${formatCurrency(context.parsed.y)}`
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={data} options={options} />
      </Box>
    );
  };
  
  const renderDrawdownChart = () => {
    if (drawdownCurve.length === 0) return null;
    
    const data = {
      labels: drawdownCurve.map(point => new Date(point.timestamp)),
      datasets: [
        {
          label: 'Drawdown',
          data: drawdownCurve.map(point => point.value * -1), // Convert to negative for visual representation
          borderColor: theme.palette.error.main,
          backgroundColor: theme.palette.error.light + '40',
          fill: true,
          tension: 0.1
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'day' as const
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Drawdown (%)'
          },
          reverse: true // Invert the y-axis to show drawdowns as negative values
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => `Drawdown: ${formatPercentage(context.parsed.y * -1)}`
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={data} options={options} />
      </Box>
    );
  };
  
  const renderMonthlyReturnsChart = () => {
    if (monthlyReturns.length === 0) return null;
    
    // Group returns by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = [...new Set(monthlyReturns.map(item => item.year))].sort();
    
    const datasets = years.map(year => {
      const yearData = monthlyReturns.filter(item => item.year === year);
      const monthlyData = Array(12).fill(null);
      
      yearData.forEach(item => {
        monthlyData[item.month - 1] = item.return * 100; // Convert to percentage
      });
      
      return {
        label: year.toString(),
        data: monthlyData,
        backgroundColor: `hsl(${(years.indexOf(year) * 60) % 360}, 70%, 60%)`,
        borderColor: `hsl(${(years.indexOf(year) * 60) % 360}, 70%, 50%)`,
        borderWidth: 1
      };
    });
    
    const data = {
      labels: monthNames,
      datasets
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Return (%)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${formatPercentage(context.parsed.y / 100)}`
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Bar data={data} options={options} />
      </Box>
    );
  };
  
  const renderTradeDistributionChart = () => {
    if (!tradeDistribution) return null;
    
    const { pnlDistribution } = tradeDistribution;
    
    const data = {
      labels: pnlDistribution.map((item: any) => `${formatCurrency(item.bin)}`),
      datasets: [
        {
          label: 'Trade Count',
          data: pnlDistribution.map((item: any) => item.count),
          backgroundColor: pnlDistribution.map((item: any) => 
            item.bin >= 0 ? theme.palette.success.light : theme.palette.error.light
          ),
          borderColor: pnlDistribution.map((item: any) => 
            item.bin >= 0 ? theme.palette.success.main : theme.palette.error.main
          ),
          borderWidth: 1
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'P&L Range'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Number of Trades'
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Bar data={data} options={options} />
      </Box>
    );
  };
  
  const renderWinLossChart = () => {
    if (!tradeStatistics) return null;
    
    const { winningTrades, losingTrades } = tradeStatistics;
    
    const data = {
      labels: ['Winning Trades', 'Losing Trades'],
      datasets: [
        {
          data: [winningTrades, losingTrades],
          backgroundColor: [theme.palette.success.light, theme.palette.error.light],
          borderColor: [theme.palette.success.main, theme.palette.error.main],
          borderWidth: 1
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = winningTrades + losingTrades;
              const percentage = ((value / total) * 100).toFixed(2);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 300 }}>
        <Pie data={data} options={options} />
      </Box>
    );
  };
  
  if (!backtestResult) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No backtest result selected</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please run a backtest or select a result to view performance metrics.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              {backtestResult.configId} Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(backtestResult.startDate)} - {formatDate(backtestResult.endDate)}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('pdf')}
              sx={{ mr: 1 }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => handleExportReport('html')}
            >
              Share
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!loading && !error && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Return
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: getReturnColor(backtestResult.totalReturn) }}>
                    {formatPercentage(backtestResult.totalReturn)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(backtestResult.finalCapital - backtestResult.initialCapital)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Annualized Return
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: getReturnColor(backtestResult.annualizedReturn) }}>
                    {formatPercentage(backtestResult.annualizedReturn)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Max Drawdown
                  </Typography>
                  <Typography variant="h5" component="div" color="error">
                    {formatPercentage(backtestResult.maxDrawdown)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatNumber(backtestResult.sharpeRatio)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance tabs">
              <Tab icon={<TimelineIcon />} iconPosition="start" label="Equity Curve" />
              <Tab icon={<BarChartIcon />} iconPosition="start" label="Returns" />
              <Tab icon={<TableChartIcon />} iconPosition="start" label="Trades" />
              <Tab icon={<PieChartIcon />} iconPosition="start" label="Statistics" />
            </Tabs>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Equity Curve" />
                    <Divider />
                    <CardContent>
                      {renderEquityCurveChart()}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Drawdown" />
                    <Divider />
                    <CardContent>
                      {renderDrawdownChart()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Monthly Returns" />
                    <Divider />
                    <CardContent>
                      {renderMonthlyReturnsChart()}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Return Distribution" />
                    <Divider />
                    <CardContent>
                      {renderTradeDistributionChart()}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Win/Loss Ratio" />
                    <Divider />
                    <CardContent>
                      {renderWinLossChart()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Card>
                <CardHeader title="Trade List" />
                <Divider />
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
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
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.ticker}</TableCell>
                          <TableCell>
                            <Chip
                              label={trade.side === 'buy' ? 'LONG' : 'SHORT'}
                              color={trade.side === 'buy' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(trade.entryDate)}</TableCell>
                          <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                          <TableCell>{trade.exitDate ? formatDate(trade.exitDate) : '-'}</TableCell>
                          <TableCell>{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell sx={{ color: getReturnColor(trade.pnl || 0) }}>
                            {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                          </TableCell>
                          <TableCell sx={{ color: getReturnColor(trade.pnlPercentage || 0) }}>
                            {trade.pnlPercentage ? formatPercentage(trade.pnlPercentage) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Performance Metrics" />
                    <Divider />
                    <CardContent>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Total Return</TableCell>
                              <TableCell align="right" sx={{ color: getReturnColor(backtestResult.totalReturn) }}>
                                {formatPercentage(backtestResult.totalReturn)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Annualized Return</TableCell>
                              <TableCell align="right" sx={{ color: getReturnColor(backtestResult.annualizedReturn) }}>
                                {formatPercentage(backtestResult.annualizedReturn)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Max Drawdown</TableCell>
                              <TableCell align="right" color="error">
                                {formatPercentage(backtestResult.maxDrawdown)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Sharpe Ratio</TableCell>
                              <TableCell align="right">
                                {formatNumber(backtestResult.sharpeRatio)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Sortino Ratio</TableCell>
                              <TableCell align="right">
                                {formatNumber(backtestResult.sortinoRatio)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Calmar Ratio</TableCell>
                              <TableCell align="right">
                                {formatNumber(backtestResult.calmarRatio)}
                              </TableCell>
                            </TableRow>
                            {backtestResult.performanceMetrics?.alpha !== undefined && (
                              <TableRow>
                                <TableCell>Alpha</TableCell>
                                <TableCell align="right">
                                  {formatPercentage(backtestResult.performanceMetrics.alpha)}
                                </TableCell>
                              </TableRow>
                            )}
                            {backtestResult.performanceMetrics?.beta !== undefined && (
                              <TableRow>
                                <TableCell>Beta</TableCell>
                                <TableCell align="right">
                                  {formatNumber(backtestResult.performanceMetrics.beta)}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Trade Statistics" />
                    <Divider />
                    <CardContent>
                      {tradeStatistics && (
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell>Total Trades</TableCell>
                                <TableCell align="right">{tradeStatistics.totalTrades}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Winning Trades</TableCell>
                                <TableCell align="right">{tradeStatistics.winningTrades}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Losing Trades</TableCell>
                                <TableCell align="right">{tradeStatistics.losingTrades}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Win Rate</TableCell>
                                <TableCell align="right">{formatPercentage(tradeStatistics.winRate)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Average Win</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.success.main }}>
                                  {formatCurrency(tradeStatistics.averageWin)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Average Loss</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.error.main }}>
                                  {formatCurrency(tradeStatistics.averageLoss)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Largest Win</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.success.main }}>
                                  {formatCurrency(tradeStatistics.largestWin)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Largest Loss</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.error.main }}>
                                  {formatCurrency(tradeStatistics.largestLoss)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Profit Factor</TableCell>
                                <TableCell align="right">{formatNumber(tradeStatistics.profitFactor)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Average Holding Period</TableCell>
                                <TableCell align="right">{tradeStatistics.averageHoldingPeriod.toFixed(1)} days</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PerformanceResultsPanel;