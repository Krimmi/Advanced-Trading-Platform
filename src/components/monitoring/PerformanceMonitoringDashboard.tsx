import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

import VirtualizedTable from '../common/VirtualizedTable.optimized';
import { useComponentPerformance } from '../../utils/withPerformanceTracking.optimized';
import PerformanceMonitor from '../../utils/performanceMonitor.optimized';

// Mock service for performance monitoring
// In a real application, this would be replaced with actual API calls
const PerformanceService = {
  getApiPerformance: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate time series data
    const now = new Date();
    const data = Array.from({ length: 24 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        responseTime: 50 + Math.random() * 150,
        throughput: 100 + Math.random() * 400,
        errorRate: Math.random() * 2,
        endpoint: i % 5 === 0 ? '/api/market/quotes' : 
                 i % 5 === 1 ? '/api/portfolio/summary' : 
                 i % 5 === 2 ? '/api/analytics/risk' : 
                 i % 5 === 3 ? '/api/user/preferences' : '/api/watchlist'
      };
    });
    
    // Top endpoints by response time
    const endpoints = [
      { endpoint: '/api/analytics/risk/var', responseTime: 245, throughput: 120, errorRate: 0.5 },
      { endpoint: '/api/market/historical', responseTime: 189, throughput: 350, errorRate: 0.2 },
      { endpoint: '/api/portfolio/performance', responseTime: 156, throughput: 280, errorRate: 0.1 },
      { endpoint: '/api/market/quotes', responseTime: 98, throughput: 520, errorRate: 0.05 },
      { endpoint: '/api/watchlist', responseTime: 76, throughput: 410, errorRate: 0.03 },
      { endpoint: '/api/user/preferences', responseTime: 45, throughput: 180, errorRate: 0.01 },
      { endpoint: '/api/auth/validate', responseTime: 32, throughput: 620, errorRate: 0.02 }
    ];
    
    return {
      timeSeriesData: data,
      endpoints,
      averageResponseTime: data.reduce((sum, item) => sum + item.responseTime, 0) / data.length,
      averageThroughput: data.reduce((sum, item) => sum + item.throughput, 0) / data.length,
      averageErrorRate: data.reduce((sum, item) => sum + item.errorRate, 0) / data.length,
      totalRequests: data.reduce((sum, item) => sum + item.throughput, 0)
    };
  },
  
  getDatabasePerformance: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate time series data
    const now = new Date();
    const data = Array.from({ length: 24 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        queryTime: 30 + Math.random() * 100,
        throughput: 80 + Math.random() * 300,
        connectionPoolUsage: 20 + Math.random() * 60,
        queryType: i % 4 === 0 ? 'SELECT' : i % 4 === 1 ? 'INSERT' : i % 4 === 2 ? 'UPDATE' : 'DELETE'
      };
    });
    
    // Top queries by execution time
    const queries = [
      { query: 'SELECT * FROM market_data WHERE symbol IN (...) AND date BETWEEN ? AND ?', executionTime: 320, count: 450, type: 'SELECT' },
      { query: 'SELECT * FROM portfolio_positions JOIN securities ON ... WHERE portfolio_id = ?', executionTime: 245, count: 380, type: 'SELECT' },
      { query: 'UPDATE user_preferences SET settings = ? WHERE user_id = ?', executionTime: 120, count: 210, type: 'UPDATE' },
      { query: 'INSERT INTO trade_history (user_id, symbol, quantity, price, ...) VALUES (?, ?, ?, ?, ...)', executionTime: 95, count: 520, type: 'INSERT' },
      { query: 'SELECT AVG(price) FROM trade_history WHERE symbol = ? GROUP BY date', executionTime: 85, count: 320, type: 'SELECT' },
      { query: 'DELETE FROM user_alerts WHERE expiry < NOW()', executionTime: 75, count: 180, type: 'DELETE' }
    ];
    
    return {
      timeSeriesData: data,
      queries,
      averageQueryTime: data.reduce((sum, item) => sum + item.queryTime, 0) / data.length,
      averageThroughput: data.reduce((sum, item) => sum + item.throughput, 0) / data.length,
      averageConnectionPoolUsage: data.reduce((sum, item) => sum + item.connectionPoolUsage, 0) / data.length,
      queryTypeDistribution: {
        SELECT: data.filter(item => item.queryType === 'SELECT').length,
        INSERT: data.filter(item => item.queryType === 'INSERT').length,
        UPDATE: data.filter(item => item.queryType === 'UPDATE').length,
        DELETE: data.filter(item => item.queryType === 'DELETE').length
      }
    };
  },
  
  getFrontendPerformance: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 550));
    
    // Get actual performance metrics from PerformanceMonitor
    const componentMetrics = PerformanceMonitor.getComponentMetrics();
    const dataProcessingMetrics = PerformanceMonitor.getDataProcessingMetrics();
    const networkMetrics = PerformanceMonitor.getNetworkMetrics();
    const webSocketMetrics = PerformanceMonitor.getWebSocketMetrics();
    const performanceSummary = PerformanceMonitor.getPerformanceSummary();
    
    // Generate time series data for page load metrics
    const now = new Date();
    const pageLoadData = Array.from({ length: 24 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        firstContentfulPaint: 800 + Math.random() * 400,
        domInteractive: 1200 + Math.random() * 600,
        domComplete: 1800 + Math.random() * 800,
        loadEvent: 2000 + Math.random() * 1000
      };
    });
    
    return {
      componentMetrics,
      dataProcessingMetrics,
      networkMetrics,
      webSocketMetrics,
      performanceSummary,
      pageLoadData,
      averages: {
        componentRenderTime: componentMetrics.length > 0 
          ? componentMetrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / componentMetrics.length 
          : 0,
        dataProcessingTime: dataProcessingMetrics.length > 0 
          ? dataProcessingMetrics.reduce((sum, m) => sum + m.averageProcessingTime, 0) / dataProcessingMetrics.length 
          : 0,
        networkResponseTime: networkMetrics.length > 0 
          ? networkMetrics.reduce((sum, m) => sum + m.responseTime, 0) / networkMetrics.length 
          : 0,
        webSocketProcessingTime: webSocketMetrics.length > 0 
          ? webSocketMetrics.reduce((sum, m) => sum + m.processingTime, 0) / webSocketMetrics.length 
          : 0
      }
    };
  }
};

