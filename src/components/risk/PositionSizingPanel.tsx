import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
  SelectChangeEvent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { 
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Calculate as CalculateIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { 
  ResponsiveBar,
  ResponsivePie
} from '@nivo/core';
import { Bar } from '@nivo/bar';
import { Pie } from '@nivo/pie';
import { 
  PositionSizingService, 
  PositionSizingMethod, 
  PositionSizingOptions,
  TradeSetup,
  PositionSizingResult
} from '../../services/risk/PositionSizingService';
import { CorrelationAnalysisService, CorrelationMethod } from '../../services/risk/CorrelationAnalysisService';
import { Portfolio, Position, PositionSizingRecommendation } from '../../services/risk/models/RiskModels';

// Props interface
interface PositionSizingPanelProps {
  portfolio?: Portfolio;
  accountValue?: number;
  onPositionSizeCalculated?: (result: PositionSizingResult) => void;
  onRecommendationsCalculated?: (recommendations: PositionSizingRecommendation[]) => void;
  height?: number | string;
}

// Tab panel interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`position-sizing-tabpanel-${index}`}
      aria-labelledby={`position-sizing-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Component for position sizing visualization
const PositionSizingPanel: React.FC<PositionSizingPanelProps> = ({
  portfolio,
  accountValue = 100000,
  onPositionSizeCalculated,
  onRecommendationsCalculated,
  height = 700
}) => {
  const theme = useTheme();
  
  // Services
  const positionSizingService = useMemo(() => new PositionSizingService(), []);
  const correlationService = useMemo(() => new CorrelationAnalysisService(), []);
  
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PositionSizingResult | null>(null);
  const [recommendations, setRecommendations] = useState<PositionSizingRecommendation[] | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<Record<string, Record<string, number>> | null>(null);
  
  // Trade setup
  const [symbol, setSymbol] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [atrValue, setAtrValue] = useState<number>(0);
  const [winRate, setWinRate] = useState<number>(50);
  
  // Position sizing options
  const [sizingMethod, setSizingMethod] = useState<PositionSizingMethod>(PositionSizingMethod.RISK);
  const [maxPositionSizePercent, setMaxPositionSizePercent] = useState<number>(5);
  const [maxRiskPerTradePercent, setMaxRiskPerTradePercent] = useState<number>(1);
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(252);
  const [kellyFraction, setKellyFraction] = useState<number>(50);
  const [useCorrelationAdjustment, setUseCorrelationAdjustment] = useState<boolean>(false);
  const [correlationMethod, setCorrelationMethod] = useState<CorrelationMethod>(CorrelationMethod.PEARSON);
  
  // Initialize symbol and price if portfolio is available
  useEffect(() => {
    if (portfolio && portfolio.positions.length > 0) {
      const firstPosition = portfolio.positions[0];
      setSymbol(firstPosition.symbol);
      setEntryPrice(firstPosition.price);
      setStopLossPrice(firstPosition.price * 0.95); // Default 5% stop loss
      setTakeProfitPrice(firstPosition.price * 1.1); // Default 10% take profit
      setAtrValue(firstPosition.price * 0.02); // Default 2% ATR
    }
  }, [portfolio]);
  
  // Calculate position size
  const calculatePositionSize = async () => {
    if (!symbol || entryPrice <= 0 || stopLossPrice <= 0) {
      setError('Please enter valid symbol, entry price, and stop loss price');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const setup: TradeSetup = {
        symbol,
        entryPrice,
        stopLossPrice,
        takeProfitPrice: takeProfitPrice > 0 ? takeProfitPrice : undefined,
        atrValue: atrValue > 0 ? atrValue : undefined,
        winRate: winRate > 0 ? winRate : undefined
      };
      
      const options: PositionSizingOptions = {
        method: sizingMethod,
        accountValue,
        maxPositionSizePercent,
        maxRiskPerTradePercent,
        lookbackPeriod,
        kellyFraction,
        useCorrelationAdjustment,
        correlationMethod
      };
      
      const result = await positionSizingService.calculatePositionSize(setup, options, portfolio);
      
      setResult(result);
      
      if (onPositionSizeCalculated) {
        onPositionSizeCalculated(result);
      }
    } catch (err) {
      console.error('Error calculating position size:', err);
      setError('Failed to calculate position size');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate portfolio recommendations
  const calculateRecommendations = async () => {
    if (!portfolio || portfolio.positions.length === 0) {
      setError('Portfolio is required for recommendations');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const options: PositionSizingOptions = {
        method: sizingMethod,
        accountValue: portfolio.totalValue,
        maxPositionSizePercent,
        maxRiskPerTradePercent,
        lookbackPeriod,
        kellyFraction,
        useCorrelationAdjustment,
        correlationMethod
      };
      
      // Calculate correlation matrix if needed
      if (useCorrelationAdjustment || 
          sizingMethod === PositionSizingMethod.CORRELATION_ADJUSTED || 
          sizingMethod === PositionSizingMethod.RISK_PARITY) {
        const symbols = portfolio.positions.map(p => p.symbol);
        
        const correlationResult = await correlationService.calculateCorrelationMatrix(
          symbols,
          {
            lookbackPeriod,
            method: correlationMethod,
            useLogReturns: true
          }
        );
        
        setCorrelationMatrix(correlationResult.value);
      }
      
      const recommendations = await positionSizingService.calculatePortfolioPositionSizing(portfolio, options);
      
      setRecommendations(recommendations);
      
      if (onRecommendationsCalculated) {
        onRecommendationsCalculated(recommendations);
      }
      
      // Switch to recommendations tab
      setActiveTab(1);
    } catch (err) {
      console.error('Error calculating recommendations:', err);
      setError('Failed to calculate position sizing recommendations');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle method change
  const handleMethodChange = (event: SelectChangeEvent<PositionSizingMethod>) => {
    setSizingMethod(event.target.value as PositionSizingMethod);
  };
  
  // Handle correlation method change
  const handleCorrelationMethodChange = (event: SelectChangeEvent<CorrelationMethod>) => {
    setCorrelationMethod(event.target.value as CorrelationMethod);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
  
  // Format percentage
  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };
  
  // Prepare data for position size visualization
  const positionSizeData = useMemo(() => {
    if (!result) return [];
    
    return [
      {
        id: 'Position Value',
        value: result.positionValue,
        color: theme.palette.primary.main,
        label: formatCurrency(result.positionValue)
      },
      {
        id: 'Remaining Account',
        value: accountValue - result.positionValue,
        color: theme.palette.grey[300],
        label: formatCurrency(accountValue - result.positionValue)
      }
    ];
  }, [result, accountValue]);
  
  // Prepare data for risk visualization
  const riskData = useMemo(() => {
    if (!result) return [];
    
    return [
      {
        id: 'Risk Amount',
        value: result.riskAmount,
        color: theme.palette.error.main,
        label: formatCurrency(result.riskAmount)
      },
      {
        id: 'Remaining Risk Budget',
        value: (accountValue * (maxRiskPerTradePercent / 100)) - result.riskAmount,
        color: theme.palette.grey[300],
        label: formatCurrency((accountValue * (maxRiskPerTradePercent / 100)) - result.riskAmount)
      }
    ];
  }, [result, accountValue, maxRiskPerTradePercent]);
  
  // Prepare data for recommendations visualization
  const recommendationsData = useMemo(() => {
    if (!recommendations) return [];
    
    return recommendations.map(rec => ({
      symbol: rec.symbol,
      current: rec.currentSize,
      recommended: rec.recommendedSize,
      change: rec.sizeChange,
      changePercent: rec.sizeChangePercentage
    }));
  }, [recommendations]);
  
  // Get color for change percentage
  const getChangeColor = (changePercent: number) => {
    if (changePercent > 20) return theme.palette.success.main;
    if (changePercent > 5) return theme.palette.success.light;
    if (changePercent > -5) return theme.palette.text.secondary;
    if (changePercent > -20) return theme.palette.error.light;
    return theme.palette.error.main;
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: height,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Position Sizing Calculator
          <Tooltip title="Position sizing is a risk management technique that determines how many shares or contracts to buy based on your risk tolerance and account size.">
            <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: theme.palette.info.main }} />
          </Tooltip>
        </Typography>
        <Divider />
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="position sizing tabs">
          <Tab label="Single Position" id="position-sizing-tab-0" aria-controls="position-sizing-tabpanel-0" />
          <Tab label="Portfolio Recommendations" id="position-sizing-tab-1" aria-controls="position-sizing-tabpanel-1" />
        </Tabs>
      </Box>
      
      {/* Single Position Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Left Column - Inputs */}
          <Grid item xs={12} md={5}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Trade Setup
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Entry Price"
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(parseFloat(e.target.value))}
                    size="small"
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Stop Loss"
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(parseFloat(e.target.value))}
                    size="small"
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Take Profit"
                    type="number"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value))}
                    size="small"
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Position Sizing Method
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="sizing-method-label">Sizing Method</InputLabel>
                    <Select
                      labelId="sizing-method-label"
                      id="sizing-method"
                      value={sizingMethod}
                      onChange={handleMethodChange}
                      label="Sizing Method"
                    >
                      <MenuItem value={PositionSizingMethod.FIXED}>Fixed Dollar Amount</MenuItem>
                      <MenuItem value={PositionSizingMethod.PERCENT}>Percentage of Account</MenuItem>
                      <MenuItem value={PositionSizingMethod.RISK}>Risk-Based Sizing</MenuItem>
                      <MenuItem value={PositionSizingMethod.VOLATILITY}>Volatility-Based Sizing</MenuItem>
                      <MenuItem value={PositionSizingMethod.KELLY}>Kelly Criterion</MenuItem>
                      <MenuItem value={PositionSizingMethod.OPTIMAL_F}>Optimal F</MenuItem>
                      <MenuItem value={PositionSizingMethod.EQUAL_RISK}>Equal Risk</MenuItem>
                      <MenuItem value={PositionSizingMethod.CORRELATION_ADJUSTED}>Correlation-Adjusted</MenuItem>
                      <MenuItem value={PositionSizingMethod.RISK_PARITY}>Risk Parity</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Position Size (%)"
                    type="number"
                    value={maxPositionSizePercent}
                    onChange={(e) => setMaxPositionSizePercent(parseFloat(e.target.value))}
                    size="small"
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Risk Per Trade (%)"
                    type="number"
                    value={maxRiskPerTradePercent}
                    onChange={(e) => setMaxRiskPerTradePercent(parseFloat(e.target.value))}
                    size="small"
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                    }}
                  />
                </Grid>
                
                {(sizingMethod === PositionSizingMethod.KELLY) && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Win Rate (%)"
                      type="number"
                      value={winRate}
                      onChange={(e) => setWinRate(parseFloat(e.target.value))}
                      size="small"
                      InputProps={{
                        endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                      }}
                    />
                  </Grid>
                )}
                
                {(sizingMethod === PositionSizingMethod.KELLY) && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Kelly Fraction (%)"
                      type="number"
                      value={kellyFraction}
                      onChange={(e) => setKellyFraction(parseFloat(e.target.value))}
                      size="small"
                      InputProps={{
                        endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                      }}
                    />
                  </Grid>
                )}
                
                {(sizingMethod === PositionSizingMethod.VOLATILITY) && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ATR Value"
                      type="number"
                      value={atrValue}
                      onChange={(e) => setAtrValue(parseFloat(e.target.value))}
                      size="small"
                      InputProps={{
                        startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>
                      }}
                    />
                  </Grid>
                )}
                
                {(sizingMethod === PositionSizingMethod.CORRELATION_ADJUSTED || 
                  sizingMethod === PositionSizingMethod.RISK_PARITY) && (
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="correlation-method-label">Correlation Method</InputLabel>
                      <Select
                        labelId="correlation-method-label"
                        id="correlation-method"
                        value={correlationMethod}
                        onChange={handleCorrelationMethodChange}
                        label="Correlation Method"
                      >
                        <MenuItem value={CorrelationMethod.PEARSON}>Pearson</MenuItem>
                        <MenuItem value={CorrelationMethod.SPEARMAN}>Spearman (Rank)</MenuItem>
                        <MenuItem value={CorrelationMethod.KENDALL}>Kendall's Tau</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useCorrelationAdjustment}
                        onChange={(e) => setUseCorrelationAdjustment(e.target.checked)}
                      />
                    }
                    label="Use Correlation Adjustment"
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CalculateIcon />}
                onClick={calculatePositionSize}
                disabled={loading || !symbol || entryPrice <= 0 || stopLossPrice <= 0}
                fullWidth
              >
                Calculate Position Size
              </Button>
            </Box>
          </Grid>
          
          {/* Right Column - Results */}
          <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Results */}
            {!loading && result && (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Position Sizing Results
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.light, 0.1),
                        border: `1px solid ${theme.palette.primary.light}`,
                        height: '100%'
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Position Details
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Symbol:
                        </Typography>
                        <Typography variant="h6">
                          {result.symbol}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Number of Shares:
                        </Typography>
                        <Typography variant="h6">
                          {result.shares.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Position Value:
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(result.positionValue)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Percentage of Account:
                        </Typography>
                        <Typography variant="h6">
                          {((result.positionValue / accountValue) * 100).toFixed(2)}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.secondary.light, 0.1),
                        border: `1px solid ${theme.palette.secondary.light}`,
                        height: '100%'
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Risk Metrics
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Risk Amount:
                        </Typography>
                        <Typography variant="h6" color={result.riskPercent > 2 ? 'error' : 'inherit'}>
                          {formatCurrency(result.riskAmount)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Risk Percentage:
                        </Typography>
                        <Typography variant="h6" color={result.riskPercent > 2 ? 'error' : 'inherit'}>
                          {result.riskPercent.toFixed(2)}%
                        </Typography>
                      </Box>
                      
                      {result.potentialProfit !== undefined && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Potential Profit:
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {formatCurrency(result.potentialProfit)}
                          </Typography>
                        </Box>
                      )}
                      
                      {result.riskRewardRatio !== undefined && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Risk/Reward Ratio:
                          </Typography>
                          <Typography variant="h6" color={result.riskRewardRatio >= 1 ? 'success.main' : 'warning.main'}>
                            1:{result.riskRewardRatio.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
                
                {/* Visualizations */}
                <Grid container spacing={3} sx={{ mt: 1, flexGrow: 1 }}>
                  <Grid item xs={12} md={6} sx={{ height: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Position Size
                    </Typography>
                    <Box sx={{ height: 220 }}>
                      <Pie
                        data={positionSizeData}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'paired' }}
                        borderWidth={1}
                        borderColor={{
                          from: 'color',
                          modifiers: [['darker', 0.2]]
                        }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor={theme.palette.text.primary}
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                          from: 'color',
                          modifiers: [['darker', 2]]
                        }}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: theme.palette.text.primary,
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle'
                          }
                        ]}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6} sx={{ height: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Risk Allocation
                    </Typography>
                    <Box sx={{ height: 220 }}>
                      <Pie
                        data={riskData}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'red_grey' }}
                        borderWidth={1}
                        borderColor={{
                          from: 'color',
                          modifiers: [['darker', 0.2]]
                        }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor={theme.palette.text.primary}
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                          from: 'color',
                          modifiers: [['darker', 2]]
                        }}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: theme.palette.text.primary,
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle'
                          }
                        ]}
                      />
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Warnings */}
                {result.riskPercent > 2 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>High Risk Warning</AlertTitle>
                    Risk exceeds 2% of your account value. Consider reducing position size.
                  </Alert>
                )}
                
                {result.riskRewardRatio !== undefined && result.riskRewardRatio < 1 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>Poor Risk/Reward Ratio</AlertTitle>
                    Risk/reward ratio is less than 1:1. Consider adjusting your stop loss or take profit levels.
                  </Alert>
                )}
              </Box>
            )}
            
            {/* No Results Message */}
            {!loading && !result && !error && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  Enter trade details and calculate position size to view results
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Portfolio Recommendations Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Controls */}
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="portfolio-sizing-method-label">Sizing Method</InputLabel>
                    <Select
                      labelId="portfolio-sizing-method-label"
                      id="portfolio-sizing-method"
                      value={sizingMethod}
                      onChange={handleMethodChange}
                      label="Sizing Method"
                    >
                      <MenuItem value={PositionSizingMethod.RISK}>Risk-Based Sizing</MenuItem>
                      <MenuItem value={PositionSizingMethod.VOLATILITY}>Volatility-Based Sizing</MenuItem>
                      <MenuItem value={PositionSizingMethod.EQUAL_RISK}>Equal Risk</MenuItem>
                      <MenuItem value={PositionSizingMethod.CORRELATION_ADJUSTED}>Correlation-Adjusted</MenuItem>
                      <MenuItem value={PositionSizingMethod.RISK_PARITY}>Risk Parity</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Max Risk Per Trade (%)"
                    type="number"
                    value={maxRiskPerTradePercent}
                    onChange={(e) => setMaxRiskPerTradePercent(parseFloat(e.target.value))}
                    size="small"
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useCorrelationAdjustment}
                        onChange={(e) => setUseCorrelationAdjustment(e.target.checked)}
                      />
                    }
                    label="Use Correlation Adjustment"
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CalculateIcon />}
                    onClick={calculateRecommendations}
                    disabled={loading || !portfolio || portfolio.positions.length === 0}
                    fullWidth
                  >
                    Calculate
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          {/* Error Message */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Grid>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
            </Grid>
          )}
          
          {/* Recommendations Table */}
          {!loading && recommendations && recommendations.length > 0 && (
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom>
                Position Sizing Recommendations
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Current Size</TableCell>
                      <TableCell align="right">Recommended</TableCell>
                      <TableCell align="right">Change</TableCell>
                      <TableCell align="right">Risk %</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recommendations.map((rec) => (
                      <TableRow key={rec.symbol}>
                        <TableCell component="th" scope="row">
                          {rec.symbol}
                        </TableCell>
                        <TableCell align="right">{rec.currentSize.toLocaleString()}</TableCell>
                        <TableCell align="right">{rec.recommendedSize.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: getChangeColor(rec.sizeChangePercentage) }}>
                          {rec.sizeChange > 0 ? '+' : ''}{rec.sizeChange.toLocaleString()} 
                          ({rec.sizeChangePercentage > 0 ? '+' : ''}{rec.sizeChangePercentage.toFixed(1)}%)
                        </TableCell>
                        <TableCell align="right" sx={{ color: rec.riskContributionPercentage > 2 ? theme.palette.error.main : 'inherit' }}>
                          {rec.riskContributionPercentage.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          {Math.abs(rec.sizeChangePercentage) > 10 && (
                            <Chip
                              label={rec.sizeChange > 0 ? "Buy" : "Sell"}
                              color={rec.sizeChange > 0 ? "success" : "error"}
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
          
          {/* Recommendations Chart */}
          {!loading && recommendations && recommendations.length > 0 && (
            <Grid item xs={12} md={4} sx={{ height: 400 }}>
              <Typography variant="subtitle1" gutterBottom>
                Position Size Comparison
              </Typography>
              
              <Box sx={{ height: 350 }}>
                <Bar
                  data={recommendationsData}
                  keys={['current', 'recommended']}
                  indexBy="symbol"
                  margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                  padding={0.3}
                  groupMode="grouped"
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={[theme.palette.grey[400], theme.palette.primary.main]}
                  borderColor={{
                    from: 'color',
                    modifiers: [['darker', 1.6]]
                  }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Symbol',
                    legendPosition: 'middle',
                    legendOffset: 40
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Shares',
                    legendPosition: 'middle',
                    legendOffset: -50
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  legends={[
                    {
                      dataFrom: 'keys',
                      anchor: 'top-right',
                      direction: 'column',
                      justify: false,
                      translateX: 0,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 20,
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemOpacity: 1
                          }
                        }
                      ]
                    }
                  ]}
                  role="application"
                  ariaLabel="Position size comparison chart"
                  theme={{
                    axis: {
                      ticks: {
                        text: {
                          fill: theme.palette.text.primary
                        }
                      },
                      legend: {
                        text: {
                          fill: theme.palette.text.primary
                        }
                      }
                    },
                    legends: {
                      text: {
                        fill: theme.palette.text.primary
                      }
                    },
                    tooltip: {
                      container: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary
                      }
                    }
                  }}
                />
              </Box>
            </Grid>
          )}
          
          {/* No Portfolio Message */}
          {!loading && !recommendations && !error && (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <BarChartIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {portfolio && portfolio.positions.length > 0 
                    ? 'Click Calculate to generate position sizing recommendations'
                    : 'No portfolio available. Please add positions to your portfolio first.'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default PositionSizingPanel;