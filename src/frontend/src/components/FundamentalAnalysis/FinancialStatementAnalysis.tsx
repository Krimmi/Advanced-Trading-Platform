import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  ComposedChart,
  Area
} from 'recharts';
import financialAnalysisService from '../../services/financialAnalysisService';

interface FinancialStatementAnalysisProps {
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
      id={`statement-tabpanel-${index}`}
      aria-labelledby={`statement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Financial statement descriptions
const statementDescriptions = {
  incomeStatement: "The income statement shows a company's revenues, expenses, and profits over a specific period. It provides information about a company's ability to generate profit by increasing revenue, reducing costs, or both.",
  balanceSheet: "The balance sheet provides a snapshot of a company's assets, liabilities, and shareholders' equity at a specific point in time. It shows what a company owns and owes, as well as the amount invested by shareholders.",
  cashFlowStatement: "The cash flow statement shows how changes in balance sheet accounts and income affect cash and cash equivalents. It breaks down the analysis into operating, investing, and financing activities.",
  keyMetrics: "Key metrics provide a quick overview of important financial indicators that help assess a company's performance, financial health, and valuation."
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const FinancialStatementAnalysis: React.FC<FinancialStatementAnalysisProps> = ({ symbol }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [financialData, setFinancialData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<string>('annual');
  const [showPercentageChange, setShowPercentageChange] = useState<boolean>(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  
  useEffect(() => {
    fetchFinancialData();
  }, [symbol, timeframe]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const data = await financialAnalysisService.getFinancialStatements(symbol, timeframe);
      setFinancialData(data);
      
      // Set default selected metrics based on statement type
      if (data && data.incomeStatement && data.incomeStatement.length > 0) {
        if (tabValue === 0) {
          setSelectedMetrics(['revenue', 'grossProfit', 'operatingIncome', 'netIncome']);
        } else if (tabValue === 1) {
          setSelectedMetrics(['totalAssets', 'totalLiabilities', 'totalEquity']);
        } else if (tabValue === 2) {
          setSelectedMetrics(['operatingCashFlow', 'investingCashFlow', 'financingCashFlow', 'freeCashFlow']);
        }
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update selected metrics based on tab
    if (financialData) {
      if (newValue === 0) {
        setSelectedMetrics(['revenue', 'grossProfit', 'operatingIncome', 'netIncome']);
      } else if (newValue === 1) {
        setSelectedMetrics(['totalAssets', 'totalLiabilities', 'totalEquity']);
      } else if (newValue === 2) {
        setSelectedMetrics(['operatingCashFlow', 'investingCashFlow', 'financingCashFlow', 'freeCashFlow']);
      } else if (newValue === 3) {
        setSelectedMetrics(['eps', 'roe', 'roa', 'currentRatio']);
      }
    }
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null) return 'N/A';
    
    if (Math.abs(value) >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  // Format percentage values
  const formatPercentage = (value: number): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Format metric name for display
  const formatMetricName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
  };

  // Get trend direction for a metric
  const getTrendDirection = (data: any[], metric: string): 'up' | 'down' | 'flat' => {
    if (!data || data.length < 2) return 'flat';
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sortedData[0][metric];
    const last = sortedData[sortedData.length - 1][metric];
    
    if (first === undefined || last === undefined) return 'flat';
    
    // Calculate percentage change
    const change = ((last - first) / Math.abs(first)) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'flat';
  };

  // Get color based on metric trend and whether higher is better
  const getTrendColor = (metric: string, trend: 'up' | 'down' | 'flat'): string => {
    // Metrics where higher is generally better
    const higherIsBetter = [
      'revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'eps', 
      'totalAssets', 'totalEquity', 'operatingCashFlow', 'freeCashFlow',
      'roe', 'roa', 'currentRatio', 'quickRatio'
    ];
    
    // Metrics where lower is generally better
    const lowerIsBetter = [
      'totalLiabilities', 'longTermDebt', 'interestExpense'
    ];
    
    // Special cases
    const specialCases = ['investingCashFlow', 'financingCashFlow'];
    
    if (trend === 'flat') return '#757575'; // Gray for flat trend
    
    if (higherIsBetter.includes(metric)) {
      return trend === 'up' ? '#4caf50' : '#f44336'; // Green for up, red for down
    }
    
    if (lowerIsBetter.includes(metric)) {
      return trend === 'down' ? '#4caf50' : '#f44336'; // Green for down, red for up
    }
    
    if (specialCases.includes(metric)) {
      return '#757575'; // Gray for special cases as context matters
    }
    
    // Default case
    return trend === 'up' ? '#4caf50' : '#f44336';
  };

  // Get trend icon based on direction
  const getTrendIcon = (trend: 'up' | 'down' | 'flat', color: string) => {
    if (trend === 'up') return <TrendingUpIcon sx={{ color }} />;
    if (trend === 'down') return <TrendingDownIcon sx={{ color }} />;
    return <TrendingFlatIcon sx={{ color }} />;
  };

  // Calculate year-over-year or quarter-over-quarter percentage change
  const calculatePercentageChange = (data: any[], metric: string): any[] => {
    if (!data || data.length < 2) return [];
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const result = [];
    
    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i][metric];
      const previous = sortedData[i - 1][metric];
      
      if (current === undefined || previous === undefined || previous === 0) {
        result.push({
          ...sortedData[i],
          [metric]: null
        });
      } else {
        const percentChange = ((current - previous) / Math.abs(previous)) * 100;
        result.push({
          ...sortedData[i],
          [metric]: percentChange
        });
      }
    }
    
    return result;
  };

  // Prepare data for charts
  const prepareChartData = (data: any[], metrics: string[]): any[] => {
    if (!data || data.length === 0) return [];
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedData.map(item => {
      const result: any = {
        date: timeframe === 'annual' ? item.year : `Q${item.quarter} ${item.year}`
      };
      
      metrics.forEach(metric => {
        if (showPercentageChange) {
          // For percentage change, we'll calculate it separately
          result[metric] = item[metric];
        } else {
          result[metric] = item[metric];
        }
      });
      
      return result;
    });
  };

  // Get available metrics based on statement type
  const getAvailableMetrics = (): { value: string, label: string }[] => {
    if (!financialData) return [];
    
    let data: any[] = [];
    let commonMetrics: string[] = [];
    
    switch (tabValue) {
      case 0: // Income Statement
        data = financialData.incomeStatement || [];
        commonMetrics = [
          'revenue', 'costOfRevenue', 'grossProfit', 'operatingExpenses', 
          'operatingIncome', 'interestExpense', 'incomeTaxExpense', 'netIncome',
          'ebitda', 'eps', 'sharesOutstanding'
        ];
        break;
      case 1: // Balance Sheet
        data = financialData.balanceSheet || [];
        commonMetrics = [
          'totalAssets', 'currentAssets', 'cash', 'shortTermInvestments',
          'inventory', 'accountsReceivable', 'totalLiabilities', 'currentLiabilities',
          'accountsPayable', 'longTermDebt', 'totalEquity'
        ];
        break;
      case 2: // Cash Flow
        data = financialData.cashFlowStatement || [];
        commonMetrics = [
          'operatingCashFlow', 'capitalExpenditures', 'investingCashFlow',
          'financingCashFlow', 'freeCashFlow', 'dividendsPaid', 'stockRepurchase'
        ];
        break;
      case 3: // Key Metrics
        data = financialData.keyMetrics || [];
        commonMetrics = [
          'eps', 'roe', 'roa', 'currentRatio', 'quickRatio', 'debtToEquity',
          'grossProfitMargin', 'operatingMargin', 'netProfitMargin', 'peRatio',
          'priceToBook', 'dividendYield'
        ];
        break;
    }
    
    // If we have data, extract all available metrics
    if (data.length > 0) {
      const allMetrics = Object.keys(data[0]).filter(key => 
        key !== 'date' && key !== 'year' && key !== 'quarter' && key !== 'period'
      );
      
      // Prioritize common metrics, then add any additional ones
      const availableMetrics = [
        ...commonMetrics.filter(metric => allMetrics.includes(metric)),
        ...allMetrics.filter(metric => !commonMetrics.includes(metric))
      ];
      
      return availableMetrics.map(metric => ({
        value: metric,
        label: formatMetricName(metric)
      }));
    }
    
    return [];
  };

  // Render income statement tab
  const renderIncomeStatementTab = () => {
    if (!financialData || !financialData.incomeStatement) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No income statement data available</Typography>
        </Box>
      );
    }
    
    const data = financialData.incomeStatement;
    const chartData = showPercentageChange 
      ? calculatePercentageChange(data, selectedMetrics[0])
      : prepareChartData(data, selectedMetrics);
    
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="income-metrics-select-label">Select Metrics</InputLabel>
                <Select
                  labelId="income-metrics-select-label"
                  id="income-metrics-select"
                  multiple
                  value={selectedMetrics}
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={formatMetricName(value)} size="small" />
                      ))}
                    </Box>
                  )}
                  label="Select Metrics"
                >
                  {getAvailableMetrics().map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPercentageChange}
                    onChange={(e) => setShowPercentageChange(e.target.checked)}
                  />
                }
                label="Show Year-over-Year % Change"
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ height: 400, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            {showPercentageChange ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}%`, formatMetricName(selectedMetrics[0])]}
                />
                <Legend />
                <Bar 
                  dataKey={selectedMetrics[0]} 
                  name={`${formatMetricName(selectedMetrics[0])} YoY Change`} 
                  fill="#8884d8"
                />
              </BarChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                />
                <RechartsTooltip 
                  formatter={(value: any, name: string) => [formatCurrency(value), formatMetricName(name)]}
                />
                <Legend />
                {selectedMetrics.map((metric, index) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={formatMetricName(metric)}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                {data
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((period) => (
                    <TableCell key={period.date} align="right">
                      {timeframe === 'annual' ? period.year : `Q${period.quarter} ${period.year}`}
                    </TableCell>
                  ))}
                <TableCell align="right">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getAvailableMetrics().map((metric) => {
                const trend = getTrendDirection(data, metric.value);
                const trendColor = getTrendColor(metric.value, trend);
                
                return (
                  <TableRow key={metric.value}>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {metric.label}
                        <Tooltip title={`${metric.label} represents ${metric.value}`}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    {data
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((period) => (
                        <TableCell key={`${period.date}-${metric.value}`} align="right">
                          {typeof period[metric.value] === 'number' 
                            ? formatCurrency(period[metric.value]) 
                            : 'N/A'}
                        </TableCell>
                      ))}
                    <TableCell align="right">
                      {getTrendIcon(trend, trendColor)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Render balance sheet tab
  const renderBalanceSheetTab = () => {
    if (!financialData || !financialData.balanceSheet) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No balance sheet data available</Typography>
        </Box>
      );
    }
    
    const data = financialData.balanceSheet;
    const chartData = showPercentageChange 
      ? calculatePercentageChange(data, selectedMetrics[0])
      : prepareChartData(data, selectedMetrics);
    
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="balance-metrics-select-label">Select Metrics</InputLabel>
                <Select
                  labelId="balance-metrics-select-label"
                  id="balance-metrics-select"
                  multiple
                  value={selectedMetrics}
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={formatMetricName(value)} size="small" />
                      ))}
                    </Box>
                  )}
                  label="Select Metrics"
                >
                  {getAvailableMetrics().map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPercentageChange}
                    onChange={(e) => setShowPercentageChange(e.target.checked)}
                  />
                }
                label="Show Year-over-Year % Change"
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ height: 400, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            {showPercentageChange ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}%`, formatMetricName(selectedMetrics[0])]}
                />
                <Legend />
                <Bar 
                  dataKey={selectedMetrics[0]} 
                  name={`${formatMetricName(selectedMetrics[0])} YoY Change`} 
                  fill="#8884d8"
                />
              </BarChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                />
                <RechartsTooltip 
                  formatter={(value: any, name: string) => [formatCurrency(value), formatMetricName(name)]}
                />
                <Legend />
                {selectedMetrics.map((metric, index) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    name={formatMetricName(metric)}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                {data
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((period) => (
                    <TableCell key={period.date} align="right">
                      {timeframe === 'annual' ? period.year : `Q${period.quarter} ${period.year}`}
                    </TableCell>
                  ))}
                <TableCell align="right">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getAvailableMetrics().map((metric) => {
                const trend = getTrendDirection(data, metric.value);
                const trendColor = getTrendColor(metric.value, trend);
                
                return (
                  <TableRow key={metric.value}>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {metric.label}
                        <Tooltip title={`${metric.label} represents ${metric.value}`}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    {data
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((period) => (
                        <TableCell key={`${period.date}-${metric.value}`} align="right">
                          {typeof period[metric.value] === 'number' 
                            ? formatCurrency(period[metric.value]) 
                            : 'N/A'}
                        </TableCell>
                      ))}
                    <TableCell align="right">
                      {getTrendIcon(trend, trendColor)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Render cash flow statement tab
  const renderCashFlowTab = () => {
    if (!financialData || !financialData.cashFlowStatement) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No cash flow statement data available</Typography>
        </Box>
      );
    }
    
    const data = financialData.cashFlowStatement;
    const chartData = showPercentageChange 
      ? calculatePercentageChange(data, selectedMetrics[0])
      : prepareChartData(data, selectedMetrics);
    
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="cashflow-metrics-select-label">Select Metrics</InputLabel>
                <Select
                  labelId="cashflow-metrics-select-label"
                  id="cashflow-metrics-select"
                  multiple
                  value={selectedMetrics}
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={formatMetricName(value)} size="small" />
                      ))}
                    </Box>
                  )}
                  label="Select Metrics"
                >
                  {getAvailableMetrics().map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPercentageChange}
                    onChange={(e) => setShowPercentageChange(e.target.checked)}
                  />
                }
                label="Show Year-over-Year % Change"
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ height: 400, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            {showPercentageChange ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}%`, formatMetricName(selectedMetrics[0])]}
                />
                <Legend />
                <Bar 
                  dataKey={selectedMetrics[0]} 
                  name={`${formatMetricName(selectedMetrics[0])} YoY Change`} 
                  fill="#8884d8"
                />
              </BarChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                />
                <RechartsTooltip 
                  formatter={(value: any, name: string) => [formatCurrency(value), formatMetricName(name)]}
                />
                <Legend />
                {selectedMetrics.map((metric, index) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    name={formatMetricName(metric)}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                {data
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((period) => (
                    <TableCell key={period.date} align="right">
                      {timeframe === 'annual' ? period.year : `Q${period.quarter} ${period.year}`}
                    </TableCell>
                  ))}
                <TableCell align="right">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getAvailableMetrics().map((metric) => {
                const trend = getTrendDirection(data, metric.value);
                const trendColor = getTrendColor(metric.value, trend);
                
                return (
                  <TableRow key={metric.value}>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {metric.label}
                        <Tooltip title={`${metric.label} represents ${metric.value}`}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    {data
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((period) => (
                        <TableCell key={`${period.date}-${metric.value}`} align="right">
                          {typeof period[metric.value] === 'number' 
                            ? formatCurrency(period[metric.value]) 
                            : 'N/A'}
                        </TableCell>
                      ))}
                    <TableCell align="right">
                      {getTrendIcon(trend, trendColor)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Render key metrics tab
  const renderKeyMetricsTab = () => {
    if (!financialData || !financialData.keyMetrics) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No key metrics data available</Typography>
        </Box>
      );
    }
    
    const data = financialData.keyMetrics;
    const chartData = showPercentageChange 
      ? calculatePercentageChange(data, selectedMetrics[0])
      : prepareChartData(data, selectedMetrics);
    
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="metrics-select-label">Select Metrics</InputLabel>
                <Select
                  labelId="metrics-select-label"
                  id="metrics-select"
                  multiple
                  value={selectedMetrics}
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={formatMetricName(value)} size="small" />
                      ))}
                    </Box>
                  )}
                  label="Select Metrics"
                >
                  {getAvailableMetrics().map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPercentageChange}
                    onChange={(e) => setShowPercentageChange(e.target.checked)}
                  />
                }
                label="Show Year-over-Year % Change"
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ height: 400, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            {showPercentageChange ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}%`, formatMetricName(selectedMetrics[0])]}
                />
                <Legend />
                <Bar 
                  dataKey={selectedMetrics[0]} 
                  name={`${formatMetricName(selectedMetrics[0])} YoY Change`} 
                  fill="#8884d8"
                />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                {selectedMetrics.map((metric, index) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={formatMetricName(metric)}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                {data
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((period) => (
                    <TableCell key={period.date} align="right">
                      {timeframe === 'annual' ? period.year : `Q${period.quarter} ${period.year}`}
                    </TableCell>
                  ))}
                <TableCell align="right">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getAvailableMetrics().map((metric) => {
                const trend = getTrendDirection(data, metric.value);
                const trendColor = getTrendColor(metric.value, trend);
                
                // Determine if this metric should be formatted as currency or percentage
                const isPercentageMetric = [
                  'roe', 'roa', 'grossProfitMargin', 'operatingMargin', 'netProfitMargin',
                  'dividendYield', 'payoutRatio'
                ].includes(metric.value);
                
                return (
                  <TableRow key={metric.value}>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {metric.label}
                        <Tooltip title={`${metric.label} represents ${metric.value}`}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    {data
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((period) => (
                        <TableCell key={`${period.date}-${metric.value}`} align="right">
                          {typeof period[metric.value] === 'number' 
                            ? isPercentageMetric 
                              ? formatPercentage(period[metric.value]) 
                              : formatCurrency(period[metric.value])
                            : 'N/A'}
                        </TableCell>
                      ))}
                    <TableCell align="right">
                      {getTrendIcon(trend, trendColor)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="h6">Financial Statement Analysis</Typography>
          </Grid>
          <Grid item xs>
            <Tooltip title={statementDescriptions[['incomeStatement', 'balanceSheet', 'cashFlowStatement', 'keyMetrics'][tabValue]]}>
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-select-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <MenuItem value="annual">Annual</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="financial statement tabs">
          <Tab label="Income Statement" />
          <Tab label="Balance Sheet" />
          <Tab label="Cash Flow" />
          <Tab label="Key Metrics" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            {renderIncomeStatementTab()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderBalanceSheetTab()}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderCashFlowTab()}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {renderKeyMetricsTab()}
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default FinancialStatementAnalysis;