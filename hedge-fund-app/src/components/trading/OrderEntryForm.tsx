import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Divider,
  Chip,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';

// Types
export type OrderSide = 'buy' | 'sell' | 'short' | 'cover';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type OrderTimeInForce = 'day' | 'gtc' | 'ioc' | 'fok';

export interface OrderFormValues {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number | string;
  price?: number | string;
  stopPrice?: number | string;
  trailingAmount?: number | string;
  trailingType?: 'percent' | 'amount';
  timeInForce: OrderTimeInForce;
  expiration?: string;
  allOrNone: boolean;
  extendedHours: boolean;
  notes?: string;
}

export interface OrderEntryFormProps {
  symbol?: string;
  price?: number;
  side?: OrderSide;
  availableCash?: number;
  availableShares?: number;
  onSubmit: (values: OrderFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

const OrderEntryForm: React.FC<OrderEntryFormProps> = ({
  symbol = '',
  price = 0,
  side = 'buy',
  availableCash = 0,
  availableShares = 0,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [percentOfCash, setPercentOfCash] = useState<number>(0);
  const [percentOfPosition, setPercentOfPosition] = useState<number>(0);

  // Validation schema
  const validationSchema = yup.object({
    symbol: yup.string().required('Symbol is required'),
    side: yup.string().oneOf(['buy', 'sell', 'short', 'cover'], 'Invalid order side').required('Side is required'),
    type: yup.string().oneOf(['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'], 'Invalid order type').required('Order type is required'),
    quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
    price: yup.number().when('type', {
      is: (type: string) => ['limit', 'stop_limit'].includes(type),
      then: yup.number().positive('Price must be positive').required('Price is required for this order type'),
      otherwise: yup.number().nullable(),
    }),
    stopPrice: yup.number().when('type', {
      is: (type: string) => ['stop', 'stop_limit'].includes(type),
      then: yup.number().positive('Stop price must be positive').required('Stop price is required for this order type'),
      otherwise: yup.number().nullable(),
    }),
    trailingAmount: yup.number().when('type', {
      is: 'trailing_stop',
      then: yup.number().positive('Trailing amount must be positive').required('Trailing amount is required for trailing stop orders'),
      otherwise: yup.number().nullable(),
    }),
    trailingType: yup.string().when('type', {
      is: 'trailing_stop',
      then: yup.string().oneOf(['percent', 'amount'], 'Invalid trailing type').required('Trailing type is required'),
      otherwise: yup.string().nullable(),
    }),
    timeInForce: yup.string().oneOf(['day', 'gtc', 'ioc', 'fok'], 'Invalid time in force').required('Time in force is required'),
    expiration: yup.string().when('timeInForce', {
      is: 'gtc',
      then: yup.string().required('Expiration date is required for GTC orders'),
      otherwise: yup.string().nullable(),
    }),
    allOrNone: yup.boolean(),
    extendedHours: yup.boolean(),
    notes: yup.string().max(500, 'Notes cannot exceed 500 characters'),
  });

  // Initialize form with default values
  const formik = useFormik<OrderFormValues>({
    initialValues: {
      symbol,
      side,
      type: 'market',
      quantity: '',
      price: price || '',
      stopPrice: '',
      trailingAmount: '',
      trailingType: 'percent',
      timeInForce: 'day',
      expiration: '',
      allOrNone: false,
      extendedHours: false,
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  // Update symbol and price when props change
  useEffect(() => {
    if (symbol && symbol !== formik.values.symbol) {
      formik.setFieldValue('symbol', symbol);
    }
    if (price && price !== formik.values.price && ['limit', 'stop_limit'].includes(formik.values.type)) {
      formik.setFieldValue('price', price);
    }
  }, [symbol, price]);

  // Calculate estimated cost and percentages
  useEffect(() => {
    const quantity = Number(formik.values.quantity) || 0;
    const orderPrice = formik.values.type === 'market' ? price : Number(formik.values.price) || price;
    const cost = quantity * orderPrice;
    
    setEstimatedCost(cost);
    
    if (availableCash > 0 && ['buy', 'short'].includes(formik.values.side)) {
      setPercentOfCash((cost / availableCash) * 100);
    } else {
      setPercentOfCash(0);
    }
    
    if (availableShares > 0 && ['sell', 'cover'].includes(formik.values.side)) {
      setPercentOfPosition((quantity / availableShares) * 100);
    } else {
      setPercentOfPosition(0);
    }
  }, [formik.values.quantity, formik.values.price, formik.values.type, formik.values.side, price, availableCash, availableShares]);

  // Handle percentage of cash/position slider change
  const handlePercentageChange = (event: Event, newValue: number | number[]) => {
    const percentage = newValue as number;
    
    if (['buy', 'short'].includes(formik.values.side) && availableCash > 0) {
      const maxQuantity = Math.floor((availableCash * percentage / 100) / price);
      formik.setFieldValue('quantity', maxQuantity);
    } else if (['sell', 'cover'].includes(formik.values.side) && availableShares > 0) {
      const shareQuantity = Math.floor(availableShares * percentage / 100);
      formik.setFieldValue('quantity', shareQuantity);
    }
  };

  // Get button color based on order side
  const getButtonColor = () => {
    switch (formik.values.side) {
      case 'buy':
      case 'cover':
        return 'success';
      case 'sell':
      case 'short':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Get button text based on order side and type
  const getButtonText = () => {
    const action = formik.values.side === 'buy' ? 'Buy' : 
                  formik.values.side === 'sell' ? 'Sell' : 
                  formik.values.side === 'short' ? 'Short' : 'Cover';
    
    const type = formik.values.type === 'market' ? 'at Market' :
                formik.values.type === 'limit' ? 'Limit' :
                formik.values.type === 'stop' ? 'Stop' :
                formik.values.type === 'stop_limit' ? 'Stop Limit' : 'Trailing Stop';
    
    return `${action} ${formik.values.quantity || 0} ${formik.values.symbol} ${type}`;
  };

  return (
    <Paper 
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            New Order
          </Typography>
          <Divider />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Symbol */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="symbol"
              name="symbol"
              label="Symbol"
              value={formik.values.symbol}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.symbol && Boolean(formik.errors.symbol)}
              helperText={formik.touched.symbol && formik.errors.symbol}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ShowChartIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Order Side */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="side-label">Side</InputLabel>
              <Select
                labelId="side-label"
                id="side"
                name="side"
                value={formik.values.side}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.side && Boolean(formik.errors.side)}
                label="Side"
              >
                <MenuItem value="buy">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                    Buy
                  </Box>
                </MenuItem>
                <MenuItem value="sell">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDownIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                    Sell
                  </Box>
                </MenuItem>
                <MenuItem value="short">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDownIcon sx={{ color: theme.palette.error.dark, mr: 1 }} />
                    Short
                  </Box>
                </MenuItem>
                <MenuItem value="cover">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ color: theme.palette.success.dark, mr: 1 }} />
                    Cover
                  </Box>
                </MenuItem>
              </Select>
              {formik.touched.side && formik.errors.side && (
                <FormHelperText error>{formik.errors.side}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Order Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Order Type</InputLabel>
              <Select
                labelId="type-label"
                id="type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.type && Boolean(formik.errors.type)}
                label="Order Type"
              >
                <MenuItem value="market">Market</MenuItem>
                <MenuItem value="limit">Limit</MenuItem>
                <MenuItem value="stop">Stop</MenuItem>
                <MenuItem value="stop_limit">Stop Limit</MenuItem>
                <MenuItem value="trailing_stop">Trailing Stop</MenuItem>
              </Select>
              {formik.touched.type && formik.errors.type && (
                <FormHelperText error>{formik.errors.type}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Quantity */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="quantity"
              name="quantity"
              label="Quantity"
              type="number"
              value={formik.values.quantity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    #
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Price (for limit and stop_limit orders) */}
          {['limit', 'stop_limit'].includes(formik.values.type) && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="price"
                name="price"
                label="Limit Price"
                type="number"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {/* Stop Price (for stop and stop_limit orders) */}
          {['stop', 'stop_limit'].includes(formik.values.type) && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="stopPrice"
                name="stopPrice"
                label="Stop Price"
                type="number"
                value={formik.values.stopPrice}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.stopPrice && Boolean(formik.errors.stopPrice)}
                helperText={formik.touched.stopPrice && formik.errors.stopPrice}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {/* Trailing Amount (for trailing_stop orders) */}
          {formik.values.type === 'trailing_stop' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="trailingAmount"
                  name="trailingAmount"
                  label="Trailing Amount"
                  type="number"
                  value={formik.values.trailingAmount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.trailingAmount && Boolean(formik.errors.trailingAmount)}
                  helperText={formik.touched.trailingAmount && formik.errors.trailingAmount}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {formik.values.trailingType === 'percent' ? '%' : '$'}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="trailing-type-label">Trailing Type</InputLabel>
                  <Select
                    labelId="trailing-type-label"
                    id="trailingType"
                    name="trailingType"
                    value={formik.values.trailingType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.trailingType && Boolean(formik.errors.trailingType)}
                    label="Trailing Type"
                  >
                    <MenuItem value="percent">Percent</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                  </Select>
                  {formik.touched.trailingType && formik.errors.trailingType && (
                    <FormHelperText error>{formik.errors.trailingType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </>
          )}

          {/* Time in Force */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="time-in-force-label">Time in Force</InputLabel>
              <Select
                labelId="time-in-force-label"
                id="timeInForce"
                name="timeInForce"
                value={formik.values.timeInForce}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.timeInForce && Boolean(formik.errors.timeInForce)}
                label="Time in Force"
              >
                <MenuItem value="day">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1 }} />
                    Day
                  </Box>
                </MenuItem>
                <MenuItem value="gtc">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ mr: 1 }} />
                    Good Till Canceled (GTC)
                  </Box>
                </MenuItem>
                <MenuItem value="ioc">Immediate or Cancel (IOC)</MenuItem>
                <MenuItem value="fok">Fill or Kill (FOK)</MenuItem>
              </Select>
              {formik.touched.timeInForce && formik.errors.timeInForce && (
                <FormHelperText error>{formik.errors.timeInForce}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Expiration Date (for GTC orders) */}
          {formik.values.timeInForce === 'gtc' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="expiration"
                name="expiration"
                label="Expiration Date"
                type="date"
                value={formik.values.expiration}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.expiration && Boolean(formik.errors.expiration)}
                helperText={formik.touched.expiration && formik.errors.expiration}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          )}

          {/* Order Options */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    id="allOrNone"
                    name="allOrNone"
                    checked={formik.values.allOrNone}
                    onChange={formik.handleChange}
                  />
                }
                label="All or None"
              />
              <FormControlLabel
                control={
                  <Switch
                    id="extendedHours"
                    name="extendedHours"
                    checked={formik.values.extendedHours}
                    onChange={formik.handleChange}
                  />
                }
                label="Extended Hours"
              />
            </Box>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="notes"
              name="notes"
              label="Notes"
              multiline
              rows={2}
              value={formik.values.notes}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={formik.touched.notes && formik.errors.notes}
            />
          </Grid>

          {/* Position/Cash Slider */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {['buy', 'short'].includes(formik.values.side)
                  ? `Percentage of Available Cash ($${availableCash.toLocaleString()})`
                  : `Percentage of Position (${availableShares.toLocaleString()} shares)`}
              </Typography>
              <Slider
                value={['buy', 'short'].includes(formik.values.side) ? percentOfCash : percentOfPosition}
                onChange={handlePercentageChange}
                aria-labelledby="position-slider"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value.toFixed(0)}%`}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
              />
            </Box>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Order Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Cost:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="medium">
                    ${estimatedCost.toLocaleString()}
                  </Typography>
                </Grid>
                
                {['buy', 'short'].includes(formik.values.side) && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Available Cash:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        ${availableCash.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Remaining Cash:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        ${(availableCash - estimatedCost).toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                {['sell', 'cover'].includes(formik.values.side) && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Available Shares:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        {availableShares.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Remaining Shares:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        {(availableShares - Number(formik.values.quantity || 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                color={getButtonColor()}
                disabled={loading || !formik.isValid || !formik.values.quantity}
                sx={{ minWidth: 200 }}
              >
                {getButtonText()}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default OrderEntryForm;