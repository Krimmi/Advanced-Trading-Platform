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
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
  Cell
} from 'recharts';

import VirtualizedTable from '../common/VirtualizedTable.optimized';
import { useComponentPerformance } from '../../utils/withPerformanceTracking.optimized';

// Mock service for system health monitoring
// In a real application, this would be replaced with actual API calls
const SystemHealthService = {
  getSystemHealth: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      status: 'healthy',
      uptime: 1209600, // 14 days in seconds
      lastChecked: new Date().toISOString(),
      services: [
        { name: 'API Server', status: 'healthy', responseTime: 42, errorRate: 0.01 },
        { name: 'Database', status: 'healthy', responseTime: 78, errorRate: 0.02 },
        { name: 'Cache', status: 'healthy', responseTime: 12, errorRate: 0 },
        { name: 'Authentication', status: 'healthy', responseTime: 56, errorRate: 0.05 },
        { name: 'WebSocket', status: 'degraded', responseTime: 145, errorRate: 1.2 },
        { name: 'File Storage', status: 'healthy', responseTime: 89, errorRate: 0.03 }
      ],
      resources: {
        cpu: { usage: 42, available: 100 },
        memory: { usage: 6.2, available: 16, unit: 'GB' },
        disk: { usage: 128, available: 512, unit: 'GB' },
        connections: { current: 256, max: 1000 }
      },
      errors: [
        { service: 'WebSocket', message: 'Connection timeout', count: 12, lastOccurred: '2025-08-14T10:23:45Z', severity: 'warning' },
        { service: 'API Server', message: 'Rate limit exceeded', count: 3, lastOccurred: '2025-08-14T09:15:22Z', severity: 'warning' },
        { service: 'Database', message: 'Query timeout', count: 1, lastOccurred: '2025-08-14T08:45:12Z', severity: 'error' }
      ]
    };
  },
  
  getPerformanceMetrics: async (period: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Generate time series data based on period
    const now = new Date();
    const points = period === '1h' ? 12 : period === '24h' ? 24 : 14;
    const interval = period === '1h' ? 5 * 60 * 1000 : period === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    const timeSeriesData = Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now.getTime() - (points - i - 1) * interval);
      return {
        timestamp: timestamp.toISOString(),
        apiResponseTime: 30 + Math.random() * 50,
        dbResponseTime: 50 + Math.random() * 100,
        cacheHitRatio: 0.7 + Math.random() * 0.25,
        errorRate: Math.random() * 2,
        cpuUsage: 30 + Math.random() * 30,
        memoryUsage: 50 + Math.random() * 20,
        activeUsers: 100 + Math.random() * 200
      };
    });
    
    return {
      period,
      timeSeriesData,
      averages: {
        apiResponseTime: timeSeriesData.reduce((sum, item) => sum + item.apiResponseTime, 0) / points,
        dbResponseTime: timeSeriesData.reduce((sum, item) => sum + item.dbResponseTime, 0) / points,
        cacheHitRatio: timeSeriesData.reduce((sum, item) => sum + item.cacheHitRatio, 0) / points,
        errorRate: timeSeriesData.reduce((sum, item) => sum + item.errorRate, 0) / points,
        cpuUsage: timeSeriesData.reduce((sum, item) => sum + item.cpuUsage, 0) / points,
        memoryUsage: timeSeriesData.reduce((sum, item) => sum + item.memoryUsage, 0) / points,
        activeUsers: timeSeriesData.reduce((sum, item) => sum + item.activeUsers, 0) / points
      }
    };
  },
  
  getAlertHistory: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      { id: 1, service: 'WebSocket', message: 'Connection timeout', severity: 'warning', timestamp: '2025-08-14T10:23:45Z', resolved: false },
      { id: 2, service: 'API Server', message: 'Rate limit exceeded', severity: 'warning', timestamp: '2025-08-14T09:15:22Z', resolved: true },
      { id: 3, service: 'Database', message: 'Query timeout', severity: 'error', timestamp: '2025-08-14T08:45:12Z', resolved: false },
      { id: 4, service: 'Authentication', message: 'Failed login attempts', severity: 'warning', timestamp: '2025-08-14T07:30:18Z', resolved: true },
      { id: 5, service: 'File Storage', message: 'Low disk space', severity: 'error', timestamp: '2025-08-14T06:12:33Z', resolved: true },
      { id: 6, service: 'Cache', message: 'Cache eviction rate high', severity: 'info', timestamp: '2025-08-14T05:45:51Z', resolved: true },
      { id: 7, service: 'API Server', message: 'High latency detected', severity: 'warning', timestamp: '2025-08-14T04:22:07Z', resolved: true },
      { id: 8, service: 'Database', message: 'Connection pool exhausted', severity: 'error', timestamp: '2025-08-14T03:18:29Z', resolved: true },
      { id: 9, service: 'WebSocket', message: 'Message queue overflow', severity: 'warning', timestamp: '2025-08-14T02:05:14Z', resolved: true },
      { id: 10, service: 'Authentication', message: 'Token validation errors', severity: 'info', timestamp: '2025-08-14T01:42:38Z', resolved: true }
    ];
  }
};

