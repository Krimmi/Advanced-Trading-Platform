import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  Insights as InsightsIcon,
  Article as ArticleIcon,
  Info as InfoIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Components
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ChartContainer from '../../components/common/ChartContainer';
import DataTable from '../../components/common/DataTable';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Store
import { RootState } from '../../store';
import { fetchStockQuote, addToWatchlist, removeFromWatchlist } from '../../store/slices/marketSlice';

// Types
import { Column } from '../../components/common/DataTable';

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
      id={`stock-tabpanel-${index}`}
      aria-labelledby={`stock-tab-${index}`}
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

const StockDetailPage: React.FC = () => {
  const theme = useTheme();
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL'>('1D');
  
  // Redux state
  const { quotes, watchlists, loading, error } = useSelector((state: RootState) => state.market);
  const defaultWatchlist = watchlists['default'];
  const stockQuote = symbol ? quotes[symbol] : undefined;
  
  // Load stock data
  useEffect(() => {
    if (symbol) {
      dispatch(fetchStockQuote(symbol) as any);
    }
  }, [dispatch, symbol]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    if (symbol) {
      dispatch(fetchStockQuote(symbol) as any);
    }
  };
  
  // Handle watchlist toggle
  const handleWatchlistToggle = () => {
    if (!symbol) return;
    
    if (defaultWatchlist.symbols.includes(symbol)) {
      dispatch(removeFromWatchlist({ watchlistId: 'default', symbol }) as any);
    } else {
      dispatch(addToWatchlist({ watchlistId: 'default', symbol }) as any);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    navigate('/market');
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL') => {
    setTimeframe(newTimeframe);
  };
  
  // Mock data for company info
  const companyInfo = {
    sector: 'Technology',
    industry: 'Consumer Electronics',
    employees: '154,000',
    founded: '1976',
    ceo: 'Tim Cook',
    headquarters: 'Cupertino, California',
    website: 'www.apple.com',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. It also sells various related services. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, HomePod, iPod touch, and other Apple-branded and third-party accessories.',
  };
  
  // Mock data for key stats
  const keyStats = [
    { label: 'Market Cap', value: '$2.45T' },
    { label: 'P/E Ratio', value: '28.5' },
    { label: 'EPS (TTM)', value: '$6.15' },
    { label: 'Dividend Yield', value: '0.65%' },
    { label: '52 Week High', value: '$198.23' },
    { label: '52 Week Low', value: '$124.17' },
    { label: 'Avg Volume', value: '64.3M' },
    { label: 'Beta', value: '1.28' },
  ];
  
  // Mock data for news
  const newsItems = [
    {
      id: 1,
      title: 'Apple Announces New iPhone 15 with Revolutionary Features',
      source: 'TechCrunch',
      date: '2 hours ago',
      url: '#',
    },
    {
      id: 2,
      title: 'Apple Services Revenue Hits All-Time High in Q3 Earnings',
      source: 'CNBC',
      date: '1 day ago',
      url: '#',
    },
    {
      id: 3,
      title: 'Apple\'s AI Strategy: What We Know So Far',
      source: 'Bloomberg',
      date: '2 days ago',
      url: '#',
    },
    {
      id: 4,
      title: 'Analysts Raise Apple Price Targets Following Strong Earnings',
      source: 'Wall Street Journal',
      date: '3 days ago',
      url: '#',
    },
  ];
  
  // Render loading state
  if (loading && !stockQuote) {
    return <LoadingIndicator message={`Loading ${symbol} data...`} />;
  }
  
  // Render error state
  if (error && !stockQuote) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading stock data
        </Typography>
        <Typography color="text.secondary" paragraph>
          {error}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Market
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Market
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="h4" component="h1">
                {stockQuote?.name || symbol}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ ml: 1 }}>
                {symbol}
              </Typography>
              <IconButton
                onClick={handleWatchlistToggle}
                sx={{ ml: 1 }}
              >
                {defaultWatchlist.symbols.includes(symbol || '') ? (
                  <StarIcon fontSize="medium" color="primary" />
                ) : (
                  <StarBorderIcon fontSize="medium" />
                )}
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mr: 2 }}>
                ${stockQuote?.price.toFixed(2) || '0.00'}
              </Typography>
              
              {stockQuote && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stockQuote.change > 0 ? (
                    <>
                      <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 'medium' }}>
                        +{stockQuote.change.toFixed(2)} (+{stockQuote.changePercent.toFixed(2)}%)
                      </Typography>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
                      <Typography variant="h6" color="error.main" sx={{ fontWeight: 'medium' }}>
                        {stockQuote.change.toFixed(2)} ({stockQuote.changePercent.toFixed(2)}%)
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {stockQuote ? (
                `Last updated: ${new Date(stockQuote.timestamp).toLocaleString()}`
              ) : (
                'Loading stock data...'
              )}
            </Typography>
          </Box>
          
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              variant="outlined"
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            <Button
              startIcon={<AddIcon />}
              variant="contained"
            >
              Trade
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Price Chart */}
      <ErrorBoundary>
        <Box sx={{ mb: 4 }}>
          <ChartContainer
            title="Price Chart"
            subtitle={`${symbol} stock price`}
            height={400}
            onRefresh={handleRefresh}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {(['1D', '1W', '1M', '3M', '1Y', 'YTD', 'ALL'] as const).map((tf) => (
                <Chip
                  key={tf}
                  label={tf}
                  color={timeframe === tf ? 'primary' : 'default'}
                  variant={timeframe === tf ? 'filled' : 'outlined'}
                  onClick={() => handleTimeframeChange(tf)}
                  size="small"
                />
              ))}
            </Box>
            
            <Box sx={{ height: 'calc(100% - 40px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                [Price Chart - Placeholder]
              </Typography>
            </Box>
          </ChartContainer>
        </Box>
      </ErrorBoundary>
      
      {/* Stock Details Tabs */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="stock details tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<InfoIcon />} label="Overview" />
          <Tab icon={<ShowChartIcon />} label="Technical" />
          <Tab icon={<BarChartIcon />} label="Fundamentals" />
          <Tab icon={<InsightsIcon />} label="Analysis" />
          <Tab icon={<ArticleIcon />} label="News" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Company Info */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sector
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.sector}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Industry
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.industry}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Employees
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.employees}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Founded
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.founded}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      CEO
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.ceo}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Headquarters
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.headquarters}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Website
                    </Typography>
                    <Typography variant="body1">
                      {companyInfo.website}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {companyInfo.description}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Key Stats */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Key Statistics
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {keyStats.map((stat) => (
                    <Grid item xs={6} key={stat.label}>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stat.value}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Trading Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Open
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.open.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Previous Close
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.previousClose.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Day High
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.dayHigh.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Day Low
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.dayLow.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Volume
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stockQuote?.volume.toLocaleString() || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Volume
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stockQuote?.avgVolume.toLocaleString() || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" paragraph>
              Technical analysis will be implemented in the next phase.
            </Typography>
            <Button variant="outlined">
              View Technical Analysis
            </Button>
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" paragraph>
              Fundamental analysis will be implemented in the next phase.
            </Typography>
            <Button variant="outlined">
              View Fundamentals
            </Button>
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" paragraph>
              ML-powered analysis will be implemented in the next phase.
            </Typography>
            <Button variant="outlined">
              View Analysis
            </Button>
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Latest News
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {newsItems.map((news) => (
              <Box key={news.id} sx={{ mb: 2, pb: 2, borderBottom: news.id !== newsItems.length ? `1px solid ${theme.palette.divider}` : 'none' }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {news.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {news.source}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {news.date}
                  </Typography>
                </Box>
              </Box>
            ))}
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="outlined">
                View All News
              </Button>
            </Box>
          </Paper>
        </TabPanel>
      </Box>
      
      {/* Trade Actions */}
      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Trade Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
              >
                Buy
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                size="large"
              >
                Sell
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
              >
                Set Alert
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
              >
                Add to Portfolio
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default StockDetailPage;