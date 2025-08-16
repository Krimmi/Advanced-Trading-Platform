import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
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
  useMediaQuery
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';

// Lazy load components for better performance
const MarketBreadthPanel = lazy(() => import('./MarketBreadthPanel'));
const AnomalyDetectionPanel = lazy(() => import('./AnomalyDetectionPanel'));
const CorrelationHeatmapPanel = lazy(() => import('./CorrelationHeatmapPanel'));
const LiveOrderFlowPanel = lazy(() => import('./LiveOrderFlowPanel'));

// Import services
import { MarketDataService } from '../../services';

// Import types
import { MarketBreadthData, AnomalyData, CorrelationData, OrderFlowData } from '../../types/analytics';

interface RealTimeAnalyticsDashboardProps {
  refreshInterval?: number; // in milliseconds
  defaultView?: 'grid' | 'tabs';
  onSettingsClick?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Memoize TabPanel to prevent unnecessary re-renders
const TabPanel = React.memo((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
});

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress size={40} />
  </Box>
);

const RealTimeAnalyticsDashboard: React.FC<RealTimeAnalyticsDashboardProps> = ({
  refreshInterval = 30000, // Default to 30 seconds
  defaultView = 'grid',
  onSettingsClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for data
  const [marketBreadthData, setMarketBreadthData] = useState<MarketBreadthData | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [orderFlowData, setOrderFlowData] = useState<OrderFlowData | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'tabs'>(isMobile ? 'tabs' : defaultView);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  // Services - memoize to prevent recreation on each render
  const marketDataService = useMemo(() => new MarketDataService(), []);
  
  // Fetch data function - use useCallback to prevent recreation on each render
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch only the data needed for the current view in tabs mode
      if (viewMode === 'tabs') {
        switch (activeTab) {
          case 0: // Market Breadth
            const breadthData = await marketDataService.getMarketBreadth();
            setMarketBreadthData(breadthData);
            break;
          case 1: // Anomaly Detection
            const anomaliesData = await marketDataService.getAnomalyDetection();
            setAnomalyData(anomaliesData);
            break;
          case 2: // Correlation Analysis
            const correlationsData = await marketDataService.getCorrelationMatrix();
            setCorrelationData(correlationsData);
            break;
          case 3: // Order Flow
            const orderFlow = await marketDataService.getOrderFlow();
            setOrderFlowData(orderFlow);
            break;
        }
      } else {
        // In grid mode, fetch all data in parallel
        const [breadthData, anomaliesData, correlationsData, orderFlow] = await Promise.all([
          marketDataService.getMarketBreadth(),
          marketDataService.getAnomalyDetection(),
          marketDataService.getCorrelationMatrix(),
          marketDataService.getOrderFlow()
        ]);
        
        setMarketBreadthData(breadthData);
        setAnomalyData(anomaliesData);
        setCorrelationData(correlationsData);
        setOrderFlowData(orderFlow);
      }
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch real-time analytics data. Please try again later.');
      setLoading(false);
    }
  }, [marketDataService, viewMode, activeTab]);
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Auto-refresh setup with cleanup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
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
  
  // Handle view mode toggle
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'tabs' : 'grid');
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // Memoized panel rendering functions to prevent unnecessary re-renders
  const renderMarketBreadthPanel = useMemo(() => (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Market Breadth" 
        action={
          <Tooltip title="Expand">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent sx={{ height: 'calc(100% - 72px)', overflow: 'auto' }}>
        <Suspense fallback={<LoadingFallback />}>
          {marketBreadthData ? (
            <MarketBreadthPanel data={marketBreadthData} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography color="text.secondary">No market breadth data available</Typography>
              )}
            </Box>
          )}
        </Suspense>
      </CardContent>
    </Card>
  ), [marketBreadthData, loading]);
  
  const renderAnomalyDetectionPanel = useMemo(() => (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Anomaly Detection" 
        action={
          <Tooltip title="Expand">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent sx={{ height: 'calc(100% - 72px)', overflow: 'auto' }}>
        <Suspense fallback={<LoadingFallback />}>
          {anomalyData ? (
            <AnomalyDetectionPanel data={anomalyData} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography color="text.secondary">No anomaly data available</Typography>
              )}
            </Box>
          )}
        </Suspense>
      </CardContent>
    </Card>
  ), [anomalyData, loading]);
  
  const renderCorrelationHeatmapPanel = useMemo(() => (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Correlation Analysis" 
        action={
          <Tooltip title="Expand">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent sx={{ height: 'calc(100% - 72px)', overflow: 'auto' }}>
        <Suspense fallback={<LoadingFallback />}>
          {correlationData ? (
            <CorrelationHeatmapPanel data={correlationData} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography color="text.secondary">No correlation data available</Typography>
              )}
            </Box>
          )}
        </Suspense>
      </CardContent>
    </Card>
  ), [correlationData, loading]);
  
  const renderOrderFlowPanel = useMemo(() => (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Order Flow Analysis" 
        action={
          <Tooltip title="Expand">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent sx={{ height: 'calc(100% - 72px)', overflow: 'auto' }}>
        <Suspense fallback={<LoadingFallback />}>
          {orderFlowData ? (
            <LiveOrderFlowPanel data={orderFlowData} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography color="text.secondary">No order flow data available</Typography>
              )}
            </Box>
          )}
        </Suspense>
      </CardContent>
    </Card>
  ), [orderFlowData, loading]);
  
  // Memoize the grid and tabs views to prevent unnecessary re-renders
  const gridView = useMemo(() => (
    <Grid container spacing={2} sx={{ height: 'calc(100% - 16px)', mt: 1 }}>
      <Grid item xs={12} md={6} sx={{ height: { xs: '400px', md: '50%' } }}>
        {renderMarketBreadthPanel}
      </Grid>
      <Grid item xs={12} md={6} sx={{ height: { xs: '400px', md: '50%' } }}>
        {renderAnomalyDetectionPanel}
      </Grid>
      <Grid item xs={12} md={6} sx={{ height: { xs: '400px', md: '50%' } }}>
        {renderCorrelationHeatmapPanel}
      </Grid>
      <Grid item xs={12} md={6} sx={{ height: { xs: '400px', md: '50%' } }}>
        {renderOrderFlowPanel}
      </Grid>
    </Grid>
  ), [renderMarketBreadthPanel, renderAnomalyDetectionPanel, renderCorrelationHeatmapPanel, renderOrderFlowPanel]);
  
  const tabsView = useMemo(() => (
    <Box sx={{ width: '100%', height: 'calc(100% - 48px)' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="analytics tabs"
        >
          <Tab icon={<ShowChartIcon />} iconPosition="start" label="Market Breadth" />
          <Tab icon={<WarningIcon />} iconPosition="start" label="Anomalies" />
          <Tab icon={<GridViewIcon />} iconPosition="start" label="Correlations" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Order Flow" />
        </Tabs>
      </Box>
      <Box sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {activeTab === 0 && renderMarketBreadthPanel}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {activeTab === 1 && renderAnomalyDetectionPanel}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {activeTab === 2 && renderCorrelationHeatmapPanel}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {activeTab === 3 && renderOrderFlowPanel}
        </TabPanel>
      </Box>
    </Box>
  ), [activeTab, handleTabChange, renderMarketBreadthPanel, renderAnomalyDetectionPanel, renderCorrelationHeatmapPanel, renderOrderFlowPanel]);
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Real-Time Market Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lastUpdated ? (
                `Last updated: ${lastUpdated.toLocaleTimeString()}`
              ) : (
                'Loading market data...'
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Tooltip title={viewMode === 'grid' ? 'Switch to Tabs View' : 'Switch to Grid View'}>
              <IconButton onClick={handleViewModeToggle} sx={{ mr: 1 }}>
                {viewMode === 'grid' ? <ViewCompactIcon /> : <GridViewIcon />}
              </IconButton>
            </Tooltip>
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
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {viewMode === 'grid' ? gridView : tabsView}
      </Box>
    </Box>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(RealTimeAnalyticsDashboard);