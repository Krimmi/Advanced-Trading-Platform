import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Button, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ReferenceLine
} from 'recharts';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';

// Services
import { MarketDataService } from '../../services/market-data/MarketDataService';
import { MarketAnalyticsService } from '../../services/analytics/MarketAnalyticsService';
import { MarketPredictionService } from '../../services/ml/MarketPredictionService';

// Types
import { 
  PricePrediction, 
  TrendPrediction, 
  VolatilityPrediction, 
  SentimentAnalysis 
} from '../../services/ml/MarketPredictionService';
import { 
  MACDResult, 
  BollingerBandsResult, 
  SupportResistanceResult, 
  VolumeProfileResult 
} from '../../services/analytics/MarketAnalyticsService';

/**
 * Market Insights Dashboard Component
 */
const MarketInsightsDashboard: React.FC = () => {
  // Services
  const [marketDataService] = useState(MarketDataService.getInstance());
  const [analyticsService] = useState(MarketAnalyticsService.getInstance());
  const [predictionService] = useState(MarketPredictionService.getInstance());
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [availableSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'JNJ']);
  
  // Market data
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  
  // Analytics data
  const [movingAverages, setMovingAverages] = useState<{ sma20: number[], sma50: number[], sma200: number[] }>({ sma20: [], sma50: [], sma200: [] });
  const [rsiValues, setRsiValues] = useState<number[]>([]);
  const [macdValues, setMacdValues] = useState<MACDResult[]>([]);
  const [bollingerBands, setBollingerBands] = useState<BollingerBandsResult[]>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistanceResult | null>(null);
  const [volumeProfile, setVolumeProfile] = useState<VolumeProfileResult | null>(null);
  
  // Prediction data
  const [pricePredictions, setPricePredictions] = useState<PricePrediction[]>([]);
  const [trendPredictions, setTrendPredictions] = useState<TrendPrediction[]>([]);
  const [volatilityPredictions, setVolatilityPredictions] = useState<VolatilityPrediction[]>([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis[]>([]);
  
  // Initialize services and load data
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize services
        await marketDataService.initialize({
          alpaca: {
            apiKey: 'demo_api_key',
            apiSecret: 'demo_api_secret',
            paperTrading: true
          }
        });
        
        await analyticsService.initialize();
        await predictionService.initialize();
        
        // Load data for initial symbol
        await loadSymbolData(symbol, timeframe);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing services:', error);
        setError('Failed to initialize services. Please try again later.');
        setIsLoading(false);
      }
    };
    
    initializeServices();
    
    // Clean up
    return () => {
      // Unsubscribe from data
      const cleanup = async () => {
        try {
          await predictionService.unsubscribeFromPredictions(symbol);
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      };
      
      cleanup();
    };
  }, []);
  
  // Load data when symbol or timeframe changes
  useEffect(() => {
    if (!isLoading) {
      loadSymbolData(symbol, timeframe);
    }
  }, [symbol, timeframe]);
  
  // Handle tab change
  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle symbol change
  const handleSymbolChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSymbol(event.target.value as string);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeframe(event.target.value as string);
  };
  
  // Load data for a symbol
  const loadSymbolData = async (symbol: string, timeframe: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Subscribe to predictions
      await predictionService.subscribeToPredictions(symbol, timeframe);
      
      // Load historical prices
      const end = new Date();
      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      
      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        timeframe,
        start,
        end
      );
      
      setHistoricalPrices(historicalData);
      
      // Load analytics data
      const sma20 = await analyticsService.getMovingAverage(symbol, 20, 'SMA', timeframe);
      const sma50 = await analyticsService.getMovingAverage(symbol, 50, 'SMA', timeframe);
      const sma200 = await analyticsService.getMovingAverage(symbol, 200, 'SMA', timeframe);
      setMovingAverages({ sma20, sma50, sma200 });
      
      const rsi = await analyticsService.getRSI(symbol, 14, timeframe);
      setRsiValues(rsi);
      
      const macd = await analyticsService.getMACD(symbol, 12, 26, 9, timeframe);
      setMacdValues(macd);
      
      const bollinger = await analyticsService.getBollingerBands(symbol, 20, 2, timeframe);
      setBollingerBands(bollinger);
      
      const supportRes = await analyticsService.getSupportResistanceLevels(symbol, timeframe);
      setSupportResistance(supportRes);
      
      const volProfile = await analyticsService.getVolumeProfile(symbol, timeframe);
      setVolumeProfile(volProfile);
      
      // Load prediction data
      const pricePreds = await predictionService.getPricePredictions(symbol);
      setPricePredictions(pricePreds);
      
      const trendPreds = await predictionService.getTrendPredictions(symbol);
      setTrendPredictions(trendPreds);
      
      const volPreds = await predictionService.getVolatilityPredictions(symbol);
      setVolatilityPredictions(volPreds);
      
      const sentiment = await predictionService.getSentimentAnalysis(symbol);
      setSentimentAnalysis(sentiment);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again later.');
      setIsLoading(false);
    }
  };
  
  // Format date for charts
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  // Render price chart
  const renderPriceChart = () => {
    if (historicalPrices.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="textSecondary">
            No price data available
          </Typography>
        </Box>
      );
    }
    
    // Combine historical prices with moving averages
    const chartData = historicalPrices.map((price, index) => {
      const sma20 = movingAverages.sma20[index - (historicalPrices.length - movingAverages.sma20.length)] || null;
      const sma50 = movingAverages.sma50[index - (historicalPrices.length - movingAverages.sma50.length)] || null;
      const sma200 = movingAverages.sma200[index - (historicalPrices.length - movingAverages.sma200.length)] || null;
      
      return {
        date: price.timestamp,
        price: price.close,
        open: price.open,
        high: price.high,
        low: price.low,
        volume: price.volume,
        sma20,
        sma50,
        sma200
      };
    });
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            minTickGap={50}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip 
            labelFormatter={(label) => formatDate(new Date(label))}
            formatter={(value: any) => [value.toFixed(2), 'Price']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8884d8" 
            dot={false} 
            name="Price"
          />
          <Line 
            type="monotone" 
            dataKey="sma20" 
            stroke="#82ca9d" 
            dot={false} 
            name="SMA 20"
          />
          <Line 
            type="monotone" 
            dataKey="sma50" 
            stroke="#ff7300" 
            dot={false} 
            name="SMA 50"
          />
          <Line 
            type="monotone" 
            dataKey="sma200" 
            stroke="#ff0000" 
            dot={false} 
            name="SMA 200"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render price predictions chart
  const renderPricePredictionsChart = () => {
    if (historicalPrices.length === 0 || pricePredictions.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="textSecondary">
            No prediction data available
          </Typography>
        </Box>
      );
    }
    
    // Get the last 30 historical prices
    const recentPrices = historicalPrices.slice(-30);
    
    // Create chart data
    const chartData = [
      ...recentPrices.map(price => ({
        date: price.timestamp,
        price: price.close,
        predicted: null,
        confidenceLow: null,
        confidenceHigh: null,
        isHistorical: true
      })),
      ...pricePredictions.map(pred => ({
        date: pred.targetDate,
        price: null,
        predicted: pred.predictedPrice,
        confidenceLow: pred.confidenceLow,
        confidenceHigh: pred.confidenceHigh,
        isHistorical: false
      }))
    ];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            minTickGap={50}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip 
            labelFormatter={(label) => formatDate(new Date(label))}
            formatter={(value: any, name: string) => {
              if (value === null) return ['-', name];
              return [value.toFixed(2), name];
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="confidenceLow" 
            stackId="1"
            stroke="none" 
            fill="#8884d8" 
            fillOpacity={0.2}
            name="Lower Bound"
          />
          <Area 
            type="monotone" 
            dataKey="confidenceHigh" 
            stackId="1"
            stroke="none" 
            fill="#8884d8" 
            fillOpacity={0.2}
            name="Upper Bound"
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8884d8" 
            dot={false} 
            name="Historical Price"
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#ff7300" 
            dot={true} 
            name="Predicted Price"
          />
          <ReferenceLine x={pricePredictions[0]?.targetDate} stroke="#666" strokeDasharray="3 3" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };
  
  // Render RSI chart
  const renderRSIChart = () => {
    if (rsiValues.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="textSecondary">
            No RSI data available
          </Typography>
        </Box>
      );
    }
    
    // Create chart data
    const chartData = rsiValues.map((rsi, index) => {
      const priceIndex = historicalPrices.length - rsiValues.length + index;
      const price = priceIndex >= 0 ? historicalPrices[priceIndex] : null;
      
      return {
        date: price?.timestamp || new Date(),
        rsi
      };
    });
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            minTickGap={50}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            labelFormatter={(label) => formatDate(new Date(label))}
            formatter={(value: any) => [value.toFixed(2), 'RSI']}
          />
          <Legend />
          <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
          <ReferenceLine y={30} stroke="green" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="rsi" 
            stroke="#8884d8" 
            dot={false} 
            name="RSI (14)"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render MACD chart
  const renderMACDChart = () => {
    if (macdValues.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="textSecondary">
            No MACD data available
          </Typography>
        </Box>
      );
    }
    
    // Create chart data
    const chartData = macdValues.map((macd, index) => {
      return {
        date: new Date(historicalPrices[historicalPrices.length - macdValues.length + index].timestamp),
        macd: macd.macd,
        signal: macd.signal,
        histogram: macd.histogram
      };
    });
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            minTickGap={50}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(label) => formatDate(new Date(label))}
            formatter={(value: any, name: string) => [value.toFixed(4), name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="macd" 
            stroke="#8884d8" 
            dot={false} 
            name="MACD"
          />
          <Line 
            type="monotone" 
            dataKey="signal" 
            stroke="#ff7300" 
            dot={false} 
            name="Signal"
          />
          <Bar 
            dataKey="histogram" 
            fill={(data: any) => data.histogram >= 0 ? '#82ca9d' : '#ff0000'} 
            name="Histogram"
          />
          <ReferenceLine y={0} stroke="#666" />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render Bollinger Bands chart
  const renderBollingerBandsChart = () => {
    if (bollingerBands.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="textSecondary">
            No Bollinger Bands data available
          </Typography>
        </Box>
      );
    }
    
    // Create chart data
    const chartData = bollingerBands.map((bb, index) => {
      return {
        date: new Date(historicalPrices[historicalPrices.length - bollingerBands.length + index].timestamp),
        price: bb.price,
        middle: bb.middle,
        upper: bb.upper,
        lower: bb.lower
      };
    });
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            minTickGap={50}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip 
            labelFormatter={(label) => formatDate(new Date(label))}
            formatter={(value: any, name: string) => [value.toFixed(2), name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8884d8" 
            dot={false} 
            name="Price"
          />
          <Line 
            type="monotone" 
            dataKey="middle" 
            stroke="#ff7300" 
            dot={false} 
            name="Middle Band"
          />
          <Line 
            type="monotone" 
            dataKey="upper" 
            stroke="#82ca9d" 
            dot={false} 
            name="Upper Band"
          />
          <Line 
            type="monotone" 
            dataKey="lower" 
            stroke="#ff0000" 
            dot={false} 
            name="Lower Band"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render trend predictions
  const renderTrendPredictions = () => {
    if (trendPredictions.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="textSecondary">
            No trend prediction data available
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {trendPredictions.map((prediction, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardHeader 
                title={`Day ${index + 1} Prediction`} 
                subheader={formatDate(prediction.targetDate)}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {prediction.predictedTrend === 'UP' ? (
                    <TrendingUpIcon color="success" sx={{ fontSize: 40, mr: 1 }} />
                  ) : (
                    <TrendingDownIcon color="error" sx={{ fontSize: 40, mr: 1 }} />
                  )}
                  <Typography variant="h5">
                    {prediction.predictedTrend === 'UP' ? 'Bullish' : 'Bearish'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" gutterBottom>
                  Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Probability Distribution:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ width: `${prediction.upProbability * 100}%`, bgcolor: 'success.main', height: 20, borderRadius: '4px 0 0 4px' }} />
                    <Box sx={{ width: `${prediction.downProbability * 100}%`, bgcolor: 'error.main', height: 20, borderRadius: '0 4px 4px 0' }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption">
                      Up: {(prediction.upProbability * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                      Down: {(prediction.downProbability * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render volatility predictions
  const renderVolatilityPredictions = () => {
    if (volatilityPredictions.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="textSecondary">
            No volatility prediction data available
          </Typography>
        </Box>
      );
    }
    
    // Create chart data
    const chartData = volatilityPredictions.map((pred, index) => {
      return {
        date: pred.targetDate,
        volatility: pred.predictedVolatility,
        confidenceLow: pred.confidenceLow,
        confidenceHigh: pred.confidenceHigh
      };
    });
    
    return (
      <Box>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              minTickGap={50}
            />
            <YAxis domain={[0, 'auto']} />
            <Tooltip 
              labelFormatter={(label) => formatDate(new Date(label))}
              formatter={(value: any, name: string) => {
                if (name === 'volatility') {
                  return [(value * 100).toFixed(2) + '%', 'Predicted Volatility'];
                }
                if (name === 'confidenceLow') {
                  return [(value * 100).toFixed(2) + '%', 'Lower Bound'];
                }
                if (name === 'confidenceHigh') {
                  return [(value * 100).toFixed(2) + '%', 'Upper Bound'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="confidenceLow" 
              stackId="1"
              stroke="none" 
              fill="#8884d8" 
              fillOpacity={0.2}
              name="Lower Bound"
            />
            <Area 
              type="monotone" 
              dataKey="confidenceHigh" 
              stackId="1"
              stroke="none" 
              fill="#8884d8" 
              fillOpacity={0.2}
              name="Upper Bound"
            />
            <Line 
              type="monotone" 
              dataKey="volatility" 
              stroke="#ff7300" 
              dot={true} 
              name="Predicted Volatility"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Volatility Interpretation
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Low Volatility
                  </Typography>
                  <Typography variant="body2">
                    &lt; 15% annualized
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Stable price movement, potentially lower risk but also lower potential returns.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'warning.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Medium Volatility
                  </Typography>
                  <Typography variant="body2">
                    15% - 30% annualized
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Moderate price swings, balanced risk-reward profile.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    High Volatility
                  </Typography>
                  <Typography variant="body2">
                    &gt; 30% annualized
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Large price swings, higher risk but potentially higher returns.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };
  
  // Render sentiment analysis
  const renderSentimentAnalysis = () => {
    if (sentimentAnalysis.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="textSecondary">
            No sentiment analysis data available
          </Typography>
        </Box>
      );
    }
    
    // Create chart data
    const chartData = sentimentAnalysis.map((analysis) => {
      return {
        date: analysis.date,
        overall: analysis.overallScore,
        news: analysis.sources.news.score,
        social: analysis.sources.socialMedia.score,
        analysts: analysis.sources.analysts.score
      };
    });
    
    // Get the latest sentiment
    const latestSentiment = sentimentAnalysis[sentimentAnalysis.length - 1];
    
    // Get sentiment icon
    const getSentimentIcon = (category: string) => {
      switch (category) {
        case 'VERY_BULLISH':
        case 'BULLISH':
          return <SentimentSatisfiedAltIcon sx={{ color: 'success.main', fontSize: 40 }} />;
        case 'NEUTRAL':
          return <SentimentNeutralIcon sx={{ color: 'info.main', fontSize: 40 }} />;
        case 'BEARISH':
        case 'VERY_BEARISH':
          return <SentimentVeryDissatisfiedIcon sx={{ color: 'error.main', fontSize: 40 }} />;
        default:
          return <SentimentNeutralIcon sx={{ color: 'info.main', fontSize: 40 }} />;
      }
    };
    
    // Get sentiment color
    const getSentimentColor = (category: string) => {
      switch (category) {
        case 'VERY_BULLISH':
          return 'success.dark';
        case 'BULLISH':
          return 'success.main';
        case 'NEUTRAL':
          return 'info.main';
        case 'BEARISH':
          return 'error.main';
        case 'VERY_BEARISH':
          return 'error.dark';
        default:
          return 'info.main';
      }
    };
    
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Current Sentiment" />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getSentimentIcon(latestSentiment.sentimentCategory)}
                  <Typography 
                    variant="h5" 
                    sx={{ ml: 1, color: getSentimentColor(latestSentiment.sentimentCategory) }}
                  >
                    {latestSentiment.sentimentCategory.replace('_', ' ')}
                  </Typography>
                </Box>
                
                <Typography variant="body2" gutterBottom>
                  Overall Score: {(latestSentiment.overallScore * 100).toFixed(1)}%
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Source Breakdown:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          News
                        </Typography>
                        <Typography variant="h6">
                          {(latestSentiment.sources.news.score * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {latestSentiment.sources.news.volume} articles
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          Social
                        </Typography>
                        <Typography variant="h6">
                          {(latestSentiment.sources.socialMedia.score * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {latestSentiment.sources.socialMedia.volume} posts
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          Analysts
                        </Typography>
                        <Typography variant="h6">
                          {(latestSentiment.sources.analysts.score * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {latestSentiment.sources.analysts.volume} reports
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Topics:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {latestSentiment.keywords.map((keyword, i) => (
                      <Chip 
                        key={i} 
                        label={keyword} 
                        size="small" 
                        color={
                          latestSentiment.sentimentCategory.includes('BULLISH') ? 'success' :
                          latestSentiment.sentimentCategory.includes('BEARISH') ? 'error' : 'default'
                        }
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Sentiment Trend" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      minTickGap={50}
                    />
                    <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip 
                      labelFormatter={(label) => formatDate(new Date(label))}
                      formatter={(value: any, name: string) => {
                        const nameMap: Record<string, string> = {
                          overall: 'Overall',
                          news: 'News',
                          social: 'Social Media',
                          analysts: 'Analysts'
                        };
                        return [(value * 100).toFixed(1) + '%', nameMap[name] || name];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="overall" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Overall"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="news" 
                      stroke="#82ca9d" 
                      strokeDasharray="5 5"
                      name="News"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="social" 
                      stroke="#ff7300" 
                      strokeDasharray="3 3"
                      name="Social Media"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="analysts" 
                      stroke="#0088fe" 
                      strokeDasharray="3 3"
                      name="Analysts"
                    />
                    <ReferenceLine y={0.5} stroke="#666" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Market Insights Dashboard
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel id="symbol-label">Symbol</InputLabel>
          <Select
            labelId="symbol-label"
            value={symbol}
            onChange={handleSymbolChange as any}
            label="Symbol"
          >
            {availableSymbols.map((sym) => (
              <MenuItem key={sym} value={sym}>{sym}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel id="timeframe-label">Timeframe</InputLabel>
          <Select
            labelId="timeframe-label"
            value={timeframe}
            onChange={handleTimeframeChange as any}
            label="Timeframe"
          >
            <MenuItem value="1m">1 Minute</MenuItem>
            <MenuItem value="5m">5 Minutes</MenuItem>
            <MenuItem value="15m">15 Minutes</MenuItem>
            <MenuItem value="1h">1 Hour</MenuItem>
            <MenuItem value="1d">1 Day</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<ShowChartIcon />} label="Price" />
          <Tab icon={<TimelineIcon />} label="Predictions" />
          <Tab icon={<BarChartIcon />} label="Technical Indicators" />
          <Tab icon={<TrendingUpIcon />} label="Trend Analysis" />
          <Tab icon={<BubbleChartIcon />} label="Volatility" />
          <Tab icon={<SentimentSatisfiedAltIcon />} label="Sentiment" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && (
        <Box>
          <Card>
            <CardHeader 
              title={`${symbol} Price Chart`} 
              subheader={`Timeframe: ${timeframe}`}
            />
            <CardContent>
              {renderPriceChart()}
            </CardContent>
          </Card>
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title={`${symbol} Price Predictions`} 
              subheader="Next 5 days forecast"
            />
            <CardContent>
              {renderPricePredictionsChart()}
            </CardContent>
          </Card>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Trend Predictions
          </Typography>
          {renderTrendPredictions()}
        </Box>
      )}
      
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="RSI (14)" />
                <CardContent>
                  {renderRSIChart()}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="MACD" />
                <CardContent>
                  {renderMACDChart()}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Bollinger Bands" />
                <CardContent>
                  {renderBollingerBandsChart()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {activeTab === 3 && (
        <Box>
          <Card>
            <CardHeader title="Trend Analysis" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Support & Resistance Levels
                  </Typography>
                  {supportResistance ? (
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Resistance Levels" 
                          secondary={supportResistance.resistance.map(level => level.toFixed(2)).join(', ')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingDownIcon color="error" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Support Levels" 
                          secondary={supportResistance.support.map(level => level.toFixed(2)).join(', ')}
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No support and resistance data available
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Moving Average Analysis
                  </Typography>
                  {historicalPrices.length > 0 && movingAverages.sma20.length > 0 ? (
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Price vs SMA 20" 
                          secondary={`Current price is ${historicalPrices[historicalPrices.length - 1].close > movingAverages.sma20[movingAverages.sma20.length - 1] ? 'above' : 'below'} the 20-day moving average`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Price vs SMA 50" 
                          secondary={`Current price is ${historicalPrices[historicalPrices.length - 1].close > movingAverages.sma50[movingAverages.sma50.length - 1] ? 'above' : 'below'} the 50-day moving average`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="SMA 20 vs SMA 50" 
                          secondary={`20-day moving average is ${movingAverages.sma20[movingAverages.sma20.length - 1] > movingAverages.sma50[movingAverages.sma50.length - 1] ? 'above' : 'below'} the 50-day moving average`}
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No moving average data available
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
      
      {activeTab === 4 && (
        <Box>
          <Card>
            <CardHeader title="Volatility Analysis" />
            <CardContent>
              {renderVolatilityPredictions()}
            </CardContent>
          </Card>
        </Box>
      )}
      
      {activeTab === 5 && (
        <Box>
          <Card>
            <CardHeader title="Sentiment Analysis" />
            <CardContent>
              {renderSentimentAnalysis()}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default MarketInsightsDashboard;