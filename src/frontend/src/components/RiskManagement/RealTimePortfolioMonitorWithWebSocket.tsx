import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  useTheme,
  IconButton,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { PortfolioWeights, RiskMetrics } from '../../api/riskManagementService';
import websocketService from '../../services/websocketService';

interface RealTimePortfolioMonitorProps {
  symbols: string[];
  weights: PortfolioWeights;
  initialMetrics?: RiskMetrics;
  refreshInterval?: number; // in milliseconds
}

interface AssetPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

interface PortfolioSnapshot {
  timestamp: Date;
  value: number;
  return: number;
  risk: number;
}

const RealTimePortfolioMonitor: React.FC<RealTimePortfolioMonitorProps> = ({
  symbols,
  weights,
  initialMetrics,
  refreshInterval = 5000 // Default to 5 seconds
}) => {
  const theme = useTheme();

  // State variables
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [assetPrices, setAssetPrices] = useState<AssetPrice[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(10000); // Default starting value
  const [portfolioReturn, setPortfolioReturn] = useState<number>(0);
  const [portfolioRisk, setPortfolioRisk] = useState<number>(initialMetrics?.volatility || 0);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<{message: string, type: 'warning' | 'error' | 'info' | 'success'}[]>([]);
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);

  // Function to fetch initial price data
  const fetchInitialPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API to get initial prices
      // For now, we'll simulate initial prices
      const initialPrices = symbols.map(symbol => {
        const basePrice = 100 + Math.random() * 900; // Random base price between 100 and 1000
        
        return {
          symbol,
          price: basePrice,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date()
        };
      });

      setAssetPrices(initialPrices);

      // Calculate initial portfolio value
      const initialPortfolioValue = initialPrices.reduce((total, asset) => {
        const weight = weights[asset.symbol] || 0;
        return total + (asset.price * weight * 100); // Assuming $100 per 1% allocation for simplicity
      }, 0);

      setPortfolioValue(initialPortfolioValue);

      // Add to history
      const initialSnapshot: PortfolioSnapshot = {
        timestamp: new Date(),
        value: initialPortfolioValue,
        return: 0,
        risk: portfolioRisk
      };

      setPortfolioHistory([initialSnapshot]);

    } catch (error) {
      console.error('Error fetching initial prices:', error);
      setError('Failed to fetch initial prices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [symbols, weights, portfolioRisk]);

  // Function to handle price updates from WebSocket
  const handlePriceUpdate = useCallback((priceUpdate: any) => {
    setAssetPrices(prevPrices => {
      // Find if we already have this symbol in our prices
      const existingIndex = prevPrices.findIndex(p => p.symbol === priceUpdate.symbol);
      
      if (existingIndex === -1) {
        // If symbol not found, ignore the update if it's not in our symbols list
        if (!symbols.includes(priceUpdate.symbol)) {
          return prevPrices;
        }
        
        // Add new price
        return [...prevPrices, {
          symbol: priceUpdate.symbol,
          price: priceUpdate.price,
          change: priceUpdate.change,
          changePercent: priceUpdate.changePercent,
          lastUpdate: new Date()
        }];
      } else {
        // Update existing price
        const newPrices = [...prevPrices];
        newPrices[existingIndex] = {
          ...newPrices[existingIndex],
          price: priceUpdate.price,
          change: priceUpdate.change,
          changePercent: priceUpdate.changePercent,
          lastUpdate: new Date()
        };
        return newPrices;
      }
    });

    // Update portfolio value based on new price
    setAssetPrices(currentPrices => {
      const newPortfolioValue = currentPrices.reduce((total, asset) => {
        const weight = weights[asset.symbol] || 0;
        return total + (asset.price * weight * 100); // Assuming $100 per 1% allocation for simplicity
      }, 0);

      // Calculate portfolio return
      const newReturn = portfolioValue > 0 ? ((newPortfolioValue / portfolioValue) - 1) * 100 : 0;
      
      // Update portfolio value and return
      setPortfolioValue(newPortfolioValue);
      setPortfolioReturn(newReturn);

      // Add to history
      const newSnapshot: PortfolioSnapshot = {
        timestamp: new Date(),
        value: newPortfolioValue,
        return: newReturn,
        risk: portfolioRisk
      };

      setPortfolioHistory(prev => {
        const newHistory = [...prev, newSnapshot];
        // Keep only the last 100 snapshots to avoid memory issues
        if (newHistory.length > 100) {
          return newHistory.slice(newHistory.length - 100);
        }
        return newHistory;
      });

      // Check for alerts
      if (alertsEnabled) {
        // Check for significant price changes
        if (Math.abs(priceUpdate.changePercent) > 1) {
          const direction = priceUpdate.changePercent > 0 ? 'up' : 'down';
          const alertType = priceUpdate.changePercent > 0 ? 'success' : 'warning';
          
          setAlerts(prev => [
            ...prev, 
            {
              message: `${priceUpdate.symbol} moved ${direction} by ${Math.abs(priceUpdate.changePercent).toFixed(2)}%`,
              type: alertType as 'warning' | 'error' | 'info' | 'success'
            }
          ]);
        }

        // Check for portfolio risk threshold
        if (Math.abs(newReturn) > 2) {
          setAlerts(prev => [
            ...prev, 
            {
              message: `Portfolio return exceeded 2% threshold: ${newReturn.toFixed(2)}%`,
              type: newReturn > 0 ? 'success' : 'error'
            }
          ]);
        }

        // Limit alerts to most recent 5
        if (alerts.length > 5) {
          setAlerts(prev => prev.slice(prev.length - 5));
        }
      }

      return currentPrices;
    });
  }, [symbols, weights, portfolioValue, portfolioRisk, alertsEnabled, alerts]);

  // Subscribe to WebSocket updates when component mounts
  useEffect(() => {
    // Fetch initial data
    fetchInitialPrices();

    // Subscribe to price updates for each symbol
    if (autoRefresh) {
      const ids: string[] = [];
      
      // Subscribe to individual symbol price updates
      symbols.forEach(symbol => {
        const id = websocketService.subscribe('price_updates', { symbol });
        ids.push(id);
      });

      // Subscribe to portfolio updates if needed
      // const portfolioId = 'portfolio_123'; // This would come from props in a real app
      // const portfolioSubId = websocketService.subscribe('portfolio_updates', { portfolioId });
      // ids.push(portfolioSubId);

      setSubscriptionIds(ids);

      // Set up custom event listener for price updates
      const handleWebSocketMessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'price_update') {
            handlePriceUpdate(message.data);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      // This is a workaround since we don't have direct access to the WebSocket instance
      // In a real app, you would use the websocketService's built-in message handling
      window.addEventListener('websocket_message', handleWebSocketMessage as any);

      // Clean up subscriptions when component unmounts
      return () => {
        ids.forEach(id => websocketService.unsubscribe(id));
        window.removeEventListener('websocket_message', handleWebSocketMessage as any);
      };
    }
  }, [symbols, autoRefresh, fetchInitialPrices, handlePriceUpdate]);

  // Manual refresh function
  const manualRefresh = async () => {
    await fetchInitialPrices();
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
    return `${value.toFixed(2)}%`;
  };

  // Format time for chart
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Prepare data for portfolio value chart
  const prepareChartData = () => {
    return portfolioHistory.map(snapshot => ({
      time: formatTime(snapshot.timestamp),
      value: snapshot.value,
      return: snapshot.return,
      risk: snapshot.risk * 100 // Convert to percentage
    }));
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="textPrimary">
            <strong>{label}</strong>
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color="textSecondary">
              {`${entry.name}: ${entry.name === 'Portfolio Value' ? formatCurrency(entry.value) : formatPercentage(entry.value)}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Real-Time Portfolio Monitor
      </Typography>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Real-Time Updates"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enable Alerts"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <MuiTooltip title="Refresh Data">
                    <IconButton 
                      onClick={manualRefresh} 
                      disabled={loading}
                      color="primary"
                    >
                      {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                  </MuiTooltip>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Error Message */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Portfolio Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Portfolio Summary
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" gutterBottom>
                {formatCurrency(portfolioValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {portfolioReturn > 0 ? (
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 1 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', mr: 1 }} />
                )}
                <Typography 
                  variant="body1"
                  sx={{ 
                    color: portfolioReturn > 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}
                >
                  {portfolioReturn > 0 ? '+' : ''}{formatPercentage(portfolioReturn)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Risk (Volatility): {formatPercentage(portfolioRisk * 100)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last Update: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                Alerts & Notifications
              </Typography>
              {alertsEnabled ? (
                <NotificationsActiveIcon color="primary" />
              ) : (
                <NotificationsIcon color="disabled" />
              )}
            </Box>
            {alerts.length > 0 ? (
              <Box>
                {alerts.map((alert, index) => (
                  <Alert 
                    key={index} 
                    severity={alert.type}
                    sx={{ mb: 1 }}
                    icon={alert.type === 'warning' ? <WarningIcon /> : undefined}
                  >
                    {alert.message}
                  </Alert>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No alerts at this time
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Portfolio Value Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Portfolio Performance
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={prepareChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                  <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    name="Portfolio Value"
                    stroke={theme.palette.primary.main}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="return"
                    name="Return (%)"
                    stroke={theme.palette.secondary.main}
                    dot={false}
                  />
                  <ReferenceLine yAxisId="right" y={0} stroke="#000" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Asset Prices Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Asset Prices
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="right">Change %</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Last Update</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assetPrices.map((asset) => (
                    <TableRow key={asset.symbol}>
                      <TableCell component="th" scope="row">
                        <strong>{asset.symbol}</strong>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(asset.price)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: asset.change > 0 
                            ? 'success.main' 
                            : asset.change < 0 
                              ? 'error.main' 
                              : 'text.primary'
                        }}
                      >
                        {asset.change > 0 ? '+' : ''}{formatCurrency(asset.change)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: asset.changePercent > 0 
                            ? 'success.main' 
                            : asset.changePercent < 0 
                              ? 'error.main' 
                              : 'text.primary'
                        }}
                      >
                        {asset.changePercent > 0 ? '+' : ''}{formatPercentage(asset.changePercent)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(weights[asset.symbol] * 100 || 0)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(asset.price * (weights[asset.symbol] || 0) * 100)}
                      </TableCell>
                      <TableCell align="right">
                        {asset.lastUpdate.toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimePortfolioMonitor;