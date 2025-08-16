import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import { tradingService, OrderRequest } from '../../services/api/trading/TradingServiceFactory';

interface OrderEntryFormProps {
  symbol?: string;
  onOrderSubmitted?: (order: any) => void;
}

/**
 * Component for entering and submitting trading orders
 */
const OrderEntryForm: React.FC<OrderEntryFormProps> = ({ 
  symbol = '',
  onOrderSubmitted 
}) => {
  // Order form state
  const [orderForm, setOrderForm] = useState<OrderRequest>({
    symbol: symbol,
    side: 'buy',
    type: 'market',
    quantity: 1,
    limitPrice: undefined,
    stopPrice: undefined,
    timeInForce: 'day'
  });

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Update symbol when prop changes
  useEffect(() => {
    if (symbol) {
      setOrderForm(prev => ({ ...prev, symbol }));
    }
  }, [symbol]);

  // Handle form field changes
  const handleChange = (field: keyof OrderRequest) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    const value = event.target.value;
    
    setOrderForm(prev => ({
      ...prev,
      [field]: field === 'quantity' || field === 'limitPrice' || field === 'stopPrice' 
        ? value === '' ? undefined : Number(value)
        : value
    }));
  };

  // Submit the order
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!orderForm.symbol) {
      setError('Symbol is required');
      return;
    }
    
    if (!orderForm.quantity || orderForm.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    if (orderForm.type === 'limit' && !orderForm.limitPrice) {
      setError('Limit price is required for limit orders');
      return;
    }
    
    if (orderForm.type === 'stop' && !orderForm.stopPrice) {
      setError('Stop price is required for stop orders');
      return;
    }
    
    if (orderForm.type === 'stop_limit' && (!orderForm.limitPrice || !orderForm.stopPrice)) {
      setError('Both limit price and stop price are required for stop-limit orders');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const order = await tradingService.createOrder(orderForm);
      
      setSuccess(`Order submitted successfully! Order ID: ${order.id}`);
      
      // Call the callback if provided
      if (onOrderSubmitted) {
        onOrderSubmitted(order);
      }
      
      // Reset form for market orders (keep symbol)
      if (orderForm.type === 'market') {
        setOrderForm({
          symbol: orderForm.symbol,
          side: 'buy',
          type: 'market',
          quantity: 1,
          timeInForce: 'day'
        });
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated cost
  useEffect(() => {
    if (orderForm.quantity && currentPrice) {
      const cost = orderForm.quantity * currentPrice;
      setEstimatedCost(cost);
    } else {
      setEstimatedCost(null);
    }
  }, [orderForm.quantity, currentPrice]);

  // Fetch current price when symbol changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!orderForm.symbol) {
        setCurrentPrice(null);
        return;
      }
      
      try {
        // This would normally use a market data service to get the current price
        // For now, we'll just use a mock price
        setCurrentPrice(Math.random() * 500 + 50); // Random price between $50 and $550
      } catch (err) {
        console.error('Error fetching price:', err);
        setCurrentPrice(null);
      }
    };
    
    fetchPrice();
  }, [orderForm.symbol]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Place Order
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Symbol"
                value={orderForm.symbol}
                onChange={handleChange('symbol')}
                fullWidth
                required
                disabled={loading}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Side</InputLabel>
                <Select
                  value={orderForm.side}
                  onChange={handleChange('side') as any}
                  disabled={loading}
                >
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={orderForm.type}
                  onChange={handleChange('type') as any}
                  disabled={loading}
                >
                  <MenuItem value="market">Market</MenuItem>
                  <MenuItem value="limit">Limit</MenuItem>
                  <MenuItem value="stop">Stop</MenuItem>
                  <MenuItem value="stop_limit">Stop Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                label="Quantity"
                type="number"
                value={orderForm.quantity || ''}
                onChange={handleChange('quantity')}
                fullWidth
                required
                disabled={loading}
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Time in Force</InputLabel>
                <Select
                  value={orderForm.timeInForce || 'day'}
                  onChange={handleChange('timeInForce') as any}
                  disabled={loading}
                >
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="gtc">Good Till Canceled</MenuItem>
                  <MenuItem value="ioc">Immediate or Cancel</MenuItem>
                  <MenuItem value="fok">Fill or Kill</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {(orderForm.type === 'limit' || orderForm.type === 'stop_limit') && (
              <Grid item xs={6}>
                <TextField
                  label="Limit Price"
                  type="number"
                  value={orderForm.limitPrice || ''}
                  onChange={handleChange('limitPrice')}
                  fullWidth
                  required
                  disabled={loading}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
            )}
            
            {(orderForm.type === 'stop' || orderForm.type === 'stop_limit') && (
              <Grid item xs={6}>
                <TextField
                  label="Stop Price"
                  type="number"
                  value={orderForm.stopPrice || ''}
                  onChange={handleChange('stopPrice')}
                  fullWidth
                  required
                  disabled={loading}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
            )}
          </Grid>
          
          {currentPrice && (
            <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Current Price: ${currentPrice.toFixed(2)}
              </Typography>
              
              {estimatedCost && (
                <Typography variant="body1" fontWeight="bold" mt={1}>
                  Estimated {orderForm.side === 'buy' ? 'Cost' : 'Proceeds'}: ${estimatedCost.toFixed(2)}
                </Typography>
              )}
            </Box>
          )}
          
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color={orderForm.side === 'buy' ? 'primary' : 'error'}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Submitting...' : `${orderForm.side === 'buy' ? 'Buy' : 'Sell'} ${orderForm.symbol}`}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderEntryForm;