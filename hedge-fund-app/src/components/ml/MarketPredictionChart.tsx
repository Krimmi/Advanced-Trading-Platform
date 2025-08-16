import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';

import { MarketPredictionService, PredictionResult } from '../../services/ml';

interface MarketPredictionChartProps {
  symbol: string;
  days?: number;
  height?: number | string;
  showControls?: boolean;
}

const MarketPredictionChart: React.FC<MarketPredictionChartProps> = ({ 
  symbol, 
  days = 5, 
  height = 400,
  showControls = true
}) => {
  const theme = useTheme();
  const predictionService = MarketPredictionService.getInstance();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [predictionDays, setPredictionDays] = useState(days);
  
  // Popular symbols for the dropdown
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'];
  
  // Load prediction data
  useEffect(() => {
    const loadPrediction = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await predictionService.predictPrices(selectedSymbol, predictionDays);
        setPrediction(result);
      } catch (error) {
        console.error('Error loading prediction:', error);
        setError(error instanceof Error ? error.message : 'Failed to load prediction');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPrediction();
  }, [selectedSymbol, predictionDays, predictionService]);
  
  // Handle symbol change
  const handleSymbolChange = (event: SelectChangeEvent<string>) => {
    setSelectedSymbol(event.target.value);
  };
  
  // Handle days change
  const handleDaysChange = (event: SelectChangeEvent<number>) => {
    setPredictionDays(event.target.value as number);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    // Re-trigger the effect to load new prediction
    setPrediction(null);
    setIsLoading(true);
    
    // Force re-fetch by setting a dummy state and reverting it
    setSelectedSymbol('');
    setTimeout(() => {
      setSelectedSymbol(symbol);
    }, 10);
  };
  
  // Format data for chart
  const formatChartData = () => {
    if (!prediction) return [];
    
    const chartData = [];
    
    // Add current price as first point
    chartData.push({
      date: new Date().toLocaleDateString(),
      actual: prediction.lastPrice,
      predicted: prediction.lastPrice
    });
    
    // Add prediction points
    for (let i = 0; i < prediction.predictionDates.length; i++) {
      chartData.push({
        date: prediction.predictionDates[i].toLocaleDateString(),
        predicted: prediction.predictionValues[i],
        actual: null // No actual data for future dates
      });
    }
    
    return chartData;
  };
  
  // Calculate price change
  const calculatePriceChange = () => {
    if (!prediction || prediction.predictionValues.length === 0) return { value: 0, percent: 0 };
    
    const lastPredictedPrice = prediction.predictionValues[prediction.predictionValues.length - 1];
    const change = lastPredictedPrice - prediction.lastPrice;
    const percentChange = (change / prediction.lastPrice) * 100;
    
    return {
      value: change,
      percent: percentChange
    };
  };
  
  // Format price with commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  const chartData = formatChartData();
  const priceChange = calculatePriceChange();
  const isPriceUp = priceChange.value >= 0;
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Market Price Prediction
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ML-based price forecasting for {selectedSymbol}
          </Typography>
        </Box>
        
        {showControls && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="symbol-select-label">Symbol</InputLabel>
              <Select
                labelId="symbol-select-label"
                id="symbol-select"
                value={selectedSymbol}
                label="Symbol"
                onChange={handleSymbolChange}
              >
                {popularSymbols.map(sym => (
                  <MenuItem key={sym} value={sym}>{sym}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel id="days-select-label">Days</InputLabel>
              <Select
                labelId="days-select-label"
                id="days-select"
                value={predictionDays}
                label="Days"
                onChange={handleDaysChange}
              >
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : prediction ? (
          <>
            {/* Price summary */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Price
                </Typography>
                <Typography variant="h5" fontWeight="medium">
                  {formatPrice(prediction.lastPrice)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Predicted ({predictionDays} days)
                </Typography>
                <Typography 
                  variant="h5" 
                  fontWeight="medium"
                  color={isPriceUp ? 'success.main' : 'error.main'}
                >
                  {formatPrice(prediction.lastPrice + priceChange.value)}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Prediction Date
                </Typography>
                <Typography variant="body1">
                  {prediction.predictionDate.toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Predicted Change
                </Typography>
                <Typography 
                  variant="body1"
                  color={isPriceUp ? 'success.main' : 'error.main'}
                >
                  {isPriceUp ? '+' : ''}{formatPrice(priceChange.value)} ({isPriceUp ? '+' : ''}{priceChange.percent.toFixed(2)}%)
                </Typography>
              </Box>
            </Box>
            
            {/* Chart */}
            <Box sx={{ flexGrow: 1, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <ReferenceLine 
                    x={chartData[0].date} 
                    stroke={theme.palette.divider}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    label={{ value: 'Today', position: 'insideTopRight', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual Price"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    name="Predicted Price"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    fill={theme.palette.secondary.light}
                    fillOpacity={0.1}
                    stroke="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
            
            {/* Model info */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Model: {prediction.modelType.toUpperCase()} | ID: {prediction.modelId.substring(0, 8)}...
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">No prediction data available</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MarketPredictionChart;