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
  Button,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  Description,
  BarChart,
  Timeline,
  Insights,
  Notifications,
  AddAlert,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import StockChart from '../../components/common/StockChart';
import TradingViewChartWrapper from '../../components/common/TradingViewChartWrapper';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';
import StatsCard from '../../components/common/StatsCard';
import ValueChangeIndicator from '../../components/common/ValueChangeIndicator';

// Services
import { marketService, fundamentalService, technicalService, mlService } from '../../services';

// Types
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `stock-tab-${index}`,
    'aria-controls': `stock-tabpanel-${index}`,
  };
}

const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [stockData, setStockData] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<any>(null);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [technicalIndicators, setTechnicalIndicators] = useState<any>(null);
  const [pricePrediction, setPricePrediction] = useState<any>(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [useTradingView, setUseTradingView] = useState<boolean>(true);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: 'daily' | 'weekly' | 'monthly') => {
    setTimeframe(newTimeframe);
    fetchHistoricalData(newTimeframe);
  };
  
  // Toggle chart type
  const handleToggleChartType = () => {
    setUseTradingView(!useTradingView);
  };
  
  // Fetch historical price data
  const fetchHistoricalData = async (tf: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    if (!symbol) return;
    
    try {
      const data = await marketService.getHistoricalPrices(symbol, {
        timeframe: tf,
        from_date: getFromDate(tf),
        to_date: new Date().toISOString().split('T')[0]
      });
      
      setHistoricalData(data);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  };
  
  // Helper to get from_date based on timeframe
  const getFromDate = (tf: string): string => {
    const date = new Date();
    
    switch (tf) {
      case 'daily':
        date.setFullYear(date.getFullYear() - 1); // 1 year ago
        break;
      case 'weekly':
        date.setFullYear(date.getFullYear() - 2); // 2 years ago
        break;
      case 'monthly':
        date.setFullYear(date.getFullYear() - 5); // 5 years ago
        break;
      default:
        date.setFullYear(date.getFullYear() - 1);
    }
    
    return date.toISOString().split('T')[0];
  };
  
  // Toggle watchlist
  const handleToggleWatchlist = () => {
    setInWatchlist(!inWatchlist);
    // In a real implementation, this would call the watchlist service
  };
  
  // Add alert
  const handleAddAlert = () => {
    navigate(`/alerts/new?symbol=${symbol}`);
  };
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) {
        setError('Invalid stock symbol');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch stock quote
        const quoteData = await marketService.getStockQuote(symbol);
        setStockData(quoteData);
        
        // Fetch company profile
        const profileData = await fundamentalService.getCompanyProfile(symbol);
        setCompanyProfile(profileData);
        
        // Fetch historical price data
        await fetchHistoricalData(timeframe);
        
        // Fetch key metrics
        const metricsData = await fundamentalService.getKeyMetrics(symbol, { period: 'quarter', limit: 1 });
        setKeyMetrics(metricsData[0]);
        
        // Fetch financial ratios
        const ratiosData = await fundamentalService.getFinancialRatios(symbol, { period: 'quarter', limit: 1 });
        setFinancialRatios(ratiosData[0]);
        
        // Fetch technical indicators
        const technicalData = await technicalService.getMultipleIndicators(
          symbol, 
          ['sma', 'ema', 'rsi', 'macd'], 
          getFromDate('daily')
        );
        setTechnicalIndicators(technicalData);
        
        // Fetch price prediction
        const predictionData = await mlService.getPricePredictions(symbol, 30);
        setPricePrediction(predictionData);
        
        // Fetch sentiment analysis
        const sentimentData = await mlService.getSentimentAnalysis(symbol);
        setSentimentAnalysis(sentimentData);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || `Failed to fetch data for ${symbol}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol]);
  
  // Show loading state
  if (loading) {
    return <LoadingIndicator />;
  }
  
  // Show error state
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  // Show no data state
  if (!stockData || !companyProfile) {
    return <NoData message={`No data available for ${symbol}`} />;
  }
  
  // Map timeframe to TradingView interval
  const getTradingViewInterval = () => {
    switch (timeframe) {
      case 'daily':
        return 'D';
      case 'weekly':
        return 'W';
      case 'monthly':
        return 'M';
      default:
        return 'D';
    }
  };
  
  return (
    <Box>
      {/* Header with stock info */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {symbol}
              <Typography component="span" variant="h5" color="text.secondary" ml={1}>
                {companyProfile.name}
              </Typography>
            </Typography>
            
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="h5" fontWeight="bold" mr={1}>
                {stockData.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
              <ValueChangeIndicator 
                value={stockData.change} 
                percentage={stockData.changePercent} 
                showIcon 
                size="large" 
              />
              <Chip 
                label={companyProfile.exchange} 
                size="small" 
                sx={{ ml: 2 }} 
                variant="outlined" 
              />
              <Chip 
                label={companyProfile.sector} 
                size="small" 
                sx={{ ml: 1 }} 
                variant="outlined" 
                color="primary" 
              />
            </Box>
          </Box>
          
          <Box>
            <Tooltip title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}>
              <IconButton onClick={handleToggleWatchlist}>
                {inWatchlist ? <Bookmark color="primary" /> : <BookmarkBorder />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Create price alert">
              <IconButton onClick={handleAddAlert}>
                <AddAlert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      {/* Stock Chart */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Price Chart</Typography>
          <Box display="flex" alignItems="center">
            <Box mr={2}>
              <Button 
                size="small" 
                variant={timeframe === 'daily' ? 'contained' : 'outlined'} 
                onClick={() => handleTimeframeChange('daily')}
                sx={{ mr: 1 }}
              >
                1Y
              </Button>
              <Button 
                size="small" 
                variant={timeframe === 'weekly' ? 'contained' : 'outlined'} 
                onClick={() => handleTimeframeChange('weekly')}
                sx={{ mr: 1 }}
              >
                2Y
              </Button>
              <Button 
                size="small" 
                variant={timeframe === 'monthly' ? 'contained' : 'outlined'} 
                onClick={() => handleTimeframeChange('monthly')}
              >
                5Y
              </Button>
            </Box>
            
            <Tooltip title={useTradingView ? "Switch to Basic Chart" : "Switch to TradingView Chart"}>
              <IconButton onClick={handleToggleChartType}>
                {useTradingView ? <BarChart /> : <ShowChart />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {useTradingView ? (
          <TradingViewChartWrapper
            symbol={symbol || ''}
            height={400}
            showToolbar={true}
            showIntervalSelector={true}
            showChartTypeSelector={true}
            showStudiesSelector={true}
          />
        ) : (
          historicalData.length > 0 ? (
            <StockChart 
              data={historicalData} 
              height={400} 
              showVolume 
            />
          ) : (
            <NoData message="No historical price data available" />
          )
        )}
      </Paper>
      
      {/* Key Stats */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Market Cap"
            value={stockData.marketCap ? 
              (stockData.marketCap >= 1e12 ? 
                `$${(stockData.marketCap / 1e12).toFixed(2)}T` : 
                `$${(stockData.marketCap / 1e9).toFixed(2)}B`) : 
              'N/A'
            }
            icon={<ShowChart />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Volume"
            value={stockData.volume ? 
              (stockData.volume >= 1e9 ? 
                `${(stockData.volume / 1e9).toFixed(2)}B` : 
                `${(stockData.volume / 1e6).toFixed(2)}M`) : 
              'N/A'
            }
            icon={<BarChart />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="P/E Ratio"
            value={keyMetrics?.peRatio ? keyMetrics.peRatio.toFixed(2) : 'N/A'}
            icon={<Timeline />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="52W Range"
            value={stockData.yearHigh && stockData.yearLow ? 
              `$${stockData.yearLow.toFixed(2)} - $${stockData.yearHigh.toFixed(2)}` : 
              'N/A'
            }
            icon={<ShowChart />}
          />
        </Grid>
      </Grid>
      
      {/* Tabs for different sections */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="stock data tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Description />} iconPosition="start" label="Overview" {...a11yProps(0)} />
          <Tab icon={<BarChart />} iconPosition="start" label="Fundamentals" {...a11yProps(1)} />
          <Tab icon={<Timeline />} iconPosition="start" label="Technical" {...a11yProps(2)} />
          <Tab icon={<Insights />} iconPosition="start" label="AI Insights" {...a11yProps(3)} />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Company Description</Typography>
              <Typography variant="body1" paragraph>
                {companyProfile.description || 'No company description available.'}
              </Typography>
              
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>Key Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">CEO</Typography>
                      <Typography variant="body1">{companyProfile.ceo || 'N/A'}</Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Industry</Typography>
                      <Typography variant="body1">{companyProfile.industry || 'N/A'}</Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Sector</Typography>
                      <Typography variant="body1">{companyProfile.sector || 'N/A'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Website</Typography>
                      <Typography variant="body1">
                        <a href={companyProfile.website} target="_blank" rel="noopener noreferrer">
                          {companyProfile.website || 'N/A'}
                        </a>
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Employees</Typography>
                      <Typography variant="body1">
                        {companyProfile.employees ? companyProfile.employees.toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">IPO Date</Typography>
                      <Typography variant="body1">{companyProfile.ipoDate || 'N/A'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Trading Information</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Open</Typography>
                  <Typography variant="body1">
                    {stockData.open ? stockData.open.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Previous Close</Typography>
                  <Typography variant="body1">
                    {stockData.previousClose ? stockData.previousClose.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Day Range</Typography>
                  <Typography variant="body1">
                    {stockData.dayLow && stockData.dayHigh ? 
                      `${stockData.dayLow.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} - ${stockData.dayHigh.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : 
                      'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">52 Week Range</Typography>
                  <Typography variant="body1">
                    {stockData.yearLow && stockData.yearHigh ? 
                      `${stockData.yearLow.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} - ${stockData.yearHigh.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : 
                      'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Volume</Typography>
                  <Typography variant="body1">
                    {stockData.volume ? stockData.volume.toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Avg. Volume</Typography>
                  <Typography variant="body1">
                    {stockData.avgVolume ? stockData.avgVolume.toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Market Cap</Typography>
                  <Typography variant="body1">
                    {stockData.marketCap ? 
                      stockData.marketCap.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : 
                      'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Beta</Typography>
                  <Typography variant="body1">
                    {stockData.beta ? stockData.beta.toFixed(2) : 'N/A'}
                  </Typography>
                </Box>
                <Box mb={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Dividend Yield</Typography>
                  <Typography variant="body1">
                    {stockData.lastDiv ? `${(stockData.lastDiv / stockData.price * 100).toFixed(2)}%` : 'N/A'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Fundamentals Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Key Metrics</Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                {keyMetrics ? (
                  <>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">P/E Ratio</Typography>
                      <Typography variant="body1">{keyMetrics.peRatio ? keyMetrics.peRatio.toFixed(2) : 'N/A'}</Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">EPS</Typography>
                      <Typography variant="body1">{keyMetrics.eps ? keyMetrics.eps.toFixed(2) : 'N/A'}</Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">P/B Ratio</Typography>
                      <Typography variant="body1">{keyMetrics.pbRatio ? keyMetrics.pbRatio.toFixed(2) : 'N/A'}</Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">ROE</Typography>
                      <Typography variant="body1">
                        {keyMetrics.roe ? `${(keyMetrics.roe * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">ROA</Typography>
                      <Typography variant="body1">
                        {keyMetrics.roa ? `${(keyMetrics.roa * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Debt to Equity</Typography>
                      <Typography variant="body1">
                        {keyMetrics.debtToEquity ? keyMetrics.debtToEquity.toFixed(2) : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Current Ratio</Typography>
                      <Typography variant="body1">
                        {keyMetrics.currentRatio ? keyMetrics.currentRatio.toFixed(2) : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Quick Ratio</Typography>
                      <Typography variant="body1">
                        {keyMetrics.quickRatio ? keyMetrics.quickRatio.toFixed(2) : 'N/A'}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <NoData message="No key metrics data available" />
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Financial Ratios</Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                {financialRatios ? (
                  <>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Gross Margin</Typography>
                      <Typography variant="body1">
                        {financialRatios.grossProfitMargin ? `${(financialRatios.grossProfitMargin * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Operating Margin</Typography>
                      <Typography variant="body1">
                        {financialRatios.operatingProfitMargin ? `${(financialRatios.operatingProfitMargin * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Net Margin</Typography>
                      <Typography variant="body1">
                        {financialRatios.netProfitMargin ? `${(financialRatios.netProfitMargin * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Dividend Yield</Typography>
                      <Typography variant="body1">
                        {financialRatios.dividendYield ? `${(financialRatios.dividendYield * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Dividend Payout Ratio</Typography>
                      <Typography variant="body1">
                        {financialRatios.payoutRatio ? `${(financialRatios.payoutRatio * 100).toFixed(2)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Price to Sales</Typography>
                      <Typography variant="body1">
                        {financialRatios.priceToSalesRatio ? financialRatios.priceToSalesRatio.toFixed(2) : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Price to Cash Flow</Typography>
                      <Typography variant="body1">
                        {financialRatios.priceCashFlowRatio ? financialRatios.priceCashFlowRatio.toFixed(2) : 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={1.5} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Price to Earnings Growth</Typography>
                      <Typography variant="body1">
                        {financialRatios.priceEarningsToGrowthRatio ? financialRatios.priceEarningsToGrowthRatio.toFixed(2) : 'N/A'}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <NoData message="No financial ratios data available" />
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Technical Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Technical Analysis</Typography>
              <TradingViewChartWrapper
                symbol={symbol || ''}
                height={500}
                showToolbar={true}
                showIntervalSelector={true}
                showChartTypeSelector={true}
                showStudiesSelector={true}
                allowFullscreen={true}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* AI Insights Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Price Prediction (30 Days)</Typography>
              {pricePrediction && pricePrediction.length > 0 ? (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  {/* Price prediction chart would go here */}
                  <Typography variant="body1">
                    Price prediction data is available but chart visualization requires additional implementation.
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="subtitle2">Latest Prediction:</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" fontWeight="bold">
                        {pricePrediction[0].predictedPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" ml={1}>
                        (Confidence: {Math.round(pricePrediction[0].confidence * 100)}%)
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Range: {pricePrediction[0].lowerBound.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} - {pricePrediction[0].upperBound.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <NoData message="No price prediction data available" />
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Sentiment Analysis</Typography>
              {sentimentAnalysis && sentimentAnalysis.length > 0 ? (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Box mb={2}>
                    <Typography variant="subtitle2">Overall Sentiment:</Typography>
                    <Box display="flex" alignItems="center">
                      <Chip 
                        label={sentimentAnalysis[0].overallSentiment.toUpperCase()} 
                        color={
                          sentimentAnalysis[0].overallSentiment === 'positive' ? 'success' :
                          sentimentAnalysis[0].overallSentiment === 'negative' ? 'error' : 'default'
                        }
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary" ml={1}>
                        Score: {sentimentAnalysis[0].sentimentScore.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>Source Breakdown:</Typography>
                  {sentimentAnalysis[0].sources.map((source: any, index: number) => (
                    <Box key={index} mb={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{source.source}</Typography>
                        <Chip 
                          label={source.sentiment.toUpperCase()} 
                          color={
                            source.sentiment === 'positive' ? 'success' :
                            source.sentiment === 'negative' ? 'error' : 'default'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Score: {source.score.toFixed(2)} (Based on {source.count} mentions)
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              ) : (
                <NoData message="No sentiment analysis data available" />
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StockDetailPage;