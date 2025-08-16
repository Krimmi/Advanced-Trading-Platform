import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Autocomplete,
  Chip,
  Button,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

// Import chart components (assuming we're using recharts)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Scatter
} from 'recharts';

// Import types
import { OrderFlowData, Order, MarketDepth } from '../../types/analytics';

interface LiveOrderFlowPanelProps {
  data: OrderFlowData;
}

const LiveOrderFlowPanel: React.FC<LiveOrderFlowPanelProps> = ({ data }) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<string>('depth');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(data.symbols[0] || '');
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [orderType, setOrderType] = useState<string>('all');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(data.recentOrders);
  
  // Colors for buy/sell
  const buyColor = theme.palette.success.main;
  const sellColor = theme.palette.error.main;
  
  // Effect to filter orders based on selected criteria
  useEffect(() => {
    let filtered = data.recentOrders;
    
    // Filter by symbol
    if (selectedSymbol) {
      filtered = filtered.filter(order => order.symbol === selectedSymbol);
    }
    
    // Filter by order type
    if (orderType !== 'all') {
      filtered = filtered.filter(order => order.type === orderType);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  }, [data.recentOrders, selectedSymbol, orderType, searchQuery]);
  
  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: string) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };
  
  const handleSymbolChange = (event: SelectChangeEvent) => {
    setSelectedSymbol(event.target.value);
  };
  
  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };
  
  const handleOrderTypeChange = (event: SelectChangeEvent) => {
    setOrderType(event.target.value);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleLiveToggle = () => {
    setIsLive(!isLive);
  };
  
  // Format price with appropriate precision
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };
  
  // Format volume with appropriate scale
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toString();
  };
  
  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  // Get trend icon based on direction
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <TrendingFlatIcon />;
    }
  };
  
  // Get the market depth data for the selected symbol
  const getMarketDepth = (): MarketDepth | undefined => {
    return data.marketDepth.find(depth => depth.symbol === selectedSymbol);
  };
  
  // Get the order flow imbalance for the selected symbol
  const getOrderFlowImbalance = () => {
    const symbolOrders = data.recentOrders.filter(order => order.symbol === selectedSymbol);
    const buyVolume = symbolOrders
      .filter(order => order.side === 'buy')
      .reduce((sum, order) => sum + order.quantity, 0);
    const sellVolume = symbolOrders
      .filter(order => order.side === 'sell')
      .reduce((sum, order) => sum + order.quantity, 0);
    
    const totalVolume = buyVolume + sellVolume;
    const buyPercentage = totalVolume > 0 ? buyVolume / totalVolume : 0.5;
    
    return {
      buyVolume,
      sellVolume,
      totalVolume,
      buyPercentage,
      imbalance: buyVolume - sellVolume
    };
  };
  
  // Render the order flow summary cards
  const renderSummaryCards = () => {
    const imbalance = getOrderFlowImbalance();
    const marketDepth = getMarketDepth();
    
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Buy Volume
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {formatVolume(imbalance.buyVolume)}
                </Typography>
                <ArrowUpwardIcon sx={{ color: theme.palette.success.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Sell Volume
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {formatVolume(imbalance.sellVolume)}
                </Typography>
                <ArrowDownwardIcon sx={{ color: theme.palette.error.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Buy/Sell Ratio
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {imbalance.sellVolume > 0 ? (imbalance.buyVolume / imbalance.sellVolume).toFixed(2) : 'N/A'}
                </Typography>
                {imbalance.buyVolume > imbalance.sellVolume ? (
                  <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.error.main }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Bid/Ask Spread
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {marketDepth ? `$${(marketDepth.askPrice - marketDepth.bidPrice).toFixed(2)}` : 'N/A'}
                </Typography>
                <ShowChartIcon />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render the market depth chart
  const renderMarketDepthChart = () => {
    const marketDepth = getMarketDepth();
    
    if (!marketDepth) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            No market depth data available for {selectedSymbol}.
          </Typography>
        </Box>
      );
    }
    
    // Prepare data for the chart
    const bidLevels = marketDepth.bidLevels.map(level => ({
      price: level.price,
      bidVolume: level.volume,
      askVolume: 0
    }));
    
    const askLevels = marketDepth.askLevels.map(level => ({
      price: level.price,
      bidVolume: 0,
      askVolume: level.volume
    }));
    
    // Combine and sort by price
    const depthData = [...bidLevels, ...askLevels].sort((a, b) => a.price - b.price);
    
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={depthData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="price" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              tickFormatter={(value) => formatPrice(value)}
            />
            <YAxis />
            <RechartsTooltip 
              formatter={(value, name) => {
                if (name === 'bidVolume') return [`${formatVolume(value as number)} (Bid)`, 'Volume'];
                if (name === 'askVolume') return [`${formatVolume(value as number)} (Ask)`, 'Volume'];
                return [value, name];
              }}
              labelFormatter={(label) => `Price: $${formatPrice(label as number)}`}
            />
            <Legend />
            <Bar dataKey="bidVolume" name="Bid Volume" fill={buyColor} stackId="stack" />
            <Bar dataKey="askVolume" name="Ask Volume" fill={sellColor} stackId="stack" />
            <RechartsTooltip />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the order flow chart
  const renderOrderFlowChart = () => {
    // Filter orders for the selected symbol
    const symbolOrders = data.recentOrders.filter(order => order.symbol === selectedSymbol);
    
    // Group orders by time bucket
    const timeIntervals = 10; // Number of time buckets
    const now = new Date();
    const timeWindow = timeframe === '1m' ? 60000 : 
                       timeframe === '5m' ? 300000 : 
                       timeframe === '15m' ? 900000 : 
                       timeframe === '1h' ? 3600000 : 86400000;
    
    const intervalSize = timeWindow / timeIntervals;
    const buckets = Array(timeIntervals).fill(0).map((_, i) => {
      const bucketTime = new Date(now.getTime() - (timeIntervals - i - 1) * intervalSize);
      return {
        time: bucketTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: bucketTime.getTime(),
        buyVolume: 0,
        sellVolume: 0,
        totalVolume: 0,
        orderCount: 0
      };
    });
    
    // Populate buckets with order data
    symbolOrders.forEach(order => {
      const orderTime = new Date(order.timestamp).getTime();
      const bucketIndex = Math.floor((orderTime - (now.getTime() - timeWindow)) / intervalSize);
      
      if (bucketIndex >= 0 && bucketIndex < timeIntervals) {
        if (order.side === 'buy') {
          buckets[bucketIndex].buyVolume += order.quantity;
        } else {
          buckets[bucketIndex].sellVolume += order.quantity;
        }
        buckets[bucketIndex].totalVolume += order.quantity;
        buckets[bucketIndex].orderCount += 1;
      }
    });
    
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={buckets}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="buyVolume" name="Buy Volume" fill={buyColor} />
            <Bar yAxisId="left" dataKey="sellVolume" name="Sell Volume" fill={sellColor} />
            <Line yAxisId="right" type="monotone" dataKey="orderCount" name="Order Count" stroke={theme.palette.primary.main} />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the price impact chart
  const renderPriceImpactChart = () => {
    // Get the price impact data for the selected symbol
    const priceImpactData = data.priceImpact.find(impact => impact.symbol === selectedSymbol);
    
    if (!priceImpactData) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            No price impact data available for {selectedSymbol}.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceImpactData.data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="price" 
              name="Price" 
              stroke={theme.palette.primary.main} 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="impact" 
              name="Price Impact" 
              stroke={theme.palette.secondary.main} 
              dot={true}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumulativeImpact" 
              name="Cumulative Impact" 
              stroke={theme.palette.info.main} 
              strokeDasharray="3 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the order table
  const renderOrderTable = () => {
    return (
      <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{formatTimestamp(order.timestamp)}</TableCell>
                <TableCell>{order.symbol}</TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: order.side === 'buy' ? buyColor : sellColor,
                    fontWeight: 'medium'
                  }}>
                    {order.side === 'buy' ? 'Buy' : 'Sell'}
                  </Box>
                </TableCell>
                <TableCell align="right">${formatPrice(order.price)}</TableCell>
                <TableCell align="right">{formatVolume(order.quantity)}</TableCell>
                <TableCell>{order.type}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    size="small" 
                    color={
                      order.status === 'Filled' ? 'success' : 
                      order.status === 'Partial' ? 'warning' : 
                      order.status === 'Canceled' ? 'error' : 
                      'default'
                    }
                    sx={{ fontSize: '0.7rem' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Render the main visualization based on view mode
  const renderVisualization = () => {
    switch (viewMode) {
      case 'depth':
        return renderMarketDepthChart();
      case 'flow':
        return renderOrderFlowChart();
      case 'impact':
        return renderPriceImpactChart();
      case 'table':
        return renderOrderTable();
      default:
        return renderMarketDepthChart();
    }
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="symbol-label">Symbol</InputLabel>
              <Select
                labelId="symbol-label"
                id="symbol-select"
                value={selectedSymbol}
                label="Symbol"
                onChange={handleSymbolChange}
              >
                {data.symbols.map((symbol) => (
                  <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeframe-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="1m">1 Minute</MenuItem>
                <MenuItem value="5m">5 Minutes</MenuItem>
                <MenuItem value="15m">15 Minutes</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="order-type-label">Order Type</InputLabel>
              <Select
                labelId="order-type-label"
                id="order-type-select"
                value={orderType}
                label="Order Type"
                onChange={handleOrderTypeChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="market">Market</MenuItem>
                <MenuItem value="limit">Limit</MenuItem>
                <MenuItem value="stop">Stop</MenuItem>
                <MenuItem value="stop-limit">Stop Limit</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant={isLive ? "contained" : "outlined"} 
                size="small" 
                startIcon={isLive ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={handleLiveToggle}
                color={isLive ? "primary" : "inherit"}
              >
                {isLive ? "Live" : "Paused"}
              </Button>
              <IconButton size="small">
                <RefreshIcon />
              </IconButton>
              <IconButton size="small">
                <SettingsIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {renderSummaryCards()}
      
      <Box sx={{ mb: 2, mt: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="depth" aria-label="depth">
            <Tooltip title="Market Depth">
              <BarChartIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="flow" aria-label="flow">
            <Tooltip title="Order Flow">
              <TimelineIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="impact" aria-label="impact">
            <Tooltip title="Price Impact">
              <ShowChartIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table" aria-label="table">
            <Tooltip title="Order Table">
              <TableChartIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        
        {viewMode === 'table' && (
          <TextField
            size="small"
            label="Search Orders"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ ml: 2, width: 200 }}
            InputProps={{
              endAdornment: <SearchIcon color="action" />
            }}
          />
        )}
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 400 }}>
        {renderVisualization()}
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
          Order flow data as of {formatTimestamp(data.asOf)}. {isLive && "Updating in real-time."}
        </Typography>
        
        {isLive && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Live updates
            </Typography>
            <CircularProgress size={16} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LiveOrderFlowPanel;