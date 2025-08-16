import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  IconButton,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  Notifications as NotificationsIcon,
  Psychology as PsychologyIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// Components
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ChartContainer from '../../components/common/ChartContainer';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Store
import { RootState } from '../../store';
import { fetchMarketSummary } from '../../store/slices/marketSlice';
import { fetchPortfolioSummary } from '../../store/slices/portfolioSlice';

// Mock data for charts (in a real app, this would come from Redux)
const mockPerformanceData = [
  { date: '2025-01', portfolio: 10.2, benchmark: 8.7 },
  { date: '2025-02', portfolio: 11.5, benchmark: 9.2 },
  { date: '2025-03', portfolio: 10.8, benchmark: 9.8 },
  { date: '2025-04', portfolio: 12.3, benchmark: 10.5 },
  { date: '2025-05', portfolio: 13.1, benchmark: 11.2 },
  { date: '2025-06', portfolio: 14.5, benchmark: 11.8 },
  { date: '2025-07', portfolio: 15.2, benchmark: 12.3 },
  { date: '2025-08', portfolio: 16.8, benchmark: 13.1 },
];

const mockAllocationData = [
  { name: 'Technology', value: 35 },
  { name: 'Healthcare', value: 20 },
  { name: 'Financials', value: 15 },
  { name: 'Consumer', value: 12 },
  { name: 'Energy', value: 8 },
  { name: 'Other', value: 10 },
];

