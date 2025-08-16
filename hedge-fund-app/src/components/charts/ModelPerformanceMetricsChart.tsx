import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Scatter
} from 'recharts';
import {
  Box,
  Typography,
  useTheme,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip as MuiTooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export interface ModelMetric {
  name: string;
  value: number;
  benchmark?: number;
  description?: string;
  ideal?: 'high' | 'low' | 'mid';
  category?: 'accuracy' | 'error' | 'fit' | 'speed' | 'other';
}

export interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export interface ROCPoint {
  falsePositiveRate: number;
  truePositiveRate: number;
  threshold?: number;
}

export interface PrecisionRecallPoint {
  precision: number;
  recall: number;
  threshold?: number;
}

export interface ModelPerformanceData {
  id: string;
  name: string;
  metrics: ModelMetric[];
  confusionMatrix?: ConfusionMatrix;
  rocCurve?: ROCPoint[];
  precisionRecallCurve?: PrecisionRecallPoint[];
  color?: string;
}

interface ModelPerformanceMetricsChartProps {
  data: ModelPerformanceData[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showBenchmark?: boolean;
  metricValueFormatter?: (value: number, metricName: string) => string;
  onModelSelect?: (modelId: string) => void;
  selectedModelId?: string;
}

const ModelPerformanceMetricsChart: React.FC<ModelPerformanceMetricsChartProps> = ({
  data,
  title,
  subtitle,
  height = 500,
  width = '100%',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showBenchmark = true,
  metricValueFormatter = (value, metricName) => value.toFixed(4),
  onModelSelect,
  selectedModelId,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState<number>(0);
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');
  const [metricFilter, setMetricFilter] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>(selectedModelId || (data.length > 0 ? data[0].id : ''));
  
  // Default colors if not provided in data
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'radar' | 'bar',
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };
  
  // Handle metric filter change
  const handleMetricFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMetricFilter(event.target.value as string);
  };
  
  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    if (onModelSelect) {
      onModelSelect(modelId);
    }
  };
  
  // Get color for a model
  const getModelColor = (modelId: string, index: number) => {
    const model = data.find(m => m.id === modelId);
    return model?.color || defaultColors[index % defaultColors.length];
  };
  
  // Filter metrics based on selected category
  const getFilteredMetrics = (metrics: ModelMetric[]) => {
    if (metricFilter === 'all') return metrics;
    return metrics.filter(m => m.category === metricFilter);
  };
  
  // Custom tooltip for metrics
  const MetricsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metricName = label;
      const metric = data.flatMap(m => m.metrics).find(m => m.name === metricName);
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            maxWidth: 300,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {metricName}
          </Typography>
          
          {metric?.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {metric.description}
            </Typography>
          )}
          
          {payload.map((entry: any, index: number) => (
            <Box key={`tooltip-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  mr: 1,
                  borderRadius: '50%',
                }}
              />
              <Typography variant="body2" component="span">
                {entry.name}: {metricValueFormatter(entry.value, metricName)}
              </Typography>
            </Box>
          ))}
          
          {metric?.ideal && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Ideal: {metric.ideal === 'high' ? 'Higher is better' : metric.ideal === 'low' ? 'Lower is better' : 'Mid-range is optimal'}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };
  
  // Custom tooltip for ROC curve
  const ROCTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            True Positive Rate: {point.truePositiveRate.toFixed(4)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            False Positive Rate: {point.falsePositiveRate.toFixed(4)}
          </Typography>
          {point.threshold !== undefined && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Threshold: {point.threshold.toFixed(4)}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };
  
  // Custom tooltip for Precision-Recall curve
  const PRTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Precision: {point.precision.toFixed(4)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Recall: {point.recall.toFixed(4)}
          </Typography>
          {point.threshold !== undefined && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Threshold: {point.threshold.toFixed(4)}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };
  
  // Custom tooltip for confusion matrix
  const ConfusionMatrixTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cellType = label;
      const value = payload[0].value;
      
      let description = '';
      switch (cellType) {
        case 'truePositive':
          description = 'Correctly predicted positive cases';
          break;
        case 'trueNegative':
          description = 'Correctly predicted negative cases';
          break;
        case 'falsePositive':
          description = 'Incorrectly predicted positive cases (Type I error)';
          break;
        case 'falseNegative':
          description = 'Incorrectly predicted negative cases (Type II error)';
          break;
      }
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {cellType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Count: {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  // Prepare metrics data for charts
  const prepareMetricsData = () => {
    // Get all unique metric names
    const allMetricNames = Array.from(
      new Set(data.flatMap(model => model.metrics.map(metric => metric.name)))
    );
    
    // Create data points for each metric
    return allMetricNames.map(metricName => {
      const dataPoint: any = { name: metricName };
      
      // Add value for each model
      data.forEach(model => {
        const metric = model.metrics.find(m => m.name === metricName);
        if (metric) {
          dataPoint[model.id] = metric.value;
          
          // Add benchmark if available
          if (showBenchmark && metric.benchmark !== undefined) {
            dataPoint[`${model.id}_benchmark`] = metric.benchmark;
          }
        }
      });
      
      return dataPoint;
    });
  };
  
  // Prepare confusion matrix data
  const prepareConfusionMatrixData = () => {
    const selectedModelData = data.find(m => m.id === selectedModel);
    if (!selectedModelData || !selectedModelData.confusionMatrix) return [];
    
    const { truePositive, trueNegative, falsePositive, falseNegative } = selectedModelData.confusionMatrix;
    
    return [
      { name: 'truePositive', value: truePositive, color: theme.palette.success.main },
      { name: 'trueNegative', value: trueNegative, color: theme.palette.info.main },
      { name: 'falsePositive', value: falsePositive, color: theme.palette.warning.main },
      { name: 'falseNegative', value: falseNegative, color: theme.palette.error.main },
    ];
  };
  
  // Calculate derived metrics from confusion matrix
  const calculateDerivedMetrics = () => {
    const selectedModelData = data.find(m => m.id === selectedModel);
    if (!selectedModelData || !selectedModelData.confusionMatrix) return null;
    
    const { truePositive, trueNegative, falsePositive, falseNegative } = selectedModelData.confusionMatrix;
    const total = truePositive + trueNegative + falsePositive + falseNegative;
    
    const accuracy = (truePositive + trueNegative) / total;
    const precision = truePositive / (truePositive + falsePositive);
    const recall = truePositive / (truePositive + falseNegative);
    const f1Score = 2 * (precision * recall) / (precision + recall);
    const specificity = trueNegative / (trueNegative + falsePositive);
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      specificity,
    };
  };
  
  // Filter metrics based on category
  const filteredMetricsData = prepareMetricsData().filter(metric => {
    if (metricFilter === 'all') return true;
    
    // Find the metric in any model to check its category
    for (const model of data) {
      const modelMetric = model.metrics.find(m => m.name === metric.name);
      if (modelMetric && modelMetric.category === metricFilter) {
        return true;
      }
    }
    
    return false;
  });
  
  // Get selected model data
  const selectedModelData = data.find(m => m.id === selectedModel);
  
  // Render metrics chart (radar or bar)
  const renderMetricsChart = () => {
    if (chartType === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={filteredMetricsData}>
            <PolarGrid stroke={theme.palette.divider} />
            <PolarAngleAxis dataKey="name" tick={{ fill: theme.palette.text.secondary }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: theme.palette.text.secondary }} />
            
            {data.map((model, index) => (
              <Radar
                key={model.id}
                name={model.name}
                dataKey={model.id}
                stroke={getModelColor(model.id, index)}
                fill={getModelColor(model.id, index)}
                fillOpacity={0.2}
              />
            ))}
            
            {showBenchmark && data.map((model, index) => (
              model.metrics.some(m => m.benchmark !== undefined) && (
                <Radar
                  key={`${model.id}_benchmark`}
                  name={`${model.name} Benchmark`}
                  dataKey={`${model.id}_benchmark`}
                  stroke={getModelColor(model.id, index)}
                  strokeDasharray="5 5"
                  fill="none"
                />
              )
            ))}
            
            {showLegend && <Legend />}
            {showTooltip && <Tooltip content={<MetricsTooltip />} />}
          </RadarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={filteredMetricsData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />}
            <XAxis type="number" tick={{ fill: theme.palette.text.secondary }} stroke={theme.palette.divider} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: theme.palette.text.secondary }}
              width={100}
              stroke={theme.palette.divider}
            />
            
            {data.map((model, index) => (
              <Bar
                key={model.id}
                dataKey={model.id}
                name={model.name}
                fill={getModelColor(model.id, index)}
                barSize={20}
              />
            ))}
            
            {showLegend && <Legend />}
            {showTooltip && <Tooltip content={<MetricsTooltip />} />}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };
  
  // Render ROC curve
  const renderROCCurve = () => {
    if (!selectedModelData || !selectedModelData.rocCurve) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="text.secondary">
            No ROC curve data available for this model
          </Typography>
        </Box>
      );
    }
    
    // Add reference line data (random classifier)
    const rocData = [
      { falsePositiveRate: 0, truePositiveRate: 0 },
      ...selectedModelData.rocCurve,
      { falsePositiveRate: 1, truePositiveRate: 1 },
    ];
    
    // Calculate AUC (Area Under Curve) using trapezoidal rule
    const calculateAUC = (rocPoints: ROCPoint[]) => {
      let auc = 0;
      for (let i = 1; i < rocPoints.length; i++) {
        const width = rocPoints[i].falsePositiveRate - rocPoints[i - 1].falsePositiveRate;
        const height = (rocPoints[i].truePositiveRate + rocPoints[i - 1].truePositiveRate) / 2;
        auc += width * height;
      }
      return auc;
    };
    
    const auc = calculateAUC(selectedModelData.rocCurve);
    
    return (
      <Box sx={{ height: 400 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            ROC Curve - {selectedModelData.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AUC: {auc.toFixed(4)}
          </Typography>
        </Box>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={rocData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis
              dataKey="falsePositiveRate"
              type="number"
              domain={[0, 1]}
              tick={{ fill: theme.palette.text.secondary }}
              stroke={theme.palette.divider}
              label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              dataKey="truePositiveRate"
              type="number"
              domain={[0, 1]}
              tick={{ fill: theme.palette.text.secondary }}
              stroke={theme.palette.divider}
              label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
            />
            
            {/* Reference line (random classifier) */}
            <Line
              type="linear"
              dataKey=""
              stroke={theme.palette.grey[500]}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              points={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            />
            
            <Line
              type="monotone"
              dataKey="truePositiveRate"
              stroke={getModelColor(selectedModel, 0)}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            {showTooltip && <Tooltip content={<ROCTooltip />} />}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render Precision-Recall curve
  const renderPRCurve = () => {
    if (!selectedModelData || !selectedModelData.precisionRecallCurve) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="text.secondary">
            No Precision-Recall curve data available for this model
          </Typography>
        </Box>
      );
    }
    
    // Add endpoints
    const prData = [
      { precision: 1, recall: 0 },
      ...selectedModelData.precisionRecallCurve,
    ];
    
    // Calculate average precision using trapezoidal rule
    const calculateAP = (prPoints: PrecisionRecallPoint[]) => {
      let ap = 0;
      for (let i = 1; i < prPoints.length; i++) {
        const width = prPoints[i].recall - prPoints[i - 1].recall;
        const height = (prPoints[i].precision + prPoints[i - 1].precision) / 2;
        ap += width * height;
      }
      return ap;
    };
    
    const ap = calculateAP(selectedModelData.precisionRecallCurve);
    
    return (
      <Box sx={{ height: 400 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Precision-Recall Curve - {selectedModelData.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average Precision: {ap.toFixed(4)}
          </Typography>
        </Box>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={prData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis
              dataKey="recall"
              type="number"
              domain={[0, 1]}
              tick={{ fill: theme.palette.text.secondary }}
              stroke={theme.palette.divider}
              label={{ value: 'Recall', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              dataKey="precision"
              type="number"
              domain={[0, 1]}
              tick={{ fill: theme.palette.text.secondary }}
              stroke={theme.palette.divider}
              label={{ value: 'Precision', angle: -90, position: 'insideLeft' }}
            />
            
            <Line
              type="monotone"
              dataKey="precision"
              stroke={getModelColor(selectedModel, 0)}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            {showTooltip && <Tooltip content={<PRTooltip />} />}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render confusion matrix
  const renderConfusionMatrix = () => {
    if (!selectedModelData || !selectedModelData.confusionMatrix) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="text.secondary">
            No confusion matrix data available for this model
          </Typography>
        </Box>
      );
    }
    
    const { truePositive, trueNegative, falsePositive, falseNegative } = selectedModelData.confusionMatrix;
    const total = truePositive + trueNegative + falsePositive + falseNegative;
    
    // Calculate derived metrics
    const derivedMetrics = calculateDerivedMetrics();
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 400 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Confusion Matrix - {selectedModelData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total samples: {total}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', height: 300, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              {/* Matrix header */}
              <Box sx={{ display: 'flex', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ width: '25%', p: 1, borderRight: `1px solid ${theme.palette.divider}` }}></Box>
                <Box sx={{ width: '37.5%', p: 1, textAlign: 'center', borderRight: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="body2" fontWeight="medium">Predicted Positive</Typography>
                </Box>
                <Box sx={{ width: '37.5%', p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="medium">Predicted Negative</Typography>
                </Box>
              </Box>
              
              {/* Actual Positive row */}
              <Box sx={{ display: 'flex', flexGrow: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ width: '25%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ transform: 'rotate(-90deg)' }}>Actual Positive</Typography>
                </Box>
                <Box sx={{ width: '37.5%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                  <MuiTooltip title="True Positive: Correctly predicted positive cases">
                    <Typography variant="h6" color="success.main">{truePositive}</Typography>
                  </MuiTooltip>
                </Box>
                <Box sx={{ width: '37.5%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
                  <MuiTooltip title="False Negative: Incorrectly predicted negative cases (Type II error)">
                    <Typography variant="h6" color="error.main">{falseNegative}</Typography>
                  </MuiTooltip>
                </Box>
              </Box>
              
              {/* Actual Negative row */}
              <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <Box sx={{ width: '25%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ transform: 'rotate(-90deg)' }}>Actual Negative</Typography>
                </Box>
                <Box sx={{ width: '37.5%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                  <MuiTooltip title="False Positive: Incorrectly predicted positive cases (Type I error)">
                    <Typography variant="h6" color="warning.main">{falsePositive}</Typography>
                  </MuiTooltip>
                </Box>
                <Box sx={{ width: '37.5%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                  <MuiTooltip title="True Negative: Correctly predicted negative cases">
                    <Typography variant="h6" color="info.main">{trueNegative}</Typography>
                  </MuiTooltip>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {derivedMetrics && (
            <Box sx={{ height: 400 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Performance Metrics - {selectedModelData.name}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Accuracy
                      </Typography>
                      <Typography variant="h5" fontWeight="medium">
                        {derivedMetrics.accuracy.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (TP + TN) / Total
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Precision
                      </Typography>
                      <Typography variant="h5" fontWeight="medium">
                        {derivedMetrics.precision.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        TP / (TP + FP)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Recall (Sensitivity)
                      </Typography>
                      <Typography variant="h5" fontWeight="medium">
                        {derivedMetrics.recall.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        TP / (TP + FN)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        F1 Score
                      </Typography>
                      <Typography variant="h5" fontWeight="medium">
                        {derivedMetrics.f1Score.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        2 * (Precision * Recall) / (Precision + Recall)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Specificity
                      </Typography>
                      <Typography variant="h5" fontWeight="medium">
                        {derivedMetrics.specificity.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        TN / (TN + FP)
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={prepareConfusionMatrixData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary }} stroke={theme.palette.divider} />
                  <YAxis tick={{ fill: theme.palette.text.secondary }} stroke={theme.palette.divider} />
                  <Tooltip content={<ConfusionMatrixTooltip />} />
                  <Bar dataKey="value">
                    {prepareConfusionMatrixData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Box sx={{ width, height }}>
      {/* Chart Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {title && (
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
          )}
          
          <MuiTooltip title="Model performance metrics help evaluate how well a machine learning model is performing on various criteria.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </Box>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {/* Model selection chips */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {data.map((model, index) => (
            <Chip
              key={model.id}
              label={model.name}
              color={selectedModel === model.id ? 'primary' : 'default'}
              variant={selectedModel === model.id ? 'filled' : 'outlined'}
              onClick={() => handleModelSelect(model.id)}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="model performance tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Metrics" />
          <Tab label="ROC Curve" />
          <Tab label="Precision-Recall" />
          <Tab label="Confusion Matrix" />
        </Tabs>
      </Paper>
      
      {/* Tab content */}
      <Box sx={{ mb: 3 }}>
        {tabValue === 0 && (
          <>
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="metric-filter-label">Metric Category</InputLabel>
                <Select
                  labelId="metric-filter-label"
                  value={metricFilter}
                  label="Metric Category"
                  onChange={handleMetricFilterChange}
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="accuracy">Accuracy</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="fit">Fit</MenuItem>
                  <MenuItem value="speed">Speed</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <ToggleButtonGroup
                size="small"
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                aria-label="chart type"
              >
                <ToggleButton value="radar" aria-label="radar chart">
                  Radar
                </ToggleButton>
                <ToggleButton value="bar" aria-label="bar chart">
                  Bar
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {renderMetricsChart()}
          </>
        )}
        
        {tabValue === 1 && renderROCCurve()}
        {tabValue === 2 && renderPRCurve()}
        {tabValue === 3 && renderConfusionMatrix()}
      </Box>
    </Box>
  );
};

export default ModelPerformanceMetricsChart;