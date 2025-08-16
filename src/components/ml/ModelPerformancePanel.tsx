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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

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
  Brush,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Import services and types
import { MLService } from '../../services';
import { 
  MLModel, 
  ModelType,
  ModelStatus,
  PerformanceMetric,
  PerformanceOverTime,
  ClassPerformance,
  ModelComparison
} from '../../types/ml';

interface ModelPerformancePanelProps {
  selectedModel?: MLModel;
  onModelSelect?: (model: MLModel) => void;
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
      id={`model-performance-tabpanel-${index}`}
      aria-labelledby={`model-performance-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const ModelPerformancePanel: React.FC<ModelPerformancePanelProps> = ({
  selectedModel,
  onModelSelect
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [models, setModels] = useState<MLModel[]>([]);
  const [currentModel, setCurrentModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Performance data
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceOverTime[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [modelComparisons, setModelComparisons] = useState<ModelComparison[]>([]);
  
  // Filters and settings
  const [timeRange, setTimeRange] = useState<string>('1m');
  const [metricType, setMetricType] = useState<string>('accuracy');
  const [compareModels, setCompareModels] = useState<string[]>([]);
  
  // Service instance
  const mlService = new MLService();
  
  // Effect to fetch models on component mount
  useEffect(() => {
    if (!selectedModel) {
      fetchModels();
    } else {
      setCurrentModel(selectedModel);
      fetchPerformanceData(selectedModel.id);
    }
  }, [selectedModel]);
  
  // Effect to update when current model changes
  useEffect(() => {
    if (currentModel) {
      fetchPerformanceData(currentModel.id);
    }
  }, [currentModel]);
  
  // Fetch models from the API
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedModels = await mlService.getModels();
      setModels(fetchedModels);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch performance data
  const fetchPerformanceData = async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, these would be separate API calls
      // For now, we'll simulate the data
      
      // Performance metrics
      const metrics: PerformanceMetric[] = [
        { name: 'Accuracy', value: 0.87, change: 0.02, target: 0.9 },
        { name: 'Precision', value: 0.83, change: -0.01, target: 0.85 },
        { name: 'Recall', value: 0.79, change: 0.03, target: 0.8 },
        { name: 'F1 Score', value: 0.81, change: 0.01, target: 0.85 },
        { name: 'ROC AUC', value: 0.92, change: 0, target: 0.95 },
        { name: 'Latency (ms)', value: 120, change: -15, target: 100 }
      ];
      setPerformanceMetrics(metrics);
      
      // Performance history (last 30 days)
      const history: PerformanceOverTime[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        
        return {
          timestamp: date.toISOString(),
          accuracy: 0.8 + Math.random() * 0.15,
          loss: 0.3 - Math.random() * 0.2
        };
      });
      setPerformanceHistory(history);
      
      // Class performance (for classification models)
      if (currentModel?.type === ModelType.CLASSIFICATION) {
        const classes: ClassPerformance[] = [
          { class: 'Class A', precision: 0.91, recall: 0.87, f1Score: 0.89, support: 120 },
          { class: 'Class B', precision: 0.85, recall: 0.82, f1Score: 0.83, support: 95 },
          { class: 'Class C', precision: 0.78, recall: 0.81, f1Score: 0.79, support: 110 },
          { class: 'Class D', precision: 0.88, recall: 0.75, f1Score: 0.81, support: 85 }
        ];
        setClassPerformance(classes);
      }
      
      // Model comparisons
      const comparisons: ModelComparison[] = [
        { 
          modelId: 'model-1', 
          modelName: 'Primary Model', 
          accuracy: 0.87, 
          latency: 120, 
          size: 45.2, 
          lastUpdated: new Date().toISOString() 
        },
        { 
          modelId: 'model-2', 
          modelName: 'Lightweight Model', 
          accuracy: 0.82, 
          latency: 85, 
          size: 12.8, 
          lastUpdated: new Date(Date.now() - 86400000).toISOString() 
        },
        { 
          modelId: 'model-3', 
          modelName: 'Experimental Model', 
          accuracy: 0.89, 
          latency: 180, 
          size: 78.5, 
          lastUpdated: new Date(Date.now() - 172800000).toISOString() 
        },
        { 
          modelId: 'model-4', 
          modelName: 'Legacy Model', 
          accuracy: 0.79, 
          latency: 95, 
          size: 32.1, 
          lastUpdated: new Date(Date.now() - 2592000000).toISOString() 
        }
      ];
      setModelComparisons(comparisons);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to fetch performance data. Please try again later.');
      setLoading(false);
    }
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
    
    if (onModelSelect && model) {
      onModelSelect(model);
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as string);
  };
  
  // Handle metric type change
  const handleMetricTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMetricType(event.target.value as string);
  };
  
  // Handle compare model change
  const handleCompareModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setCompareModels(event.target.value as string[]);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format number for display
  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };
  
  // Get trend icon based on change
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
    if (change < 0) return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
    return <TrendingFlatIcon sx={{ color: theme.palette.grey[500] }} />;
  };
  
  // Get color based on performance vs target
  const getPerformanceColor = (value: number, target: number) => {
    const ratio = value / target;
    if (ratio >= 1) return theme.palette.success.main;
    if (ratio >= 0.9) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Filter history data based on time range
  const getFilteredHistory = () => {
    const now = new Date();
    let cutoff = new Date();
    
    switch (timeRange) {
      case '1w':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '1m':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case '1y':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoff = new Date(0); // All data
    }
    
    return performanceHistory.filter(item => new Date(item.timestamp) >= cutoff);
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
                  <Chip 
                    label={currentModel.status} 
                    size="small"
                    color={
                      currentModel.status === ModelStatus.DEPLOYED ? 'success' :
                      currentModel.status === ModelStatus.TRAINING ? 'warning' :
                      currentModel.status === ModelStatus.FAILED ? 'error' :
                      'default'
                    }
                    sx={{ mr: 1, fontSize: '0.7rem' }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {formatDate(currentModel.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render performance overview
  const renderPerformanceOverview = () => {
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
            Select a model to view performance metrics
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader 
                title="Performance Over Time" 
                subheader="Model accuracy and loss trends"
                action={
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="time-range-label">Time Range</InputLabel>
                    <Select
                      labelId="time-range-label"
                      id="time-range"
                      value={timeRange}
                      label="Time Range"
                      onChange={handleTimeRangeChange as any}
                    >
                      <MenuItem value="1w">Last Week</MenuItem>
                      <MenuItem value="1m">Last Month</MenuItem>
                      <MenuItem value="3m">Last 3 Months</MenuItem>
                      <MenuItem value="1y">Last Year</MenuItem>
                      <MenuItem value="all">All Time</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getFilteredHistory()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(timestamp) => formatDate(timestamp)}
                      />
                      <YAxis yAxisId="left" domain={[0.5, 1]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 0.5]} />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => [
                          formatNumber(value), 
                          name === 'accuracy' ? 'Accuracy' : 'Loss'
                        ]}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="accuracy" 
                        name="Accuracy" 
                        stroke={theme.palette.primary.main} 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="loss" 
                        name="Loss" 
                        stroke={theme.palette.error.main} 
                      />
                      <Brush 
                        dataKey="timestamp" 
                        height={30} 
                        stroke={theme.palette.primary.main}
                        tickFormatter={(timestamp) => formatDate(timestamp)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Key Metrics" 
                subheader="Current performance indicators"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  {performanceMetrics.map((metric) => (
                    <Grid item xs={6} key={metric.name}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {metric.name}
                            </Typography>
                            {getTrendIcon(metric.change)}
                          </Box>
                          <Typography variant="h6">
                            {formatNumber(metric.value)}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(metric.value / (metric.target || 1)) * 100}
                              sx={{ 
                                height: 4, 
                                borderRadius: 1,
                                bgcolor: alpha(getPerformanceColor(metric.value, metric.target || 1), 0.2),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getPerformanceColor(metric.value, metric.target || 1)
                                }
                              }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {metric.change > 0 ? '+' : ''}{formatNumber(metric.change)}
                              </Typography>
                              {metric.target && (
                                <Typography variant="caption" color="text.secondary">
                                  Target: {formatNumber(metric.target)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {currentModel.type === ModelType.CLASSIFICATION && (
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Class Performance" 
                  subheader="Performance metrics by class"
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={90} data={classPerformance}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="class" />
                            <PolarRadiusAxis domain={[0, 1]} />
                            <Radar 
                              name="Precision" 
                              dataKey="precision" 
                              stroke={theme.palette.primary.main} 
                              fill={theme.palette.primary.main} 
                              fillOpacity={0.6} 
                            />
                            <Radar 
                              name="Recall" 
                              dataKey="recall" 
                              stroke={theme.palette.secondary.main} 
                              fill={theme.palette.secondary.main} 
                              fillOpacity={0.6} 
                            />
                            <Radar 
                              name="F1 Score" 
                              dataKey="f1Score" 
                              stroke={theme.palette.success.main} 
                              fill={theme.palette.success.main} 
                              fillOpacity={0.6} 
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Class</TableCell>
                              <TableCell align="right">Precision</TableCell>
                              <TableCell align="right">Recall</TableCell>
                              <TableCell align="right">F1 Score</TableCell>
                              <TableCell align="right">Support</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {classPerformance.map((cls) => (
                              <TableRow key={cls.class}>
                                <TableCell>{cls.class}</TableCell>
                                <TableCell align="right">{formatNumber(cls.precision)}</TableCell>
                                <TableCell align="right">{formatNumber(cls.recall)}</TableCell>
                                <TableCell align="right">{formatNumber(cls.f1Score)}</TableCell>
                                <TableCell align="right">{cls.support}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };
  
  // Render model comparison
  const renderModelComparison = () => {
    return (
      <Box>
        <Card>
          <CardHeader 
            title="Model Comparison" 
            subheader="Compare performance across different models"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Model</TableCell>
                        <TableCell align="right">Accuracy</TableCell>
                        <TableCell align="right">Latency (ms)</TableCell>
                        <TableCell align="right">Size (MB)</TableCell>
                        <TableCell align="right">Last Updated</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modelComparisons.map((model) => (
                        <TableRow 
                          key={model.modelId}
                          sx={{ 
                            bgcolor: model.modelId === 'model-1' ? 
                              alpha(theme.palette.primary.main, 0.1) : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {model.modelName}
                              </Typography>
                              {model.modelId === 'model-1' && (
                                <Chip 
                                  label="Current" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ ml: 1, fontSize: '0.7rem' }} 
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Typography variant="body2">
                                {formatNumber(model.accuracy * 100)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{model.latency.toFixed(0)}</TableCell>
                          <TableCell align="right">{model.size.toFixed(1)}</TableCell>
                          <TableCell align="right">{formatDate(model.lastUpdated)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Compare Details">
                              <IconButton size="small">
                                <CompareArrowsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Comparison
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={modelComparisons}
                      margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="modelName" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis yAxisId="left" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight' }} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="accuracy" 
                        name="Accuracy" 
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      >
                        {modelComparisons.map((entry, index) => (
                          <Cell 
                            key={`accuracy-${index}`} 
                            fill={entry.modelId === 'model-1' ? theme.palette.primary.dark : theme.palette.primary.main} 
                          />
                        ))}
                      </Bar>
                      <Bar 
                        yAxisId="right"
                        dataKey="latency" 
                        name="Latency" 
                        fill={theme.palette.secondary.main}
                        radius={[4, 4, 0, 0]}
                      >
                        {modelComparisons.map((entry, index) => (
                          <Cell 
                            key={`latency-${index}`} 
                            fill={entry.modelId === 'model-1' ? theme.palette.secondary.dark : theme.palette.secondary.main} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Size vs. Performance
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="size" 
                        name="Size" 
                        unit=" MB" 
                        domain={['dataMin - 5', 'dataMax + 5']}
                        label={{ value: 'Size (MB)', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="accuracy" 
                        name="Accuracy" 
                        unit="%" 
                        domain={[0.7, 0.95]}
                        label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis 
                        type="number" 
                        dataKey="latency" 
                        range={[50, 400]} 
                        name="Latency" 
                        unit=" ms" 
                      />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter 
                        name="Models" 
                        data={modelComparisons} 
                        fill={theme.palette.primary.main}
                      >
                        {modelComparisons.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.modelId === 'model-1' ? theme.palette.primary.dark : theme.palette.primary.main} 
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  // Render detailed metrics
  const renderDetailedMetrics = () => {
    return (
      <Box>
        <Card>
          <CardHeader 
            title="Detailed Performance Metrics" 
            subheader="In-depth analysis of model performance"
            action={
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="metric-type-label">Metric Type</InputLabel>
                <Select
                  labelId="metric-type-label"
                  id="metric-type"
                  value={metricType}
                  label="Metric Type"
                  onChange={handleMetricTypeChange as any}
                >
                  <MenuItem value="accuracy">Accuracy</MenuItem>
                  <MenuItem value="precision">Precision</MenuItem>
                  <MenuItem value="recall">Recall</MenuItem>
                  <MenuItem value="f1">F1 Score</MenuItem>
                  <MenuItem value="roc">ROC AUC</MenuItem>
                  <MenuItem value="latency">Latency</MenuItem>
                </Select>
              </FormControl>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={Array.from({ length: 100 }, (_, i) => ({
                        value: 0.7 + (i / 100) * 0.3,
                        frequency: Math.exp(-Math.pow((i - 50) / 15, 2))
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="value" 
                        label={{ value: metricType.charAt(0).toUpperCase() + metricType.slice(1), position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="frequency" 
                        stroke={theme.palette.primary.main} 
                        fill={alpha(theme.palette.primary.main, 0.3)} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance by Data Volume
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Array.from({ length: 10 }, (_, i) => ({
                        dataSize: (i + 1) * 10,
                        accuracy: 0.7 + (i / 10) * 0.2 + (Math.random() * 0.05),
                        latency: 50 + (i * 15) + (Math.random() * 20)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dataSize" 
                        label={{ value: 'Data Size (GB)', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        domain={[0.6, 1]} 
                        label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        domain={[0, 250]}
                        label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight' }}
                      />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="accuracy" 
                        name="Accuracy" 
                        stroke={theme.palette.primary.main} 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="latency" 
                        name="Latency" 
                        stroke={theme.palette.secondary.main} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Analysis
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Error Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Impact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>False Positives</TableCell>
                        <TableCell>Instances incorrectly predicted as positive</TableCell>
                        <TableCell align="right">42</TableCell>
                        <TableCell align="right">8.4%</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label="High" 
                            size="small" 
                            color="error" 
                            sx={{ fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>False Negatives</TableCell>
                        <TableCell>Instances incorrectly predicted as negative</TableCell>
                        <TableCell align="right">28</TableCell>
                        <TableCell align="right">5.6%</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label="Medium" 
                            size="small" 
                            color="warning" 
                            sx={{ fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Outliers</TableCell>
                        <TableCell>Extreme values causing prediction errors</TableCell>
                        <TableCell align="right">15</TableCell>
                        <TableCell align="right">3.0%</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label="Low" 
                            size="small" 
                            color="info" 
                            sx={{ fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Data Drift</TableCell>
                        <TableCell>Changes in data distribution over time</TableCell>
                        <TableCell align="right">35</TableCell>
                        <TableCell align="right">7.0%</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label="High" 
                            size="small" 
                            color="error" 
                            sx={{ fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Model Performance Tracking</Typography>
        <Box>
          <IconButton onClick={() => currentModel && fetchPerformanceData(currentModel.id)}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>
      
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {renderModelSelector()}
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="Comparison" />
          <Tab icon={<TableChartIcon />} iconPosition="start" label="Detailed Metrics" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {renderPerformanceOverview()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {renderModelComparison()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          {renderDetailedMetrics()}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default ModelPerformancePanel;