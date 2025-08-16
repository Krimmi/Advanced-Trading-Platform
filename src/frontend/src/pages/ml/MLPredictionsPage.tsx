import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  ShowChart,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';

// Charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

// Redux
import { RootState } from '../../store';
import { fetchPredictions, fetchModelInfo } from '../../store/slices/mlSlice';

// Types
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `ml-tab-${index}`,
    'aria-controls': `ml-tabpanel-${index}`,
  };
}

const MLPredictionsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { predictions, modelInfo, loading, error } = useSelector((state: RootState) => state.ml);
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [symbol, setSymbol] = useState<string>('');
  const [symbolInput, setSymbolInput] = useState('');
  const [symbolOptions, setSymbolOptions] = useState<string[]>([]);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');
  const [modelType, setModelType] = useState('ensemble');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Fetch predictions when symbol changes
  useEffect(() => {
    if (symbol) {
      dispatch(fetchPredictions({ symbol, timeframe, modelType }) as any);
      dispatch(fetchModelInfo({ modelType }) as any);
    }
  }, [dispatch, symbol, timeframe, modelType]);
  
  // Search for stock symbols
  useEffect(() => {
    const searchSymbols = async () => {
      if (symbolInput.length < 2) {
        setSymbolOptions([]);
        return;
      }
      
      setSymbolLoading(true);
      try {
        // This would be replaced with an actual API call in a real implementation
        // For now, we'll simulate a search result
        const results = await new Promise<string[]>(resolve => {
          setTimeout(() => {
            const mockResults = [
              'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'FB', 'NVDA', 'JPM', 'V', 'JNJ'
            ].filter(symbol => symbol.toLowerCase().includes(symbolInput.toLowerCase()));
            resolve(mockResults);
          }, 500);
        });
        
        setSymbolOptions(results);
      } catch (error) {
        console.error('Error searching symbols:', error);
      } finally {
        setSymbolLoading(false);
      }
    };
    
    searchSymbols();
  }, [symbolInput]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle symbol selection
  const handleSymbolChange = (event: React.SyntheticEvent, value: string | null) => {
    if (value) {
      setSymbol(value);
    }
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeframe(event.target.value as string);
  };
  
  // Handle model type change
  const handleModelTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setModelType(event.target.value as string);
  };
  
  // Toggle favorite
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  // Generate mock prediction data
  const generateMockData = () => {
    const data = [];
    const today = new Date();
    const basePrice = 150 + Math.random() * 50;
    
    // Historical data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual: basePrice + Math.sin(i / 3) * 10 + Math.random() * 5,
        predicted: null
      });
    }
    
    // Future predictions
    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual: null,
        predicted: basePrice + Math.sin((30 + i) / 3) * 10 + Math.random() * 8
      });
    }
    
    return data;
  };
  
  // Mock prediction data
  const predictionData = predictions?.data || generateMockData();
  
  // Mock model metrics
  const modelMetrics = {
    accuracy: 0.87,
    mse: 2.34,
    mae: 1.21,
    r2: 0.83,
    lastUpdated: '2023-08-10T14:30:00Z'
  };
  
  // Show loading state
  if (loading && !symbol) {
    return <LoadingIndicator />;
  }
  
  return (
    <Box>
      <PageHeader 
        title="ML Price Predictions" 
        subtitle="AI-powered stock price forecasting"
        icon={<Timeline />}
      />
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={symbolOptions}
              loading={symbolLoading}
              onInputChange={(e, value) => setSymbolInput(value)}
              onChange={handleSymbolChange}
              value={symbol}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Stock Symbol"
                  placeholder="Enter symbol (e.g., AAPL)"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {symbolLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                onChange={handleTimeframeChange as any}
                label="Timeframe"
              >
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
                <MenuItem value="180d">180 Days</MenuItem>
                <MenuItem value="365d">1 Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Model Type</InputLabel>
              <Select
                value={modelType}
                onChange={handleModelTypeChange as any}
                label="Model Type"
              >
                <MenuItem value="ensemble">Ensemble Model</MenuItem>
                <MenuItem value="lstm">LSTM</MenuItem>
                <MenuItem value="transformer">Transformer</MenuItem>
                <MenuItem value="prophet">Prophet</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={handleToggleFavorite} color={isFavorite ? 'primary' : 'default'}>
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton>
                <RefreshIcon />
              </IconButton>
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {symbol ? (
        <>
          <Paper sx={{ mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="ml prediction tabs"
              >
                <Tab label="Price Prediction" icon={<ShowChart />} iconPosition="start" {...a11yProps(0)} />
                <Tab label="Performance Metrics" icon={<Timeline />} iconPosition="start" {...a11yProps(1)} />
                <Tab label="Model Information" icon={<InfoIcon />} iconPosition="start" {...a11yProps(2)} />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ height: 500 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={predictionData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#8884d8" 
                        name="Actual Price" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#82ca9d" 
                        name="Predicted Price" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Current Price
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                          ${predictionData[predictionData.length - 11]?.actual?.toFixed(2) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Predicted (Tomorrow)
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                          ${predictionData[predictionData.length - 10]?.predicted?.toFixed(2) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Predicted (7 Days)
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                          ${predictionData[predictionData.length - 4]?.predicted?.toFixed(2) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Predicted (30 Days)
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                          ${predictionData[predictionData.length - 1]?.predicted?.toFixed(2) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Model Accuracy" />
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Overall Accuracy
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={modelMetrics.accuracy * 100} 
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {(modelMetrics.accuracy * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          R² Score
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={modelMetrics.r2 * 100} 
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {modelMetrics.r2.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Mean Squared Error (MSE)
                          </Typography>
                          <Typography variant="h6">
                            {modelMetrics.mse.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Mean Absolute Error (MAE)
                          </Typography>
                          <Typography variant="h6">
                            {modelMetrics.mae.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Prediction Error Distribution" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { range: '-10%', count: 5 },
                              { range: '-8%', count: 8 },
                              { range: '-6%', count: 12 },
                              { range: '-4%', count: 18 },
                              { range: '-2%', count: 25 },
                              { range: '0%', count: 30 },
                              { range: '+2%', count: 22 },
                              { range: '+4%', count: 15 },
                              { range: '+6%', count: 10 },
                              { range: '+8%', count: 6 },
                              { range: '+10%', count: 3 },
                            ]}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Historical Prediction Accuracy" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[
                              { month: 'Jan', accuracy: 0.82 },
                              { month: 'Feb', accuracy: 0.84 },
                              { month: 'Mar', accuracy: 0.81 },
                              { month: 'Apr', accuracy: 0.85 },
                              { month: 'May', accuracy: 0.83 },
                              { month: 'Jun', accuracy: 0.86 },
                              { month: 'Jul', accuracy: 0.87 },
                              { month: 'Aug', accuracy: 0.88 },
                            ]}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0.7, 0.9]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                            <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Accuracy']} />
                            <Line type="monotone" dataKey="accuracy" stroke="#82ca9d" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Model Information" />
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {modelType === 'ensemble' ? 'Ensemble Model' : 
                         modelType === 'lstm' ? 'Long Short-Term Memory (LSTM)' :
                         modelType === 'transformer' ? 'Transformer Model' : 'Prophet Model'}
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        {modelType === 'ensemble' ? 
                          'This ensemble model combines multiple machine learning algorithms to improve prediction accuracy and robustness. It leverages LSTM, Transformer, and Prophet models with a weighted voting mechanism.' :
                         modelType === 'lstm' ? 
                          'LSTM is a type of recurrent neural network capable of learning order dependence in sequence prediction problems. It\'s particularly effective for time series forecasting of stock prices.' :
                         modelType === 'transformer' ? 
                          'The Transformer model uses self-attention mechanisms to process sequential data, capturing long-range dependencies in time series data without using recurrence.' :
                          'Prophet is a procedure for forecasting time series data based on an additive model where non-linear trends are fit with yearly, weekly, and daily seasonality.'}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Last Trained
                          </Typography>
                          <Typography variant="body1">
                            {new Date(modelMetrics.lastUpdated).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Training Data Points
                          </Typography>
                          <Typography variant="body1">
                            24,560
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Features Used
                          </Typography>
                          <Typography variant="body1">
                            42
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Model Version
                          </Typography>
                          <Typography variant="body1">
                            v3.2.1
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Features Used in Model
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Chip label="Price History" size="small" />
                        <Chip label="Volume" size="small" />
                        <Chip label="Moving Averages" size="small" />
                        <Chip label="RSI" size="small" />
                        <Chip label="MACD" size="small" />
                        <Chip label="Bollinger Bands" size="small" />
                        <Chip label="Market Sentiment" size="small" />
                        <Chip label="Sector Performance" size="small" />
                        <Chip label="Economic Indicators" size="small" />
                        <Chip label="News Sentiment" size="small" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Feature Importance" />
                    <CardContent>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={[
                              { feature: 'Price (t-1)', importance: 0.28 },
                              { feature: 'Volume', importance: 0.18 },
                              { feature: 'Moving Avg (50d)', importance: 0.15 },
                              { feature: 'RSI', importance: 0.12 },
                              { feature: 'MACD', importance: 0.09 },
                              { feature: 'Market Sentiment', importance: 0.07 },
                              { feature: 'Sector Performance', importance: 0.06 },
                              { feature: 'News Sentiment', importance: 0.05 },
                            ]}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 100,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 0.3]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                            <YAxis dataKey="feature" type="category" />
                            <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Importance']} />
                            <Bar dataKey="importance" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Prediction Disclaimer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The predictions shown are generated by machine learning models and should be used for informational purposes only. 
              Past performance is not indicative of future results. These predictions are not financial advice, and you should 
              consult with a qualified financial advisor before making investment decisions. The models have inherent limitations 
              and cannot account for all market factors or unforeseen events.
            </Typography>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NoData message="Enter a stock symbol to view ML predictions" />
        </Paper>
      )}
    </Box>
  );
};

export default MLPredictionsPage;