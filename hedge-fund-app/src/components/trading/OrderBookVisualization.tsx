import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

// Types
export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  orders?: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercentage: number;
  timestamp: number;
}

interface OrderBookVisualizationProps {
  data: OrderBookData;
  symbol: string;
  depth?: number;
  grouping?: number;
  onRefresh?: () => void;
  onPriceClick?: (price: number, side: 'bid' | 'ask') => void;
  loading?: boolean;
  error?: string | null;
  height?: number | string;
  width?: number | string;
}

const OrderBookVisualization: React.FC<OrderBookVisualizationProps> = ({
  data,
  symbol,
  depth = 10,
  grouping = 0.01,
  onRefresh,
  onPriceClick,
  loading = false,
  error = null,
  height = 500,
  width = '100%',
}) => {
  const theme = useTheme();
  const [visibleDepth, setVisibleDepth] = useState<number>(depth);
  const [priceGrouping, setPriceGrouping] = useState<number>(grouping);
  const [highlightedLevel, setHighlightedLevel] = useState<{ price: number, side: 'bid' | 'ask' } | null>(null);
  const [displayMode, setDisplayMode] = useState<'default' | 'depth' | 'cumulative'>('default');

  // Find the maximum size for visualization scaling
  const maxSize = useMemo(() => {
    const allSizes = [...data.bids, ...data.asks].map(level => level.size);
    return Math.max(...allSizes, 1);
  }, [data]);

  // Find the maximum cumulative size for visualization scaling
  const maxCumulativeSize = useMemo(() => {
    const bidMax = data.bids.length > 0 ? data.bids[0].total : 0;
    const askMax = data.asks.length > 0 ? data.asks[0].total : 0;
    return Math.max(bidMax, askMax, 1);
  }, [data]);

  // Group order book levels by price
  const groupOrderBookLevels = (levels: OrderBookLevel[], groupSize: number, isAsk: boolean): OrderBookLevel[] => {
    if (groupSize <= 0) return levels;
    
    const grouped: Record<number, OrderBookLevel> = {};
    
    levels.forEach(level => {
      // Round price to nearest group
      const groupedPrice = isAsk
        ? Math.ceil(level.price / groupSize) * groupSize
        : Math.floor(level.price / groupSize) * groupSize;
      
      if (!grouped[groupedPrice]) {
        grouped[groupedPrice] = {
          price: groupedPrice,
          size: 0,
          total: 0,
          orders: 0
        };
      }
      
      grouped[groupedPrice].size += level.size;
      grouped[groupedPrice].orders = (grouped[groupedPrice].orders || 0) + (level.orders || 1);
    });
    
    // Convert back to array and sort
    const result = Object.values(grouped);
    return isAsk
      ? result.sort((a, b) => a.price - b.price)
      : result.sort((a, b) => b.price - a.price);
  };

  // Apply grouping and calculate cumulative totals
  const processedBids = useMemo(() => {
    const grouped = groupOrderBookLevels(data.bids, priceGrouping, false);
    let runningTotal = 0;
    
    return grouped.map((bid, index) => {
      runningTotal += bid.size;
      return {
        ...bid,
        total: runningTotal
      };
    }).slice(0, visibleDepth);
  }, [data.bids, priceGrouping, visibleDepth]);

  const processedAsks = useMemo(() => {
    const grouped = groupOrderBookLevels(data.asks, priceGrouping, true);
    let runningTotal = 0;
    
    return grouped.map((ask, index) => {
      runningTotal += ask.size;
      return {
        ...ask,
        total: runningTotal
      };
    }).slice(0, visibleDepth);
  }, [data.asks, priceGrouping, visibleDepth]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    setVisibleDepth(prev => Math.max(5, prev - 5));
  };

  const handleZoomOut = () => {
    setVisibleDepth(prev => prev + 5);
  };

  // Handle grouping change
  const handleGroupingChange = (value: number) => {
    setPriceGrouping(value);
  };

  // Handle display mode change
  const handleDisplayModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'default' | 'depth' | 'cumulative',
  ) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
    }
  };

  // Handle price click
  const handlePriceClick = (price: number, side: 'bid' | 'ask') => {
    if (onPriceClick) {
      onPriceClick(price, side);
    }
    setHighlightedLevel({ price, side });
  };

  // Format price with appropriate precision
  const formatPrice = (price: number): string => {
    const precision = Math.max(2, Math.ceil(-Math.log10(priceGrouping)));
    return price.toFixed(precision);
  };

  // Format size with appropriate precision
  const formatSize = (size: number): string => {
    if (size >= 1000000) {
      return (size / 1000000).toFixed(2) + 'M';
    } else if (size >= 1000) {
      return (size / 1000).toFixed(2) + 'K';
    } else {
      return size.toFixed(2);
    }
  };

  // Calculate visualization width based on size
  const getVisualizationWidth = (size: number, isAsk: boolean, isCumulative: boolean = false): string => {
    const maxValue = isCumulative ? maxCumulativeSize : maxSize;
    const percentage = (size / maxValue) * 100;
    return `${Math.min(percentage, 100)}%`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height,
        width,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3">
            Order Book
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {symbol} • Depth: {visibleDepth} • Group: {priceGrouping}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              size="small"
              value={displayMode}
              exclusive
              onChange={handleDisplayModeChange}
              aria-label="display mode"
            >
              <ToggleButton value="default" aria-label="default view">
                Default
              </ToggleButton>
              <ToggleButton value="depth" aria-label="depth view">
                Depth
              </ToggleButton>
              <ToggleButton value="cumulative" aria-label="cumulative view">
                Cumulative
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {[0.01, 0.05, 0.1, 0.5, 1, 5].map((group) => (
            <Chip
              key={group}
              label={group < 1 ? group : group.toFixed(0)}
              size="small"
              color={priceGrouping === group ? 'primary' : 'default'}
              variant={priceGrouping === group ? 'filled' : 'outlined'}
              onClick={() => handleGroupingChange(group)}
            />
          ))}
        </Box>
      </Box>

      {/* Order Book Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Loading order book data...</Typography>
          </Box>
        ) : (
          <>
            {/* Column Headers */}
            <Box sx={{ display: 'flex', borderBottom: `1px solid ${theme.palette.divider}`, px: 2, py: 1, position: 'sticky', top: 0, backgroundColor: theme.palette.background.paper, zIndex: 1 }}>
              <Grid container>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Price
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium" align="right">
                    Size
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium" align="right">
                    {displayMode === 'cumulative' ? 'Total' : 'Orders'}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium" align="center">
                    Depth
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Asks (Sell Orders) */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column-reverse', overflow: 'auto' }}>
              {processedAsks.map((ask, index) => (
                <Box
                  key={`ask-${ask.price}`}
                  sx={{
                    display: 'flex',
                    px: 2,
                    py: 0.5,
                    position: 'relative',
                    cursor: onPriceClick ? 'pointer' : 'default',
                    backgroundColor: highlightedLevel?.price === ask.price && highlightedLevel?.side === 'ask'
                      ? alpha(theme.palette.error.light, 0.1)
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.light, 0.05),
                    },
                  }}
                  onClick={() => handlePriceClick(ask.price, 'ask')}
                >
                  {/* Visualization Bar */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: getVisualizationWidth(
                        displayMode === 'cumulative' ? ask.total : ask.size,
                        true,
                        displayMode === 'cumulative'
                      ),
                      backgroundColor: alpha(theme.palette.error.main, 0.15),
                      zIndex: 0,
                    }}
                  />
                  
                  <Grid container sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="error.main" fontWeight="medium">
                        {formatPrice(ask.price)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" align="right">
                        {formatSize(ask.size)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary" align="right">
                        {displayMode === 'cumulative' ? formatSize(ask.total) : ask.orders || 1}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowDownwardIcon fontSize="small" color="error" />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>

            {/* Spread */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Spread: {formatPrice(data.spread)} ({data.spreadPercentage.toFixed(3)}%)
              </Typography>
            </Box>

            {/* Bids (Buy Orders) */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {processedBids.map((bid, index) => (
                <Box
                  key={`bid-${bid.price}`}
                  sx={{
                    display: 'flex',
                    px: 2,
                    py: 0.5,
                    position: 'relative',
                    cursor: onPriceClick ? 'pointer' : 'default',
                    backgroundColor: highlightedLevel?.price === bid.price && highlightedLevel?.side === 'bid'
                      ? alpha(theme.palette.success.light, 0.1)
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.success.light, 0.05),
                    },
                  }}
                  onClick={() => handlePriceClick(bid.price, 'bid')}
                >
                  {/* Visualization Bar */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: getVisualizationWidth(
                        displayMode === 'cumulative' ? bid.total : bid.size,
                        false,
                        displayMode === 'cumulative'
                      ),
                      backgroundColor: alpha(theme.palette.success.main, 0.15),
                      zIndex: 0,
                    }}
                  />
                  
                  <Grid container sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        {formatPrice(bid.price)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" align="right">
                        {formatSize(bid.size)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary" align="right">
                        {displayMode === 'cumulative' ? formatSize(bid.total) : bid.orders || 1}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowUpwardIcon fontSize="small" color="success" />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(data.timestamp).toLocaleTimeString()}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Visible levels: {processedBids.length + processedAsks.length} of {data.bids.length + data.asks.length}
        </Typography>
      </Box>
    </Paper>
  );
};

export default OrderBookVisualization;