interface PerformanceMonitoringDashboardProps {
  refreshInterval?: number; // in milliseconds
  onSettingsClick?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
});

const PerformanceMonitoringDashboard: React.FC<PerformanceMonitoringDashboardProps> = ({
  refreshInterval = 30000, // Default to 30 seconds
  onSettingsClick
}) => {
  const theme = useTheme();
  const { trackOperation } = useComponentPerformance('PerformanceMonitoringDashboard');
  
  // State for data
  const [apiPerformance, setApiPerformance] = useState<any>(null);
  const [databasePerformance, setDatabasePerformance] = useState<any>(null);
  const [frontendPerformance, setFrontendPerformance] = useState<any>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('24h');
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main
  ];
  
  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [apiData, dbData, frontendData] = await Promise.all([
        PerformanceService.getApiPerformance(),
        PerformanceService.getDatabasePerformance(),
        PerformanceService.getFrontendPerformance()
      ]);
      
      setApiPerformance(apiData);
      setDatabasePerformance(dbData);
      setFrontendPerformance(frontendData);
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to fetch performance data. Please try again later.');
      setLoading(false);
    }
  }, []);
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Auto-refresh setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchData();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, fetchData, refreshInterval]);
  
  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);
  
  // Handle time range change
  const handleTimeRangeChange = useCallback((event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // Toggle auto refresh
  const handleAutoRefreshToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(event.target.checked);
  }, []);
  
  // Format date
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);
  
  // Format time in ms
  const formatTime = useCallback((time: number): string => {
    return `${time.toFixed(2)} ms`;
  }, []);
  
  // Get color based on response time
  const getResponseTimeColor = useCallback((time: number): string => {
    if (time > 200) {
      return theme.palette.error.main;
    } else if (time > 100) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.success.main;
    }
  }, [theme]);
  
  // Memoized components for better performance
  
  // API Performance Panel
  const apiPerformancePanel = useMemo(() => {
    if (!apiPerformance) return null;
    
    const { timeSeriesData, endpoints, averageResponseTime, averageThroughput, averageErrorRate, totalRequests } = apiPerformance;
    
    // Format timestamp for display
    const formattedData = timeSeriesData.map((item: any) => ({
      ...item,
      formattedTime: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    
    // Columns for endpoints table
    const columns = [
      { id: 'endpoint', label: 'Endpoint', minWidth: 200 },
      { 
        id: 'responseTime', 
        label: 'Avg Response Time', 
        minWidth: 150,
        align: 'right' as const,
        format: (value: number) => (
          <Typography 
            variant="body2" 
            sx={{ color: getResponseTimeColor(value) }}
          >
            {formatTime(value)}
          </Typography>
        )
      },
      { 
        id: 'throughput', 
        label: 'Requests/Hour', 
        minWidth: 120,
        align: 'right' as const
      },
      { 
        id: 'errorRate', 
        label: 'Error Rate', 
        minWidth: 100,
        align: 'right' as const,
        format: (value: number) => (
          <Typography 
            variant="body2" 
            sx={{ color: value > 1 ? theme.palette.error.main : theme.palette.text.primary }}
          >
            {value.toFixed(2)}%
          </Typography>
        )
      }
    ];
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="API Response Time" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis unit="ms" />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      name="Response Time" 
                      stroke={theme.palette.primary.main} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="API Metrics Summary" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Response Time
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getResponseTimeColor(averageResponseTime) }}
                    >
                      {formatTime(averageResponseTime)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Throughput
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(averageThroughput)}/hr
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography 
                      variant="h6"
                      sx={{ color: averageErrorRate > 1 ? theme.palette.error.main : theme.palette.text.primary }}
                    >
                      {averageErrorRate.toFixed(2)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Requests
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(totalRequests)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  API Throughput & Error Rate
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedTime" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="throughput" 
                        name="Throughput" 
                        fill={theme.palette.primary.light}
                        stroke={theme.palette.primary.main}
                        fillOpacity={0.3}
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="errorRate" 
                        name="Error Rate" 
                        fill={theme.palette.error.light}
                        stroke={theme.palette.error.main}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="API Endpoints Performance" />
            <Divider />
            <CardContent>
              <VirtualizedTable
                columns={columns}
                data={endpoints}
                maxHeight={350}
                virtualizationThreshold={20}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [apiPerformance, formatTime, getResponseTimeColor, theme]);
  
  // Database Performance Panel
  const databasePerformancePanel = useMemo(() => {
    if (!databasePerformance) return null;
    
    const { timeSeriesData, queries, averageQueryTime, averageThroughput, averageConnectionPoolUsage, queryTypeDistribution } = databasePerformance;
    
    // Format timestamp for display
    const formattedData = timeSeriesData.map((item: any) => ({
      ...item,
      formattedTime: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    
    // Prepare data for query type distribution chart
    const queryTypeData = Object.entries(queryTypeDistribution).map(([name, value]) => ({
      name,
      value
    }));
    
    // Columns for queries table
    const columns = [
      { id: 'query', label: 'Query', minWidth: 300 },
      { 
        id: 'executionTime', 
        label: 'Execution Time', 
        minWidth: 150,
        align: 'right' as const,
        format: (value: number) => (
          <Typography 
            variant="body2" 
            sx={{ color: getResponseTimeColor(value) }}
          >
            {formatTime(value)}
          </Typography>
        )
      },
      { 
        id: 'count', 
        label: 'Execution Count', 
        minWidth: 150,
        align: 'right' as const
      },
      { 
        id: 'type', 
        label: 'Type', 
        minWidth: 100,
        format: (value: string) => (
          <Typography 
            variant="body2" 
            sx={{ 
              color: value === 'SELECT' ? theme.palette.info.main : 
                    value === 'INSERT' ? theme.palette.success.main :
                    value === 'UPDATE' ? theme.palette.warning.main :
                    theme.palette.error.main
            }}
          >
            {value}
          </Typography>
        )
      }
    ];
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Database Query Time" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis unit="ms" />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="queryTime" 
                      name="Query Time" 
                      stroke={theme.palette.secondary.main} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Database Metrics Summary" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Query Time
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getResponseTimeColor(averageQueryTime) }}
                    >
                      {formatTime(averageQueryTime)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Throughput
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(averageThroughput)}/hr
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Connection Pool Usage
                    </Typography>
                    <Typography variant="h6">
                      {averageConnectionPoolUsage.toFixed(1)}%
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={averageConnectionPoolUsage} 
                        color={averageConnectionPoolUsage > 80 ? "error" : averageConnectionPoolUsage > 60 ? "warning" : "primary"}
                      />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Query Type Distribution
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={queryTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {queryTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Database Queries Performance" />
            <Divider />
            <CardContent>
              <VirtualizedTable
                columns={columns}
                data={queries}
                maxHeight={350}
                virtualizationThreshold={20}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Database Metrics Over Time" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="throughput" 
                      name="Throughput" 
                      stroke={theme.palette.primary.main} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="connectionPoolUsage" 
                      name="Connection Pool Usage (%)" 
                      stroke={theme.palette.warning.main} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [databasePerformance, formatTime, getResponseTimeColor, theme, COLORS]);
  
  // Frontend Performance Panel
  const frontendPerformancePanel = useMemo(() => {
    if (!frontendPerformance) return null;
    
    const { componentMetrics, dataProcessingMetrics, networkMetrics, pageLoadData, averages } = frontendPerformance;
    
    // Format timestamp for display
    const formattedPageLoadData = pageLoadData.map((item: any) => ({
      ...item,
      formattedTime: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    
    // Prepare data for component render time chart
    const componentChartData = componentMetrics
      .filter((metric: any) => metric.renderCount > 0)
      .sort((a: any, b: any) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 10)
      .map((metric: any) => ({
        name: metric.componentId.length > 20 
          ? `${metric.componentId.substring(0, 17)}...` 
          : metric.componentId,
        averageRenderTime: metric.averageRenderTime,
        maxRenderTime: metric.maxRenderTime,
        renderCount: metric.renderCount
      }));
    
    // Prepare data for data processing chart
    const dataProcessingChartData = dataProcessingMetrics
      .filter((metric: any) => metric.operationCount > 0)
      .sort((a: any, b: any) => b.averageProcessingTime - a.averageProcessingTime)
      .slice(0, 10)
      .map((metric: any) => ({
        name: metric.operationId.length > 20 
          ? `${metric.operationId.substring(0, 17)}...` 
          : metric.operationId,
        averageProcessingTime: metric.averageProcessingTime,
        maxProcessingTime: metric.maxProcessingTime,
        operationCount: metric.operationCount
      }));
    
    // Columns for component metrics table
    const componentColumns = [
      { id: 'componentId', label: 'Component', minWidth: 200 },
      { 
        id: 'renderCount', 
        label: 'Render Count', 
        minWidth: 120,
        align: 'right' as const
      },
      { 
        id: 'averageRenderTime', 
        label: 'Avg Render Time', 
        minWidth: 150,
        align: 'right' as const,
        format: (value: number) => (
          <Typography 
            variant="body2" 
            sx={{ color: getResponseTimeColor(value) }}
          >
            {formatTime(value)}
          </Typography>
        )
      },
      { 
        id: 'maxRenderTime', 
        label: 'Max Render Time', 
        minWidth: 150,
        align: 'right' as const,
        format: (value: number) => (
          <Typography 
            variant="body2" 
            sx={{ color: getResponseTimeColor(value) }}
          >
            {formatTime(value)}
          </Typography>
        )
      },
      { 
        id: 'lastRenderTime', 
        label: 'Last Render Time', 
        minWidth: 150,
        align: 'right' as const,
        format: (value: number) => (
          <Typography 
            variant="body2" 
            sx={{ color: getResponseTimeColor(value) }}
          >
            {formatTime(value)}
          </Typography>
        )
      }
    ];
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Page Load Performance" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedPageLoadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis unit="ms" />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="firstContentfulPaint" 
                      name="First Contentful Paint" 
                      stroke={theme.palette.success.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="domInteractive" 
                      name="DOM Interactive" 
                      stroke={theme.palette.info.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="domComplete" 
                      name="DOM Complete" 
                      stroke={theme.palette.warning.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="loadEvent" 
                      name="Load Event" 
                      stroke={theme.palette.error.main} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Component Render Performance" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={componentChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit=" ms" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)} ms`,
                        name === 'averageRenderTime' ? 'Average Render Time' : 'Max Render Time'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="averageRenderTime"
                      name="Average Render Time"
                      fill={theme.palette.primary.main}
                    />
                    <Bar
                      dataKey="maxRenderTime"
                      name="Max Render Time"
                      fill={theme.palette.secondary.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Data Processing Performance" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataProcessingChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit=" ms" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)} ms`,
                        name === 'averageProcessingTime' ? 'Average Processing Time' : 'Max Processing Time'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="averageProcessingTime"
                      name="Average Processing Time"
                      fill={theme.palette.info.main}
                    />
                    <Bar
                      dataKey="maxProcessingTime"
                      name="Max Processing Time"
                      fill={theme.palette.warning.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Component Metrics" />
            <Divider />
            <CardContent>
              <VirtualizedTable
                columns={componentColumns}
                data={componentMetrics}
                maxHeight={350}
                virtualizationThreshold={20}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Performance Summary" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Component Render
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getResponseTimeColor(averages.componentRenderTime) }}
                    >
                      {formatTime(averages.componentRenderTime)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Data Processing
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getResponseTimeColor(averages.dataProcessingTime) }}
                    >
                      {formatTime(averages.dataProcessingTime)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Network Response
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getResponseTimeColor(averages.networkResponseTime) }}
                    >
                      {formatTime(averages.networkResponseTime)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg WebSocket Processing
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getResponseTimeColor(averages.webSocketProcessingTime) }}
                    >
                      {formatTime(averages.webSocketProcessingTime)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    // In a real app, this would download a performance report
                    alert('Performance report download would start here');
                  }}
                >
                  Download Performance Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [frontendPerformance, formatTime, getResponseTimeColor, theme]);
  
  // Render loading state
  if (loading && !apiPerformance && !databasePerformance && !frontendPerformance) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SpeedIcon sx={{ mr: 1 }} />
              <Typography variant="h5" component="h1">
                Performance Monitoring Dashboard
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {lastUpdated ? (
                `Last updated: ${lastUpdated.toLocaleString()}`
              ) : (
                'Loading performance data...'
              )}
            </Typography>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                id="time-range-select"
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                  color="primary"
                />
              }
              label="Auto Refresh"
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} sx={{ mr: 1 }} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={onSettingsClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<NetworkCheckIcon />} iconPosition="start" label="API Performance" />
          <Tab icon={<StorageIcon />} iconPosition="start" label="Database Performance" />
          <Tab icon={<CodeIcon />} iconPosition="start" label="Frontend Performance" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {apiPerformancePanel}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {databasePerformancePanel}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {frontendPerformancePanel}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default React.memo(PerformanceMonitoringDashboard);