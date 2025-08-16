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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  LinearProgress,
  Alert,
  Autocomplete,
  useTheme,
  alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TuneIcon from '@mui/icons-material/Tune';
import StorageIcon from '@mui/icons-material/Storage';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import TableChartIcon from '@mui/icons-material/TableChart';

// Import chart components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Import services and types
import { MLService } from '../../services';
import { 
  MLModel, 
  ModelType,
  AutoMLConfig,
  AutoMLResult
} from '../../types/ml';

interface AutoMLConfigPanelProps {
  onConfigSave?: (config: AutoMLConfig) => void;
  onAutoMLComplete?: (result: AutoMLResult) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`automl-tabpanel-${index}`}
      aria-labelledby={`automl-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const AutoMLConfigPanel: React.FC<AutoMLConfigPanelProps> = ({
  onConfigSave,
  onAutoMLComplete
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // AutoML configuration
  const [autoMLConfig, setAutoMLConfig] = useState<AutoMLConfig>({
    datasetId: '',
    targetColumn: '',
    optimizationMetric: 'accuracy',
    timeLimit: 60,
    maxModels: 10,
    modelTypes: [ModelType.REGRESSION, ModelType.CLASSIFICATION],
    validationStrategy: 'cross_validation',
    validationParams: {
      folds: 5,
      testSize: 0.2,
      shuffle: true
    }
  });
  
  // Available datasets and columns
  const [availableDatasets, setAvailableDatasets] = useState<{ id: string; name: string; size: number; columns: string[] }[]>([]);
  const [selectedDatasetColumns, setSelectedDatasetColumns] = useState<string[]>([]);
  
  // AutoML results
  const [autoMLResult, setAutoMLResult] = useState<AutoMLResult | null>(null);
  const [autoMLHistory, setAutoMLHistory] = useState<AutoMLResult[]>([]);
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  
  // Service instance
  const mlService = new MLService();
  
  // Effect to fetch datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  // Effect to fetch columns when dataset changes
  useEffect(() => {
    if (autoMLConfig.datasetId) {
      fetchDatasetColumns(autoMLConfig.datasetId);
    }
  }, [autoMLConfig.datasetId]);
  
  // Fetch available datasets
  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, this would be an API call
      // For now, we'll simulate the data
      const datasets = [
        { id: 'dataset-1', name: 'Stock Market Data', size: 1250000, columns: ['date', 'open', 'high', 'low', 'close', 'volume', 'adj_close', 'returns', 'volatility', 'market_cap', 'sector', 'industry'] },
        { id: 'dataset-2', name: 'Customer Transactions', size: 3500000, columns: ['transaction_id', 'customer_id', 'date', 'amount', 'product_id', 'category', 'payment_method', 'store_id', 'online', 'discount_applied', 'tax', 'total'] },
        { id: 'dataset-3', name: 'Portfolio Performance', size: 500000, columns: ['date', 'portfolio_id', 'asset_class', 'instrument_id', 'weight', 'return', 'risk', 'sharpe_ratio', 'sortino_ratio', 'max_drawdown', 'var', 'cvar'] },
        { id: 'dataset-4', name: 'Risk Factors', size: 750000, columns: ['date', 'factor_id', 'factor_name', 'value', 'z_score', 'percentile', 'source', 'region', 'sector', 'confidence', 'lookback_period'] }
      ];
      
      setAvailableDatasets(datasets);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError('Failed to fetch datasets. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch dataset columns
  const fetchDatasetColumns = async (datasetId: string) => {
    try {
      setLoading(true);
      
      // In a real application, this would be an API call
      // For now, we'll use the simulated data
      const dataset = availableDatasets.find(d => d.id === datasetId);
      if (dataset) {
        setSelectedDatasetColumns(dataset.columns);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dataset columns:', err);
      setLoading(false);
    }
  };
  
  // Handle dataset change
  const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const datasetId = event.target.value as string;
    setAutoMLConfig(prev => ({
      ...prev,
      datasetId,
      targetColumn: '' // Reset target column when dataset changes
    }));
  };
  
  // Handle target column change
  const handleTargetColumnChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const targetColumn = event.target.value as string;
    setAutoMLConfig(prev => ({
      ...prev,
      targetColumn
    }));
  };
  
  // Handle optimization metric change
  const handleOptimizationMetricChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const optimizationMetric = event.target.value as string;
    setAutoMLConfig(prev => ({
      ...prev,
      optimizationMetric
    }));
  };
  
  // Handle time limit change
  const handleTimeLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeLimit = parseInt(event.target.value);
    setAutoMLConfig(prev => ({
      ...prev,
      timeLimit: isNaN(timeLimit) ? 0 : timeLimit
    }));
  };
  
  // Handle max models change
  const handleMaxModelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const maxModels = parseInt(event.target.value);
    setAutoMLConfig(prev => ({
      ...prev,
      maxModels: isNaN(maxModels) ? 0 : maxModels
    }));
  };
  
  // Handle model types change
  const handleModelTypesChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const modelTypes = event.target.value as ModelType[];
    setAutoMLConfig(prev => ({
      ...prev,
      modelTypes
    }));
  };
  
  // Handle validation strategy change
  const handleValidationStrategyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const validationStrategy = event.target.value as 'cross_validation' | 'train_test_split' | 'time_series_split';
    
    // Update validation params based on strategy
    let validationParams = {};
    switch (validationStrategy) {
      case 'cross_validation':
        validationParams = {
          folds: 5,
          shuffle: true
        };
        break;
      case 'train_test_split':
        validationParams = {
          testSize: 0.2,
          shuffle: true,
          stratify: false
        };
        break;
      case 'time_series_split':
        validationParams = {
          splits: 3,
          testSize: 0.2,
          gap: 0
        };
        break;
    }
    
    setAutoMLConfig(prev => ({
      ...prev,
      validationStrategy,
      validationParams
    }));
  };
  
  // Handle validation params change
  const handleValidationParamChange = (param: string, value: any) => {
    setAutoMLConfig(prev => ({
      ...prev,
      validationParams: {
        ...prev.validationParams,
        [param]: value
      }
    }));
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Handle reset
  const handleReset = () => {
    setActiveStep(0);
    setAutoMLConfig({
      datasetId: '',
      targetColumn: '',
      optimizationMetric: 'accuracy',
      timeLimit: 60,
      maxModels: 10,
      modelTypes: [ModelType.REGRESSION, ModelType.CLASSIFICATION],
      validationStrategy: 'cross_validation',
      validationParams: {
        folds: 5,
        testSize: 0.2,
        shuffle: true
      }
    });
    setAutoMLResult(null);
  };
  
  // Handle save configuration
  const handleSaveConfig = () => {
    if (onConfigSave) {
      onConfigSave(autoMLConfig);
    }
  };
  
  // Handle run AutoML
  const handleRunAutoML = async () => {
    try {
      setLoading(true);
      setError(null);
      setConfirmDialogOpen(false);
      
      // In a real application, this would be an API call
      // For now, we'll simulate the process
      
      // Create a new AutoML result
      const newResult: AutoMLResult = {
        id: `automl-${Date.now()}`,
        status: 'running',
        startTime: new Date().toISOString(),
        progress: 0
      };
      
      setAutoMLResult(newResult);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAutoMLResult(prev => {
          if (!prev) return null;
          
          const newProgress = Math.min(prev.progress + Math.random() * 10, 100);
          const isComplete = newProgress >= 100;
          
          if (isComplete) {
            clearInterval(progressInterval);
            
            // Simulate completion with results
            const completedResult: AutoMLResult = {
              ...prev,
              status: 'completed',
              endTime: new Date().toISOString(),
              progress: 100,
              bestModel: {
                modelId: 'model-123',
                modelType: 'GRADIENT_BOOSTING',
                accuracy: 0.89,
                hyperparameters: {
                  n_estimators: 150,
                  max_depth: 5,
                  learning_rate: 0.1,
                  subsample: 0.8
                }
              },
              leaderboard: [
                { modelId: 'model-123', modelType: 'GRADIENT_BOOSTING', accuracy: 0.89, rank: 1 },
                { modelId: 'model-456', modelType: 'RANDOM_FOREST', accuracy: 0.87, rank: 2 },
                { modelId: 'model-789', modelType: 'NEURAL_NETWORK', accuracy: 0.85, rank: 3 },
                { modelId: 'model-101', modelType: 'LOGISTIC_REGRESSION', accuracy: 0.82, rank: 4 },
                { modelId: 'model-102', modelType: 'SVM', accuracy: 0.81, rank: 5 }
              ]
            };
            
            setAutoMLResult(completedResult);
            setAutoMLHistory(prev => [completedResult, ...prev]);
            
            if (onAutoMLComplete) {
              onAutoMLComplete(completedResult);
            }
            
            // Show results dialog
            setResultDialogOpen(true);
          }
          
          return {
            ...prev,
            progress: newProgress,
            status: isComplete ? 'completed' : 'running'
          };
        });
      }, 1000);
      
      setLoading(false);
    } catch (err) {
      console.error('Error running AutoML:', err);
      setError('Failed to run AutoML. Please try again later.');
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Format duration
  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Check if step is complete
  const isStepComplete = (step: number) => {
    switch (step) {
      case 0: // Dataset selection
        return !!autoMLConfig.datasetId && !!autoMLConfig.targetColumn;
      case 1: // Model configuration
        return autoMLConfig.modelTypes.length > 0 && autoMLConfig.optimizationMetric !== '';
      case 2: // Training settings
        return autoMLConfig.timeLimit > 0 && autoMLConfig.maxModels > 0;
      default:
        return false;
    }
  };
  
  // Render dataset selection step
  const renderDatasetSelection = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Select a dataset and target column for your AutoML task
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="dataset-select-label">Dataset</InputLabel>
              <Select
                labelId="dataset-select-label"
                id="dataset-select"
                value={autoMLConfig.datasetId}
                label="Dataset"
                onChange={handleDatasetChange as any}
              >
                {availableDatasets.map((dataset) => (
                  <MenuItem key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {autoMLConfig.datasetId && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dataset Information
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Name</TableCell>
                        <TableCell>
                          {availableDatasets.find(d => d.id === autoMLConfig.datasetId)?.name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Size</TableCell>
                        <TableCell>
                          {(availableDatasets.find(d => d.id === autoMLConfig.datasetId)?.size || 0).toLocaleString()} rows
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Columns</TableCell>
                        <TableCell>
                          {selectedDatasetColumns.length} columns
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {autoMLConfig.datasetId && (
              <FormControl fullWidth>
                <InputLabel id="target-column-label">Target Column</InputLabel>
                <Select
                  labelId="target-column-label"
                  id="target-column"
                  value={autoMLConfig.targetColumn}
                  label="Target Column"
                  onChange={handleTargetColumnChange as any}
                >
                  {selectedDatasetColumns.map((column) => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {autoMLConfig.targetColumn && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  You've selected <strong>{autoMLConfig.targetColumn}</strong> as your target column. 
                  AutoML will try to predict this column based on the other columns in the dataset.
                </Typography>
              </Alert>
            )}
          </Grid>
          
          {autoMLConfig.datasetId && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Dataset Preview
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {selectedDatasetColumns.map((column) => (
                        <TableCell key={column}>
                          {column}
                          {column === autoMLConfig.targetColumn && (
                            <Chip 
                              label="Target" 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1, fontSize: '0.7rem' }} 
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Simulate 5 rows of data */}
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {selectedDatasetColumns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`}>
                            {column.includes('date') ? 
                              new Date(2023, 0, 1 + rowIndex).toLocaleDateString() :
                              column.includes('id') ? 
                                `ID-${10000 + rowIndex}` :
                                column.includes('amount') || column.includes('price') || column.includes('return') ?
                                  (Math.random() * 100).toFixed(2) :
                                  column.includes('volume') ?
                                    Math.floor(Math.random() * 1000000).toLocaleString() :
                                    column.includes('sector') || column.includes('category') ?
                                      ['Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy'][rowIndex % 5] :
                                      (Math.random() * 10).toFixed(4)
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };
  
  // Render model configuration step
  const renderModelConfiguration = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Configure the types of models and optimization metrics
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="model-types-label">Model Types</InputLabel>
              <Select
                labelId="model-types-label"
                id="model-types"
                multiple
                value={autoMLConfig.modelTypes}
                label="Model Types"
                onChange={handleModelTypesChange as any}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as ModelType[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Object.values(ModelType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Model Types
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Model Type</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {autoMLConfig.modelTypes.map((type) => (
                      <TableRow key={type}>
                        <TableCell>{type}</TableCell>
                        <TableCell>
                          {type === ModelType.REGRESSION ? 
                            'Predicts continuous numerical values' :
                            type === ModelType.CLASSIFICATION ?
                              'Predicts categorical classes or labels' :
                              type === ModelType.TIME_SERIES ?
                                'Specialized for time-dependent data' :
                                type === ModelType.CLUSTERING ?
                                  'Groups similar data points together' :
                                  'Learns through interaction with environment'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="optimization-metric-label">Optimization Metric</InputLabel>
              <Select
                labelId="optimization-metric-label"
                id="optimization-metric"
                value={autoMLConfig.optimizationMetric}
                label="Optimization Metric"
                onChange={handleOptimizationMetricChange as any}
              >
                <MenuItem value="accuracy">Accuracy</MenuItem>
                <MenuItem value="precision">Precision</MenuItem>
                <MenuItem value="recall">Recall</MenuItem>
                <MenuItem value="f1">F1 Score</MenuItem>
                <MenuItem value="auc">AUC-ROC</MenuItem>
                <MenuItem value="rmse">RMSE</MenuItem>
                <MenuItem value="mae">MAE</MenuItem>
                <MenuItem value="r2">R² Score</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Validation Strategy
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="validation-strategy-label">Validation Strategy</InputLabel>
                <Select
                  labelId="validation-strategy-label"
                  id="validation-strategy"
                  value={autoMLConfig.validationStrategy}
                  label="Validation Strategy"
                  onChange={handleValidationStrategyChange as any}
                >
                  <MenuItem value="cross_validation">Cross Validation</MenuItem>
                  <MenuItem value="train_test_split">Train-Test Split</MenuItem>
                  <MenuItem value="time_series_split">Time Series Split</MenuItem>
                </Select>
              </FormControl>
              
              {autoMLConfig.validationStrategy === 'cross_validation' && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Number of Folds
                  </Typography>
                  <Slider
                    value={autoMLConfig.validationParams.folds || 5}
                    onChange={(_, value) => handleValidationParamChange('folds', value)}
                    step={1}
                    marks
                    min={2}
                    max={10}
                    valueLabelDisplay="auto"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoMLConfig.validationParams.shuffle || false}
                        onChange={(e) => handleValidationParamChange('shuffle', e.target.checked)}
                      />
                    }
                    label="Shuffle data before splitting"
                  />
                </Box>
              )}
              
              {autoMLConfig.validationStrategy === 'train_test_split' && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Test Size: {(autoMLConfig.validationParams.testSize || 0.2) * 100}%
                  </Typography>
                  <Slider
                    value={autoMLConfig.validationParams.testSize || 0.2}
                    onChange={(_, value) => handleValidationParamChange('testSize', value)}
                    step={0.05}
                    min={0.1}
                    max={0.5}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoMLConfig.validationParams.shuffle || false}
                        onChange={(e) => handleValidationParamChange('shuffle', e.target.checked)}
                      />
                    }
                    label="Shuffle data before splitting"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoMLConfig.validationParams.stratify || false}
                        onChange={(e) => handleValidationParamChange('stratify', e.target.checked)}
                      />
                    }
                    label="Stratify by target (for classification)"
                  />
                </Box>
              )}
              
              {autoMLConfig.validationStrategy === 'time_series_split' && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Number of Splits
                  </Typography>
                  <Slider
                    value={autoMLConfig.validationParams.splits || 3}
                    onChange={(_, value) => handleValidationParamChange('splits', value)}
                    step={1}
                    marks
                    min={2}
                    max={5}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                    Test Size: {(autoMLConfig.validationParams.testSize || 0.2) * 100}%
                  </Typography>
                  <Slider
                    value={autoMLConfig.validationParams.testSize || 0.2}
                    onChange={(_, value) => handleValidationParamChange('testSize', value)}
                    step={0.05}
                    min={0.1}
                    max={0.5}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                    Gap Size (periods)
                  </Typography>
                  <Slider
                    value={autoMLConfig.validationParams.gap || 0}
                    onChange={(_, value) => handleValidationParamChange('gap', value)}
                    step={1}
                    marks
                    min={0}
                    max={10}
                    valueLabelDisplay="auto"
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render training settings step
  const renderTrainingSettings = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Configure training settings and resource allocation
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Time & Resource Constraints
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Time Limit (minutes)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={autoMLConfig.timeLimit}
                    onChange={handleTimeLimitChange}
                    InputProps={{
                      inputProps: { min: 1 },
                      startAdornment: <ScheduleIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum time allowed for the AutoML process to run
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Maximum Models to Train
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={autoMLConfig.maxModels}
                    onChange={handleMaxModelsChange}
                    InputProps={{
                      inputProps: { min: 1 },
                      startAdornment: <TuneIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum number of models to evaluate during the AutoML process
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                      />
                    }
                    label="Enable early stopping"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Stop training if no improvement is seen after a certain number of iterations
                  </Typography>
                </Box>
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                      />
                    }
                    label="Save intermediate results"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Save intermediate models and results during the AutoML process
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Advanced Settings
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                      />
                    }
                    label="Feature engineering"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Automatically create new features from existing ones
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                      />
                    }
                    label="Feature selection"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Automatically select the most important features
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                      />
                    }
                    label="Hyperparameter tuning"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Automatically optimize model hyperparameters
                  </Typography>
                </Box>
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                      />
                    }
                    label="Ensemble top models"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Create an ensemble of the best performing models
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  Estimated completion time: {autoMLConfig.timeLimit} minutes
                </Typography>
                <Typography variant="body2">
                  Estimated resource usage: Medium
                </Typography>
              </Alert>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Configuration Summary
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Dataset</TableCell>
                        <TableCell>
                          {availableDatasets.find(d => d.id === autoMLConfig.datasetId)?.name || 'Not selected'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Target Column</TableCell>
                        <TableCell>{autoMLConfig.targetColumn || 'Not selected'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Model Types</TableCell>
                        <TableCell>
                          {autoMLConfig.modelTypes.join(', ')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Optimization Metric</TableCell>
                        <TableCell>{autoMLConfig.optimizationMetric}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Validation Strategy</TableCell>
                        <TableCell>
                          {autoMLConfig.validationStrategy === 'cross_validation' ? 
                            `${autoMLConfig.validationParams.folds}-fold Cross Validation` :
                            autoMLConfig.validationStrategy === 'train_test_split' ?
                              `Train-Test Split (${(autoMLConfig.validationParams.testSize || 0.2) * 100}% test)` :
                              `Time Series Split (${autoMLConfig.validationParams.splits} splits)`
                          }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Time Limit</TableCell>
                        <TableCell>{autoMLConfig.timeLimit} minutes</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Max Models</TableCell>
                        <TableCell>{autoMLConfig.maxModels} models</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render review and run step
  const renderReviewAndRun = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Review configuration and start AutoML process
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  AutoML Configuration Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StorageIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Dataset</Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Name:</strong> {availableDatasets.find(d => d.id === autoMLConfig.datasetId)?.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Size:</strong> {(availableDatasets.find(d => d.id === autoMLConfig.datasetId)?.size || 0).toLocaleString()} rows
                      </Typography>
                      <Typography variant="body2">
                        <strong>Target:</strong> {autoMLConfig.targetColumn}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AutoGraphIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Model Configuration</Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Types:</strong> {autoMLConfig.modelTypes.join(', ')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Metric:</strong> {autoMLConfig.optimizationMetric}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Validation:</strong> {autoMLConfig.validationStrategy}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SpeedIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Resources</Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Time Limit:</strong> {autoMLConfig.timeLimit} minutes
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max Models:</strong> {autoMLConfig.maxModels}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Estimated Completion:</strong> {autoMLConfig.timeLimit} minutes
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveConfig}
              >
                Save Configuration
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() => setConfirmDialogOpen(true)}
              >
                Start AutoML Process
              </Button>
            </Box>
          </Grid>
          
          {autoMLResult && (
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="AutoML Process Status" 
                  subheader={`Started at ${formatDate(autoMLResult.startTime)}`}
                />
                <Divider />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">
                        Status: {autoMLResult.status.charAt(0).toUpperCase() + autoMLResult.status.slice(1)}
                      </Typography>
                      <Typography variant="body2">
                        {autoMLResult.progress.toFixed(0)}% Complete
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={autoMLResult.progress} 
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Elapsed Time: {formatDuration(autoMLResult.startTime, autoMLResult.endTime)}
                    </Typography>
                    {autoMLResult.status === 'running' ? (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<StopIcon />}
                      >
                        Stop Process
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => setResultDialogOpen(true)}
                      >
                        View Results
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };
  
  // Render AutoML results dialog
  const renderResultsDialog = () => {
    if (!autoMLResult || autoMLResult.status !== 'completed') return null;
    
    return (
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          AutoML Process Completed
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Process Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    <strong>Start Time:</strong> {formatDate(autoMLResult.startTime)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>End Time:</strong> {formatDate(autoMLResult.endTime!)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {formatDuration(autoMLResult.startTime, autoMLResult.endTime)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    <strong>Models Evaluated:</strong> {autoMLResult.leaderboard?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Best Model Type:</strong> {autoMLResult.bestModel?.modelType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Best Accuracy:</strong> {(autoMLResult.bestModel?.accuracy || 0) * 100}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    <strong>Dataset:</strong> {availableDatasets.find(d => d.id === autoMLConfig.datasetId)?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Target:</strong> {autoMLConfig.targetColumn}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Metric:</strong> {autoMLConfig.optimizationMetric}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Model Leaderboard
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Model Type</TableCell>
                    <TableCell align="right">Accuracy</TableCell>
                    <TableCell align="right">Relative Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {autoMLResult.leaderboard?.map((model) => (
                    <TableRow 
                      key={model.modelId}
                      sx={{ 
                        bgcolor: model.rank === 1 ? alpha(theme.palette.success.main, 0.1) : 'inherit'
                      }}
                    >
                      <TableCell>
                        {model.rank === 1 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                            {model.rank}
                          </Box>
                        ) : model.rank}
                      </TableCell>
                      <TableCell>{model.modelType}</TableCell>
                      <TableCell align="right">{(model.accuracy * 100).toFixed(2)}%</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(model.accuracy / (autoMLResult.leaderboard?.[0].accuracy || 1)) * 100} 
                            sx={{ 
                              width: 100, 
                              height: 8, 
                              borderRadius: 1,
                              mr: 1
                            }}
                          />
                          {((model.accuracy / (autoMLResult.leaderboard?.[0].accuracy || 1)) * 100).toFixed(1)}%
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Best Model Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Model Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Model ID:</strong> {autoMLResult.bestModel?.modelId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Model Type:</strong> {autoMLResult.bestModel?.modelType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Accuracy:</strong> {(autoMLResult.bestModel?.accuracy || 0) * 100}%
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Hyperparameters
                  </Typography>
                  {autoMLResult.bestModel?.hyperparameters && Object.entries(autoMLResult.bestModel.hyperparameters).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      <strong>{key}:</strong> {value}
                    </Typography>
                  ))}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Comparison
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={autoMLResult.leaderboard?.slice(0, 5).map(model => ({
                          name: model.modelType,
                          accuracy: model.accuracy
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          domain={[0, 1]} 
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <RechartsTooltip 
                          formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                        />
                        <Bar dataKey="accuracy" fill={theme.palette.primary.main}>
                          {autoMLResult.leaderboard?.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? theme.palette.success.main : theme.palette.primary.main} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
          <Button variant="contained" color="primary">
            Deploy Model
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render confirmation dialog
  const renderConfirmDialog = () => {
    return (
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          Start AutoML Process
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to start an AutoML process that may take up to {autoMLConfig.timeLimit} minutes to complete.
            This will evaluate up to {autoMLConfig.maxModels} different models to find the best one for your dataset.
            Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRunAutoML} variant="contained" color="primary">
            Start Process
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">AutoML Configuration</Typography>
        <Box>
          <Tooltip title="Help">
            <IconButton>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>
              <Typography variant="subtitle1">Dataset Selection</Typography>
            </StepLabel>
            <StepContent>
              {renderDatasetSelection()}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(0)}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>
              <Typography variant="subtitle1">Model Configuration</Typography>
            </StepLabel>
            <StepContent>
              {renderModelConfiguration()}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(1)}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>
              <Typography variant="subtitle1">Training Settings</Typography>
            </StepLabel>
            <StepContent>
              {renderTrainingSettings()}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(2)}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>
              <Typography variant="subtitle1">Review & Run</Typography>
            </StepLabel>
            <StepContent>
              {renderReviewAndRun()}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Box>
      
      {renderConfirmDialog()}
      {renderResultsDialog()}
    </Box>
  );
};

export default AutoMLConfigPanel;