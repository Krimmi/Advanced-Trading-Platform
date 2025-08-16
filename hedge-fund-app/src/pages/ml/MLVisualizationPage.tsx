import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme
} from '@mui/material';

// Components
import ChartContainer from '../../components/common/ChartContainer';
import PredictionChart from '../../components/charts/PredictionChart';
import FeatureImportanceBarChart from '../../components/charts/FeatureImportanceBarChart';
import ModelPerformanceMetricsChart from '../../components/charts/ModelPerformanceMetricsChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-tabpanel-${index}`}
      aria-labelledby={`ml-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MLVisualizationPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string>('model1');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [timeRange, setTimeRange] = useState<string>('1Y');
  
  // Mock data for predictions
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [featureImportanceData, setFeatureImportanceData] = useState<any[]>([]);
  const [modelPerformanceData, setModelPerformanceData] = useState<any[]>([]);
  
  // Generate mock data on mount
  useEffect(() => {
    generateMockData();
  }, [selectedSymbol, selectedModel]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };
  
  // Handle symbol selection
  const handleSymbolChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedSymbol(event.target.value as string);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };
  
  // Generate mock data
  const generateMockData = () => {
    // Generate prediction data
    const now = new Date();
    const predictionPoints = [];
    const historicalPoints = 180; // 6 months of historical data
    const futurePoints = 30; // 1 month of predictions
    
    // Base price and volatility based on selected symbol
    let basePrice = 150;
    let volatility = 2;
    
    switch (selectedSymbol) {
      case 'AAPL':
        basePrice = 180;
        volatility = 2;
        break;
      case 'MSFT':
        basePrice = 350;
        volatility = 3;
        break;
      case 'GOOGL':
        basePrice = 130;
        volatility = 2.5;
        break;
      case 'AMZN':
        basePrice = 140;
        volatility = 3.5;
        break;
      case 'TSLA':
        basePrice = 250;
        volatility = 5;
        break;
    }
    
    // Generate historical data
    for (let i = historicalPoints; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate price with some randomness and trend
      const trend = Math.sin(i / 30) * 10;
      const noise = (Math.random() - 0.5) * volatility;
      const price = basePrice + trend + noise * (i / 20);
      
      predictionPoints.push({
        date: date.toISOString().split('T')[0],
        actual: price,
      });
    }
    
    // Generate future predictions based on model
    let predictionAccuracy = 0.8;
    let confidenceInterval = 5;
    
    switch (selectedModel) {
      case 'model1': // LSTM
        predictionAccuracy = 0.85;
        confidenceInterval = 4;
        break;
      case 'model2': // Random Forest
        predictionAccuracy = 0.75;
        confidenceInterval = 6;
        break;
      case 'model3': // XGBoost
        predictionAccuracy = 0.82;
        confidenceInterval = 5;
        break;
    }
    
    // Last actual price
    const lastActualPrice = predictionPoints[predictionPoints.length - 1].actual;
    
    // Generate future predictions
    for (let i = 1; i <= futurePoints; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Generate predicted price with some trend and noise
      const trend = Math.sin((historicalPoints + i) / 30) * 10;
      const noise = (Math.random() - 0.5) * volatility;
      const truePrice = basePrice + trend + noise * ((historicalPoints + i) / 20);
      
      // Add prediction error based on model accuracy
      const predictionError = (1 - predictionAccuracy) * truePrice * (Math.random() - 0.5) * 0.2;
      const predictedPrice = truePrice + predictionError;
      
      // Calculate confidence interval
      const lower = predictedPrice - (confidenceInterval * (i / futurePoints));
      const upper = predictedPrice + (confidenceInterval * (i / futurePoints));
      
      predictionPoints.push({
        date: date.toISOString().split('T')[0],
        predicted: predictedPrice,
        lower,
        upper,
      });
    }
    
    setPredictionData([
      {
        id: 'price',
        name: `${selectedSymbol} Price`,
        data: predictionPoints,
        color: theme.palette.primary.main,
      }
    ]);
    
    // Generate feature importance data
    const featureCategories = {
      'price': ['Open', 'High', 'Low', 'Close', 'Adj Close', 'Previous Close'],
      'volume': ['Volume', 'Avg Volume', 'Relative Volume'],
      'technical': ['SMA50', 'SMA200', 'EMA20', 'RSI', 'MACD', 'Bollinger Bands', 'ATR'],
      'fundamental': ['P/E Ratio', 'EPS', 'Market Cap', 'Revenue Growth', 'Profit Margin'],
      'sentiment': ['News Sentiment', 'Social Media Sentiment', 'Analyst Ratings'],
      'macro': ['S&P 500', 'Interest Rates', 'USD Index', 'Sector Performance', 'VIX']
    };
    
    // Generate different feature importance based on model
    let features = [];
    
    switch (selectedModel) {
      case 'model1': // LSTM - focuses more on price and technical
        features = [
          { feature: 'Close', importance: 0.18, category: 'price', description: 'Previous day closing price' },
          { feature: 'SMA50', importance: 0.12, category: 'technical', description: '50-day Simple Moving Average' },
          { feature: 'Volume', importance: 0.11, category: 'volume', description: 'Trading volume' },
          { feature: 'RSI', importance: 0.09, category: 'technical', description: 'Relative Strength Index' },
          { feature: 'MACD', importance: 0.08, category: 'technical', description: 'Moving Average Convergence Divergence' },
          { feature: 'S&P 500', importance: 0.07, category: 'macro', description: 'S&P 500 Index performance' },
          { feature: 'Open', importance: 0.06, category: 'price', description: 'Opening price' },
          { feature: 'News Sentiment', importance: 0.06, category: 'sentiment', description: 'Sentiment from news articles' },
          { feature: 'EMA20', importance: 0.05, category: 'technical', description: '20-day Exponential Moving Average' },
          { feature: 'Bollinger Bands', importance: 0.05, category: 'technical', description: 'Bollinger Bands indicator' },
          { feature: 'High', importance: 0.04, category: 'price', description: 'Daily high price' },
          { feature: 'Low', importance: 0.04, category: 'price', description: 'Daily low price' },
          { feature: 'ATR', importance: 0.03, category: 'technical', description: 'Average True Range' },
          { feature: 'VIX', importance: 0.02, category: 'macro', description: 'Volatility Index' },
        ];
        break;
      case 'model2': // Random Forest - more balanced
        features = [
          { feature: 'Close', importance: 0.14, category: 'price', description: 'Previous day closing price' },
          { feature: 'Volume', importance: 0.12, category: 'volume', description: 'Trading volume' },
          { feature: 'S&P 500', importance: 0.10, category: 'macro', description: 'S&P 500 Index performance' },
          { feature: 'RSI', importance: 0.09, category: 'technical', description: 'Relative Strength Index' },
          { feature: 'News Sentiment', importance: 0.08, category: 'sentiment', description: 'Sentiment from news articles' },
          { feature: 'SMA50', importance: 0.07, category: 'technical', description: '50-day Simple Moving Average' },
          { feature: 'P/E Ratio', importance: 0.07, category: 'fundamental', description: 'Price to Earnings Ratio' },
          { feature: 'Sector Performance', importance: 0.06, category: 'macro', description: 'Performance of the sector' },
          { feature: 'Market Cap', importance: 0.06, category: 'fundamental', description: 'Market Capitalization' },
          { feature: 'Social Media Sentiment', importance: 0.05, category: 'sentiment', description: 'Sentiment from social media' },
          { feature: 'Interest Rates', importance: 0.05, category: 'macro', description: 'Federal Reserve interest rates' },
          { feature: 'EPS', importance: 0.04, category: 'fundamental', description: 'Earnings Per Share' },
          { feature: 'Analyst Ratings', importance: 0.04, category: 'sentiment', description: 'Wall Street analyst ratings' },
          { feature: 'Revenue Growth', importance: 0.03, category: 'fundamental', description: 'Year-over-year revenue growth' },
        ];
        break;
      case 'model3': // XGBoost - focuses on fundamentals and sentiment
        features = [
          { feature: 'News Sentiment', importance: 0.15, category: 'sentiment', description: 'Sentiment from news articles' },
          { feature: 'Close', importance: 0.12, category: 'price', description: 'Previous day closing price' },
          { feature: 'Social Media Sentiment', importance: 0.10, category: 'sentiment', description: 'Sentiment from social media' },
          { feature: 'P/E Ratio', importance: 0.09, category: 'fundamental', description: 'Price to Earnings Ratio' },
          { feature: 'Volume', importance: 0.08, category: 'volume', description: 'Trading volume' },
          { feature: 'S&P 500', importance: 0.07, category: 'macro', description: 'S&P 500 Index performance' },
          { feature: 'Market Cap', importance: 0.07, category: 'fundamental', description: 'Market Capitalization' },
          { feature: 'RSI', importance: 0.06, category: 'technical', description: 'Relative Strength Index' },
          { feature: 'Analyst Ratings', importance: 0.06, category: 'sentiment', description: 'Wall Street analyst ratings' },
          { feature: 'Revenue Growth', importance: 0.05, category: 'fundamental', description: 'Year-over-year revenue growth' },
          { feature: 'EPS', importance: 0.05, category: 'fundamental', description: 'Earnings Per Share' },
          { feature: 'SMA50', importance: 0.04, category: 'technical', description: '50-day Simple Moving Average' },
          { feature: 'Profit Margin', importance: 0.03, category: 'fundamental', description: 'Net profit margin' },
          { feature: 'VIX', importance: 0.03, category: 'macro', description: 'Volatility Index' },
        ];
        break;
    }
    
    setFeatureImportanceData(features);
    
    // Generate model performance data
    const models = [
      {
        id: 'model1',
        name: 'LSTM Model',
        metrics: [
          { name: 'RMSE', value: 2.34, benchmark: 3.1, category: 'error', description: 'Root Mean Squared Error', ideal: 'low' },
          { name: 'MAE', value: 1.87, benchmark: 2.5, category: 'error', description: 'Mean Absolute Error', ideal: 'low' },
          { name: 'R²', value: 0.86, benchmark: 0.75, category: 'fit', description: 'Coefficient of Determination', ideal: 'high' },
          { name: 'MAPE', value: 1.2, benchmark: 1.8, category: 'error', description: 'Mean Absolute Percentage Error', ideal: 'low' },
          { name: 'Directional Accuracy', value: 0.78, benchmark: 0.65, category: 'accuracy', description: 'Accuracy of price direction prediction', ideal: 'high' },
          { name: 'Sharpe Ratio', value: 1.9, benchmark: 1.5, category: 'accuracy', description: 'Risk-adjusted return metric', ideal: 'high' },
          { name: 'Training Time', value: 245, benchmark: 180, category: 'speed', description: 'Model training time in seconds', ideal: 'low' },
          { name: 'Inference Time', value: 0.05, benchmark: 0.02, category: 'speed', description: 'Prediction time in seconds', ideal: 'low' },
        ],
        confusionMatrix: {
          truePositive: 120,
          trueNegative: 105,
          falsePositive: 15,
          falseNegative: 20,
        },
        rocCurve: Array.from({ length: 10 }, (_, i) => ({
          falsePositiveRate: i * 0.1,
          truePositiveRate: Math.min(1, i * 0.1 * 1.5 + Math.random() * 0.1),
          threshold: 1 - i * 0.1,
        })),
        precisionRecallCurve: Array.from({ length: 10 }, (_, i) => ({
          recall: i * 0.1,
          precision: 1 - (i * 0.1 * 0.5) + Math.random() * 0.05,
          threshold: 1 - i * 0.1,
        })),
        color: theme.palette.primary.main,
      },
      {
        id: 'model2',
        name: 'Random Forest',
        metrics: [
          { name: 'RMSE', value: 2.78, benchmark: 3.1, category: 'error', description: 'Root Mean Squared Error', ideal: 'low' },
          { name: 'MAE', value: 2.15, benchmark: 2.5, category: 'error', description: 'Mean Absolute Error', ideal: 'low' },
          { name: 'R²', value: 0.79, benchmark: 0.75, category: 'fit', description: 'Coefficient of Determination', ideal: 'high' },
          { name: 'MAPE', value: 1.5, benchmark: 1.8, category: 'error', description: 'Mean Absolute Percentage Error', ideal: 'low' },
          { name: 'Directional Accuracy', value: 0.72, benchmark: 0.65, category: 'accuracy', description: 'Accuracy of price direction prediction', ideal: 'high' },
          { name: 'Sharpe Ratio', value: 1.6, benchmark: 1.5, category: 'accuracy', description: 'Risk-adjusted return metric', ideal: 'high' },
          { name: 'Training Time', value: 45, benchmark: 180, category: 'speed', description: 'Model training time in seconds', ideal: 'low' },
          { name: 'Inference Time', value: 0.01, benchmark: 0.02, category: 'speed', description: 'Prediction time in seconds', ideal: 'low' },
        ],
        confusionMatrix: {
          truePositive: 110,
          trueNegative: 100,
          falsePositive: 20,
          falseNegative: 30,
        },
        rocCurve: Array.from({ length: 10 }, (_, i) => ({
          falsePositiveRate: i * 0.1,
          truePositiveRate: Math.min(1, i * 0.1 * 1.3 + Math.random() * 0.1),
          threshold: 1 - i * 0.1,
        })),
        precisionRecallCurve: Array.from({ length: 10 }, (_, i) => ({
          recall: i * 0.1,
          precision: 1 - (i * 0.1 * 0.6) + Math.random() * 0.05,
          threshold: 1 - i * 0.1,
        })),
        color: theme.palette.secondary.main,
      },
      {
        id: 'model3',
        name: 'XGBoost',
        metrics: [
          { name: 'RMSE', value: 2.45, benchmark: 3.1, category: 'error', description: 'Root Mean Squared Error', ideal: 'low' },
          { name: 'MAE', value: 1.95, benchmark: 2.5, category: 'error', description: 'Mean Absolute Error', ideal: 'low' },
          { name: 'R²', value: 0.83, benchmark: 0.75, category: 'fit', description: 'Coefficient of Determination', ideal: 'high' },
          { name: 'MAPE', value: 1.3, benchmark: 1.8, category: 'error', description: 'Mean Absolute Percentage Error', ideal: 'low' },
          { name: 'Directional Accuracy', value: 0.75, benchmark: 0.65, category: 'accuracy', description: 'Accuracy of price direction prediction', ideal: 'high' },
          { name: 'Sharpe Ratio', value: 1.8, benchmark: 1.5, category: 'accuracy', description: 'Risk-adjusted return metric', ideal: 'high' },
          { name: 'Training Time', value: 75, benchmark: 180, category: 'speed', description: 'Model training time in seconds', ideal: 'low' },
          { name: 'Inference Time', value: 0.02, benchmark: 0.02, category: 'speed', description: 'Prediction time in seconds', ideal: 'low' },
        ],
        confusionMatrix: {
          truePositive: 115,
          trueNegative: 110,
          falsePositive: 10,
          falseNegative: 25,
        },
        rocCurve: Array.from({ length: 10 }, (_, i) => ({
          falsePositiveRate: i * 0.1,
          truePositiveRate: Math.min(1, i * 0.1 * 1.4 + Math.random() * 0.1),
          threshold: 1 - i * 0.1,
        })),
        precisionRecallCurve: Array.from({ length: 10 }, (_, i) => ({
          recall: i * 0.1,
          precision: 1 - (i * 0.1 * 0.55) + Math.random() * 0.05,
          threshold: 1 - i * 0.1,
        })),
        color: theme.palette.success.main,
      }
    ];
    
    setModelPerformanceData(models);
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ML Model Visualization
        </Typography>
        
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="symbol-select-label">Symbol</InputLabel>
            <Select
              labelId="symbol-select-label"
              value={selectedSymbol}
              label="Symbol"
              onChange={handleSymbolChange}
            >
              <MenuItem value="AAPL">AAPL</MenuItem>
              <MenuItem value="MSFT">MSFT</MenuItem>
              <MenuItem value="GOOGL">GOOGL</MenuItem>
              <MenuItem value="AMZN">AMZN</MenuItem>
              <MenuItem value="TSLA">TSLA</MenuItem>
            </Select>
          </FormControl>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Model:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="LSTM"
                color={selectedModel === 'model1' ? 'primary' : 'default'}
                variant={selectedModel === 'model1' ? 'filled' : 'outlined'}
                onClick={() => handleModelSelect('model1')}
              />
              <Chip
                label="Random Forest"
                color={selectedModel === 'model2' ? 'primary' : 'default'}
                variant={selectedModel === 'model2' ? 'filled' : 'outlined'}
                onClick={() => handleModelSelect('model2')}
              />
              <Chip
                label="XGBoost"
                color={selectedModel === 'model3' ? 'primary' : 'default'}
                variant={selectedModel === 'model3' ? 'filled' : 'outlined'}
                onClick={() => handleModelSelect('model3')}
              />
            </Box>
          </Box>
        </Box>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="ml visualization tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Price Predictions" />
            <Tab label="Feature Importance" />
            <Tab label="Model Performance" />
          </Tabs>
        </Paper>
        
        <TabPanel value={tabValue} index={0}>
          <ChartContainer
            title={`${selectedSymbol} Price Prediction`}
            subtitle={`Using ${selectedModel === 'model1' ? 'LSTM' : selectedModel === 'model2' ? 'Random Forest' : 'XGBoost'} model`}
            height={500}
          >
            {predictionData.length > 0 && (
              <PredictionChart
                series={predictionData}
                height={450}
                showConfidenceInterval={true}
                showCurrentDate={true}
                timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
                onTimeRangeChange={handleTimeRangeChange}
                valueFormatter={(value) => `$${value.toFixed(2)}`}
              />
            )}
          </ChartContainer>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ChartContainer
            title={`Feature Importance for ${selectedSymbol}`}
            subtitle={`Using ${selectedModel === 'model1' ? 'LSTM' : selectedModel === 'model2' ? 'Random Forest' : 'XGBoost'} model`}
            height={600}
          >
            {featureImportanceData.length > 0 && (
              <FeatureImportanceBarChart
                data={featureImportanceData}
                height={550}
                maxFeatures={15}
                sortBy="importance"
                orientation="horizontal"
                colorBy="category"
                valueFormatter={(value) => value.toFixed(4)}
              />
            )}
          </ChartContainer>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ChartContainer
            title="Model Performance Metrics"
            subtitle={`Comparison of prediction models for ${selectedSymbol}`}
            height={700}
          >
            {modelPerformanceData.length > 0 && (
              <ModelPerformanceMetricsChart
                data={modelPerformanceData}
                height={650}
                showBenchmark={true}
                selectedModelId={selectedModel}
                onModelSelect={handleModelSelect}
              />
            )}
          </ChartContainer>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default MLVisualizationPage;