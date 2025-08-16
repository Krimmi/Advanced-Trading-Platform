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
import riskManagementService from '../../api/riskManagementService';

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
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Function to fetch initial data
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API to get initial data
      // For now, we'll use the risk management service to get initial metrics
      if (symbols.length > 0 && Object.keys(weights).length > 0) {
        const metrics = await riskManagementService.calculateRiskMetrics(
          symbols,
          weights,
          252, // Default lookback days
          0.02 // Default risk-free rate
        );

        setPortfolioRisk(metrics.volatility);
      }

      // Initialize asset prices with placeholder values
      const initialPrices = symbols.map(symbol => ({
        symbol,
        price: 100 + Math.random() * 900, // Random initial price between 100 and 1000
        change: 0,
        changePercent: 0,
        lastUpdate: new Date()
      }));

      setAssetPrices(initialPrices);

      // Calculate initial portfolio value
      const initialValue = initialPrices.reduce((total, asset) => {
        const weight = weights[asset.symbol] || 0;
        return total + (asset.price * weight * 100); // Assuming $100 per 1% allocation for simplicity
      }, 0);

      setPortfolioValue(initialValue);

      // Add initial snapshot to history
      const initialSnapshot: PortfolioSnapshot = {
        timestamp: new Date(),
        value: initialValue,
        return: 0,
        risk: portfolioRisk
      };

      setPortfolioHistory([initialSnapshot]);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to fetch initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [symbols, weights, portfolioRisk]);

  // Connect to WebSocket and subscribe to market data
  useEffect(() => {
    if (symbols.length > 0) {
      // Subscribe to market data for portfolio symbols
      websocketService.subscribeToMarketData(symbols);
      setIsConnected(true);

      // Handle WebSocket connection status
      const checkConnectionStatus = setInterval(() => {
        if (websocketService.socket && websocketService.socket.readyState === WebSocket.OPEN) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }, 5000);

      return () => {
        // Unsubscribe when component unmounts
        websocketService.unsubscribeFromMarketData(symbols);
        clearInterval(checkConnectionStatus);
      };
    }
  }, [symbols]);

  // Handle market data updates from WebSocket
  useEffect(() => {
    // Define handler for market data updates
    const handleMarketData = (data: any[]) => {
      if (!Array.isArray(data)) {
        return;
      }

      // Update asset prices
      setAssetPrices(prevPrices => {
        const updatedPrices = [...prevPrices];

        data.forEach(item => {
          const index = updatedPrices.findIndex(p => p.symbol === item.symbol);
          if (index !== -1) {
            const oldPrice = updatedPrices[index].price;
            updatedPrices[index] = {
              symbol: item.symbol,
              price: item.price,
              change: item.price - oldPrice,
              changePercent: ((item.price / oldPrice) - 1) * 100,
              lastUpdate: new Date(item.last_update)
            };
          } else if (symbols.includes(item.symbol)) {
            updatedPrices.push({
              symbol: item.symbol,
              price: item.price,
              change: 0,
              changePercent: 0,
              lastUpdate: new Date(item.last_update)
            });
          }
        });

        return updatedPrices;
      });

      // Update portfolio value and return
      setAssetPrices(currentPrices => {
        // Calculate new portfolio value
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
          currentPrices.forEach(asset => {
            if (Math.abs(asset.changePercent) > 1) {
              const direction = asset.changePercent > 0 ? 'up' : 'down';
              const alertType = asset.changePercent > 0 ? 'success' : 'warning';
              
              setAlerts(prev => [
                ...prev, 
                {
                  message: `${asset.symbol} moved ${direction} by ${Math.abs(asset.changePercent).toFixed(2)}%`,
                  type: alertType as 'warning' | 'error' | 'info' | 'success'
                }
              ]);
            }
          });

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
    };

    // Add event listener for market data updates
    websocketService.on('market_data', handleMarketData);

    // Cleanup function
    return () => {
      websocketService.off('market_data', handleMarketData);
    };
  }, [symbols, weights, portfolioValue, portfolioRisk, alertsEnabled, alerts]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manual refresh function
  const handleRefresh = () => {
    // Connect to WebSocket if not connected
    if (!isConnected) {
      websocketService.connect();
      websocketService.subscribeToMarketData(symbols);
    }
    
    fetchInitialData();
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
                  label="Auto-Refresh"
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Chip 
                    label={isConnected ? "Connected" : "Disconnected"} 
                    color={isConnected ? "success" : "error"} 
                    size="small" 
                    sx={{ mr: 2 }}
                  />
                  <MuiTooltip title="Refresh Data">
                    <IconButton 
                      onClick={handleRefresh} 
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