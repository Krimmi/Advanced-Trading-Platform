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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Badge,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Autocomplete,
  Switch,
  FormControlLabel,
  Slider,
  useTheme,
  alpha
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';

// Import chart components (assuming we're using recharts)
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
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  AreaChart,
  Area,
  ComposedChart,
  Brush
} from 'recharts';

// Import services and types
import { MLService } from '../../services';
import { 
  MLModel, 
  ModelType, 
  Prediction, 
  PredictionResult, 
  PredictionMetrics,
  PredictionConfig
} from '../../types/ml';

interface PredictionDashboardProps {
  selectedModel?: MLModel;
  onConfigSave?: (config: PredictionConfig) => void;
  onPredictionComplete?: (result: PredictionResult) => void;
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
      id={`prediction-tabpanel-${index}`}
      aria-labelledby={`prediction-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  selectedModel,
  onConfigSave,
  onPredictionComplete
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [models, setModels] = useState<MLModel[]>([]);
  const [currentModel, setCurrentModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>([]);
  const [predictionMetrics, setPredictionMetrics] = useState<PredictionMetrics | null>(null);
  
  // Prediction configuration
  const [predictionConfig, setPredictionConfig] = useState<PredictionConfig>({
    modelId: '',
    inputData: {},
    options: {
      returnProbabilities: true,
      includeFeatureContributions: true,
      confidenceThreshold: 0.7,
      batchSize: 1
    }
  });
  
  // Input data form
  const [inputFields, setInputFields] = useState<{ name: string; value: string | number }[]>([]);
  const [inputDataValid, setInputDataValid] = useState<boolean>(false);
  
  // Visualization options
  const [chartType, setChartType] = useState<string>('bar');
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [showThreshold, setShowThreshold] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('1d');
  
  // Pagination for prediction history
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Service instance
  const mlService = new MLService();
  
  // Effect to fetch models on component mount
  useEffect(() => {
    if (!selectedModel) {
      fetchModels();
    } else {
      setCurrentModel(selectedModel);
      setPredictionConfig(prev => ({
        ...prev,
        modelId: selectedModel.id
      }));
      generateInputFields(selectedModel);
    }
  }, [selectedModel]);
  
  // Effect to update when current model changes
  useEffect(() => {
    if (currentModel) {
      generateInputFields(currentModel);
      fetchPredictionHistory(currentModel.id);
      fetchPredictionMetrics(currentModel.id);
    }
  }, [currentModel]);
  
  // Fetch models from the API
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedModels = await mlService.getModels();
      setModels(fetchedModels.filter(model => model.status === 'DEPLOYED'));
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch prediction history for a model
  const fetchPredictionHistory = async (modelId: string) => {
    try {
      setLoading(true);
      
      const history = await mlService.getPredictionHistory(modelId);
      setPredictionHistory(history);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prediction history:', err);
      setLoading(false);
    }
  };
  
  // Fetch prediction metrics for a model
  const fetchPredictionMetrics = async (modelId: string) => {
    try {
      setLoading(true);
      
      const metrics = await mlService.getPredictionMetrics(modelId);
      setPredictionMetrics(metrics);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prediction metrics:', err);
      setLoading(false);
    }
  };
  
  // Generate input fields based on model schema
  const generateInputFields = (model: MLModel) => {
    if (!model.schema) {
      setInputFields([]);
      return;
    }
    
    const fields = Object.entries(model.schema.properties).map(([name, schema]) => ({
      name,
      value: ''
    }));
    
    setInputFields(fields);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle model change
  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const modelId = event.target.value as string;
    const model = models.find(m => m.id === modelId) || null;
    setCurrentModel(model);
    setPredictionConfig(prev => ({
      ...prev,
      modelId
    }));
  };
  
  // Handle input field change
  const handleInputChange = (index: number, value: string | number) => {
    const updatedFields = [...inputFields];
    updatedFields[index].value = value;
    setInputFields(updatedFields);
    
    // Update prediction config
    const inputData: Record<string, any> = {};
    updatedFields.forEach(field => {
      inputData[field.name] = field.value;
    });
    
    setPredictionConfig(prev => ({
      ...prev,
      inputData
    }));
    
    // Validate input data
    validateInputData(updatedFields);
  };
  
  // Validate input data
  const validateInputData = (fields: { name: string; value: string | number }[]) => {
    const allFieldsFilled = fields.every(field => field.value !== '');
    setInputDataValid(allFieldsFilled);
  };
  
  // Handle options change
  const handleOptionChange = (option: string, value: any) => {
    setPredictionConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [option]: value
      }
    }));
  };
  
  // Handle chart type change
  const handleChartTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setChartType(event.target.value as string);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as string);
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Run prediction
  const handleRunPrediction = async () => {
    if (!currentModel || !inputDataValid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await mlService.runPrediction(predictionConfig);
      setPredictionResults(result);
      
      // Add to history
      setPredictionHistory([result, ...predictionHistory]);
      
      if (onPredictionComplete) {
        onPredictionComplete(result);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error running prediction:', err);
      setError('Failed to run prediction. Please try again later.');
      setLoading(false);
    }
  };
  
  // Save prediction configuration
  const handleSaveConfig = () => {
    if (onConfigSave) {
      onConfigSave(predictionConfig);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get trend icon based on direction
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
    if (value < 0) return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
    return <TrendingFlatIcon />;
  };
  
  // Render the model selector
  const renderModelSelector = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
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
                {selectedModel ? 'Model pre-selected' : 'Select a deployed model to make predictions'}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            {currentModel && (
              <Box>
                <Typography variant="subtitle2">
                  {currentModel.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Chip 
                    label={currentModel.type} 
                    size="small" 
                    sx={{ mr: 1, fontSize: '0.7rem' }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentModel.description.substring(0, 100)}
                    {currentModel.description.length > 100 ? '...' : ''}
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render the input form
  const renderInputForm = () => {
    if (!currentModel) {
      return (
        <Box sx={{ 
          p: 3, 
          textAlign: 'center', 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            Select a model to configure inputs
          </Typography>
        </Box>
      );
    }
    
    return (
      <Card>
        <CardHeader 
          title="Input Data" 
          subheader="Enter values for prediction"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {inputFields.map((field, index) => (
              <Grid item xs={12} sm={6} key={field.name}>
                <TextField
                  fullWidth
                  label={field.name}
                  value={field.value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            ))}
            
            {inputFields.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No input fields defined for this model
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Prediction Options
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={predictionConfig.options.returnProbabilities}
                      onChange={(e) => handleOptionChange('returnProbabilities', e.target.checked)}
                    />
                  }
                  label="Return Probabilities"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={predictionConfig.options.includeFeatureContributions}
                      onChange={(e) => handleOptionChange('includeFeatureContributions', e.target.checked)}
                    />
                  }
                  label="Include Feature Contributions"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Confidence Threshold: {predictionConfig.options.confidenceThreshold}
                </Typography>
                <Slider
                  value={predictionConfig.options.confidenceThreshold}
                  onChange={(e, value) => handleOptionChange('confidenceThreshold', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Size"
                  type="number"
                  value={predictionConfig.options.batchSize}
                  onChange={(e) => handleOptionChange('batchSize', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveConfig}
            >
              Save Configuration
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleRunPrediction}
              disabled={!inputDataValid || loading}
              color="primary"
            >
              Run Prediction
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  // Render prediction results
  const renderPredictionResults = () => {
    if (!predictionResults) {
      return (
        <Box sx={{ 
          p: 3, 
          textAlign: 'center', 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            Run a prediction to see results
          </Typography>
        </Box>
      );
    }
    
    return (
      <Card>
        <CardHeader 
          title="Prediction Results" 
          subheader={`Generated on ${formatDate(predictionResults.timestamp)}`}
          action={
            <IconButton>
              <DownloadIcon />
            </IconButton>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Prediction
              </Typography>
              <Box sx={{ mb: 3 }}>
                {currentModel?.type === ModelType.CLASSIFICATION ? (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {predictionResults.prediction}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        Confidence:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={predictionResults.confidence * 100}
                        sx={{ 
                          flexGrow: 1, 
                          height: 8, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.2)
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                        {(predictionResults.confidence * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h5">
                      {typeof predictionResults.prediction === 'number' ? 
                        predictionResults.prediction.toFixed(4) : 
                        predictionResults.prediction}
                    </Typography>
                    {predictionResults.predictionInterval && (
                      <Typography variant="body2" color="text.secondary">
                        95% Prediction Interval: 
                        [{predictionResults.predictionInterval.lower.toFixed(4)}, 
                        {predictionResults.predictionInterval.upper.toFixed(4)}]
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              
              {predictionResults.probabilities && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Class Probabilities
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(predictionResults.probabilities).map(([label, prob]) => ({
                          label,
                          probability: prob
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                        <YAxis type="category" dataKey="label" width={80} />
                        <RechartsTooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
                        <Bar 
                          dataKey="probability" 
                          fill={theme.palette.primary.main}
                          background={{ fill: alpha(theme.palette.primary.main, 0.1) }}
                        >
                          {Object.entries(predictionResults.probabilities).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry[0] === predictionResults.prediction ? 
                                theme.palette.primary.main : 
                                alpha(theme.palette.primary.main, 0.5)
                              } 
                            />
                          ))}
                        </Bar>
                        {showThreshold && (
                          <RechartsTooltip.Line 
                            x={predictionConfig.options.confidenceThreshold} 
                            stroke={theme.palette.warning.main} 
                            strokeDasharray="3 3" 
                            label="Threshold" 
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              {predictionResults.featureContributions && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Feature Contributions
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(predictionResults.featureContributions)
                          .map(([feature, contribution]) => ({
                            feature,
                            contribution: Number(contribution)
                          }))
                          .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                        }
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="feature" width={80} />
                        <RechartsTooltip />
                        <Bar dataKey="contribution">
                          {Object.entries(predictionResults.featureContributions).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={Number(entry[1]) >= 0 ? 
                                theme.palette.success.main : 
                                theme.palette.error.main
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Input Data
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Feature</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(predictionResults.inputData).map(([feature, value]) => (
                        <TableRow key={feature}>
                          <TableCell>{feature}</TableCell>
                          <TableCell align="right">{value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Render prediction history
  const renderPredictionHistory = () => {
    if (predictionHistory.length === 0) {
      return (
        <Box sx={{ 
          p: 3, 
          textAlign: 'center', 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            No prediction history available
          </Typography>
        </Box>
      );
    }
    
    // Filter history based on time range
    const filteredHistory = predictionHistory.filter(prediction => {
      const predictionDate = new Date(prediction.timestamp);
      const now = new Date();
      
      switch (timeRange) {
        case '1h':
          return (now.getTime() - predictionDate.getTime()) <= 3600000;
        case '1d':
          return (now.getTime() - predictionDate.getTime()) <= 86400000;
        case '7d':
          return (now.getTime() - predictionDate.getTime()) <= 604800000;
        case '30d':
          return (now.getTime() - predictionDate.getTime()) <= 2592000000;
        case 'all':
        default:
          return true;
      }
    });
    
    // Paginate history
    const paginatedHistory = filteredHistory.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
    
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            Prediction History
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange as any}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Prediction</TableCell>
                <TableCell align="right">Confidence</TableCell>
                <TableCell>Actual</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedHistory.map((prediction, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(prediction.timestamp)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {typeof prediction.prediction === 'number' ? 
                          prediction.prediction.toFixed(4) : 
                          prediction.prediction}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {prediction.confidence ? 
                      `${(prediction.confidence * 100).toFixed(2)}%` : 
                      'N/A'}
                  </TableCell>
                  <TableCell>
                    {prediction.actual !== undefined ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">
                          {typeof prediction.actual === 'number' ? 
                            prediction.actual.toFixed(4) : 
                            prediction.actual}
                        </Typography>
                        {prediction.error !== undefined && (
                          <Chip 
                            label={`Error: ${prediction.error.toFixed(4)}`} 
                            size="small" 
                            color={prediction.error > 0.1 ? 'error' : 'default'}
                            sx={{ ml: 1, fontSize: '0.7rem' }} 
                          />
                        )}
                      </Box>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredHistory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  };
  
  // Render prediction metrics
  const renderPredictionMetrics = () => {
    if (!predictionMetrics) {
      return (
        <Box sx={{ 
          p: 3, 
          textAlign: 'center', 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            No prediction metrics available
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Performance Metrics" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Accuracy
                        </Typography>
                        <Typography variant="h6">
                          {(predictionMetrics.accuracy * 100).toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Mean Error
                        </Typography>
                        <Typography variant="h6">
                          {predictionMetrics.meanError.toFixed(4)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          RMSE
                        </Typography>
                        <Typography variant="h6">
                          {predictionMetrics.rmse.toFixed(4)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Latency (ms)
                        </Typography>
                        <Typography variant="h6">
                          {predictionMetrics.averageLatency.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {currentModel?.type === ModelType.CLASSIFICATION && predictionMetrics.confusionMatrix && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Confusion Matrix
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell />
                            {Object.keys(predictionMetrics.confusionMatrix).map((key) => (
                              <TableCell key={key} align="center">
                                Predicted: {key}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(predictionMetrics.confusionMatrix).map(([actual, predictions]) => (
                            <TableRow key={actual}>
                              <TableCell component="th" scope="row">
                                Actual: {actual}
                              </TableCell>
                              {Object.entries(predictions).map(([predicted, count]) => (
                                <TableCell 
                                  key={predicted} 
                                  align="center"
                                  sx={{
                                    bgcolor: actual === predicted ? 
                                      alpha(theme.palette.success.main, 0.1) : 
                                      alpha(theme.palette.error.main, 0.1),
                                    fontWeight: actual === predicted ? 'bold' : 'normal'
                                  }}
                                >
                                  {count}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Prediction Trends" 
                action={
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="chart-type-label">Chart Type</InputLabel>
                    <Select
                      labelId="chart-type-label"
                      id="chart-type"
                      value={chartType}
                      label="Chart Type"
                      onChange={handleChartTypeChange as any}
                    >
                      <MenuItem value="line">Line Chart</MenuItem>
                      <MenuItem value="bar">Bar Chart</MenuItem>
                      <MenuItem value="scatter">Scatter Plot</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
              <Divider />
              <CardContent>
                {predictionMetrics.timeSeriesMetrics && (
                  <Box sx={{ height: 300 }}>
                    {chartType === 'line' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={predictionMetrics.timeSeriesMetrics}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="timestamp" 
                            tickFormatter={(timestamp) => {
                              const date = new Date(timestamp);
                              return date.toLocaleDateString();
                            }} 
                          />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="accuracy" 
                            name="Accuracy" 
                            stroke={theme.palette.primary.main} 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="error" 
                            name="Error" 
                            stroke={theme.palette.error.main} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    
                    {chartType === 'bar' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={predictionMetrics.timeSeriesMetrics}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="timestamp" 
                            tickFormatter={(timestamp) => {
                              const date = new Date(timestamp);
                              return date.toLocaleDateString();
                            }} 
                          />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar 
                            dataKey="accuracy" 
                            name="Accuracy" 
                            fill={theme.palette.primary.main} 
                          />
                          <Bar 
                            dataKey="error" 
                            name="Error" 
                            fill={theme.palette.error.main} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {chartType === 'scatter' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="actual" 
                            name="Actual" 
                          />
                          <YAxis 
                            type="number" 
                            dataKey="predicted" 
                            name="Predicted" 
                          />
                          <ZAxis 
                            type="number" 
                            dataKey="count" 
                            range={[50, 500]} 
                            name="Count" 
                          />
                          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Legend />
                          <Scatter 
                            name="Predictions" 
                            data={predictionMetrics.scatterData || []} 
                            fill={theme.palette.primary.main} 
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                )}
                
                {predictionMetrics.featureImportance && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Feature Importance
                    </Typography>
                    <Box sx={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(predictionMetrics.featureImportance)
                            .map(([feature, importance]) => ({
                              feature,
                              importance: Number(importance)
                            }))
                            .sort((a, b) => b.importance - a.importance)
                            .slice(0, 10)
                          }
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="feature" width={80} />
                          <RechartsTooltip />
                          <Bar 
                            dataKey="importance" 
                            fill={theme.palette.primary.main} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Prediction Dashboard</Typography>
        <Box>
          <IconButton onClick={() => {
            fetchModels();
            if (currentModel) {
              fetchPredictionHistory(currentModel.id);
              fetchPredictionMetrics(currentModel.id);
            }
          }} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && models.length === 0 && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
      
      {renderModelSelector()}
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PlayArrowIcon />} iconPosition="start" label="Make Prediction" />
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Results" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="History" />
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Metrics" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {renderInputForm()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {renderPredictionResults()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          {renderPredictionHistory()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          {renderPredictionMetrics()}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PredictionDashboard;