import React, { useEffect, useState, useRef } from 'react';
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
  alpha,
  Container
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
import CandlestickChart from '../../components/charts/CandlestickChart';
import TechnicalIndicatorChart from '../../components/charts/TechnicalIndicatorChart';
import VolumeChart from '../../components/charts/VolumeChart';
import ComparisonChart from '../../components/charts/ComparisonChart';
import OrderEntryForm from '../../components/trading/OrderEntryForm';
import OrderBookVisualization from '../../components/trading/OrderBookVisualization';
import TradeHistoryTable from '../../components/trading/TradeHistoryTable';
import PositionSizingCalculator from '../../components/trading/PositionSizingCalculator';

// Store
import { RootState } from '../../store';
import { fetchStockQuote, addToWatchlist, removeFromWatchlist } from '../../store/slices/marketSlice';

// Types
import { CandlestickData, LineData, HistogramData, TimeRange } from 'lightweight-charts';
import { Column } from '../../components/common/DataTable';
import { OrderBookData, Trade } from '../../components/trading/OrderBookVisualization';

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

const StockDetailPageEnhanced: React.FC = () => {
  const theme = useTheme();
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL'>('1D');
  const [chartTimeRange, setChartTimeRange] = useState<TimeRange | null>(null);
  const [showOrderEntry, setShowOrderEntry] = useState<boolean>(false);
  const [showPositionSizing, setShowPositionSizing] = useState<boolean>(false);
  
  // Redux state
  const { quotes, watchlists, loading, error } = useSelector((state: RootState) => state.market);
  const defaultWatchlist = watchlists['default'];
  const stockQuote = symbol ? quotes[symbol] : undefined;
  
  // Mock data for charts
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<HistogramData[]>([]);
  const [indicatorData, setIndicatorData] = useState<LineData[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  
  // Generate mock data on mount
  useEffect(() => {
    if (symbol) {
      // Generate candlestick data
      const mockCandlestickData: CandlestickData[] = [];
      const mockVolumeData: HistogramData[] = [];
      const mockIndicatorData: LineData[] = [];
      
      const basePrice = 150; // Starting price
      const now = new Date();
      now.setHours(16, 0, 0, 0); // Set to market close
      
      // Generate 100 days of data
      for (let i = 100; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const time = Math.floor(date.getTime() / 1000);
        
        // Generate random price movement
        const openPrice = basePrice + Math.sin(i / 10) * 20 + (Math.random() - 0.5) * 10;
        const highPrice = openPrice + Math.random() * 5;
        const lowPrice = openPrice - Math.random() * 5;
        const closePrice = (openPrice + highPrice + lowPrice) / 3 + (Math.random() - 0.5) * 3;
        
        // Generate random volume
        const volume = Math.floor(Math.random() * 1000000) + 500000;
        
        // Add candlestick data
        mockCandlestickData.push({
          time,
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
        });
        
        // Add volume data
        mockVolumeData.push({
          time,
          value: volume,
          color: closePrice >= openPrice ? theme.palette.success.main : theme.palette.error.main,
        });
        
        // Add indicator data (SMA)
        if (i < 95) { // Start after 5 days for SMA
          const sma = mockCandlestickData.slice(-5).reduce((sum, candle) => sum + candle.close, 0) / 5;
          mockIndicatorData.push({
            time,
            value: sma,
          });
        }
      }
      
      setCandlestickData(mockCandlestickData);
      setVolumeData(mockVolumeData);
      setIndicatorData(mockIndicatorData);
      
      // Generate comparison data
      const mockComparisonData = [
        {
          id: symbol,
          name: symbol,
          data: mockCandlestickData.map(candle => ({
            time: candle.time,
            value: candle.close,
          })),
          color: theme.palette.primary.main,
        },
        {
          id: 'SPY',
          name: 'S&P 500 ETF',
          data: mockCandlestickData.map(candle => ({
            time: candle.time,
            value: candle.close * (1 + (Math.sin(candle.time / 10000000) * 0.2)),
          })),
          color: theme.palette.secondary.main,
        },
        {
          id: 'SECTOR',
          name: 'Sector ETF',
          data: mockCandlestickData.map(candle => ({
            time: candle.time,
            value: candle.close * (1 + (Math.cos(candle.time / 10000000) * 0.15)),
          })),
          color: theme.palette.success.main,
        },
      ];
      
      setComparisonData(mockComparisonData);
      
      // Generate order book data
      const mockOrderBookData: OrderBookData = {
        bids: Array.from({ length: 20 }, (_, i) => ({
          price: basePrice - (i * 0.1) - (Math.random() * 0.05),
          size: Math.floor(Math.random() * 1000) + 100,
          total: 0, // Will be calculated later
          orders: Math.floor(Math.random() * 10) + 1,
        })),
        asks: Array.from({ length: 20 }, (_, i) => ({
          price: basePrice + (i * 0.1) + (Math.random() * 0.05),
          size: Math.floor(Math.random() * 1000) + 100,
          total: 0, // Will be calculated later
          orders: Math.floor(Math.random() * 10) + 1,
        })),
        spread: 0, // Will be calculated
        spreadPercentage: 0, // Will be calculated
        timestamp: Date.now(),
      };
      
      // Calculate totals for bids and asks
      let bidTotal = 0;
      mockOrderBookData.bids.forEach(bid => {
        bidTotal += bid.size;
        bid.total = bidTotal;
      });
      
      let askTotal = 0;
      mockOrderBookData.asks.forEach(ask => {
        askTotal += ask.size;
        ask.total = askTotal;
      });
      
      // Calculate spread
      mockOrderBookData.spread = mockOrderBookData.asks[0].price - mockOrderBookData.bids[0].price;
      mockOrderBookData.spreadPercentage = (mockOrderBookData.spread / mockOrderBookData.asks[0].price) * 100;
      
      setOrderBookData(mockOrderBookData);
      
      // Generate trade history
      const mockTradeHistory: Trade[] = Array.from({ length: 50 }, (_, i) => {
        const tradeTime = Date.now() - (i * 30000); // 30 seconds between trades
        const isBuy = Math.random() > 0.5;
        const price = basePrice + (Math.random() - 0.5) * 2;
        const size = Math.floor(Math.random() * 500) + 50;
        
        return {
          id: `trade-${i}`,
          price,
          size,
          side: isBuy ? 'buy' : 'sell',
          timestamp: tradeTime,
          exchange: ['NASDAQ', 'NYSE', 'ARCA', 'BATS'][Math.floor(Math.random() * 4)],
          conditions: Math.random() > 0.7 ? ['AUTO', 'LAST'] : [],
          isAggressorBuy: isBuy,
          isOutsideRegularHours: Math.random() > 0.9,
        };
      });
      
      setTradeHistory(mockTradeHistory);
      
      // Fetch stock quote
      dispatch(fetchStockQuote(symbol) as any);
    }
  }, [symbol, dispatch, theme]);
  
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
    
    // Adjust visible range based on timeframe
    const now = Math.floor(Date.now() / 1000);
    let from = now;
    
    switch (newTimeframe) {
      case '1D':
        from = now - 24 * 60 * 60;
        break;
      case '1W':
        from = now - 7 * 24 * 60 * 60;
        break;
      case '1M':
        from = now - 30 * 24 * 60 * 60;
        break;
      case '3M':
        from = now - 90 * 24 * 60 * 60;
        break;
      case '1Y':
        from = now - 365 * 24 * 60 * 60;
        break;
      case 'YTD':
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        from = Math.floor(startOfYear.getTime() / 1000);
        break;
      case 'ALL':
        from = candlestickData.length > 0 ? candlestickData[0].time as number : now - 365 * 24 * 60 * 60;
        break;
    }
    
    setChartTimeRange({ from, to: now });
  };
  
  // Handle time range change from chart
  const handleTimeRangeChange = (range: TimeRange) => {
    setChartTimeRange(range);
  };
  
  // Handle order entry toggle
  const handleOrderEntryToggle = () => {
    setShowOrderEntry(!showOrderEntry);
    if (showPositionSizing) {
      setShowPositionSizing(false);
    }
  };
  
  // Handle position sizing toggle
  const handlePositionSizingToggle = () => {
    setShowPositionSizing(!showPositionSizing);
    if (showOrderEntry) {
      setShowOrderEntry(false);
    }
  };
  
  // Handle order submission
  const handleOrderSubmit = (values: any) => {
    console.log('Order submitted:', values);
    // In a real app, this would dispatch an action to submit the order
    setShowOrderEntry(false);
  };
  
  // Handle position sizing calculation
  const handlePositionSizingCalculate = (result: any) => {
    console.log('Position sizing calculated:', result);
  };
  
  // Handle order book price click
  const handleOrderBookPriceClick = (price: number, side: 'bid' | 'ask') => {
    console.log(`Clicked ${side} at price ${price}`);
    // In a real app, this would update the order entry form with the selected price
  };
  
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
    <Container maxWidth="xl">
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
                onClick={handleOrderEntryToggle}
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
              
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                {candlestickData.length > 0 && (
                  <CandlestickChart
                    data={candlestickData}
                    height="100%"
                    timeRange={chartTimeRange || undefined}
                    onTimeRangeChange={handleTimeRangeChange}
                    autosize={true}
                    indicators={[
                      {
                        id: 'sma',
                        type: 'line',
                        data: indicatorData,
                        color: theme.palette.info.main,
                        title: 'SMA (5)',
                      }
                    ]}
                    interactionOptions={{
                      zoomEnabled: true,
                      panEnabled: true,
                      selectionEnabled: false,
                      drawingEnabled: false,
                    }}
                  />
                )}
              </Box>
            </ChartContainer>
          </Box>
        </ErrorBoundary>
        
        {/* Volume Chart */}
        <ErrorBoundary>
          <Box sx={{ mb: 4 }}>
            <ChartContainer
              title="Volume"
              height={150}
              onRefresh={handleRefresh}
            >
              <Box sx={{ height: '100%' }}>
                {volumeData.length > 0 && (
                  <VolumeChart
                    data={volumeData}
                    height="100%"
                    timeRange={chartTimeRange || undefined}
                    autosize={true}
                    mainChartTimeScale={null}
                    priceData={candlestickData.map(candle => ({
                      time: candle.time as number,
                      close: candle.close,
                    }))}
                  />
                )}
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
            <Tab icon={<BarChartIcon />} label="Order Book" />
            <Tab icon={<InsightsIcon />} label="Comparison" />
            <Tab icon={<ArticleIcon />} label="Trades" />
          </Tabs>
          
          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Order Entry / Position Sizing */}
              <Grid item xs={12} md={6}>
                {showOrderEntry ? (
                  <OrderEntryForm
                    symbol={symbol}
                    price={stockQuote?.price || 0}
                    availableCash={100000}
                    availableShares={1000}
                    onSubmit={handleOrderSubmit}
                    onCancel={() => setShowOrderEntry(false)}
                  />
                ) : showPositionSizing ? (
                  <PositionSizingCalculator
                    accountValue={100000}
                    symbol={symbol}
                    price={stockQuote?.price || 0}
                    onCalculate={handlePositionSizingCalculate}
                    onSave={() => setShowPositionSizing(false)}
                  />
                ) : (
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
                      Trading Tools
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          size="large"
                          onClick={handleOrderEntryToggle}
                          sx={{ mb: 2 }}
                        >
                          Place Order
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          size="large"
                          onClick={handlePositionSizingToggle}
                        >
                          Position Sizing Calculator
                        </Button>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                          Account Summary
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Available Cash
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              $100,000.00
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Portfolio Value
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              $250,000.00
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Open Positions
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              12
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Open Orders
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              3
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
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
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Market Cap
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.marketCap.toLocaleString() || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        P/E Ratio
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stockQuote?.pe.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        EPS (TTM)
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.eps.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Dividend Yield
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stockQuote?.yield.toFixed(2) || 'N/A'}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        52 Week High
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.high52.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        52 Week Low
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${stockQuote?.low52.toFixed(2) || 'N/A'}
                      </Typography>
                    </Grid>
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
          
          {/* Technical Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ChartContainer
                  title="Technical Indicators"
                  height={400}
                  onRefresh={handleRefresh}
                >
                  <Box sx={{ height: '100%' }}>
                    {candlestickData.length > 0 && (
                      <CandlestickChart
                        data={candlestickData}
                        height="100%"
                        timeRange={chartTimeRange || undefined}
                        onTimeRangeChange={handleTimeRangeChange}
                        autosize={true}
                        indicators={[
                          {
                            id: 'sma',
                            type: 'line',
                            data: indicatorData,
                            color: theme.palette.info.main,
                            title: 'SMA (5)',
                          },
                          {
                            id: 'ema',
                            type: 'line',
                            data: indicatorData.map(d => ({
                              time: d.time,
                              value: (d.value as number) * 0.98,
                            })),
                            color: theme.palette.secondary.main,
                            title: 'EMA (10)',
                          },
                        ]}
                        interactionOptions={{
                          zoomEnabled: true,
                          panEnabled: true,
                          selectionEnabled: true,
                          drawingEnabled: false,
                        }}
                      />
                    )}
                  </Box>
                </ChartContainer>
              </Grid>
              
              <Grid item xs={12}>
                <ChartContainer
                  title="Technical Oscillators"
                  height={200}
                  onRefresh={handleRefresh}
                >
                  <Box sx={{ height: '100%' }}>
                    {indicatorData.length > 0 && (
                      <TechnicalIndicatorChart
                        indicators={[
                          {
                            type: 'line',
                            data: indicatorData.map(d => ({
                              time: d.time,
                              value: Math.sin((d.time as number) / 10000000) * 50 + 50,
                            })),
                            color: theme.palette.warning.main,
                            title: 'RSI',
                          },
                        ]}
                        height="100%"
                        timeRange={chartTimeRange || undefined}
                        autosize={true}
                        mainChartTimeScale={null}
                      />
                    )}
                  </Box>
                </ChartContainer>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Order Book Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {orderBookData && (
                  <OrderBookVisualization
                    data={orderBookData}
                    symbol={symbol || ''}
                    depth={20}
                    grouping={0.1}
                    onRefresh={handleRefresh}
                    onPriceClick={handleOrderBookPriceClick}
                    height={600}
                  />
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <OrderEntryForm
                  symbol={symbol}
                  price={stockQuote?.price || 0}
                  availableCash={100000}
                  availableShares={1000}
                  onSubmit={handleOrderSubmit}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Comparison Tab */}
          <TabPanel value={tabValue} index={3}>
            <ChartContainer
              title="Performance Comparison"
              subtitle="Relative performance vs. benchmarks"
              height={400}
              onRefresh={handleRefresh}
            >
              <Box sx={{ height: '100%' }}>
                {comparisonData.length > 0 && (
                  <ComparisonChart
                    series={comparisonData}
                    height="100%"
                    timeRange={chartTimeRange || undefined}
                    onTimeRangeChange={handleTimeRangeChange}
                    autosize={true}
                    priceScaleMode="percentage"
                  />
                )}
              </Box>
            </ChartContainer>
          </TabPanel>
          
          {/* Trades Tab */}
          <TabPanel value={tabValue} index={4}>
            {tradeHistory.length > 0 && (
              <TradeHistoryTable
                trades={tradeHistory}
                symbol={symbol || ''}
                onRefresh={handleRefresh}
                height={600}
              />
            )}
          </TabPanel>
        </Box>
      </Box>
    </Container>
  );
};

export default StockDetailPageEnhanced;