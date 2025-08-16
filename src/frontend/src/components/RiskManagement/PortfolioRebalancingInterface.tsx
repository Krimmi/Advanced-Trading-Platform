import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SwapHoriz as SwapHorizIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from 'recharts';
import riskManagementService, { PortfolioWeights } from '../../api/riskManagementService';

interface PortfolioRebalancingInterfaceProps {
  symbols: string[];
  currentWeights: PortfolioWeights;
  onRebalanceComplete?: (newWeights: PortfolioWeights) => void;
}

const PortfolioRebalancingInterface: React.FC<PortfolioRebalancingInterfaceProps> = ({
  symbols,
  currentWeights,
  onRebalanceComplete
}) => {
  const theme = useTheme();

  // State variables
  const [strategy, setStrategy] = useState<string>('maximum_sharpe');
  const [loading, setLoading] = useState<boolean>(false);
  const [targetWeights, setTargetWeights] = useState<PortfolioWeights>({});
  const [trades, setTrades] = useState<PortfolioWeights>({});
  const [tradeCosts, setTradeCosts] = useState<PortfolioWeights>({});
  const [totalCost, setTotalCost] = useState<number>(0);
  const [turnover, setTurnover] = useState<number>(0);
  const [maxTurnover, setMaxTurnover] = useState<number>(0.2); // 20% default max turnover
  const [transactionFeeRate, setTransactionFeeRate] = useState<number>(0.001); // 0.1% default fee
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rebalanceComplete, setRebalanceComplete] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Available strategies
  const strategies = [
    { value: 'maximum_sharpe', label: 'Maximum Sharpe Ratio' },
    { value: 'minimum_volatility', label: 'Minimum Volatility' },
    { value: 'maximum_return', label: 'Maximum Return' },
    { value: 'risk_parity', label: 'Risk Parity' },
    { value: 'maximum_diversification', label: 'Maximum Diversification' },
    { value: 'minimum_cvar', label: 'Minimum CVaR' },
    { value: 'hierarchical_risk_parity', label: 'Hierarchical Risk Parity' },
    { value: 'equal_weight', label: 'Equal Weight' },
    { value: 'inverse_volatility', label: 'Inverse Volatility' }
  ];

  // Validate inputs
  const validateInputs = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (transactionFeeRate < 0 || transactionFeeRate > 0.1) {
      errors.transactionFeeRate = 'Transaction fee rate must be between 0% and 10%';
    }
    
    if (maxTurnover < 0 || maxTurnover > 1) {
      errors.maxTurnover = 'Maximum turnover must be between 0% and 100%';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate rebalance plan
  const generateRebalancePlan = async () => {
    // Validate inputs
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setRebalanceComplete(false);

    try {
      // Create transaction costs object
      const transactionCosts: { [symbol: string]: number } = {};
      symbols.forEach(symbol => {
        transactionCosts[symbol] = transactionFeeRate;
      });
      transactionCosts['default'] = transactionFeeRate;

      // Call rebalance API
      const result = await riskManagementService.rebalancePortfolio(
        symbols,
        currentWeights,
        strategy,
        252, // Default lookback days
        0.02, // Default risk-free rate
        {
          bounds: [0, 1] // Default bounds (long-only)
        },
        transactionCosts,
        maxTurnover
      );

      // Update state with results
      setTargetWeights(result.target_weights);
      setTrades(result.trades);
      setTradeCosts(result.trade_costs);
      setTotalCost(result.total_cost);
      setTurnover(result.turnover);
      setRebalanceComplete(true);
      setSuccess('Rebalance plan generated successfully.');

      // Notify parent component if callback provided
      if (onRebalanceComplete) {
        onRebalanceComplete(result.target_weights);
      }
    } catch (error) {
      console.error('Error generating rebalance plan:', error);
      setError('Failed to generate rebalance plan. Please try again.');
    } finally {
      setLoading(false);
    }
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

  // Prepare data for trade visualization
  const prepareTradeData = () => {
    return Object.entries(trades)
      .filter(([_, trade]) => Math.abs(trade) > 0.001) // Filter out very small trades
      .map(([symbol, trade]) => ({
        symbol,
        trade: trade * 100, // Convert to percentage
        cost: tradeCosts[symbol] * 100, // Convert to percentage
        color: trade > 0 ? theme.palette.success.main : theme.palette.error.main
      }))
      .sort((a, b) => Math.abs(b.trade) - Math.abs(a.trade)); // Sort by trade size
  };

  // Custom tooltip for trade chart
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
            <strong>{payload[0].payload.symbol}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Trade: ${payload[0].payload.trade.toFixed(2)}%`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Cost: ${payload[0].payload.cost.toFixed(4)}%`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Portfolio Rebalancing
      </Typography>

      <Grid container spacing={3}>
        {/* Success Message */}
        {success && (
          <Grid item xs={12}>
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Grid>
        )}

        {/* Error Message */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Rebalancing Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Rebalancing Settings
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="strategy-select-label">Target Strategy</InputLabel>
                  <Select
                    labelId="strategy-select-label"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as string)}
                    label="Target Strategy"
                  >
                    {strategies.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>
                  Maximum Turnover: {(maxTurnover * 100).toFixed(0)}%
                </Typography>
                <Slider
                  value={maxTurnover * 100}
                  onChange={(_, newValue) => setMaxTurnover(Number(newValue) / 100)}
                  aria-labelledby="max-turnover-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                />
                {validationErrors.maxTurnover && (
                  <Typography color="error" variant="caption">
                    {validationErrors.maxTurnover}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Transaction Fee Rate (%)"
                  type="number"
                  value={transactionFeeRate * 100}
                  onChange={(e) => setTransactionFeeRate(Number(e.target.value) / 100)}
                  inputProps={{ step: 0.01, min: 0, max: 10 }}
                  fullWidth
                  error={!!validationErrors.transactionFeeRate}
                  helperText={validationErrors.transactionFeeRate}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={generateRebalancePlan}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  fullWidth
                >
                  Generate Rebalance Plan
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Current vs Target Weights */}
        {rebalanceComplete && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current vs Target Weights
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Current Weight</TableCell>
                      <TableCell align="right">Target Weight</TableCell>
                      <TableCell align="right">Trade</TableCell>
                      <TableCell align="right">Transaction Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {symbols.map((symbol) => (
                      <TableRow key={symbol}>
                        <TableCell component="th" scope="row">
                          <strong>{symbol}</strong>
                        </TableCell>
                        <TableCell align="right">{formatPercentage(currentWeights[symbol] || 0)}</TableCell>
                        <TableCell align="right">{formatPercentage(targetWeights[symbol] || 0)}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: trades[symbol] > 0 
                              ? 'success.main' 
                              : trades[symbol] < 0 
                                ? 'error.main' 
                                : 'text.primary'
                          }}
                        >
                          {trades[symbol] > 0 ? '+' : ''}{formatPercentage(trades[symbol] || 0)}
                        </TableCell>
                        <TableCell align="right">{formatPercentage(tradeCosts[symbol] || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="subtitle2">Total Turnover:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{formatPercentage(turnover)}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="subtitle2">Total Cost:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{formatPercentage(totalCost)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Trade Visualization */}
        {rebalanceComplete && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Trade Visualization
              </Typography>
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareTradeData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="symbol" 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      label={{ value: 'Trade Size (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#000" />
                    <Bar dataKey="trade" name="Trade Size (%)" fill={theme.palette.primary.main}>
                      {prepareTradeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Rebalance Summary */}
        {rebalanceComplete && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Rebalance Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SwapHorizIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <strong>Total Turnover:</strong> {formatPercentage(turnover)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <strong>Total Transaction Cost:</strong> {formatPercentage(totalCost)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <strong>Strategy:</strong> {strategies.find(s => s.value === strategy)?.label || strategy}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RefreshIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <strong>Max Turnover Constraint:</strong> {formatPercentage(maxTurnover)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    This rebalance plan was generated using the {strategies.find(s => s.value === strategy)?.label || strategy} strategy
                    with a maximum turnover constraint of {formatPercentage(maxTurnover)} and a transaction fee rate of {formatPercentage(transactionFeeRate)}.
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PortfolioRebalancingInterface;