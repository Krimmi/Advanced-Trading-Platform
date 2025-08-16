import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  tradingService, 
  Account, 
  Position,
  TradingProvider 
} from '../../services/api/trading/TradingServiceFactory';
import { ArrowUpward, ArrowDownward, Refresh } from '@mui/icons-material';

interface AccountSummaryProps {
  defaultProvider?: TradingProvider;
  onSelectPosition?: (symbol: string) => void;
}

/**
 * Component for displaying account information and positions
 */
const AccountSummary: React.FC<AccountSummaryProps> = ({ 
  defaultProvider = 'auto',
  onSelectPosition
}) => {
  // State
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<TradingProvider>(defaultProvider);

  // Fetch account and positions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch account and positions in parallel
      const [accountData, positionsData] = await Promise.all([
        tradingService.getAccount(provider),
        tradingService.getPositions(provider)
      ]);
      
      setAccount(accountData);
      setPositions(positionsData);
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when provider changes
  useEffect(() => {
    fetchData();
  }, [provider]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Handle provider change
  const handleProviderChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setProvider(event.target.value as TradingProvider);
  };

  // Handle position selection
  const handlePositionClick = (symbol: string) => {
    if (onSelectPosition) {
      onSelectPosition(symbol);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Account Summary</Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Provider</InputLabel>
            <Select
              value={provider}
              onChange={handleProviderChange as any}
              label="Provider"
            >
              <MenuItem value="auto">Auto (Best Available)</MenuItem>
              <MenuItem value="alpaca">Alpaca</MenuItem>
              <MenuItem value="interactiveBrokers">Interactive Brokers</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Account Summary Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Account Overview</Typography>
                  {account && (
                    <Chip 
                      label={`Provider: ${account.provider}`} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                  )}
                </Box>
                
                {account ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Account ID</Typography>
                      <Typography variant="body1" fontWeight="medium">{account.id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Cash Balance</Typography>
                      <Typography variant="body1" fontWeight="medium">{formatCurrency(account.cash)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Buying Power</Typography>
                      <Typography variant="body1" fontWeight="medium">{formatCurrency(account.buyingPower)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Portfolio Value</Typography>
                      <Typography variant="body1" fontWeight="medium">{formatCurrency(account.equity)}</Typography>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body1">No account information available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Positions Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Positions</Typography>
                
                {positions.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Avg. Price</TableCell>
                          <TableCell align="right">Current Price</TableCell>
                          <TableCell align="right">Market Value</TableCell>
                          <TableCell align="right">Unrealized P&L</TableCell>
                          <TableCell align="right">P&L %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {positions.map((position) => (
                          <TableRow 
                            key={position.symbol}
                            hover
                            onClick={() => handlePositionClick(position.symbol)}
                            sx={{ cursor: onSelectPosition ? 'pointer' : 'default' }}
                          >
                            <TableCell component="th" scope="row">
                              <Typography fontWeight="medium">{position.symbol}</Typography>
                            </TableCell>
                            <TableCell align="right">{position.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(position.averageEntryPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(position.currentPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(position.marketValue)}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                color: position.unrealizedPnl >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'medium'
                              }}
                            >
                              <Box display="flex" alignItems="center" justifyContent="flex-end">
                                {position.unrealizedPnl >= 0 ? (
                                  <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />
                                ) : (
                                  <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />
                                )}
                                {formatCurrency(position.unrealizedPnl)}
                              </Box>
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                color: position.unrealizedPnlPercent >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'medium'
                              }}
                            >
                              {formatPercent(position.unrealizedPnlPercent)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No positions found</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AccountSummary;