interface SystemHealthDashboardProps {
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
      id={`health-tabpanel-${index}`}
      aria-labelledby={`health-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
});

const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  refreshInterval = 30000, // Default to 30 seconds
  onSettingsClick
}) => {
  const theme = useTheme();
  const { trackOperation } = useComponentPerformance('SystemHealthDashboard');
  
  // State for data
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('24h');
  
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
      const [healthData, metricsData, alertsData] = await Promise.all([
        SystemHealthService.getSystemHealth(),
        SystemHealthService.getPerformanceMetrics(selectedPeriod),
        SystemHealthService.getAlertHistory()
      ]);
      
      setSystemHealth(healthData);
      setPerformanceMetrics(metricsData);
      setAlertHistory(alertsData);
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching system health data:', err);
      setError('Failed to fetch system health data. Please try again later.');
      setLoading(false);
    }
  }, [selectedPeriod]);
  
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
  
  // Handle period change
  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // Toggle auto refresh
  const handleAutoRefreshToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(event.target.checked);
  }, []);
  
  // Format uptime
  const formatUptime = useCallback((seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  }, []);
  
  // Format date
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);
  
  // Get status color
  const getStatusColor = useCallback((status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return theme.palette.success.main;
      case 'degraded':
        return theme.palette.warning.main;
      case 'unhealthy':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  }, [theme]);
  
  // Get severity color
  const getSeverityColor = useCallback((severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  }, [theme]);
  
  // Get severity icon
  const getSeverityIcon = useCallback((severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return <ErrorOutlineIcon sx={{ color: theme.palette.error.main }} />;
      case 'warning':
        return <WarningAmberIcon sx={{ color: theme.palette.warning.main }} />;
      case 'info':
        return <CheckCircleOutlineIcon sx={{ color: theme.palette.info.main }} />;
      default:
        return null;
    }
  }, [theme]);
  
  // Memoized components for better performance
  
  // System status overview
  const systemStatusOverview = useMemo(() => {
    if (!systemHealth) return null;
    
    return (
      <Card>
        <CardHeader 
          title="System Status" 
          subheader={`Last updated: ${lastUpdated ? lastUpdated.toLocaleString() : 'Loading...'}`}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(systemHealth.status),
                    mr: 1
                  }}
                />
                <Typography variant="h6" component="span">
                  {systemHealth.status === 'healthy' ? 'All Systems Operational' : 'System Degraded'}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                System Uptime: {formatUptime(systemHealth.uptime)}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Resource Utilization
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">CPU</Typography>
                    <Typography variant="body2">{systemHealth.resources.cpu.usage}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={systemHealth.resources.cpu.usage} 
                    color={systemHealth.resources.cpu.usage > 80 ? "error" : systemHealth.resources.cpu.usage > 60 ? "warning" : "primary"}
                  />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Memory</Typography>
                    <Typography variant="body2">
                      {systemHealth.resources.memory.usage} / {systemHealth.resources.memory.available} {systemHealth.resources.memory.unit}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(systemHealth.resources.memory.usage / systemHealth.resources.memory.available) * 100} 
                    color={(systemHealth.resources.memory.usage / systemHealth.resources.memory.available) > 0.8 ? "error" : (systemHealth.resources.memory.usage / systemHealth.resources.memory.available) > 0.6 ? "warning" : "primary"}
                  />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Disk</Typography>
                    <Typography variant="body2">
                      {systemHealth.resources.disk.usage} / {systemHealth.resources.disk.available} {systemHealth.resources.disk.unit}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(systemHealth.resources.disk.usage / systemHealth.resources.disk.available) * 100} 
                    color={(systemHealth.resources.disk.usage / systemHealth.resources.disk.available) > 0.8 ? "error" : (systemHealth.resources.disk.usage / systemHealth.resources.disk.available) > 0.6 ? "warning" : "primary"}
                  />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Connections</Typography>
                    <Typography variant="body2">
                      {systemHealth.resources.connections.current} / {systemHealth.resources.connections.max}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(systemHealth.resources.connections.current / systemHealth.resources.connections.max) * 100} 
                    color={(systemHealth.resources.connections.current / systemHealth.resources.connections.max) > 0.8 ? "error" : (systemHealth.resources.connections.current / systemHealth.resources.connections.max) > 0.6 ? "warning" : "primary"}
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Service Status
              </Typography>
              
              {systemHealth.services.map((service: any) => (
                <Box key={service.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: getStatusColor(service.status),
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {service.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.responseTime}ms
                  </Typography>
                  <Chip 
                    label={`${service.errorRate.toFixed(2)}% errors`}
                    size="small"
                    sx={{ 
                      ml: 1, 
                      bgcolor: service.errorRate > 1 ? theme.palette.error.light : theme.palette.background.paper,
                      color: service.errorRate > 1 ? theme.palette.error.contrastText : theme.palette.text.primary
                    }}
                  />
                </Box>
              ))}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Errors
                </Typography>
                
                {systemHealth.errors.length > 0 ? (
                  systemHealth.errors.map((error: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getSeverityIcon(error.severity)}
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2">
                          {error.service}: {error.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {error.count} occurrences, last at {formatDate(error.lastOccurred)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent errors
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }, [systemHealth, lastUpdated, formatUptime, formatDate, getStatusColor, getSeverityIcon, theme]);
  
  // Performance metrics charts
  const performanceMetricsCharts = useMemo(() => {
    if (!performanceMetrics) return null;
    
    const { timeSeriesData, averages } = performanceMetrics;
    
    // Format timestamp for display
    const formattedData = timeSeriesData.map((item: any) => ({
      ...item,
      formattedTime: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Performance Metrics" 
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    variant={selectedPeriod === '1h' ? 'contained' : 'outlined'} 
                    size="small" 
                    onClick={() => handlePeriodChange('1h')}
                    sx={{ mr: 1 }}
                  >
                    1h
                  </Button>
                  <Button 
                    variant={selectedPeriod === '24h' ? 'contained' : 'outlined'} 
                    size="small" 
                    onClick={() => handlePeriodChange('24h')}
                    sx={{ mr: 1 }}
                  >
                    24h
                  </Button>
                  <Button 
                    variant={selectedPeriod === '7d' ? 'contained' : 'outlined'} 
                    size="small" 
                    onClick={() => handlePeriodChange('7d')}
                  >
                    7d
                  </Button>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Response Times
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedTime" />
                        <YAxis unit="ms" />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="apiResponseTime" 
                          name="API Response" 
                          stroke={theme.palette.primary.main} 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="dbResponseTime" 
                          name="DB Response" 
                          stroke={theme.palette.secondary.main} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    System Resources
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedTime" />
                        <YAxis unit="%" />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="cpuUsage" 
                          name="CPU Usage" 
                          stroke={theme.palette.error.main} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="memoryUsage" 
                          name="Memory Usage" 
                          stroke={theme.palette.warning.main} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error Rate
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="formattedTime" />
                        <YAxis unit="%" />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="errorRate" 
                          name="Error Rate" 
                          stroke={theme.palette.error.main} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cache Hit Ratio & Active Users
                  </Typography>
                  <Box sx={{ height: 250 }}>
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
                          dataKey="cacheHitRatio" 
                          name="Cache Hit Ratio" 
                          stroke={theme.palette.success.main} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="activeUsers" 
                          name="Active Users" 
                          stroke={theme.palette.info.main} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg API Response
                        </Typography>
                        <Typography variant="h6">
                          {averages.apiResponseTime.toFixed(2)} ms
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg DB Response
                        </Typography>
                        <Typography variant="h6">
                          {averages.dbResponseTime.toFixed(2)} ms
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Cache Hit Ratio
                        </Typography>
                        <Typography variant="h6">
                          {(averages.cacheHitRatio * 100).toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Error Rate
                        </Typography>
                        <Typography variant="h6" color={averages.errorRate > 1 ? "error.main" : "text.primary"}>
                          {averages.errorRate.toFixed(2)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg CPU Usage
                        </Typography>
                        <Typography variant="h6">
                          {averages.cpuUsage.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg Active Users
                        </Typography>
                        <Typography variant="h6">
                          {Math.round(averages.activeUsers)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [performanceMetrics, selectedPeriod, handlePeriodChange, theme]);
  
  // Alert history table
  const alertHistoryTable = useMemo(() => {
    if (!alertHistory || alertHistory.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No alerts found
          </Typography>
        </Box>
      );
    }
    
    const columns = [
      { id: 'id', label: 'ID', minWidth: 50 },
      { 
        id: 'severity', 
        label: 'Severity', 
        minWidth: 100,
        format: (value: string) => (
          <Chip 
            label={value.charAt(0).toUpperCase() + value.slice(1)} 
            size="small"
            sx={{ 
              bgcolor: getSeverityColor(value),
              color: theme.palette.getContrastText(getSeverityColor(value))
            }}
          />
        )
      },
      { id: 'service', label: 'Service', minWidth: 120 },
      { id: 'message', label: 'Message', minWidth: 200 },
      { 
        id: 'timestamp', 
        label: 'Time', 
        minWidth: 160,
        format: (value: string) => formatDate(value)
      },
      { 
        id: 'resolved', 
        label: 'Status', 
        minWidth: 100,
        format: (value: boolean) => (
          <Chip 
            label={value ? 'Resolved' : 'Active'} 
            size="small"
            color={value ? 'success' : 'error'}
            variant="outlined"
          />
        )
      }
    ];
    
    return (
      <Card>
        <CardHeader title="Alert History" />
        <Divider />
        <CardContent>
          <VirtualizedTable
            columns={columns}
            data={alertHistory}
            maxHeight={400}
            rowHeight={60}
            virtualizationThreshold={20}
          />
        </CardContent>
      </Card>
    );
  }, [alertHistory, formatDate, getSeverityColor, theme]);
  
  // Render loading state
  if (loading && !systemHealth) {
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
                System Health Dashboard
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {lastUpdated ? (
                `Last updated: ${lastUpdated.toLocaleString()}`
              ) : (
                'Loading system data...'
              )}
            </Typography>
          </Grid>
          <Grid item>
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
          <Tab icon={<SpeedIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<NetworkCheckIcon />} iconPosition="start" label="Performance" />
          <Tab icon={<ErrorOutlineIcon />} iconPosition="start" label="Alerts" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {systemStatusOverview}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {performanceMetricsCharts}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {alertHistoryTable}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default React.memo(SystemHealthDashboard);