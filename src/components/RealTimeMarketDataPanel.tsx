import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, Typography, Grid, Box, Chip, Button, IconButton, Divider, CircularProgress, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { MarketDataStreamingService } from '../services/streaming/MarketDataStreamingService';
import { MarketDataType, MarketDataMessage } from '../services/websocket/MarketDataWebSocketService';
import { RealTimeAnalyticsService, AnalyticsType } from '../services/analytics/RealTimeAnalyticsService';
import { NotificationService, NotificationPriority, NotificationCategory } from '../services/notifications/NotificationService';

// Styled components
const DataCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const PriceText = styled(Typography)<{ trend: 'up' | 'down' | 'neutral' }>(({ theme, trend }) => ({
  fontWeight: 'bold',
  color: trend === 'up' ? theme.palette.success.main : 
         trend === 'down' ? theme.palette.error.main : 
         theme.palette.text.primary,
  transition: 'color 0.3s ease'
}));

const DataPoint = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0.5, 0),
}));

const FlashingValue = styled(Box)<{ flash: 'up' | 'down' | 'none' }>(({ theme, flash }) => ({
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: flash === 'up' ? `${theme.palette.success.light}40` : 
                  flash === 'down' ? `${theme.palette.error.light}40` : 
                  'transparent',
  transition: 'background-color 1s ease',
}));

const ConnectionStatus = styled(Chip)<{ status: 'connected' | 'connecting' | 'disconnected' | 'error' }>(({ theme, status }) => ({
  backgroundColor: status === 'connected' ? theme.palette.success.main :
                  status === 'connecting' ? theme.palette.warning.main :
                  status === 'disconnected' ? theme.palette.grey[500] :
                  theme.palette.error.main,
  color: theme.palette.common.white,
}));

// Interface for component props
interface RealTimeMarketDataPanelProps {
  symbols: string[];
  refreshInterval?: number;
  showAnalytics?: boolean;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

// Interface for market data state
interface MarketDataState {
  [symbol: string]: {
    lastPrice: number;
    priceChange: number;
    bid: number;
    ask: number;
    volume: number;
    high: number;
    low: number;
    lastUpdate: number;
    flashState: 'up' | 'down' | 'none';
  };
}

// Interface for analytics state
interface AnalyticsState {
  [symbol: string]: {
    momentum: number | null;
    volatility: number | null;
    vwap: number | null;
    bidAskSpread: number | null;
  };
}

/**
 * RealTimeMarketDataPanel displays streaming market data and analytics
 */
const RealTimeMarketDataPanel: React.FC<RealTimeMarketDataPanelProps> = ({
  symbols,
  refreshInterval = 1000,
  showAnalytics = true,
  onNotificationClick,
  onSettingsClick
}) => {
  // Services
  const streamingService = useRef<MarketDataStreamingService>(MarketDataStreamingService.getInstance());
  const analyticsService = useRef<RealTimeAnalyticsService>(RealTimeAnalyticsService.getInstance());
  const notificationService = useRef<NotificationService>(NotificationService.getInstance());
  
  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [marketData, setMarketData] = useState<MarketDataState>({});
  const [analyticsData, setAnalyticsData] = useState<AnalyticsState>({});
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  
  // Refs for subscriptions
  const dataSubscriptionRef = useRef<string | null>(null);
  const analyticsSubscriptionsRef = useRef<string[]>([]);
  
  // Initialize services and set up subscriptions
  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize services
        await streamingService.current.initialize();
        await analyticsService.current.initialize();
        await notificationService.current.initialize();
        
        setIsInitialized(true);
        
        // Subscribe to market data
        const dataSubscriptionId = streamingService.current.subscribe({
          dataTypes: [MarketDataType.QUOTES, MarketDataType.TRADES, MarketDataType.BARS],
          symbols,
          throttleRate: 2, // 2 updates per second
          bufferSize: 100,
          deduplicationWindow: 500, // 500ms deduplication
        });
        
        dataSubscriptionRef.current = dataSubscriptionId;
        
        // Set up listeners for market data
        streamingService.current.addListener(dataSubscriptionId, MarketDataType.QUOTES, handleQuoteData);
        streamingService.current.addListener(dataSubscriptionId, MarketDataType.TRADES, handleTradeData);
        streamingService.current.addListener(dataSubscriptionId, MarketDataType.BARS, handleBarData);
        
        // Subscribe to analytics if enabled
        if (showAnalytics) {
          setupAnalyticsSubscriptions();
        }
        
        // Set up notification listener
        notificationService.current.on('notification', handleNotification);
        
        // Set connection status
        const providers = streamingService.current.getConnectionStatus();
        const allConnected = Array.from(providers.values()).every(status => status);
        setConnectionStatus(allConnected ? 'connected' : 'disconnected');
        
        // Initialize market data state
        const initialMarketData: MarketDataState = {};
        symbols.forEach(symbol => {
          initialMarketData[symbol] = {
            lastPrice: 0,
            priceChange: 0,
            bid: 0,
            ask: 0,
            volume: 0,
            high: 0,
            low: 0,
            lastUpdate: Date.now(),
            flashState: 'none'
          };
        });
        
        setMarketData(initialMarketData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing services:', error);
        setConnectionStatus('error');
        setIsLoading(false);
      }
    };
    
