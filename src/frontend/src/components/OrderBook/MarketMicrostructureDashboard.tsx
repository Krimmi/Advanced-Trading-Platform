import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab,
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import orderBookService, { 
  MarketMicrostructureMetrics, 
  TimeSeriesAnalytics,
  CombinedTradingSignals
} from '../../services/orderBookService';

interface MarketMicrostructureDashboardProps {
  symbol: string;
  refreshInterval?: number; // in milliseconds
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
      id={`microstructure-tabpanel-${index}`}
      aria-labelledby={`microstructure-tab-${index}`}
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
    id: `microstructure-tab-${index}`,
    'aria-controls': `microstructure-tabpanel-${index}`,
  };
}

const MarketMicrostructureDashboard: React.FC<MarketMicrostructureDashboardProps> = ({
  symbol,
  refreshInterval = 10000 // Default to 10 seconds
}) => {
  const theme = useTheme();

  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [microstructureMetrics, setMicrostructureMetrics] = useState<MarketMicrostructureMetrics | null>(null);
  const [timeSeriesAnalytics, setTimeSeriesAnalytics] = useState<TimeSeriesAnalytics | null>(null);
  const [tradingSignals, setTradingSignals] = useState<CombinedTradingSignals | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Fetch market microstructure data
  const fetchMicrostructureData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch microstructure metrics
      const metrics = await orderBookService.getMarketMicrostructure(symbol);
      setMicrostructureMetrics(metrics);

      // Fetch time series analytics
      const timeSeriesData = await orderBookService.getTimeSeriesAnalytics(symbol);
      setTimeSeriesAnalytics(timeSeriesData);

      // Fetch trading signals
      const signals = await orderBookService.getTradingSignals(symbol);
      setTradingSignals(signals);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching market microstructure data:', error);
      setError('Failed to fetch market microstructure data. Please try again.');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMicrostructureData();
  }, [symbol]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchMicrostructureData();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, symbol]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format basis points
  const formatBps = (value: number): string => {
    return `${(value * 10000).toFixed(1)} bps`;
  };

  // Render microstructure metrics
  const renderMicrostructureMetrics = () => {
    if (!microstructureMetrics) return null;

    return (
      <Grid container spacing={2}>
        {/* Basic Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Basic Metrics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Mid Price:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {formatCurrency(microstructureMetrics.basic_metrics.mid_price)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Spread:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {formatCurrency(microstructureMetrics.basic_metrics.spread)} ({formatBps(microstructureMetrics.basic_metrics.relative_spread)})
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Bid Volume:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {microstructureMetrics.basic_metrics.bid_volume.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Ask Volume:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {microstructureMetrics.basic_metrics.ask_volume.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Liquidity Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Liquidity Metrics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Depth (1%):
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {microstructureMetrics.liquidity_metrics.depth_1pct.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Depth (5%):
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {microstructureMetrics.liquidity_metrics.depth_5pct.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Liquidity at Mid:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {microstructureMetrics.liquidity_metrics.liquidity_at_mid.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Resiliency:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {microstructureMetrics.liquidity_metrics.resiliency.toFixed(4)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Imbalance Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Imbalance Metrics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Volume Imbalance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={microstructureMetrics.imbalance_metrics.volume_imbalance > 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(microstructureMetrics.imbalance_metrics.volume_imbalance)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Order Imbalance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={microstructureMetrics.imbalance_metrics.order_imbalance > 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(microstructureMetrics.imbalance_metrics.order_imbalance)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Weighted Imbalance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={microstructureMetrics.imbalance_metrics.weighted_imbalance > 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(microstructureMetrics.imbalance_metrics.weighted_imbalance)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Order Flow Imbalance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={microstructureMetrics.order_flow_imbalance > 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(microstructureMetrics.order_flow_imbalance)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Price Impact */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Price Impact Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Buy Impact
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      1% of Book:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" align="right">
                      {formatBps(microstructureMetrics.price_impact.buy_1pct)}
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      5% of Book:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" align="right">
                      {formatBps(microstructureMetrics.price_impact.buy_5pct)}
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      10% of Book:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" align="right">
                      {formatBps(microstructureMetrics.price_impact.buy_10pct)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Sell Impact
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      1% of Book:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" align="right">
                      {formatBps(microstructureMetrics.price_impact.sell_1pct)}
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      5% of Book:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" align="right">
                      {formatBps(microstructureMetrics.price_impact.sell_5pct)}
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      10% of Book:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" align="right">
                      {formatBps(microstructureMetrics.price_impact.sell_10pct)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render time series analytics
  const renderTimeSeriesAnalytics = () => {
    if (!timeSeriesAnalytics) return null;

    return (
      <Grid container spacing={2}>
        {/* Time Series Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Time Series Metrics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Price Volatility:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {formatPercentage(timeSeriesAnalytics.metrics.price_volatility)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Spread Volatility:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {timeSeriesAnalytics.metrics.spread_volatility.toFixed(6)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Volume Imbalance Trend:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={timeSeriesAnalytics.metrics.volume_imbalance_trend > 0 ? 'success.main' : 'error.main'}
                >
                  {timeSeriesAnalytics.metrics.volume_imbalance_trend.toFixed(4)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Trend Significance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {formatPercentage(timeSeriesAnalytics.metrics.volume_imbalance_trend_significance)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Liquidity Trend:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={timeSeriesAnalytics.metrics.liquidity_trend > 0 ? 'success.main' : 'error.main'}
                >
                  {timeSeriesAnalytics.metrics.liquidity_trend.toFixed(4)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Mean Reversion Strength:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {timeSeriesAnalytics.metrics.mean_reversion_strength.toFixed(4)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Time Series Signals */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Time Series Signals
            </Typography>
            {Object.entries(timeSeriesAnalytics.signals.signals).map(([key, signal]) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  Signal: {signal.signal.toUpperCase()} | Strength: {(signal.strength * 100).toFixed(1)}%
                </Typography>
                {signal.description && (
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {signal.description}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}

            <Box sx={{ 
              p: 2, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: timeSeriesAnalytics.signals.overall_signal.signal === 'buy' 
                ? 'success.light' 
                : timeSeriesAnalytics.signals.overall_signal.signal === 'sell' 
                  ? 'error.light' 
                  : 'info.light',
              opacity: 0.9
            }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Overall Signal: {timeSeriesAnalytics.signals.overall_signal.signal.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                Strength: {(timeSeriesAnalytics.signals.overall_signal.strength * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2">
                Confidence: {(timeSeriesAnalytics.signals.overall_signal.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Time Series Charts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Price Chart
            </Typography>
            <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
              <img 
                src={`data:image/png;base64,${timeSeriesAnalytics.visualizations.mid_price}`} 
                alt="Mid Price Chart" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Volume Imbalance Chart
            </Typography>
            <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
              <img 
                src={`data:image/png;base64,${timeSeriesAnalytics.visualizations.volume_imbalance}`} 
                alt="Volume Imbalance Chart" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Spread Chart
            </Typography>
            <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
              <img 
                src={`data:image/png;base64,${timeSeriesAnalytics.visualizations.spread}`} 
                alt="Spread Chart" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render trading signals
  const renderTradingSignals = () => {
    if (!tradingSignals) return null;

    return (
      <Grid container spacing={2}>
        {/* Combined Signal */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Combined Trading Signal
            </Typography>
            <Box sx={{ 
              p: 3, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: tradingSignals.combined_signal.signal === 'buy' 
                ? 'success.light' 
                : tradingSignals.combined_signal.signal === 'sell' 
                  ? 'error.light' 
                  : 'info.light',
              opacity: 0.9,
              textAlign: 'center'
            }}>
              <Typography variant="h5" fontWeight="bold">
                {tradingSignals.combined_signal.signal.toUpperCase()}
              </Typography>
              <Typography variant="h6">
                Strength: {(tradingSignals.combined_signal.strength * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body1">
                Confidence: {(tradingSignals.combined_signal.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Order Book Signals */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Order Book Signals
            </Typography>
            <Box sx={{ 
              p: 2, 
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: tradingSignals.order_book_overall.signal === 'buy' 
                ? 'success.light' 
                : tradingSignals.order_book_overall.signal === 'sell' 
                  ? 'error.light' 
                  : 'info.light',
              opacity: 0.9
            }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Overall: {tradingSignals.order_book_overall.signal.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                Strength: {(tradingSignals.order_book_overall.strength * 100).toFixed(1)}%
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {Object.entries(tradingSignals.order_book_signals).map(([key, signal]) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  Signal: {signal.signal.toUpperCase()} | Strength: {(signal.strength * 100).toFixed(1)}%
                </Typography>
                {signal.description && (
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {signal.description}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Time Series Signals */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Time Series Signals
            </Typography>
            <Box sx={{ 
              p: 2, 
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: tradingSignals.time_series_overall.signal === 'buy' 
                ? 'success.light' 
                : tradingSignals.time_series_overall.signal === 'sell' 
                  ? 'error.light' 
                  : 'info.light',
              opacity: 0.9
            }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Overall: {tradingSignals.time_series_overall.signal.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                Strength: {(tradingSignals.time_series_overall.strength * 100).toFixed(1)}%
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {Object.entries(tradingSignals.time_series_signals).map(([key, signal]) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  Signal: {signal.signal.toUpperCase()} | Strength: {(signal.strength * 100).toFixed(1)}%
                </Typography>
                {signal.description && (
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {signal.description}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Market Microstructure Analysis: {symbol}
      </Typography>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabs */}
      {!loading && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="market microstructure tabs"
              variant="fullWidth"
            >
              <Tab label="Microstructure Metrics" {...a11yProps(0)} />
              <Tab label="Time Series Analysis" {...a11yProps(1)} />
              <Tab label="Trading Signals" {...a11yProps(2)} />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            {renderMicrostructureMetrics()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderTimeSeriesAnalytics()}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderTradingSignals()}
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};

export default MarketMicrostructureDashboard;