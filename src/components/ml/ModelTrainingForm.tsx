import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Switch,
  FormControlLabel,
  Slider,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  Settings as SettingsIcon,
  Dataset as DatasetIcon,
  Tune as TuneIcon,
  Assessment as AssessmentIcon,
  Check as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// Import chart components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

// Import types
import { 
  MLModel, 
  ModelType, 
  ModelStatus, 
  ModelTrainingConfig,
  TrainingHistoryPoint
} from '../../types/ml';

// Import service (we'll create this later)
import { MLService } from '../../services';

interface ModelTrainingFormProps {
  selectedModel?: MLModel;
  onTrainingStart?: (model: MLModel, config: ModelTrainingConfig) => void;
  onTrainingComplete?: (model: MLModel) => void;
}

const ModelTrainingForm: React.FC<ModelTrainingFormProps> = ({
  selectedModel,
  onTrainingStart,
  onTrainingComplete
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Model selection state
  const [models, setModels] = useState<MLModel[]>([]);
  const [currentModel, setCurrentModel] = useState<MLModel | null>(null);
  
  // Dataset selection state
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [datasetPreview, setDatasetPreview] = useState<any>(null);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  
  // Training configuration state
  const [trainingConfig, setTrainingConfig] = useState<ModelTrainingConfig>({
    hyperparameters: {},
    datasetId: '',
    validationSplit: 0.2,
    epochs: 50,
    batchSize: 32,
    earlyStoppingPatience: 5,
    learningRate: 0.001
  });
  
  // Training progress state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryPoint[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  
  // Service instance
  const mlService = new MLService();
  
  // Effect to fetch models on component mount
  useEffect(() => {
    if (!selectedModel) {
      fetchModels();
    } else {
      setCurrentModel(selectedModel);
    }
    fetchDatasets();
  }, [selectedModel]);
  
  // Effect to update when current model changes
  useEffect(() => {
    if (currentModel) {
      // Initialize hyperparameters based on model type
      initializeHyperparameters(currentModel.type);
    }
  }, [currentModel]);
  
  // Fetch models from the API
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout
      setTimeout(() => {
        const mockModels: MLModel[] = [
          {
            id: '1',
            name: 'Stock Price Predictor',
            description: 'Predicts stock prices based on historical data',
            type: ModelType.REGRESSION,
            status: ModelStatus.DRAFT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isProduction: false
          },
          {
            id: '2',
            name: 'Market Trend Classifier',
            description: 'Classifies market trends as bullish, bearish, or neutral',
            type: ModelType.CLASSIFICATION,
            status: ModelStatus.DRAFT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isProduction: false
          },
          {
            id: '3',
            name: 'Volatility Forecaster',
            description: 'Forecasts market volatility for risk management',
            type: ModelType.TIME_SERIES,
            status: ModelStatus.DRAFT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isProduction: false
          }
        ];
        
        setModels(mockModels);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch datasets from the API
  const fetchDatasets = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout
      setTimeout(() => {
        const mockDatasets = [
          { id: 'ds1', name: 'S&P 500 Historical Data', rows: 5000, columns: 12, lastUpdated: new Date().toISOString() },
          { id: 'ds2', name: 'NASDAQ Tech Stocks', rows: 3500, columns: 15, lastUpdated: new Date().toISOString() },
          { id: 'ds3', name: 'Forex Exchange Rates', rows: 8000, columns: 10, lastUpdated: new Date().toISOString() },
          { id: 'ds4', name: 'Cryptocurrency Market Data', rows: 4200, columns: 18, lastUpdated: new Date().toISOString() }
        ];
        
        setDatasets(mockDatasets);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setLoading(false);
    }
  };
  
  // Initialize hyperparameters based on model type
  const initializeHyperparameters = (modelType: ModelType) => {
    let hyperparameters: Record<string, any> = {};
    
    switch (modelType) {
      case ModelType.REGRESSION:
        hyperparameters = {
          hiddenLayers: 2,
          neuronsPerLayer: 64,
          activation: 'relu',
          dropout: 0.2,
          l2Regularization: 0.001
        };
        break;
      case ModelType.CLASSIFICATION:
        hyperparameters = {
          hiddenLayers: 3,
          neuronsPerLayer: 128,
          activation: 'relu',
          dropout: 0.3,
          l2Regularization: 0.001
        };
        break;
      case ModelType.TIME_SERIES:
        hyperparameters = {
          lstmUnits: 64,
          timeSteps: 10,
          dropout: 0.2,
          recurrentDropout: 0.2,
          bidirectional: true
        };
        break;
      case ModelType.CLUSTERING:
        hyperparameters = {
          clusters: 5,
          algorithm: 'kmeans',
          maxIterations: 300,
          tolerance: 0.0001
        };
        break;
      default:
        hyperparameters = {};
    }
    
    setTrainingConfig(prev => ({
      ...prev,
      hyperparameters
    }));
  };
  
  // Handle model selection
  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const modelId = event.target.value as string;
    const model = models.find(m => m.id === modelId) || null;
    setCurrentModel(model);
  };
  
  // Handle dataset selection
  const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const datasetId = event.target.value as string;
    setSelectedDataset(datasetId);
    setTrainingConfig(prev => ({
      ...prev,
      datasetId
    }));
    
    // Fetch dataset preview
    fetchDatasetPreview(datasetId);
  };
  
  // Fetch dataset preview
  const fetchDatasetPreview = async (datasetId: string) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout
      setTimeout(() => {
        const mockPreview = {
          columns: ['date', 'open', 'high', 'low', 'close', 'volume', 'adj_close', 'returns', 'volatility', 'ma_20', 'rsi_14', 'target'],
          data: [
            { date: '2023-01-01', open: 150.25, high: 152.75, low: 149.50, close: 151.20, volume: 1500000, adj_close: 151.20, returns: 0.015, volatility: 0.12, ma_20: 148.50, rsi_14: 65.2, target: 1 },
            { date: '2023-01-02', open: 151.50, high: 153.25, low: 150.75, close: 152.80, volume: 1620000, adj_close: 152.80, returns: 0.011, volatility: 0.11, ma_20: 149.10, rsi_14: 67.5, target: 1 },
            { date: '2023-01-03', open: 152.90, high: 155.00, low: 152.00, close: 154.50, volume: 1750000, adj_close: 154.50, returns: 0.011, volatility: 0.10, ma_20: 149.80, rsi_14: 70.1, target: 1 },
            { date: '2023-01-04', open: 154.75, high: 156.25, low: 153.50, close: 155.75, volume: 1830000, adj_close: 155.75, returns: 0.008, volatility: 0.09, ma_20: 150.40, rsi_14: 72.3, target: 1 },
            { date: '2023-01-05', open: 155.50, high: 157.00, low: 154.25, close: 156.50, volume: 1680000, adj_close: 156.50, returns: 0.005, volatility: 0.10, ma_20: 151.10, rsi_14: 73.8, target: 1 }
          ]
        };
        
        setDatasetPreview(mockPreview);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching dataset preview:', err);
      setLoading(false);
    }
  };
  
  // Handle target column selection
  const handleTargetColumnChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const column = event.target.value as string;
    setTargetColumn(column);
  };
  
  // Handle feature column selection
  const handleFeatureColumnToggle = (column: string) => {
    if (featureColumns.includes(column)) {
      setFeatureColumns(featureColumns.filter(c => c !== column));
    } else {
      setFeatureColumns([...featureColumns, column]);
    }
  };
  
  // Handle training config change
  const handleTrainingConfigChange = (field: keyof ModelTrainingConfig, value: any) => {
    setTrainingConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle hyperparameter change
  const handleHyperparameterChange = (param: string, value: any) => {
    setTrainingConfig(prev => ({
      ...prev,
      hyperparameters: {
        ...prev.hyperparameters,
        [param]: value
      }
    }));
  };
  
  // Start training
  const handleStartTraining = async () => {
    if (!currentModel || !selectedDataset) return;
    
    try {
      setLoading(true);
      setError(null);
      setIsTraining(true);
      setTrainingProgress(0);
      setTrainingHistory([]);
      setTrainingLogs([]);
      
      if (onTrainingStart) {
        onTrainingStart(currentModel, trainingConfig);
      }
      
      // In a real implementation, this would call the API
      // For now, we'll simulate training with intervals
      const totalEpochs = trainingConfig.epochs;
      let currentEpoch = 0;
      
      const trainingInterval = setInterval(() => {
        currentEpoch++;
        const progress = (currentEpoch / totalEpochs) * 100;
        setTrainingProgress(progress);
        
        // Generate mock training history
        const newHistoryPoint: TrainingHistoryPoint = {
          epoch: currentEpoch,
          accuracy: Math.min(0.5 + (currentEpoch / totalEpochs) * 0.4 + Math.random() * 0.05, 0.99),
          loss: Math.max(0.5 - (currentEpoch / totalEpochs) * 0.4 + Math.random() * 0.05, 0.01),
          val_accuracy: Math.min(0.45 + (currentEpoch / totalEpochs) * 0.35 + Math.random() * 0.07, 0.95),
          val_loss: Math.max(0.55 - (currentEpoch / totalEpochs) * 0.35 + Math.random() * 0.07, 0.05)
        };
        
        setTrainingHistory(prev => [...prev, newHistoryPoint]);
        
        // Generate mock training log
        const logMessage = `Epoch ${currentEpoch}/${totalEpochs} - loss: ${newHistoryPoint.loss.toFixed(4)} - accuracy: ${newHistoryPoint.accuracy.toFixed(4)} - val_loss: ${newHistoryPoint.val_loss.toFixed(4)} - val_accuracy: ${newHistoryPoint.val_accuracy.toFixed(4)}`;
        setTrainingLogs(prev => [...prev, logMessage]);
        
        // Check if training is complete
        if (currentEpoch >= totalEpochs) {
          clearInterval(trainingInterval);
          
          // Update model status
          const updatedModel: MLModel = {
            ...currentModel,
            status: ModelStatus.READY,
            updatedAt: new Date().toISOString(),
            metrics: {
              accuracy: newHistoryPoint.val_accuracy,
              f1Score: 0.92,
              precision: 0.94,
              recall: 0.90,
              lastUpdated: new Date().toISOString()
            },
            trainingHistory: trainingHistory
          };
          
          setCurrentModel(updatedModel);
          setIsTraining(false);
          setSuccess('Training completed successfully!');
          
          if (onTrainingComplete) {
            onTrainingComplete(updatedModel);
          }
        }
      }, 500);
      
      setLoading(false);
    } catch (err) {
      console.error('Error starting training:', err);
      setError('Failed to start training. Please try again later.');
      setLoading(false);
      setIsTraining(false);
    }
  };
  
  // Cancel training
  const handleCancelTraining = () => {
    setIsTraining(false);
    setTrainingProgress(0);
    setError('Training cancelled by user.');
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Render model selection step
  const renderModelSelection = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Select a model to train
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="model-select-label">Select Model</InputLabel>
          <Select
            labelId="model-select-label"
            id="model-select"
            value={currentModel?.id || ''}
            label="Select Model"
            onChange={handleModelChange as any}
            disabled={!!selectedModel}
          >
            {models.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.name} ({model.type})
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {selectedModel ? 'Model pre-selected' : 'Select a model to train'}
          </FormHelperText>
        </FormControl>
        
        {currentModel && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                {currentModel.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentModel.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip 
                  label={currentModel.type} 
                  size="small" 
                  sx={{ mr: 1, fontSize: '0.7rem' }} 
                />
                <Chip 
                  label={currentModel.status} 
                  size="small" 
                  color={
                    currentModel.status === ModelStatus.DEPLOYED ? 'success' :
                    currentModel.status === ModelStatus.READY ? 'primary' :
                    currentModel.status === ModelStatus.TRAINING ? 'warning' :
                    currentModel.status === ModelStatus.FAILED ? 'error' :
                    'default'
                  }
                  sx={{ fontSize: '0.7rem' }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  Last updated: {formatDate(currentModel.updatedAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!currentModel}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render dataset selection step
  const renderDatasetSelection = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Select a dataset for training
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="dataset-select-label">Select Dataset</InputLabel>
          <Select
            labelId="dataset-select-label"
            id="dataset-select"
            value={selectedDataset}
            label="Select Dataset"
            onChange={handleDatasetChange as any}
          >
            {datasets.map((dataset) => (
              <MenuItem key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rows.toLocaleString()} rows)
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Select a dataset that matches your model type
          </FormHelperText>
        </FormControl>
        
        {datasetPreview && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Dataset Preview
            </Typography>
            <Paper variant="outlined" sx={{ overflow: 'auto' }}>
              <Box sx={{ minWidth: 650, maxHeight: 300, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {datasetPreview.columns.map((column: string) => (
                        <th key={column} style={{ 
                          padding: '8px', 
                          borderBottom: '1px solid rgba(224, 224, 224, 1)',
                          position: 'sticky',
                          top: 0,
                          backgroundColor: theme.palette.background.paper,
                          zIndex: 1
                        }}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetPreview.data.map((row: any, index: number) => (
                      <tr key={index}>
                        {datasetPreview.columns.map((column: string) => (
                          <td key={column} style={{ 
                            padding: '8px', 
                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                            textAlign: typeof row[column] === 'number' ? 'right' : 'left'
                          }}>
                            {row[column]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
          </Box>
        )}
        
        {datasetPreview && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Feature Selection
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="target-column-label">Target Column</InputLabel>
                  <Select
                    labelId="target-column-label"
                    id="target-column"
                    value={targetColumn}
                    label="Target Column"
                    onChange={handleTargetColumnChange as any}
                  >
                    {datasetPreview.columns.map((column: string) => (
                      <MenuItem key={column} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select the column you want to predict
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Feature Columns
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {datasetPreview.columns
                    .filter((column: string) => column !== targetColumn)
                    .map((column: string) => (
                      <Chip
                        key={column}
                        label={column}
                        onClick={() => handleFeatureColumnToggle(column)}
                        color={featureColumns.includes(column) ? 'primary' : 'default'}
                        variant={featureColumns.includes(column) ? 'filled' : 'outlined'}
                      />
                    ))}
                </Box>
                <FormHelperText>
                  Select the columns to use as features
                </FormHelperText>
              </Grid>
            </Grid>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!selectedDataset || !targetColumn || featureColumns.length === 0}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render training configuration step
  const renderTrainingConfiguration = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Configure Training Parameters
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardHeader title="Basic Parameters" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Epochs"
                  type="number"
                  value={trainingConfig.epochs}
                  onChange={(e) => handleTrainingConfigChange('epochs', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 1000 } }}
                  helperText="Number of complete passes through the training dataset"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Batch Size"
                  type="number"
                  value={trainingConfig.batchSize}
                  onChange={(e) => handleTrainingConfigChange('batchSize', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 1024 } }}
                  helperText="Number of samples processed before model update"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Validation Split: {trainingConfig.validationSplit}
                </Typography>
                <Slider
                  value={trainingConfig.validationSplit}
                  onChange={(e, value) => handleTrainingConfigChange('validationSplit', value)}
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0.1, label: '10%' },
                    { value: 0.2, label: '20%' },
                    { value: 0.3, label: '30%' },
                    { value: 0.4, label: '40%' },
                    { value: 0.5, label: '50%' }
                  ]}
                />
                <FormHelperText>
                  Percentage of data to use for validation
                </FormHelperText>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Learning Rate"
                  type="number"
                  value={trainingConfig.learningRate}
                  onChange={(e) => handleTrainingConfigChange('learningRate', parseFloat(e.target.value))}
                  InputProps={{ inputProps: { min: 0.0001, max: 0.1, step: 0.0001 } }}
                  helperText="Step size for gradient descent optimization"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Early Stopping Patience"
                  type="number"
                  value={trainingConfig.earlyStoppingPatience}
                  onChange={(e) => handleTrainingConfigChange('earlyStoppingPatience', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 0, max: 50 } }}
                  helperText="Number of epochs with no improvement before stopping"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardHeader title="Model Hyperparameters" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              {currentModel?.type === ModelType.REGRESSION || currentModel?.type === ModelType.CLASSIFICATION ? (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Hidden Layers"
                      type="number"
                      value={trainingConfig.hyperparameters.hiddenLayers}
                      onChange={(e) => handleHyperparameterChange('hiddenLayers', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                      helperText="Number of hidden layers in the neural network"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Neurons Per Layer"
                      type="number"
                      value={trainingConfig.hyperparameters.neuronsPerLayer}
                      onChange={(e) => handleHyperparameterChange('neuronsPerLayer', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 8, max: 512 } }}
                      helperText="Number of neurons in each hidden layer"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="activation-label">Activation Function</InputLabel>
                      <Select
                        labelId="activation-label"
                        id="activation"
                        value={trainingConfig.hyperparameters.activation}
                        label="Activation Function"
                        onChange={(e) => handleHyperparameterChange('activation', e.target.value)}
                      >
                        <MenuItem value="relu">ReLU</MenuItem>
                        <MenuItem value="sigmoid">Sigmoid</MenuItem>
                        <MenuItem value="tanh">Tanh</MenuItem>
                        <MenuItem value="leaky_relu">Leaky ReLU</MenuItem>
                      </Select>
                      <FormHelperText>
                        Activation function for hidden layers
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      Dropout Rate: {trainingConfig.hyperparameters.dropout}
                    </Typography>
                    <Slider
                      value={trainingConfig.hyperparameters.dropout}
                      onChange={(e, value) => handleHyperparameterChange('dropout', value)}
                      min={0}
                      max={0.5}
                      step={0.05}
                      valueLabelDisplay="auto"
                    />
                    <FormHelperText>
                      Dropout rate for regularization
                    </FormHelperText>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      L2 Regularization: {trainingConfig.hyperparameters.l2Regularization}
                    </Typography>
                    <Slider
                      value={trainingConfig.hyperparameters.l2Regularization}
                      onChange={(e, value) => handleHyperparameterChange('l2Regularization', value)}
                      min={0}
                      max={0.01}
                      step={0.001}
                      valueLabelDisplay="auto"
                    />
                    <FormHelperText>
                      L2 regularization strength
                    </FormHelperText>
                  </Grid>
                </>
              ) : currentModel?.type === ModelType.TIME_SERIES ? (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="LSTM Units"
                      type="number"
                      value={trainingConfig.hyperparameters.lstmUnits}
                      onChange={(e) => handleHyperparameterChange('lstmUnits', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 8, max: 512 } }}
                      helperText="Number of LSTM units in each layer"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Time Steps"
                      type="number"
                      value={trainingConfig.hyperparameters.timeSteps}
                      onChange={(e) => handleHyperparameterChange('timeSteps', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 1, max: 100 } }}
                      helperText="Number of time steps to look back"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      Dropout Rate: {trainingConfig.hyperparameters.dropout}
                    </Typography>
                    <Slider
                      value={trainingConfig.hyperparameters.dropout}
                      onChange={(e, value) => handleHyperparameterChange('dropout', value)}
                      min={0}
                      max={0.5}
                      step={0.05}
                      valueLabelDisplay="auto"
                    />
                    <FormHelperText>
                      Dropout rate for LSTM layers
                    </FormHelperText>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      Recurrent Dropout: {trainingConfig.hyperparameters.recurrentDropout}
                    </Typography>
                    <Slider
                      value={trainingConfig.hyperparameters.recurrentDropout}
                      onChange={(e, value) => handleHyperparameterChange('recurrentDropout', value)}
                      min={0}
                      max={0.5}
                      step={0.05}
                      valueLabelDisplay="auto"
                    />
                    <FormHelperText>
                      Dropout rate for recurrent connections
                    </FormHelperText>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={trainingConfig.hyperparameters.bidirectional}
                          onChange={(e) => handleHyperparameterChange('bidirectional', e.target.checked)}
                        />
                      }
                      label="Bidirectional LSTM"
                    />
                    <FormHelperText>
                      Use bidirectional LSTM layers
                    </FormHelperText>
                  </Grid>
                </>
              ) : currentModel?.type === ModelType.CLUSTERING ? (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Number of Clusters"
                      type="number"
                      value={trainingConfig.hyperparameters.clusters}
                      onChange={(e) => handleHyperparameterChange('clusters', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 2, max: 20 } }}
                      helperText="Number of clusters to form"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="algorithm-label">Clustering Algorithm</InputLabel>
                      <Select
                        labelId="algorithm-label"
                        id="algorithm"
                        value={trainingConfig.hyperparameters.algorithm}
                        label="Clustering Algorithm"
                        onChange={(e) => handleHyperparameterChange('algorithm', e.target.value)}
                      >
                        <MenuItem value="kmeans">K-Means</MenuItem>
                        <MenuItem value="dbscan">DBSCAN</MenuItem>
                        <MenuItem value="hierarchical">Hierarchical</MenuItem>
                        <MenuItem value="gmm">Gaussian Mixture</MenuItem>
                      </Select>
                      <FormHelperText>
                        Algorithm to use for clustering
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Iterations"
                      type="number"
                      value={trainingConfig.hyperparameters.maxIterations}
                      onChange={(e) => handleHyperparameterChange('maxIterations', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 10, max: 1000 } }}
                      helperText="Maximum number of iterations"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tolerance"
                      type="number"
                      value={trainingConfig.hyperparameters.tolerance}
                      onChange={(e) => handleHyperparameterChange('tolerance', parseFloat(e.target.value))}
                      InputProps={{ inputProps: { min: 0.00001, max: 0.01, step: 0.00001 } }}
                      helperText="Tolerance for convergence"
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No hyperparameters available for this model type
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render training execution step
  const renderTrainingExecution = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Training Execution
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardHeader 
            title="Training Summary" 
            subheader={`Model: ${currentModel?.name} | Dataset: ${datasets.find(d => d.id === selectedDataset)?.name}`}
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Model Configuration
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li">
                    <Typography variant="body2">
                      Model Type: {currentModel?.type}
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Target Column: {targetColumn}
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Feature Columns: {featureColumns.length} selected
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Training Configuration
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li">
                    <Typography variant="body2">
                      Epochs: {trainingConfig.epochs}
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Batch Size: {trainingConfig.batchSize}
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Validation Split: {(trainingConfig.validationSplit * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {isTraining ? (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                Training in progress...
              </Typography>
              <Typography variant="body2">
                {Math.round(trainingProgress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={trainingProgress} sx={{ mb: 2 }} />
            
            {trainingHistory.length > 0 && (
              <Box sx={{ height: 300, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Training Progress
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trainingHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      name="Training Accuracy" 
                      stroke={theme.palette.primary.main} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="val_accuracy" 
                      name="Validation Accuracy" 
                      stroke={theme.palette.secondary.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      name="Training Loss" 
                      stroke={theme.palette.error.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="val_loss" 
                      name="Validation Loss" 
                      stroke={theme.palette.warning.main} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
            
            <Box sx={{ height: 200, overflow: 'auto', bgcolor: alpha(theme.palette.common.black, 0.05), p: 1, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Training Logs
              </Typography>
              {trainingLogs.map((log, index) => (
                <Typography key={index} variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {log}
                </Typography>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancelTraining}
              >
                Cancel Training
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            {success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Ready to start training. Click the button below to begin.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartTraining}
                disabled={loading}
              >
                Start Training
              </Button>
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack} disabled={isTraining}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!success}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render training results step
  const renderTrainingResults = () => {
    if (!currentModel || !currentModel.metrics) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No training results available
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Training Results
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardHeader title="Model Performance" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="text.secondary">
                      Accuracy
                    </Typography>
                    <Typography variant="h5">
                      {(currentModel.metrics.accuracy * 100).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {currentModel.metrics.f1Score !== undefined && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">
                        F1 Score
                      </Typography>
                      <Typography variant="h5">
                        {currentModel.metrics.f1Score.toFixed(4)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {currentModel.metrics.precision !== undefined && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">
                        Precision
                      </Typography>
                      <Typography variant="h5">
                        {currentModel.metrics.precision.toFixed(4)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {currentModel.metrics.recall !== undefined && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">
                        Recall
                      </Typography>
                      <Typography variant="h5">
                        {currentModel.metrics.recall.toFixed(4)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
            
            {currentModel.trainingHistory && currentModel.trainingHistory.length > 0 && (
              <Box sx={{ height: 300, mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Training History
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={currentModel.trainingHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      name="Training Accuracy" 
                      stroke={theme.palette.primary.main} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="val_accuracy" 
                      name="Validation Accuracy" 
                      stroke={theme.palette.secondary.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      name="Training Loss" 
                      stroke={theme.palette.error.main} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="val_loss" 
                      name="Validation Loss" 
                      stroke={theme.palette.warning.main} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // In a real implementation, this would navigate to the model details page
              // or trigger some other action
              if (onTrainingComplete && currentModel) {
                onTrainingComplete(currentModel);
              }
            }}
          >
            Finish
          </Button>
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Model Training</Typography>
        <Box>
          <IconButton onClick={() => {
            fetchModels();
            fetchDatasets();
          }} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>
      
      {error && !isTraining && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && !isTraining && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {loading && !isTraining && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Select Model</StepLabel>
            <StepContent>
              {renderModelSelection()}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Select Dataset</StepLabel>
            <StepContent>
              {renderDatasetSelection()}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Configure Training</StepLabel>
            <StepContent>
              {renderTrainingConfiguration()}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Train Model</StepLabel>
            <StepContent>
              {renderTrainingExecution()}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Review Results</StepLabel>
            <StepContent>
              {renderTrainingResults()}
            </StepContent>
          </Step>
        </Stepper>
      </Box>
    </Box>
  );
};

export default ModelTrainingForm;