    initServices();
    
    // Cleanup function
    return () => {
      // Unsubscribe from market data
      if (dataSubscriptionRef.current) {
        streamingService.current.unsubscribe(dataSubscriptionRef.current);
      }
      
      // Unsubscribe from analytics
      analyticsSubscriptionsRef.current.forEach(subscriptionId => {
        analyticsService.current.unsubscribe(subscriptionId);
      });
      
      // Remove notification listener
      notificationService.current.removeAllListeners('notification');
    };
  }, [symbols, showAnalytics]);
  
  // Set up analytics subscriptions
  const setupAnalyticsSubscriptions = () => {
    // Price Momentum
    const momentumSubscriptionId = analyticsService.current.subscribe({
      type: AnalyticsType.PRICE_MOMENTUM,
      symbols,
      parameters: { lookbackPeriods: 5 },
      windowSize: 60000, // 1 minute window
      updateInterval: 5000, // Update every 5 seconds
      requiredDataTypes: [MarketDataType.TRADES, MarketDataType.BARS]
    });
    
    analyticsService.current.addListener(momentumSubscriptionId, handleMomentumData);
    analyticsSubscriptionsRef.current.push(momentumSubscriptionId);
    
    // Price Volatility
    const volatilitySubscriptionId = analyticsService.current.subscribe({
      type: AnalyticsType.PRICE_VOLATILITY,
      symbols,
      parameters: {},
      windowSize: 60000, // 1 minute window
      updateInterval: 5000, // Update every 5 seconds
      requiredDataTypes: [MarketDataType.TRADES, MarketDataType.BARS]
    });
    
    analyticsService.current.addListener(volatilitySubscriptionId, handleVolatilityData);
    analyticsSubscriptionsRef.current.push(volatilitySubscriptionId);
    
    // VWAP
    const vwapSubscriptionId = analyticsService.current.subscribe({
      type: AnalyticsType.VWAP,
      symbols,
      parameters: {},
      windowSize: 60000, // 1 minute window
      updateInterval: 5000, // Update every 5 seconds
      requiredDataTypes: [MarketDataType.TRADES]
    });
    
    analyticsService.current.addListener(vwapSubscriptionId, handleVwapData);
    analyticsSubscriptionsRef.current.push(vwapSubscriptionId);
    
    // Bid-Ask Spread
    const spreadSubscriptionId = analyticsService.current.subscribe({
      type: AnalyticsType.BID_ASK_SPREAD,
      symbols,
      parameters: {},
      windowSize: 60000, // 1 minute window
      updateInterval: 5000, // Update every 5 seconds
      requiredDataTypes: [MarketDataType.QUOTES]
    });
    
    analyticsService.current.addListener(spreadSubscriptionId, handleSpreadData);
    analyticsSubscriptionsRef.current.push(spreadSubscriptionId);
  };
  
  // Handle quote data
  const handleQuoteData = (data: MarketDataMessage) => {
    const { symbol } = data;
    
    setMarketData(prevData => {
      const symbolData = prevData[symbol] || {
        lastPrice: 0,
        priceChange: 0,
        bid: 0,
        ask: 0,
        volume: 0,
        high: 0,
        low: 0,
        lastUpdate: Date.now(),
        flashState: 'none'
      };
      
      // Update bid and ask
      const bid = data.data.bid;
      const ask = data.data.ask;
      
      // Determine flash state for bid
      let bidFlashState: 'up' | 'down' | 'none' = 'none';
      if (bid > symbolData.bid) {
        bidFlashState = 'up';
      } else if (bid < symbolData.bid) {
        bidFlashState = 'down';
      }
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          bid,
          ask,
          lastUpdate: Date.now(),
          flashState: bidFlashState
        }
      };
    });
  };
  
  // Handle trade data
  const handleTradeData = (data: MarketDataMessage) => {
    const { symbol } = data;
    
    setMarketData(prevData => {
      const symbolData = prevData[symbol] || {
        lastPrice: 0,
        priceChange: 0,
        bid: 0,
        ask: 0,
        volume: 0,
        high: 0,
        low: 0,
        lastUpdate: Date.now(),
        flashState: 'none'
      };
      
      // Update last price and calculate change
      const lastPrice = data.data.price;
      const priceChange = symbolData.lastPrice > 0 
        ? (lastPrice - symbolData.lastPrice) / symbolData.lastPrice 
        : 0;
      
      // Update volume
      const volume = symbolData.volume + data.data.size;
      
      // Update high and low
      const high = symbolData.high > 0 ? Math.max(symbolData.high, lastPrice) : lastPrice;
      const low = symbolData.low > 0 ? Math.min(symbolData.low, lastPrice) : lastPrice;
      
      // Determine flash state
      let flashState: 'up' | 'down' | 'none' = 'none';
      if (lastPrice > symbolData.lastPrice) {
        flashState = 'up';
      } else if (lastPrice < symbolData.lastPrice) {
        flashState = 'down';
      }
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          lastPrice,
          priceChange,
          volume,
          high,
          low,
          lastUpdate: Date.now(),
          flashState
        }
      };
    });
  };
  
  // Handle bar data
  const handleBarData = (data: MarketDataMessage) => {
    const { symbol } = data;
    
    setMarketData(prevData => {
      const symbolData = prevData[symbol] || {
        lastPrice: 0,
        priceChange: 0,
        bid: 0,
        ask: 0,
        volume: 0,
        high: 0,
        low: 0,
        lastUpdate: Date.now(),
        flashState: 'none'
      };
      
      // Update last price and calculate change
      const lastPrice = data.data.close;
      const priceChange = data.data.open > 0 
        ? (lastPrice - data.data.open) / data.data.open 
        : 0;
      
      // Update volume
      const volume = data.data.volume;
      
      // Update high and low
      const high = data.data.high;
      const low = data.data.low;
      
      // Determine flash state
      let flashState: 'up' | 'down' | 'none' = 'none';
      if (lastPrice > data.data.open) {
        flashState = 'up';
      } else if (lastPrice < data.data.open) {
        flashState = 'down';
      }
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          lastPrice,
          priceChange,
          volume,
          high,
          low,
          lastUpdate: Date.now(),
          flashState
        }
      };
    });
  };
  
  // Handle momentum data
  const handleMomentumData = (data: any) => {
    const { symbol, value } = data;
    
    setAnalyticsData(prevData => {
      const symbolData = prevData[symbol] || {
        momentum: null,
        volatility: null,
        vwap: null,
        bidAskSpread: null
      };
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          momentum: value
        }
      };
    });
  };
  
  // Handle volatility data
  const handleVolatilityData = (data: any) => {
    const { symbol, value } = data;
    
    setAnalyticsData(prevData => {
      const symbolData = prevData[symbol] || {
        momentum: null,
        volatility: null,
        vwap: null,
        bidAskSpread: null
      };
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          volatility: value
        }
      };
    });
  };
  
  // Handle VWAP data
  const handleVwapData = (data: any) => {
    const { symbol, value } = data;
    
    setAnalyticsData(prevData => {
      const symbolData = prevData[symbol] || {
        momentum: null,
        volatility: null,
        vwap: null,
        bidAskSpread: null
      };
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          vwap: value
        }
      };
    });
  };
  
  // Handle spread data
  const handleSpreadData = (data: any) => {
    const { symbol, value } = data;
    
    setAnalyticsData(prevData => {
      const symbolData = prevData[symbol] || {
        momentum: null,
        volatility: null,
        vwap: null,
        bidAskSpread: null
      };
      
      return {
        ...prevData,
        [symbol]: {
          ...symbolData,
          bidAskSpread: value.spread
        }
      };
    });
  };
  
  // Handle notification
  const handleNotification = () => {
    setUnreadNotifications(prev => prev + 1);
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // Unsubscribe from current data
      if (dataSubscriptionRef.current) {
        streamingService.current.unsubscribe(dataSubscriptionRef.current);
      }
      
      // Unsubscribe from analytics
      analyticsSubscriptionsRef.current.forEach(subscriptionId => {
        analyticsService.current.unsubscribe(subscriptionId);
      });
      analyticsSubscriptionsRef.current = [];
      
      // Subscribe to market data again
      const dataSubscriptionId = streamingService.current.subscribe({
        dataTypes: [MarketDataType.QUOTES, MarketDataType.TRADES, MarketDataType.BARS],
        symbols,
        throttleRate: 2, // 2 updates per second
        bufferSize: 100,
        deduplicationWindow: 500, // 500ms deduplication
      });
      
      dataSubscriptionRef.current = dataSubscriptionId;
      
      // Set up listeners for market data
      streamingService.current.addListener(dataSubscriptionId, MarketDataType.QUOTES, handleQuoteData);
      streamingService.current.addListener(dataSubscriptionId, MarketDataType.TRADES, handleTradeData);
      streamingService.current.addListener(dataSubscriptionId, MarketDataType.BARS, handleBarData);
      
      // Subscribe to analytics if enabled
      if (showAnalytics) {
        setupAnalyticsSubscriptions();
      }
      
      // Reset market data state
      const initialMarketData: MarketDataState = {};
      symbols.forEach(symbol => {
        initialMarketData[symbol] = {
          lastPrice: 0,
          priceChange: 0,
          bid: 0,
          ask: 0,
          volume: 0,
          high: 0,
          low: 0,
          lastUpdate: Date.now(),
          flashState: 'none'
        };
      });
      
      setMarketData(initialMarketData);
      setAnalyticsData({});
      
      // Update connection status
      const providers = streamingService.current.getConnectionStatus();
      const allConnected = Array.from(providers.values()).every(status => status);
      setConnectionStatus(allConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setConnectionStatus('error');
    }
    
    setIsLoading(false);
  };
  
  // Handle notification button click
  const handleNotificationClick = () => {
    setUnreadNotifications(0);
    if (onNotificationClick) {
      onNotificationClick();
    }
  };
  
  // Reset flash states after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMarketData(prevData => {
        const updatedData = { ...prevData };
        
        for (const symbol in updatedData) {
          if (updatedData[symbol].flashState !== 'none') {
            updatedData[symbol] = {
              ...updatedData[symbol],
              flashState: 'none'
            };
          }
        }
        
        return updatedData;
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [marketData]);
  
  // Render price trend icon
  const renderTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUpIcon color="success" fontSize="small" />;
    } else if (change < 0) {
      return <TrendingDownIcon color="error" fontSize="small" />;
    } else {
      return <TrendingFlatIcon color="action" fontSize="small" />;
    }
  };
  
  // Format price with commas and fixed decimal places
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Card>
      <CardHeader
        title="Real-Time Market Data"
        action={
          <Box display="flex" alignItems="center">
            <ConnectionStatus 
              label={connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting' :
                     connectionStatus === 'disconnected' ? 'Disconnected' : 'Error'}
              size="small"
              status={connectionStatus}
              sx={{ mr: 1 }}
            />
            <Tooltip title="Notifications">
              <IconButton onClick={handleNotificationClick}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={onSettingsClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {symbols.map(symbol => {
            const data = marketData[symbol] || {
              lastPrice: 0,
              priceChange: 0,
              bid: 0,
              ask: 0,
              volume: 0,
              high: 0,
              low: 0,
              lastUpdate: Date.now(),
              flashState: 'none'
            };
            
            const analytics = analyticsData[symbol] || {
              momentum: null,
              volatility: null,
              vwap: null,
              bidAskSpread: null
            };
            
            return (
              <Grid item xs={12} md={6} lg={4} key={symbol}>
                <DataCard>
                  <CardHeader
                    title={symbol}
                    titleTypographyProps={{ variant: 'h6' }}
                    action={
                      <Box display="flex" alignItems="center">
                        {renderTrendIcon(data.priceChange)}
                        <Typography variant="body2" color={data.priceChange > 0 ? 'success.main' : data.priceChange < 0 ? 'error.main' : 'text.secondary'} sx={{ ml: 0.5 }}>
                          {formatPercentage(data.priceChange)}
                        </Typography>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Box mb={2}>
                      <Typography variant="overline" color="textSecondary">Last Price</Typography>
                      <FlashingValue flash={data.flashState}>
                        <PriceText variant="h4" trend={data.priceChange > 0 ? 'up' : data.priceChange < 0 ? 'down' : 'neutral'}>
                          ${formatPrice(data.lastPrice)}
                        </PriceText>
                      </FlashingValue>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <DataPoint>
                          <Typography variant="body2" color="textSecondary">Bid</Typography>
                          <Typography variant="body2">${formatPrice(data.bid)}</Typography>
                        </DataPoint>
                      </Grid>
                      <Grid item xs={6}>
                        <DataPoint>
                          <Typography variant="body2" color="textSecondary">Ask</Typography>
                          <Typography variant="body2">${formatPrice(data.ask)}</Typography>
                        </DataPoint>
                      </Grid>
                      <Grid item xs={6}>
                        <DataPoint>
                          <Typography variant="body2" color="textSecondary">High</Typography>
                          <Typography variant="body2">${formatPrice(data.high)}</Typography>
                        </DataPoint>
                      </Grid>
                      <Grid item xs={6}>
                        <DataPoint>
                          <Typography variant="body2" color="textSecondary">Low</Typography>
                          <Typography variant="body2">${formatPrice(data.low)}</Typography>
                        </DataPoint>
                      </Grid>
                      <Grid item xs={12}>
                        <DataPoint>
                          <Typography variant="body2" color="textSecondary">Volume</Typography>
                          <Typography variant="body2">{data.volume.toLocaleString()}</Typography>
                        </DataPoint>
                      </Grid>
                    </Grid>
                    
                    {showAnalytics && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>Analytics</Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <DataPoint>
                              <Typography variant="body2" color="textSecondary">Momentum</Typography>
                              <Typography variant="body2" color={analytics.momentum > 0 ? 'success.main' : analytics.momentum < 0 ? 'error.main' : 'text.secondary'}>
                                {analytics.momentum !== null ? formatPercentage(analytics.momentum) : 'N/A'}
                              </Typography>
                            </DataPoint>
                          </Grid>
                          <Grid item xs={6}>
                            <DataPoint>
                              <Typography variant="body2" color="textSecondary">Volatility</Typography>
                              <Typography variant="body2">
                                {analytics.volatility !== null ? formatPercentage(analytics.volatility) : 'N/A'}
                              </Typography>
                            </DataPoint>
                          </Grid>
                          <Grid item xs={6}>
                            <DataPoint>
                              <Typography variant="body2" color="textSecondary">VWAP</Typography>
                              <Typography variant="body2">
                                {analytics.vwap !== null ? `$${formatPrice(analytics.vwap)}` : 'N/A'}
                              </Typography>
                            </DataPoint>
                          </Grid>
                          <Grid item xs={6}>
                            <DataPoint>
                              <Typography variant="body2" color="textSecondary">Spread</Typography>
                              <Typography variant="body2">
                                {analytics.bidAskSpread !== null ? `$${formatPrice(analytics.bidAskSpread)}` : 'N/A'}
                              </Typography>
                            </DataPoint>
                          </Grid>
                        </Grid>
                      </>
                    )}
                    
                    <Box mt={2} display="flex" justifyContent="flex-end">
                      <Typography variant="caption" color="textSecondary">
                        Last updated: {new Date(data.lastUpdate).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </DataCard>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RealTimeMarketDataPanel;