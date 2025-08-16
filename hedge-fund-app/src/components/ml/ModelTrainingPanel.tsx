import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Grid, 
  Divider, 
  CircularProgress, 
  Alert, 
  Stepper, 
  Step, 
  StepLabel,
  useTheme,
  Chip
} from '@mui/material';
import { 
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';

import { 
  MarketPredictionService, 
  ModelTrainingConfig, 
  ModelTrainingResult 
} from '../../services/ml';

interface ModelTrainingPanelProps {
  onTrainingComplete?: (result: ModelTrainingResult) => void;
}

const ModelTrainingPanel: React.FC<ModelTrainingPanelProps> = ({ onTrainingComplete }) => {
  const theme = useTheme();
  const predictionService = MarketPredictionService.getInstance();
  
  // Training configuration state
  const [config, setConfig] = useState<ModelTrainingConfig>({
    symbol: 'AAPL',
    modelType: 'lstm',
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)), // 2 years ago
    endDate: new Date(),
    dataInterval: 'daily',
    lookbackWindow: 30,
    forecastHorizon: 5,
    featureColumns: ['open', 'high', 'low', 'close', 'volume'],
    targetColumns: ['close'],
    trainTestSplit: 0.8,
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001,
    apiKey: 'demo',
    dataSource: 'alphavantage',
    lstmLayers: [128, 64],
    denseLayers: [32],
    dropout: 0.2
  });
  
  // UI state
  const [isTraining, setIsTraining] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResult | null>(null);
  
  // Popular symbols for the dropdown
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'];
  
  // Training steps
  const trainingSteps = [
    'Data Loading',
    'Preprocessing',
    'Model Building',
    'Training',
    'Evaluation',
    'Deployment'
  ];
  
  // Handle input changes
  const handleInputChange = (field: keyof ModelTrainingConfig, value: any) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [field]: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (event: SelectChangeEvent<any>, field: keyof ModelTrainingConfig) => {
    handleInputChange(field, event.target.value);
  };
  
  // Handle date changes
  const handleDateChange = (field: 'startDate' | 'endDate', dateString: string) => {
    handleInputChange(field, new Date(dateString));
  };
  
  // Start training
  const handleStartTraining = async () => {
    setIsTraining(true);
    setActiveStep(0);
    setError(null);
    setTrainingResult(null);
    
    try {
      // Simulate step progress
      const simulateStep = (step: number, delay: number) => {
        return new Promise<void>(resolve => {
          setTimeout(() => {
            setActiveStep(step);
            resolve();
          }, delay);
        });
      };
      
      // Simulate steps 1-3
      await simulateStep(1, 1000);
      await simulateStep(2, 1500);
      await simulateStep(3, 1000);
      
      // Start actual training
      const result = await predictionService.trainModel(config);
      
      // Simulate final steps
      await simulateStep(4, 1000);
      await simulateStep(5, 1000);
      
      // Set result
      setTrainingResult(result);
      
      // Call callback if provided
      if (onTrainingComplete) {
        onTrainingComplete(result);
      }
    } catch (error) {
      console.error('Error training model:', error);
      setError(error instanceof Error ? error.message : 'Failed to train model');
    } finally {
      setIsTraining(false);
    }
  };
  
  // Format training history data for chart
  const formatTrainingHistoryData = () => {
    if (!trainingResult) return [];
    
    return trainingResult.trainingHistory.loss.map((loss, index) => ({
      epoch: index + 1,
      loss,
      valLoss: trainingResult.trainingHistory.valLoss[index]
    }));
  };
  
  // Format prediction comparison data for chart
  const formatPredictionComparisonData = () => {
    if (!trainingResult) return [];
    
    return trainingResult.actualPrices.map((actual, index) => ({
      index,
      actual,
      predicted: trainingResult.predictedPrices[index]
    }));
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      <Typography variant="h5" gutterBottom>
        Model Training
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        {/* Configuration panel */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Training Configuration
          </Typography>
          
          <Grid container spacing={2}>
            {/* Symbol */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="symbol-select-label">Symbol</InputLabel>
                <Select
                  labelId="symbol-select-label"
                  id="symbol-select"
                  value={config.symbol}
                  label="Symbol"
                  onChange={(e) => handleSelectChange(e, 'symbol')}
                  disabled={isTraining}
                >
                  {popularSymbols.map(sym => (
                    <MenuItem key={sym} value={sym}>{sym}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Model Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="model-type-select-label">Model Type</InputLabel>
                <Select
                  labelId="model-type-select-label"
                  id="model-type-select"
                  value={config.modelType}
                  label="Model Type"
                  onChange={(e) => handleSelectChange(e, 'modelType')}
                  disabled={isTraining}
                >
                  <MenuItem value="lstm">LSTM</MenuItem>
                  <MenuItem value="transformer">Transformer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                value={config.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isTraining}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                value={config.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Lookback Window */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lookback Window"
                type="number"
                size="small"
                value={config.lookbackWindow}
                onChange={(e) => handleInputChange('lookbackWindow', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 5, max: 120 } }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Forecast Horizon */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Forecast Horizon"
                type="number"
                size="small"
                value={config.forecastHorizon}
                onChange={(e) => handleInputChange('forecastHorizon', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1, max: 30 } }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Epochs */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Epochs"
                type="number"
                size="small"
                value={config.epochs}
                onChange={(e) => handleInputChange('epochs', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 10, max: 500 } }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Batch Size */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch Size"
                type="number"
                size="small"
                value={config.batchSize}
                onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 8, max: 128 } }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Learning Rate */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Learning Rate"
                type="number"
                size="small"
                value={config.learningRate}
                onChange={(e) => handleInputChange('learningRate', parseFloat(e.target.value))}
                InputProps={{ inputProps: { min: 0.0001, max: 0.01, step: 0.0001 } }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Train/Test Split */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Train/Test Split"
                type="number"
                size="small"
                value={config.trainTestSplit}
                onChange={(e) => handleInputChange('trainTestSplit', parseFloat(e.target.value))}
                InputProps={{ inputProps: { min: 0.5, max: 0.9, step: 0.05 } }}
                disabled={isTraining}
              />
            </Grid>
            
            {/* Dropout (for LSTM) */}
            {config.modelType === 'lstm' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dropout"
                  type="number"
                  size="small"
                  value={config.dropout}
                  onChange={(e) => handleInputChange('dropout', parseFloat(e.target.value))}
                  InputProps={{ inputProps: { min: 0, max: 0.5, step: 0.05 } }}
                  disabled={isTraining}
                />
              </Grid>
            )}
            
            {/* Data Interval */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="interval-select-label">Data Interval</InputLabel>
                <Select
                  labelId="interval-select-label"
                  id="interval-select"
                  value={config.dataInterval}
                  label="Data Interval"
                  onChange={(e) => handleSelectChange(e, 'dataInterval')}
                  disabled={isTraining}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              disabled={isTraining}
              onClick={() => setConfig({
                ...config,
                lookbackWindow: 30,
                forecastHorizon: 5,
                epochs: 50,
                batchSize: 32,
                learningRate: 0.001,
                trainTestSplit: 0.8
              })}
            >
              Reset Parameters
            </Button>
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={isTraining ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              disabled={isTraining}
              onClick={handleStartTraining}
            >
              {isTraining ? 'Training...' : 'Start Training'}
            </Button>
          </Box>
          
          {/* Training Progress */}
          {isTraining && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Training Progress
              </Typography>
              <Stepper activeStep={activeStep} alternativeLabel>
                {trainingSteps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Grid>
        
        {/* Results panel */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Training Results
          </Typography>
          
          {trainingResult ? (
            <>
              {/* Metrics */}
              <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      MAE
                    </Typography>
                    <Typography variant="h6">
                      {trainingResult.metrics.mae.toFixed(4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      RMSE
                    </Typography>
                    <Typography variant="h6">
                      {trainingResult.metrics.rmse.toFixed(4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      MAPE
                    </Typography>
                    <Typography variant="h6">
                      {trainingResult.metrics.mape.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      R²
                    </Typography>
                    <Typography variant="h6">
                      {trainingResult.metrics.rSquared.toFixed(4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Direction Accuracy
                    </Typography>
                    <Typography variant="h6">
                      {trainingResult.metrics.directionAccuracy.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="h6">
                      {trainingResult.metrics.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Model Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Model Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`Symbol: ${trainingResult.symbol}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Type: ${trainingResult.modelType.toUpperCase()}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`ID: ${trainingResult.modelId.substring(0, 8)}...`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<CheckIcon />}
                    label="Deployed" 
                    size="small" 
                    color="success" 
                  />
                </Box>
              </Box>
              
              {/* Training History Chart */}
              <Typography variant="subtitle1" gutterBottom>
                Training History
              </Typography>
              <Box sx={{ height: 200, mb: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatTrainingHistoryData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      stroke={theme.palette.primary.main} 
                      name="Training Loss" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valLoss" 
                      stroke={theme.palette.secondary.main} 
                      name="Validation Loss" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              {/* Prediction Comparison Chart */}
              <Typography variant="subtitle1" gutterBottom>
                Prediction Comparison
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="actual" 
                      type="number" 
                      name="Actual" 
                      label={{ value: 'Actual Price', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      dataKey="predicted" 
                      type="number" 
                      name="Predicted" 
                      label={{ value: 'Predicted Price', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <ReferenceLine 
                      segment={[{ x: 0, y: 0 }, { x: 1000000, y: 1000000 }]} 
                      stroke="red" 
                      strokeDasharray="3 3" 
                    />
                    <Scatter 
                      name="Price Comparison" 
                      data={formatPredictionComparisonData()} 
                      fill={theme.palette.primary.main} 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              bgcolor: theme.palette.background.default,
              borderRadius: 1
            }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No training results yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure parameters and start training to see results
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ModelTrainingPanel;