const mockMarketMovers = [
  { symbol: 'AAPL', name: 'Apple Inc.', change: 2.45, price: 243.58 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', change: 1.87, price: 387.92 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', change: -1.23, price: 178.45 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', change: 3.21, price: 192.36 },
  { symbol: 'TSLA', name: 'Tesla Inc.', change: -2.78, price: 267.89 },
];

const mockAlerts = [
  { id: 1, type: 'price', message: 'AAPL exceeded target price of $240', time: '10:32 AM', read: false },
  { id: 2, type: 'portfolio', message: 'Portfolio rebalance recommended', time: '9:15 AM', read: false },
  { id: 3, type: 'market', message: 'S&P 500 down 1.5% in early trading', time: '9:02 AM', read: true },
  { id: 4, type: 'ml', message: 'ML model prediction: MSFT bullish signal', time: 'Yesterday', read: true },
];

const mockMlInsights = [
  { id: 1, title: 'Sector Rotation Detected', confidence: 87, description: 'ML models indicate rotation from Tech to Healthcare' },
  { id: 2, title: 'Volatility Forecast', confidence: 92, description: 'Increased market volatility expected in next 7 days' },
  { id: 3, title: 'Portfolio Optimization', confidence: 85, description: 'Suggested allocation changes could improve returns by 2.3%' },
];

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
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [marketTabValue, setMarketTabValue] = useState(0);
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { marketSummary, loading: marketLoading } = useSelector((state: RootState) => state.market);
  const { portfolioSummary, loading: portfolioLoading } = useSelector((state: RootState) => state.portfolio);
  
  // Load initial data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Dispatch actions to fetch data
        await Promise.all([
          dispatch(fetchMarketSummary() as any),
          dispatch(fetchPortfolioSummary() as any)
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [dispatch]);
  
  // Handle market tab change
  const handleMarketTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMarketTabValue(newValue);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    
    Promise.all([
      dispatch(fetchMarketSummary() as any),
      dispatch(fetchPortfolioSummary() as any)
    ]).finally(() => {
      setLoading(false);
    });
  };
  
  if (loading || marketLoading || portfolioLoading) {
    return <LoadingIndicator message="Loading dashboard..." />;
  }
  
  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name || 'Trader'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>
      
      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Portfolio Value
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              $1,245,678.90
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                +$24,567.89 (2.1%)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Today
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SwapHorizIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Today's P&L
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              +$24,567.89
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                +2.1%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                vs. Yesterday
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                YTD Return
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              +16.8%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                +3.7%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                vs. S&P 500
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Active Alerts
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {mockAlerts.filter(alert => !alert.read).length}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Button size="small" variant="text">
                View All
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts and Data */}
      <Grid container spacing={3}>
        {/* Portfolio Performance Chart */}
        <Grid item xs={12} lg={8}>
          <ErrorBoundary>
            <ChartContainer
              title="Portfolio Performance"
              subtitle="YTD Performance vs. Benchmark"
              height={350}
              onRefresh={handleRefresh}
            >
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  [Portfolio Performance Chart - Placeholder]
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                  Data as of {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </ChartContainer>
          </ErrorBoundary>
        </Grid>
        
        {/* Portfolio Allocation */}
        <Grid item xs={12} md={6} lg={4}>
          <ErrorBoundary>
            <ChartContainer
              title="Portfolio Allocation"
              subtitle="Current Asset Distribution"
              height={350}
              onRefresh={handleRefresh}
            >
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  [Portfolio Allocation Chart - Placeholder]
                </Typography>
              </Box>
            </ChartContainer>
          </ErrorBoundary>
        </Grid>
        
        {/* Market Overview */}
        <Grid item xs={12} md={6} lg={4}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <CardHeader
              title="Market Overview"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={marketTabValue} 
                onChange={handleMarketTabChange}
                variant="fullWidth"
                aria-label="market overview tabs"
              >
                <Tab label="Indices" />
                <Tab label="Top Movers" />
              </Tabs>
            </Box>
            <CardContent>
              <TabPanel value={marketTabValue} index={0}>
                <Box>
                  {/* Indices */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">S&P 500</Typography>
                      <Typography variant="body1">5,123.45</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">+1.2%</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">+60.23</Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">Nasdaq</Typography>
                      <Typography variant="body1">16,789.01</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">+1.5%</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">+248.67</Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">Dow Jones</Typography>
                      <Typography variant="body1">38,456.78</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="error.main">-0.3%</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">-115.34</Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">Russell 2000</Typography>
                      <Typography variant="body1">2,345.67</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">+0.8%</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">+18.56</Typography>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
              
              <TabPanel value={marketTabValue} index={1}>
                <Box>
                  {mockMarketMovers.map((stock, index) => (
                    <React.Fragment key={stock.symbol}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">{stock.symbol}</Typography>
                            <Typography variant="caption" color="text.secondary">{stock.name}</Typography>
                          </Box>
                          <Typography variant="body1">${stock.price.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {stock.change > 0 ? (
                              <>
                                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="success.main">+{stock.change.toFixed(2)}%</Typography>
                              </>
                            ) : (
                              <>
                                <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="error.main">{stock.change.toFixed(2)}%</Typography>
                              </>
                            )}
                          </Box>
                          <Button size="small" variant="text">Trade</Button>
                        </Box>
                      </Box>
                      
                      {index < mockMarketMovers.length - 1 && (
                        <Divider sx={{ my: 1.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Alerts */}
        <Grid item xs={12} md={6} lg={4}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <CardHeader
              title="Recent Alerts"
              action={
                <Button size="small" color="primary">
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {mockAlerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <Box sx={{ 
                    py: 1.5, 
                    px: 1,
                    borderRadius: 1,
                    backgroundColor: alert.read ? 'transparent' : alpha(theme.palette.primary.light, 0.1),
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={alert.read ? 'regular' : 'medium'}>
                        {alert.message}
                      </Typography>
                      {!alert.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.main,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {alert.time}
                    </Typography>
                  </Box>
                  
                  {index < mockAlerts.length - 1 && (
                    <Divider sx={{ my: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* ML Insights */}
        <Grid item xs={12} md={6} lg={4}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <CardHeader
              title="ML Insights"
              avatar={<PsychologyIcon color="primary" />}
              action={
                <Button size="small" color="primary">
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {mockMlInsights.map((insight, index) => (
                <React.Fragment key={insight.id}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {insight.title}
                      </Typography>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: theme.palette.success.light,
                          color: theme.palette.success.dark,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {insight.confidence}%
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {insight.description}
                    </Typography>
                  </Box>
                  
                  {index < mockMlInsights.length - 1 && (
                    <Divider sx={{ my: 1.5 }} />
                  )}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;