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
  Autocomplete,
  useTheme,
  alpha
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import TuneIcon from '@mui/icons-material/Tune';

// Import chart components
import {
  ResponsiveContainer,
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
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';

// Import services and types
import { MLService } from '../../services';
import { 
  MLModel, 
  FeatureImportance, 
  FeatureContribution,
  GlobalFeatureImportance,
  FeatureCorrelation,
  PartialDependencePlot
} from '../../types/ml';

interface FeatureImportancePanelProps {
  selectedModel?: MLModel;
  onFeatureSelect?: (feature: string) => void;
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
      id={`feature-importance-tabpanel-${index}`}
      aria-labelledby={`feature-importance-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const FeatureImportancePanel: React.FC<FeatureImportancePanelProps> = ({
  selectedModel,
  onFeatureSelect
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [models, setModels] = useState<MLModel[]>([]);
  const [currentModel, setCurrentModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feature importance data
  const [globalImportance, setGlobalImportance] = useState<GlobalFeatureImportance[]>([]);
  const [featureCorrelations, setFeatureCorrelations] = useState<FeatureCorrelation[]>([]);
  const [partialDependence, setPartialDependence] = useState<PartialDependencePlot[]>([]);
  const [localExplanations, setLocalExplanations] = useState<FeatureContribution[]>([]);
  
  // Filters and settings
  const [featureFilter, setFeatureFilter] = useState<string>('');
  const [importanceThreshold, setImportanceThreshold] = useState<number>(0.01);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [chartType, setChartType] = useState<string>('bar');
  const [sortBy, setSortBy] = useState<string>('importance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Sample data for explanation
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  
  // Service instance
  const mlService = new MLService();
  
  // Effect to fetch models on component mount
  useEffect(() => {
    if (!selectedModel) {
      fetchModels();
    } else {
      setCurrentModel(selectedModel);
      fetchFeatureImportance(selectedModel.id);
    }
  }, [selectedModel]);
  
  // Effect to update when current model changes
  useEffect(() => {
    if (currentModel) {
      fetchFeatureImportance(currentModel.id);
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
  
  // Fetch feature importance data
  const fetchFeatureImportance = async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, these would be separate API calls
      // For now, we'll simulate the data based on the model's featureImportance
      
      if (currentModel?.featureImportance) {
        // Global feature importance
        const global = currentModel.featureImportance.map(fi => ({
          feature: fi.feature,
          importance: fi.importance,
          description: `Feature representing ${fi.feature.toLowerCase().replace(/_/g, ' ')}`
        }));
        setGlobalImportance(global);
        
        // Feature correlations (simulated)
        const correlations: FeatureCorrelation[] = [];
        for (let i = 0; i < global.length; i++) {
          for (let j = i + 1; j < global.length; j++) {
            correlations.push({
              feature1: global[i].feature,
              feature2: global[j].feature,
              correlation: Math.random() * 2 - 1 // Random correlation between -1 and 1
            });
          }
        }
        setFeatureCorrelations(correlations);
        
        // Partial dependence plots (simulated)
        const pdp = global.map(feature => ({
          feature: feature.feature,
          values: Array.from({ length: 10 }, (_, i) => i * 0.1),
          predictions: Array.from({ length: 10 }, () => Math.random())
        }));
        setPartialDependence(pdp);
        
        // Local explanations (simulated)
        const local = global.map(feature => ({
          feature: feature.feature,
          value: Math.random() * 10,
          contribution: (Math.random() * 2 - 1) * feature.importance,
          impact: Math.random() > 0.5 ? 'positive' as const : 'negative' as const
        }));
        setLocalExplanations(local);
        
        // Set the first feature as selected by default
        if (global.length > 0 && !selectedFeature) {
          setSelectedFeature(global[0].feature);
        }
        
        // Generate sample data
        const sample: Record<string, any> = {};
        global.forEach(feature => {
          sample[feature.feature] = Math.random() * 10;
        });
        setSampleData(sample);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching feature importance:', err);
      setError('Failed to fetch feature importance data. Please try again later.');
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
  };
  
  // Handle feature selection
  const handleFeatureSelect = (feature: string) => {
    setSelectedFeature(feature);
    if (onFeatureSelect) {
      onFeatureSelect(feature);
    }
  };
  
  // Handle chart type change
  const handleChartTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setChartType(event.target.value as string);
  };
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  // Format number for display
  const formatNumber = (value: number, decimals: number = 4) => {
    return value.toFixed(decimals);
  };
  
  // Get color based on correlation value
  const getCorrelationColor = (value: number) => {
    if (value > 0.7) return theme.palette.success.main;
    if (value > 0.3) return theme.palette.success.light;
    if (value < -0.7) return theme.palette.error.main;
    if (value < -0.3) return theme.palette.error.light;
    return theme.palette.grey[500];
  };
  
  // Get color based on importance value
  const getImportanceColor = (value: number) => {
    const maxImportance = Math.max(...globalImportance.map(fi => fi.importance));
    const normalizedValue = value / maxImportance;
    
    if (normalizedValue > 0.8) return theme.palette.primary.dark;
    if (normalizedValue > 0.5) return theme.palette.primary.main;
    if (normalizedValue > 0.2) return theme.palette.primary.light;
    return alpha(theme.palette.primary.main, 0.5);
  };
  
  // Filter features based on search and threshold
  const filteredFeatures = globalImportance
    .filter(feature => 
      feature.feature.toLowerCase().includes(featureFilter.toLowerCase()) && 
      feature.importance >= importanceThreshold
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'feature':
          comparison = a.feature.localeCompare(b.feature);
          break;
        case 'importance':
        default:
          comparison = a.importance - b.importance;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  
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
                  <Typography variant="body2" color="text.secondary">
                    {currentModel.description.substring(0, 100)}
                    {currentModel.description.length > 100 ? '..' : ''}
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render global feature importance
  const renderGlobalImportance = () => {
    if (globalImportance.length === 0) {
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
            No feature importance data available
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              label="Search Features"
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="chart-type-label">Chart Type</InputLabel>
              <Select
                labelId="chart-type-label"
                id="chart-type"
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange as any}
              >
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="horizontal">Horizontal Bar</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Tooltip title="Download Feature Importance Data">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => currentModel && fetchFeatureImportance(currentModel.id)}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardHeader 
                title="Feature Importance" 
                subheader="Global importance of features in the model"
              />
              <Divider />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredFeatures}
                        margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="feature" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                          interval={0}
                        />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [
                            formatNumber(value), 
                            'Importance'
                          ]}
                          labelFormatter={(label) => `Feature: ${label}`}
                        />
                        <Bar dataKey="importance">
                          {filteredFeatures.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getImportanceColor(entry.importance)} 
                              onClick={() => handleFeatureSelect(entry.feature)}
                              cursor="pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  
                  {chartType === 'horizontal' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredFeatures}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="feature" 
                          width={100}
                        />
                        <RechartsTooltip 
                          formatter={(value: number) => [
                            formatNumber(value), 
                            'Importance'
                          ]}
                        />
                        <Bar dataKey="importance">
                          {filteredFeatures.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getImportanceColor(entry.importance)} 
                              onClick={() => handleFeatureSelect(entry.feature)}
                              cursor="pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  
                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredFeatures}
                          dataKey="importance"
                          nameKey="feature"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={(entry) => entry.feature}
                          onClick={(data) => handleFeatureSelect(data.feature)}
                          cursor="pointer"
                        >
                          {filteredFeatures.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getImportanceColor(entry.importance)} 
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number, name: string, props: any) => [
                            formatNumber(value), 
                            props.payload.feature
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Feature Details" 
                subheader="Detailed information about features"
              />
              <Divider />
              <CardContent sx={{ height: 400, overflow: 'auto' }}>
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          onClick={() => handleSortChange('feature')}
                          sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Feature
                          {sortBy === 'feature' && (
                            <Box component="span" sx={{ ml: 0.5 }}>
                              {sortDirection === 'asc' ? '▲' : '▼'}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell 
                          align="right"
                          onClick={() => handleSortChange('importance')}
                          sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Importance
                          {sortBy === 'importance' && (
                            <Box component="span" sx={{ ml: 0.5 }}>
                              {sortDirection === 'asc' ? '▲' : '▼'}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredFeatures.map((feature) => (
                        <TableRow 
                          key={feature.feature}
                          hover
                          onClick={() => handleFeatureSelect(feature.feature)}
                          sx={{ 
                            cursor: 'pointer',
                            bgcolor: selectedFeature === feature.feature ? 
                              alpha(theme.palette.primary.main, 0.1) : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {feature.feature}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Box 
                                sx={{ 
                                  width: 50, 
                                  height: 8, 
                                  bgcolor: getImportanceColor(feature.importance),
                                  borderRadius: 1,
                                  mr: 1
                                }} 
                              />
                              <Typography variant="body2">
                                {formatNumber(feature.importance)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {selectedFeature && (
          <Card sx={{ mt: 3 }}>
            <CardHeader 
              title={`Feature Detail: ${selectedFeature}`}
              subheader="In-depth analysis of the selected feature"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Partial Dependence Plot
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={partialDependence.find(p => p.feature === selectedFeature)?.values.map((value, index) => ({
                          value,
                          prediction: partialDependence.find(p => p.feature === selectedFeature)?.predictions[index] || 0
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line 
                          type="monotone" 
                          dataKey="prediction" 
                          stroke={theme.palette.primary.main} 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This plot shows how the prediction changes as the feature value changes, while keeping all other features constant.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Feature Correlations
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Related Feature</TableCell>
                          <TableCell align="right">Correlation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {featureCorrelations
                          .filter(corr => corr.feature1 === selectedFeature || corr.feature2 === selectedFeature)
                          .map((corr, index) => {
                            const otherFeature = corr.feature1 === selectedFeature ? corr.feature2 : corr.feature1;
                            return (
                              <TableRow key={index}>
                                <TableCell>{otherFeature}</TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ color: getCorrelationColor(corr.correlation) }}
                                    >
                                      {formatNumber(corr.correlation)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Correlation measures the statistical relationship between features. Values close to 1 or -1 indicate strong correlation.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };
  
  // Render local explanations
  const renderLocalExplanations = () => {
    return (
      <Box>
        <Card>
          <CardHeader 
            title="Local Feature Explanations" 
            subheader="How features contribute to individual predictions"
            action={
              <Tooltip title="Local explanations show how each feature contributes to a specific prediction">
                <IconButton>
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" gutterBottom>
                  Sample Input Data
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
                      {Object.entries(sampleData).map(([feature, value]) => (
                        <TableRow key={feature}>
                          <TableCell>{feature}</TableCell>
                          <TableCell align="right">{formatNumber(value as number, 2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Prediction Result
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Prediction
                          </Typography>
                          <Typography variant="h6">
                            {currentModel?.type === 'CLASSIFICATION' ? 'Class A' : '0.8752'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Confidence
                          </Typography>
                          <Typography variant="h6">
                            87.5%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    startIcon={<TuneIcon />}
                  >
                    Modify Input
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                  >
                    Recalculate
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" gutterBottom>
                  Feature Contributions
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={localExplanations
                        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                      }
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="feature" width={100} />
                      <RechartsTooltip 
                        formatter={(value: number) => [
                          formatNumber(value), 
                          'Contribution'
                        ]}
                        labelFormatter={(label) => `Feature: ${label}`}
                      />
                      <Bar dataKey="contribution">
                        {localExplanations.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.contribution >= 0 ? theme.palette.success.main : theme.palette.error.main} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Bars to the right (positive values) increase the prediction, while bars to the left (negative values) decrease it.
                  The magnitude shows how strongly each feature influences this specific prediction.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  // Render feature correlations
  const renderFeatureCorrelations = () => {
    // Create a matrix of correlations for visualization
    const features = [...new Set(featureCorrelations.flatMap(corr => [corr.feature1, corr.feature2]))];
    const correlationMatrix = features.map(f1 => ({
      feature: f1,
      ...Object.fromEntries(
        features.map(f2 => {
          if (f1 === f2) return [f2, 1]; // Self-correlation is always 1
          const corr = featureCorrelations.find(
            c => (c.feature1 === f1 && c.feature2 === f2) || (c.feature1 === f2 && c.feature2 === f1)
          );
          return [f2, corr ? corr.correlation : 0];
        })
      )
    }));
    
    return (
      <Box>
        <Card>
          <CardHeader 
            title="Feature Correlations" 
            subheader="Relationships between different features"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ height: 500, overflow: 'auto' }}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell></TableCell>
                          {features.map(feature => (
                            <TableCell 
                              key={feature} 
                              align="center"
                              sx={{ 
                                minWidth: 80,
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            >
                              {feature}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {correlationMatrix.map(row => (
                          <TableRow key={row.feature}>
                            <TableCell 
                              component="th" 
                              scope="row"
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                position: 'sticky',
                                left: 0,
                                backgroundColor: theme.palette.background.paper,
                                zIndex: 1
                              }}
                            >
                              {row.feature}
                            </TableCell>
                            {features.map(feature => {
                              const value = row[feature] as number;
                              return (
                                <TableCell 
                                  key={feature} 
                                  align="center"
                                  sx={{ 
                                    bgcolor: alpha(getCorrelationColor(value), 0.2),
                                    color: getCorrelationColor(value),
                                    fontWeight: Math.abs(value) > 0.7 ? 'bold' : 'normal'
                                  }}
                                >
                                  {formatNumber(value, 2)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Correlation Legend
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: theme.palette.error.main, mr: 1 }} />
                    <Typography variant="body2">
                      Strong Negative (-1.0 to -0.7)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: theme.palette.error.light, mr: 1 }} />
                    <Typography variant="body2">
                      Moderate Negative (-0.7 to -0.3)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: theme.palette.grey[500], mr: 1 }} />
                    <Typography variant="body2">
                      Weak/No Correlation (-0.3 to 0.3)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: theme.palette.success.light, mr: 1 }} />
                    <Typography variant="body2">
                      Moderate Positive (0.3 to 0.7)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: theme.palette.success.main, mr: 1 }} />
                    <Typography variant="body2">
                      Strong Positive (0.7 to 1.0)
                    </Typography>
                  </Box>
                </Box>
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
        <Typography variant="h6">Feature Importance Analysis</Typography>
        <Box>
          <IconButton onClick={() => currentModel && fetchFeatureImportance(currentModel.id)}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {renderModelSelector()}
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Global Importance" />
          <Tab label="Local Explanations" />
          <Tab label="Feature Correlations" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {renderGlobalImportance()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {renderLocalExplanations()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          {renderFeatureCorrelations()}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default FeatureImportancePanel;