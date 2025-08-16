import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Divider,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
  Alert
} from '@mui/material';
import {
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  AttachMoney as AttachMoneyIcon,
  Percent as PercentIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';

// Types
export type PositionSizingMethod = 'fixed' | 'percent' | 'risk' | 'volatility' | 'kelly';

export interface PositionSizingResult {
  shares: number;
  positionValue: number;
  riskAmount: number;
  riskPercent: number;
  potentialProfit: number;
  potentialLoss: number;
  riskRewardRatio: number;
  maxPositionSize: number;
}

interface PositionSizingCalculatorProps {
  accountValue?: number;
  symbol?: string;
  price?: number;
  onCalculate?: (result: PositionSizingResult) => void;
  onSave?: (values: any) => void;
}

const PositionSizingCalculator: React.FC<PositionSizingCalculatorProps> = ({
  accountValue = 100000,
  symbol = '',
  price = 0,
  onCalculate,
  onSave,
}) => {
  const theme = useTheme();
  const [result, setResult] = useState<PositionSizingResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Validation schema
  const validationSchema = yup.object({
    accountValue: yup.number().positive('Account value must be positive').required('Account value is required'),
    symbol: yup.string().required('Symbol is required'),
    price: yup.number().positive('Price must be positive').required('Price is required'),
    sizingMethod: yup.string().oneOf(['fixed', 'percent', 'risk', 'volatility', 'kelly'], 'Invalid sizing method').required('Sizing method is required'),
    
    // Fixed dollar amount
    fixedAmount: yup.number().when('sizingMethod', {
      is: 'fixed',
      then: yup.number().positive('Amount must be positive').required('Amount is required'),
      otherwise: yup.number().nullable(),
    }),
    
    // Percent of account
    accountPercent: yup.number().when('sizingMethod', {
      is: 'percent',
      then: yup.number().min(0, 'Percent must be positive').max(100, 'Percent cannot exceed 100%').required('Percent is required'),
      otherwise: yup.number().nullable(),
    }),
    
    // Risk-based sizing
    riskPercent: yup.number().when('sizingMethod', {
      is: 'risk',
      then: yup.number().min(0, 'Risk percent must be positive').max(10, 'Risk percent should not exceed 10%').required('Risk percent is required'),
      otherwise: yup.number().nullable(),
    }),
    stopLossPrice: yup.number().when('sizingMethod', {
      is: (method: string) => ['risk', 'kelly'].includes(method),
      then: yup.number().positive('Stop loss price must be positive').required('Stop loss price is required'),
      otherwise: yup.number().nullable(),
    }),
    
    // Volatility-based sizing
    atrValue: yup.number().when('sizingMethod', {
      is: 'volatility',
      then: yup.number().positive('ATR must be positive').required('ATR is required'),
      otherwise: yup.number().nullable(),
    }),
    atrMultiplier: yup.number().when('sizingMethod', {
      is: 'volatility',
      then: yup.number().positive('ATR multiplier must be positive').required('ATR multiplier is required'),
      otherwise: yup.number().nullable(),
    }),
    
    // Kelly criterion
    winRate: yup.number().when('sizingMethod', {
      is: 'kelly',
      then: yup.number().min(0, 'Win rate must be positive').max(100, 'Win rate cannot exceed 100%').required('Win rate is required'),
      otherwise: yup.number().nullable(),
    }),
    rewardRiskRatio: yup.number().when('sizingMethod', {
      is: 'kelly',
      then: yup.number().positive('Reward/risk ratio must be positive').required('Reward/risk ratio is required'),
      otherwise: yup.number().nullable(),
    }),
    kellyFraction: yup.number().when('sizingMethod', {
      is: 'kelly',
      then: yup.number().min(0, 'Kelly fraction must be positive').max(100, 'Kelly fraction cannot exceed 100%').required('Kelly fraction is required'),
      otherwise: yup.number().nullable(),
    }),
    
    // Common fields
    takeProfitPrice: yup.number().positive('Take profit price must be positive'),
    maxPositionSize: yup.number().min(0, 'Max position size must be positive').max(100, 'Max position size cannot exceed 100%'),
  });

  // Initialize form with default values
  const formik = useFormik({
    initialValues: {
      accountValue,
      symbol,
      price,
      sizingMethod: 'percent' as PositionSizingMethod,
      
      // Fixed dollar amount
      fixedAmount: 10000,
      
      // Percent of account
      accountPercent: 5,
      
      // Risk-based sizing
      riskPercent: 1,
      stopLossPrice: price > 0 ? price * 0.95 : 0, // Default to 5% below current price
      
      // Volatility-based sizing
      atrValue: price > 0 ? price * 0.02 : 1, // Default to 2% of price
      atrMultiplier: 2,
      
      // Kelly criterion
      winRate: 60,
      rewardRiskRatio: 2,
      kellyFraction: 50, // Half-Kelly
      
      // Common fields
      takeProfitPrice: price > 0 ? price * 1.1 : 0, // Default to 10% above current price
      maxPositionSize: 20, // Max 20% of account in one position
    },
    validationSchema,
    onSubmit: (values) => {
      calculatePositionSize(values);
    },
  });

  // Update symbol and price when props change
  useEffect(() => {
    if (symbol && symbol !== formik.values.symbol) {
      formik.setFieldValue('symbol', symbol);
    }
    if (price && price !== formik.values.price) {
      formik.setFieldValue('price', price);
      
      // Update stop loss and take profit based on new price
      formik.setFieldValue('stopLossPrice', price * 0.95);
      formik.setFieldValue('takeProfitPrice', price * 1.1);
      formik.setFieldValue('atrValue', price * 0.02);
    }
    if (accountValue && accountValue !== formik.values.accountValue) {
      formik.setFieldValue('accountValue', accountValue);
    }
  }, [symbol, price, accountValue]);

  // Calculate position size based on selected method
  const calculatePositionSize = (values: any) => {
    const {
      accountValue,
      price,
      sizingMethod,
      fixedAmount,
      accountPercent,
      riskPercent,
      stopLossPrice,
      atrValue,
      atrMultiplier,
      winRate,
      rewardRiskRatio,
      kellyFraction,
      takeProfitPrice,
      maxPositionSize,
    } = values;

    let positionValue = 0;
    let shares = 0;
    let riskAmount = 0;
    let riskPercent = 0;
    let potentialProfit = 0;
    let potentialLoss = 0;
    let riskRewardRatio = 1;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSize / 100);

    switch (sizingMethod) {
      case 'fixed':
        positionValue = Math.min(fixedAmount, maxPositionValue);
        shares = Math.floor(positionValue / price);
        break;
        
      case 'percent':
        positionValue = Math.min(accountValue * (accountPercent / 100), maxPositionValue);
        shares = Math.floor(positionValue / price);
        break;
        
      case 'risk':
        if (stopLossPrice > 0 && stopLossPrice !== price) {
          const riskPerShare = Math.abs(price - stopLossPrice);
          const maxRiskAmount = accountValue * (riskPercent / 100);
          shares = Math.floor(maxRiskAmount / riskPerShare);
          positionValue = shares * price;
          
          // Ensure we don't exceed max position size
          if (positionValue > maxPositionValue) {
            positionValue = maxPositionValue;
            shares = Math.floor(positionValue / price);
          }
        }
        break;
        
      case 'volatility':
        if (atrValue > 0) {
          const riskPerShare = atrValue * atrMultiplier;
          const maxRiskAmount = accountValue * (riskPercent / 100);
          shares = Math.floor(maxRiskAmount / riskPerShare);
          positionValue = shares * price;
          
          // Ensure we don't exceed max position size
          if (positionValue > maxPositionValue) {
            positionValue = maxPositionValue;
            shares = Math.floor(positionValue / price);
          }
        }
        break;
        
      case 'kelly':
        if (winRate > 0 && rewardRiskRatio > 0 && stopLossPrice > 0) {
          // Kelly formula: f* = (p * b - q) / b
          // where p = win probability, q = loss probability, b = win/loss ratio
          const winProbability = winRate / 100;
          const lossProbability = 1 - winProbability;
          
          // Calculate full Kelly percentage
          const kellyPercentage = (winProbability * rewardRiskRatio - lossProbability) / rewardRiskRatio;
          
          // Apply Kelly fraction (usually 0.5 or half-Kelly)
          const adjustedKellyPercentage = kellyPercentage * (kellyFraction / 100);
          
          // Calculate position value
          positionValue = Math.min(accountValue * Math.max(0, adjustedKellyPercentage), maxPositionValue);
          shares = Math.floor(positionValue / price);
        }
        break;
    }

    // Calculate risk metrics
    if (stopLossPrice > 0) {
      potentialLoss = shares * Math.abs(price - stopLossPrice);
      riskAmount = potentialLoss;
      riskPercent = (riskAmount / accountValue) * 100;
    }
    
    // Calculate profit potential if take profit is set
    if (takeProfitPrice > 0) {
      potentialProfit = shares * Math.abs(takeProfitPrice - price);
      
      if (potentialLoss > 0) {
        riskRewardRatio = potentialProfit / potentialLoss;
      }
    }

    const result: PositionSizingResult = {
      shares,
      positionValue,
      riskAmount,
      riskPercent,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
      maxPositionSize: maxPositionValue,
    };

    setResult(result);
    
    if (onCalculate) {
      onCalculate(result);
    }
  };

  // Handle save
  const handleSave = () => {
    if (onSave && result) {
      onSave({
        ...formik.values,
        result,
      });
    }
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
            Position Sizing Calculator
          </Typography>
          <Divider />
        </Box>

        <Grid container spacing={3}>
          {/* Basic Inputs */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="accountValue"
              name="accountValue"
              label="Account Value"
              type="number"
              value={formik.values.accountValue}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.accountValue && Boolean(formik.errors.accountValue)}
              helperText={formik.touched.accountValue && formik.errors.accountValue}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
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
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="price"
              name="price"
              label="Current Price"
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

          {/* Sizing Method */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="sizing-method-label">Position Sizing Method</InputLabel>
              <Select
                labelId="sizing-method-label"
                id="sizingMethod"
                name="sizingMethod"
                value={formik.values.sizingMethod}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.sizingMethod && Boolean(formik.errors.sizingMethod)}
                label="Position Sizing Method"
              >
                <MenuItem value="fixed">Fixed Dollar Amount</MenuItem>
                <MenuItem value="percent">Percentage of Account</MenuItem>
                <MenuItem value="risk">Risk-Based Sizing</MenuItem>
                <MenuItem value="volatility">Volatility-Based Sizing (ATR)</MenuItem>
                <MenuItem value="kelly">Kelly Criterion</MenuItem>
              </Select>
              {formik.touched.sizingMethod && formik.errors.sizingMethod && (
                <FormHelperText error>{formik.errors.sizingMethod}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Method-specific inputs */}
          {formik.values.sizingMethod === 'fixed' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="fixedAmount"
                name="fixedAmount"
                label="Position Amount"
                type="number"
                value={formik.values.fixedAmount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fixedAmount && Boolean(formik.errors.fixedAmount)}
                helperText={formik.touched.fixedAmount && formik.errors.fixedAmount}
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

          {formik.values.sizingMethod === 'percent' && (
            <Grid item xs={12}>
              <Typography gutterBottom>
                Account Percentage: {formik.values.accountPercent}%
              </Typography>
              <Slider
                id="accountPercent"
                name="accountPercent"
                value={formik.values.accountPercent}
                onChange={(e, value) => formik.setFieldValue('accountPercent', value)}
                aria-labelledby="account-percent-slider"
                valueLabelDisplay="auto"
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
                min={0}
                max={100}
              />
            </Grid>
          )}

          {formik.values.sizingMethod === 'risk' && (
            <>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  Risk Percentage: {formik.values.riskPercent}%
                </Typography>
                <Slider
                  id="riskPercent"
                  name="riskPercent"
                  value={formik.values.riskPercent}
                  onChange={(e, value) => formik.setFieldValue('riskPercent', value)}
                  aria-labelledby="risk-percent-slider"
                  valueLabelDisplay="auto"
                  step={0.1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 1, label: '1%' },
                    { value: 2, label: '2%' },
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                  ]}
                  min={0}
                  max={10}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="stopLossPrice"
                  name="stopLossPrice"
                  label="Stop Loss Price"
                  type="number"
                  value={formik.values.stopLossPrice}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.stopLossPrice && Boolean(formik.errors.stopLossPrice)}
                  helperText={formik.touched.stopLossPrice && formik.errors.stopLossPrice}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}

          {formik.values.sizingMethod === 'volatility' && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  id="atrValue"
                  name="atrValue"
                  label="ATR Value"
                  type="number"
                  value={formik.values.atrValue}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.atrValue && Boolean(formik.errors.atrValue)}
                  helperText={formik.touched.atrValue && formik.errors.atrValue}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  id="atrMultiplier"
                  name="atrMultiplier"
                  label="ATR Multiplier"
                  type="number"
                  value={formik.values.atrMultiplier}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.atrMultiplier && Boolean(formik.errors.atrMultiplier)}
                  helperText={formik.touched.atrMultiplier && formik.errors.atrMultiplier}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>
                  Risk Percentage: {formik.values.riskPercent}%
                </Typography>
                <Slider
                  id="riskPercent"
                  name="riskPercent"
                  value={formik.values.riskPercent}
                  onChange={(e, value) => formik.setFieldValue('riskPercent', value)}
                  aria-labelledby="risk-percent-slider"
                  valueLabelDisplay="auto"
                  step={0.1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 1, label: '1%' },
                    { value: 2, label: '2%' },
                    { value: 5, label: '5%' },
                  ]}
                  min={0}
                  max={5}
                />
              </Grid>
            </>
          )}

          {formik.values.sizingMethod === 'kelly' && (
            <>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>
                  Win Rate: {formik.values.winRate}%
                </Typography>
                <Slider
                  id="winRate"
                  name="winRate"
                  value={formik.values.winRate}
                  onChange={(e, value) => formik.setFieldValue('winRate', value)}
                  aria-labelledby="win-rate-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                  ]}
                  min={0}
                  max={100}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  id="rewardRiskRatio"
                  name="rewardRiskRatio"
                  label="Reward/Risk Ratio"
                  type="number"
                  value={formik.values.rewardRiskRatio}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.rewardRiskRatio && Boolean(formik.errors.rewardRiskRatio)}
                  helperText={formik.touched.rewardRiskRatio && formik.errors.rewardRiskRatio}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>
                  Kelly Fraction: {formik.values.kellyFraction}%
                </Typography>
                <Slider
                  id="kellyFraction"
                  name="kellyFraction"
                  value={formik.values.kellyFraction}
                  onChange={(e, value) => formik.setFieldValue('kellyFraction', value)}
                  aria-labelledby="kelly-fraction-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                  ]}
                  min={0}
                  max={100}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="stopLossPrice"
                  name="stopLossPrice"
                  label="Stop Loss Price"
                  type="number"
                  value={formik.values.stopLossPrice}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.stopLossPrice && Boolean(formik.errors.stopLossPrice)}
                  helperText={formik.touched.stopLossPrice && formik.errors.stopLossPrice}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}

          {/* Advanced Options Toggle */}
          <Grid item xs={12}>
            <Button
              variant="text"
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{ mb: 2 }}
            >
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </Button>
            
            {showAdvanced && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="takeProfitPrice"
                    name="takeProfitPrice"
                    label="Take Profit Price"
                    type="number"
                    value={formik.values.takeProfitPrice}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.takeProfitPrice && Boolean(formik.errors.takeProfitPrice)}
                    helperText={formik.touched.takeProfitPrice && formik.errors.takeProfitPrice}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Max Position Size: {formik.values.maxPositionSize}%
                  </Typography>
                  <Slider
                    id="maxPositionSize"
                    name="maxPositionSize"
                    value={formik.values.maxPositionSize}
                    onChange={(e, value) => formik.setFieldValue('maxPositionSize', value)}
                    aria-labelledby="max-position-size-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 25, label: '25%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' },
                    ]}
                    min={0}
                    max={100}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Calculate Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CalculateIcon />}
                sx={{ minWidth: 200 }}
              >
                Calculate Position Size
              </Button>
            </Box>
          </Grid>

          {/* Results */}
          {result && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mt: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.light, 0.1),
                  border: `1px solid ${theme.palette.primary.light}`,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Position Sizing Results
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Number of Shares:
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {result.shares.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Position Value:
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(result.positionValue)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Risk Amount:
                      </Typography>
                      <Typography variant="h6" color={result.riskPercent > 2 ? 'error' : 'inherit'}>
                        {formatCurrency(result.riskAmount)} ({result.riskPercent.toFixed(2)}% of account)
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Potential Profit:
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(result.potentialProfit)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Potential Loss:
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(result.potentialLoss)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Risk/Reward Ratio:
                      </Typography>
                      <Typography variant="h6" color={result.riskRewardRatio >= 1 ? 'success.main' : 'warning.main'}>
                        1:{result.riskRewardRatio.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {result.riskPercent > 2 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Risk exceeds 2% of your account value. Consider reducing position size.
                  </Alert>
                )}
                
                {onSave && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleSave}
                    >
                      Save Position Size
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </form>
    </Paper>
  );
};

export default PositionSizingCalculator;