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
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import orderBookService, { OrderBookSnapshot, OrderBookAnalytics } from '../../services/orderBookService';

interface OrderBookVisualizationProps {
  symbol: string;
  refreshInterval?: number; // in milliseconds
}

const OrderBookVisualization: React.FC<OrderBookVisualizationProps> = ({
  symbol,
  refreshInterval = 5000 // Default to 5 seconds
}) => {
  const theme = useTheme();

  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderBookSnapshot, setOrderBookSnapshot] = useState<OrderBookSnapshot | null>(null);
  const [analytics, setAnalytics] = useState<OrderBookAnalytics | null>(null);
  const [depth, setDepth] = useState<number>(10);
  const [activeVisualization, setActiveVisualization] = useState<string>('order_book');

  // Fetch order book data
  const fetchOrderBookData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order book snapshot
      const snapshot = await orderBookService.getOrderBookSnapshot(symbol, depth);
      setOrderBookSnapshot(snapshot);

      // Fetch analytics
      const analyticsData = await orderBookService.getOrderBookAnalytics(symbol);
      setAnalytics(analyticsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching order book data:', error);
      setError('Failed to fetch order book data. Please try again.');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOrderBookData();
  }, [symbol, depth]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchOrderBookData();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, symbol, depth]);

  // Handle depth change
  const handleDepthChange = (event: SelectChangeEvent<number>) => {
    setDepth(event.target.value as number);
  };

  // Handle visualization change
  const handleVisualizationChange = (event: SelectChangeEvent<string>) => {
    setActiveVisualization(event.target.value);
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

  // Render order book table
  const renderOrderBookTable = () => {
    if (!orderBookSnapshot) return null;

    return (
      <Grid container spacing={2}>
        {/* Bids */}
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom color="success.main">
            Bids
          </Typography>
          <Box sx={{ 
            maxHeight: 400, 
            overflow: 'auto',
            '& .MuiTableCell-root': {
              padding: '6px 16px',
            }
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Size</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderBookSnapshot.bids.map((bid, index) => {
                  const total = orderBookSnapshot.bids
                    .slice(0, index + 1)
                    .reduce((sum, item) => sum + item.size, 0);
                  
                  return (
                    <tr key={`bid-${index}`}>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '4px 8px',
                        color: theme.palette.success.main,
                        fontWeight: index === 0 ? 'bold' : 'normal'
                      }}>
                        {formatCurrency(bid.price)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                        {bid.size.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                        {total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Grid>

        {/* Asks */}
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom color="error.main">
            Asks
          </Typography>
          <Box sx={{ 
            maxHeight: 400, 
            overflow: 'auto',
            '& .MuiTableCell-root': {
              padding: '6px 16px',
            }
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Size</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderBookSnapshot.asks.map((ask, index) => {
                  const total = orderBookSnapshot.asks
                    .slice(0, index + 1)
                    .reduce((sum, item) => sum + item.size, 0);
                  
                  return (
                    <tr key={`ask-${index}`}>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '4px 8px',
                        color: theme.palette.error.main,
                        fontWeight: index === 0 ? 'bold' : 'normal'
                      }}>
                        {formatCurrency(ask.price)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                        {ask.size.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                        {total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Grid>
      </Grid>
    );
  };

  // Render visualization
  const renderVisualization = () => {
    if (!analytics) return null;

    switch (activeVisualization) {
      case 'order_book':
        return (
          <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
            <img 
              src={`data:image/png;base64,${analytics.visualizations.order_book}`} 
              alt="Order Book Visualization" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        );
      case 'depth_chart':
        return (
          <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
            <img 
              src={`data:image/png;base64,${analytics.visualizations.depth_chart}`} 
              alt="Depth Chart" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        );
      case 'price_impact':
        return (
          <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
            <img 
              src={`data:image/png;base64,${analytics.visualizations.price_impact}`} 
              alt="Price Impact Chart" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  // Render metrics
  const renderMetrics = () => {
    if (!analytics) return null;

    return (
      <Grid container spacing={2}>
        {/* Basic Metrics */}
        <Grid item xs={12} md={6}>
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
                  {formatCurrency(analytics.basic_metrics.mid_price)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Spread:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {formatCurrency(analytics.basic_metrics.spread)} ({formatPercentage(analytics.basic_metrics.relative_spread)})
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Bid Volume:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {analytics.basic_metrics.bid_volume.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Ask Volume:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {analytics.basic_metrics.ask_volume.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Volume Imbalance:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body2" 
                  align="right"
                  color={analytics.basic_metrics.volume_imbalance > 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(analytics.basic_metrics.volume_imbalance)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Liquidity Metrics */}
        <Grid item xs={12} md={6}>
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
                  {analytics.liquidity_metrics.depth_1pct.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Depth (5%):
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {analytics.liquidity_metrics.depth_5pct.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Liquidity at Mid:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {analytics.liquidity_metrics.liquidity_at_mid.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Resiliency:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {analytics.liquidity_metrics.resiliency.toFixed(4)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Trading Signals */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Trading Signals
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(analytics.signals.signals).map(([key, signal]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Box sx={{ 
                    p: 1, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: signal.signal === 'buy' 
                      ? 'success.light' 
                      : signal.signal === 'sell' 
                        ? 'error.light' 
                        : 'info.light',
                    opacity: 0.8
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      Signal: {signal.signal.toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      Strength: {(signal.strength * 100).toFixed(1)}%
                    </Typography>
                    {signal.description && (
                      <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem' }}>
                        {signal.description}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ 
              p: 2, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: analytics.signals.overall_signal.signal === 'buy' 
                ? 'success.light' 
                : analytics.signals.overall_signal.signal === 'sell' 
                  ? 'error.light' 
                  : 'info.light',
              opacity: 0.9
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Overall Signal: {analytics.signals.overall_signal.signal.toUpperCase()}
              </Typography>
              <Typography variant="body1">
                Strength: {(analytics.signals.overall_signal.strength * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body1">
                Confidence: {(analytics.signals.overall_signal.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Order Book Analysis: {symbol}
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="depth-select-label">Order Book Depth</InputLabel>
              <Select
                labelId="depth-select-label"
                value={depth}
                onChange={handleDepthChange}
                label="Order Book Depth"
              >
                <MenuItem value={5}>5 Levels</MenuItem>
                <MenuItem value={10}>10 Levels</MenuItem>
                <MenuItem value={20}>20 Levels</MenuItem>
                <MenuItem value={50}>50 Levels</MenuItem>
                <MenuItem value={100}>100 Levels</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="visualization-select-label">Visualization</InputLabel>
              <Select
                labelId="visualization-select-label"
                value={activeVisualization}
                onChange={handleVisualizationChange}
                label="Visualization"
              >
                <MenuItem value="order_book">Order Book</MenuItem>
                <MenuItem value="depth_chart">Depth Chart</MenuItem>
                <MenuItem value="price_impact">Price Impact</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

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

      {/* Order Book Data */}
      {!loading && orderBookSnapshot && (
        <Grid container spacing={3}>
          {/* Order Book Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Order Book
              </Typography>
              {renderOrderBookTable()}
            </Paper>
          </Grid>

          {/* Visualization */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {activeVisualization === 'order_book' ? 'Order Book Visualization' : 
                 activeVisualization === 'depth_chart' ? 'Depth Chart' : 'Price Impact Analysis'}
              </Typography>
              {renderVisualization()}
            </Paper>
          </Grid>

          {/* Metrics */}
          <Grid item xs={12}>
            {renderMetrics()}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default OrderBookVisualization;