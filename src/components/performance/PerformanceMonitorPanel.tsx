import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SettingsIcon from '@mui/icons-material/Settings';

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

import PerformanceMonitor, {
  ComponentRenderMetrics,
  DataProcessingMetrics,
  NetworkMetrics,
  WebSocketMetrics
} from '../../utils/performanceMonitor';

interface PerformanceMonitorPanelProps {
  refreshInterval?: number;
  onClose?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
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
};

const PerformanceMonitorPanel: React.FC<PerformanceMonitorPanelProps> = ({
  refreshInterval = 2000,
  onClose
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true);
  const [componentMetrics, setComponentMetrics] = useState<ComponentRenderMetrics[]>([]);
  const [dataProcessingMetrics, setDataProcessingMetrics] = useState<DataProcessingMetrics[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics[]>([]);
  const [webSocketMetrics, setWebSocketMetrics] = useState<WebSocketMetrics[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);
  const [slowComponentThreshold, setSlowComponentThreshold] = useState(16); // ms (for 60fps)

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.error.light,
    theme.palette.warning.light
  ];

  // Fetch metrics
  const fetchMetrics = useCallback(() => {
    if (!isMonitoringEnabled) return;

    // Get component metrics
    const components = PerformanceMonitor.getComponentMetrics();
    setComponentMetrics(components);

    // Get data processing metrics
    const dataProcessing = PerformanceMonitor.getDataProcessingMetrics();
    setDataProcessingMetrics(dataProcessing);

    // Get network metrics
    const network = PerformanceMonitor.getNetworkMetrics();
    setNetworkMetrics(network);

    // Get WebSocket metrics
    const webSocket = PerformanceMonitor.getWebSocketMetrics();
    setWebSocketMetrics(webSocket);

    // Get performance summary
    const summary = PerformanceMonitor.getPerformanceSummary();
    setPerformanceSummary(summary);
  }, [isMonitoringEnabled]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    PerformanceMonitor.clearMetrics();
    fetchMetrics();
  }, [fetchMetrics]);

  // Toggle monitoring
  const toggleMonitoring = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setIsMonitoringEnabled(enabled);
    PerformanceMonitor.setEnabled(enabled);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  // Set up interval for fetching metrics
  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Set up interval
    const intervalId = setInterval(fetchMetrics, refreshInterval);

    // Clean up
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchMetrics, refreshInterval]);

  // Format time in ms
  const formatTime = useCallback((time: number): string => {
    return `${time.toFixed(2)} ms`;
  }, []);

  // Determine color based on render time
  const getRenderTimeColor = useCallback((time: number): string => {
    if (time > slowComponentThreshold * 2) {
      return theme.palette.error.main;
    } else if (time > slowComponentThreshold) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.success.main;
    }
  }, [theme, slowComponentThreshold]);

  // Prepare component metrics for chart
  const componentChartData = useMemo(() => {
    return componentMetrics
      .filter(metric => metric.renderCount > 0)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 10)
      .map(metric => ({
        name: metric.componentId.length > 20 
          ? `${metric.componentId.substring(0, 17)}...` 
          : metric.componentId,
        averageRenderTime: metric.averageRenderTime,
        maxRenderTime: metric.maxRenderTime,
        renderCount: metric.renderCount
      }));
  }, [componentMetrics]);

  // Prepare data processing metrics for chart
  const dataProcessingChartData = useMemo(() => {
    return dataProcessingMetrics
      .filter(metric => metric.operationCount > 0)
      .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)
      .slice(0, 10)
      .map(metric => ({
        name: metric.operationId.length > 20 
          ? `${metric.operationId.substring(0, 17)}...` 
          : metric.operationId,
        averageProcessingTime: metric.averageProcessingTime,
        maxProcessingTime: metric.maxProcessingTime,
        operationCount: metric.operationCount,
        dataSize: metric.dataSize
      }));
  }, [dataProcessingMetrics]);

  // Prepare network metrics for chart
  const networkChartData = useMemo(() => {
    // Group by URL
    const urlGroups = networkMetrics.reduce((acc, metric) => {
      const url = metric.url.split('?')[0]; // Remove query params
      if (!acc[url]) {
        acc[url] = {
          url,
          count: 0,
          totalResponseTime: 0,
          averageResponseTime: 0,
          maxResponseTime: 0,
          totalDataSize: 0
        };
      }
      
      acc[url].count++;
      acc[url].totalResponseTime += metric.responseTime;
      acc[url].averageResponseTime = acc[url].totalResponseTime / acc[url].count;
      acc[url].maxResponseTime = Math.max(acc[url].maxResponseTime, metric.responseTime);
      acc[url].totalDataSize += metric.dataSize;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort
    return Object.values(urlGroups)
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 10)
      .map(group => ({
        name: group.url.length > 25 
          ? `${group.url.substring(0, 22)}...` 
          : group.url,
        averageResponseTime: group.averageResponseTime,
        maxResponseTime: group.maxResponseTime,
        count: group.count,
        totalDataSize: group.totalDataSize
      }));
  }, [networkMetrics]);

  // Prepare WebSocket metrics for chart
  const webSocketChartData = useMemo(() => {
    // Group by message type
    const typeGroups = webSocketMetrics.reduce((acc, metric) => {
      if (!acc[metric.messageType]) {
        acc[metric.messageType] = {
          messageType: metric.messageType,
          count: 0,
          totalProcessingTime: 0,
          averageProcessingTime: 0,
          maxProcessingTime: 0,
          totalMessageSize: 0
        };
      }
      
      acc[metric.messageType].count++;
      acc[metric.messageType].totalProcessingTime += metric.processingTime;
      acc[metric.messageType].averageProcessingTime = acc[metric.messageType].totalProcessingTime / acc[metric.messageType].count;
      acc[metric.messageType].maxProcessingTime = Math.max(acc[metric.messageType].maxProcessingTime, metric.processingTime);
      acc[metric.messageType].totalMessageSize += metric.messageSize;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort
    return Object.values(typeGroups)
      .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)
      .slice(0, 10)
      .map(group => ({
        name: group.messageType,
        averageProcessingTime: group.averageProcessingTime,
        maxProcessingTime: group.maxProcessingTime,
        count: group.count,
        totalMessageSize: group.totalMessageSize
      }));
  }, [webSocketMetrics]);

  // Prepare performance summary for pie chart
  const performanceSummaryData = useMemo(() => {
    if (!performanceSummary) return [];
    
    // Calculate total time spent in each category
    const componentTime = componentMetrics.reduce(
      (sum, metric) => sum + (metric.averageRenderTime * metric.renderCount),
      0
    );
    
    const dataProcessingTime = dataProcessingMetrics.reduce(
      (sum, metric) => sum + (metric.averageProcessingTime * metric.operationCount),
      0
    );
    
    const networkTime = networkMetrics.reduce(
      (sum, metric) => sum + metric.responseTime,
      0
    );
    
    const webSocketTime = webSocketMetrics.reduce(
      (sum, metric) => sum + metric.processingTime,
      0
    );
    
    return [
      { name: 'Component Rendering', value: componentTime },
      { name: 'Data Processing', value: dataProcessingTime },
      { name: 'Network Requests', value: networkTime },
      { name: 'WebSocket Processing', value: webSocketTime }
    ];
  }, [performanceSummary, componentMetrics, dataProcessingMetrics, networkMetrics, webSocketMetrics]);

  // Render component metrics tab
  const renderComponentMetricsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Component Render Performance
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top 10 Slowest Components" />
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
            <CardHeader title="Component Render Count" />
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
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip />
                    <Bar
                      dataKey="renderCount"
                      name="Render Count"
                      fill={theme.palette.info.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell align="right">Render Count</TableCell>
                  <TableCell align="right">Average Render Time</TableCell>
                  <TableCell align="right">Max Render Time</TableCell>
                  <TableCell align="right">Last Render Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {componentMetrics
                  .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
                  .map((metric) => (
                    <TableRow key={metric.componentId}>
                      <TableCell component="th" scope="row">
                        {metric.componentId}
                      </TableCell>
                      <TableCell align="right">{metric.renderCount}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getRenderTimeColor(metric.averageRenderTime) }}
                      >
                        {formatTime(metric.averageRenderTime)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getRenderTimeColor(metric.maxRenderTime) }}
                      >
                        {formatTime(metric.maxRenderTime)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getRenderTimeColor(metric.lastRenderTime) }}
                      >
                        {formatTime(metric.lastRenderTime)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );

  // Render data processing metrics tab
  const renderDataProcessingTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Processing Performance
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top 10 Slowest Operations" />
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
                      fill={theme.palette.primary.main}
                    />
                    <Bar
                      dataKey="maxProcessingTime"
                      name="Max Processing Time"
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
            <CardHeader title="Operation Count" />
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
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip />
                    <Bar
                      dataKey="operationCount"
                      name="Operation Count"
                      fill={theme.palette.info.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Operation</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Average Processing Time</TableCell>
                  <TableCell align="right">Max Processing Time</TableCell>
                  <TableCell align="right">Last Processing Time</TableCell>
                  <TableCell align="right">Data Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataProcessingMetrics
                  .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)
                  .map((metric) => (
                    <TableRow key={metric.operationId}>
                      <TableCell component="th" scope="row">
                        {metric.operationId}
                      </TableCell>
                      <TableCell align="right">{metric.operationCount}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getRenderTimeColor(metric.averageProcessingTime) }}
                      >
                        {formatTime(metric.averageProcessingTime)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getRenderTimeColor(metric.maxProcessingTime) }}
                      >
                        {formatTime(metric.maxProcessingTime)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getRenderTimeColor(metric.lastProcessingTime) }}
                      >
                        {formatTime(metric.lastProcessingTime)}
                      </TableCell>
                      <TableCell align="right">
                        {metric.dataSize > 1024 * 1024
                          ? `${(metric.dataSize / (1024 * 1024)).toFixed(2)} MB`
                          : metric.dataSize > 1024
                          ? `${(metric.dataSize / 1024).toFixed(2)} KB`
                          : `${metric.dataSize} B`}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );

  // Render network metrics tab
  const renderNetworkTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Network Performance
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top 10 Slowest Network Requests" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={networkChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit=" ms" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)} ms`,
                        name === 'averageResponseTime' ? 'Average Response Time' : 'Max Response Time'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="averageResponseTime"
                      name="Average Response Time"
                      fill={theme.palette.primary.main}
                    />
                    <Bar
                      dataKey="maxResponseTime"
                      name="Max Response Time"
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
            <CardHeader title="Request Count" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={networkChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip />
                    <Bar
                      dataKey="count"
                      name="Request Count"
                      fill={theme.palette.info.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Average Response Time</TableCell>
                  <TableCell align="right">Max Response Time</TableCell>
                  <TableCell align="right">Total Data Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {networkChartData.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell component="th" scope="row">
                      {metric.name}
                    </TableCell>
                    <TableCell align="right">{metric.count}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: getRenderTimeColor(metric.averageResponseTime) }}
                    >
                      {formatTime(metric.averageResponseTime)}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: getRenderTimeColor(metric.maxResponseTime) }}
                    >
                      {formatTime(metric.maxResponseTime)}
                    </TableCell>
                    <TableCell align="right">
                      {metric.totalDataSize > 1024 * 1024
                        ? `${(metric.totalDataSize / (1024 * 1024)).toFixed(2)} MB`
                        : metric.totalDataSize > 1024
                        ? `${(metric.totalDataSize / 1024).toFixed(2)} KB`
                        : `${metric.totalDataSize} B`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );

  // Render WebSocket metrics tab
  const renderWebSocketTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        WebSocket Performance
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top 10 Slowest WebSocket Messages" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={webSocketChartData}
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
                      fill={theme.palette.primary.main}
                    />
                    <Bar
                      dataKey="maxProcessingTime"
                      name="Max Processing Time"
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
            <CardHeader title="Message Count" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={webSocketChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip />
                    <Bar
                      dataKey="count"
                      name="Message Count"
                      fill={theme.palette.info.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Message Type</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Average Processing Time</TableCell>
                  <TableCell align="right">Max Processing Time</TableCell>
                  <TableCell align="right">Total Message Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {webSocketChartData.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell component="th" scope="row">
                      {metric.name}
                    </TableCell>
                    <TableCell align="right">{metric.count}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: getRenderTimeColor(metric.averageProcessingTime) }}
                    >
                      {formatTime(metric.averageProcessingTime)}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: getRenderTimeColor(metric.maxProcessingTime) }}
                    >
                      {formatTime(metric.maxProcessingTime)}
                    </TableCell>
                    <TableCell align="right">
                      {metric.totalMessageSize > 1024 * 1024
                        ? `${(metric.totalMessageSize / (1024 * 1024)).toFixed(2)} MB`
                        : metric.totalMessageSize > 1024
                        ? `${(metric.totalMessageSize / 1024).toFixed(2)} KB`
                        : `${metric.totalMessageSize} B`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );

  // Render summary tab
  const renderSummaryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Summary
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Performance Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceSummaryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {performanceSummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip
                      formatter={(value: number) => [`${formatTime(value)}`, 'Total Time']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Performance Metrics" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Components Tracked
                    </Typography>
                    <Typography variant="h4">
                      {componentMetrics.length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Operations Tracked
                    </Typography>
                    <Typography variant="h4">
                      {dataProcessingMetrics.length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Network Requests
                    </Typography>
                    <Typography variant="h4">
                      {networkMetrics.length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      WebSocket Messages
                    </Typography>
                    <Typography variant="h4">
                      {webSocketMetrics.length}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Performance Issues" />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Time</TableCell>
                      <TableCell>Issue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {componentMetrics
                      .filter(metric => metric.averageRenderTime > slowComponentThreshold)
                      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
                      .slice(0, 5)
                      .map(metric => (
                        <TableRow key={`component-${metric.componentId}`}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <WarningIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                              Component
                            </Box>
                          </TableCell>
                          <TableCell>{metric.componentId}</TableCell>
                          <TableCell align="right" sx={{ color: getRenderTimeColor(metric.averageRenderTime) }}>
                            {formatTime(metric.averageRenderTime)}
                          </TableCell>
                          <TableCell>Slow rendering</TableCell>
                        </TableRow>
                      ))}
                    
                    {dataProcessingMetrics
                      .filter(metric => metric.averageProcessingTime > slowComponentThreshold)
                      .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)
                      .slice(0, 5)
                      .map(metric => (
                        <TableRow key={`operation-${metric.operationId}`}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <MemoryIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
                              Operation
                            </Box>
                          </TableCell>
                          <TableCell>{metric.operationId}</TableCell>
                          <TableCell align="right" sx={{ color: getRenderTimeColor(metric.averageProcessingTime) }}>
                            {formatTime(metric.averageProcessingTime)}
                          </TableCell>
                          <TableCell>Slow data processing</TableCell>
                        </TableRow>
                      ))}
                    
                    {networkChartData
                      .filter(metric => metric.averageResponseTime > slowComponentThreshold * 2)
                      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
                      .slice(0, 5)
                      .map(metric => (
                        <TableRow key={`network-${metric.name}`}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <NetworkCheckIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                              Network
                            </Box>
                          </TableCell>
                          <TableCell>{metric.name}</TableCell>
                          <TableCell align="right" sx={{ color: getRenderTimeColor(metric.averageResponseTime) }}>
                            {formatTime(metric.averageResponseTime)}
                          </TableCell>
                          <TableCell>Slow network request</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SpeedIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="h1">
                Performance Monitor
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={isMonitoringEnabled}
                  onChange={toggleMonitoring}
                  color="primary"
                />
              }
              label="Enable Monitoring"
            />
          </Grid>
          <Grid item>
            <Tooltip title="Refresh Metrics">
              <IconButton onClick={fetchMetrics} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Metrics">
              <IconButton onClick={clearMetrics} sx={{ mr: 1 }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Summary" />
          <Tab label="Components" />
          <Tab label="Data Processing" />
          <Tab label="Network" />
          <Tab label="WebSocket" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {renderSummaryTab()}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {renderComponentMetricsTab()}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {renderDataProcessingTab()}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {renderNetworkTab()}
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          {renderWebSocketTab()}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PerformanceMonitorPanel;