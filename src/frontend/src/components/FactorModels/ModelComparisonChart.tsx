import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ModelComparisonChartProps {
  data: {
    model_names: string[];
    comparison_results: {
      [model_name: string]: {
        metrics: {
          mse: number;
          rmse: number;
          mae: number;
          r_squared: number;
          information_coefficient: number;
          [key: string]: number;
        };
      };
    };
    symbols_used: string[];
    days_analyzed: number;
    generated_at: string;
  };
}

const ModelComparisonChart: React.FC<ModelComparisonChartProps> = ({ data }) => {
  // Extract model names and metrics
  const modelNames = data.model_names || Object.keys(data.comparison_results || {});
  const metricKeys = modelNames.length > 0 && data.comparison_results[modelNames[0]]?.metrics
    ? Object.keys(data.comparison_results[modelNames[0]].metrics)
    : [];
  
  // State for selected metric
  const [selectedMetric, setSelectedMetric] = useState<string>(metricKeys[0] || '');
  
  // Prepare data for bar chart comparison
  const prepareBarChartData = () => {
    return modelNames.map(modelName => {
      const metrics = data.comparison_results[modelName]?.metrics || {};
      
      return {
        model: modelName,
        value: metrics[selectedMetric] || 0
      };
    });
  };
  
  // Prepare data for radar chart
  const prepareRadarChartData = () => {
    return metricKeys.map(metric => {
      const result: any = { metric };
      
      modelNames.forEach(modelName => {
        const metrics = data.comparison_results[modelName]?.metrics || {};
        result[modelName] = metrics[metric] || 0;
      });
      
      return result;
    });
  };
  
  // Generate colors for charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ];
  
  const barChartData = prepareBarChartData();
  const radarChartData = prepareRadarChartData();
  
  // Format metric name for display
  const formatMetricName = (metric: string) => {
    return metric
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Determine if lower values are better for a metric
  const isLowerBetter = (metric: string) => {
    return ['mse', 'rmse', 'mae'].includes(metric.toLowerCase());
  };
  
  // Find the best model for the selected metric
  const findBestModel = () => {
    if (!selectedMetric || modelNames.length === 0) return null;
    
    let bestModel = modelNames[0];
    let bestValue = data.comparison_results[bestModel]?.metrics[selectedMetric] || 0;
    
    modelNames.forEach(modelName => {
      const value = data.comparison_results[modelName]?.metrics[selectedMetric] || 0;
      
      if (isLowerBetter(selectedMetric)) {
        if (value < bestValue) {
          bestValue = value;
          bestModel = modelName;
        }
      } else {
        if (value > bestValue) {
          bestValue = value;
          bestModel = modelName;
        }
      }
    });
    
    return { model: bestModel, value: bestValue };
  };
  
  const bestModel = findBestModel();
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Factor Model Comparison
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary">
          Comparing {modelNames.length} models using {data.symbols_used?.length || 0} symbols over {data.days_analyzed || 0} days
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Generated at: {data.generated_at}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Metric Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="metric-select-label">Select Metric</InputLabel>
                <Select
                  labelId="metric-select-label"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as string)}
                  label="Select Metric"
                  size="small"
                >
                  {metricKeys.map((metric) => (
                    <MenuItem key={metric} value={metric}>
                      {formatMetricName(metric)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {bestModel && (
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mr: 1, display: 'inline' }}>
                    Best model for {formatMetricName(selectedMetric)}:
                  </Typography>
                  <Chip 
                    label={`${bestModel.model} (${bestModel.value.toFixed(4)})`} 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Bar Chart Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              {formatMetricName(selectedMetric)} Comparison
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip formatter={(value) => value.toFixed(4)} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  name={formatMetricName(selectedMetric)}
                  isAnimationActive={false}
                >
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Multi-Metric Comparison
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart outerRadius={150} data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis />
                {modelNames.map((modelName, index) => (
                  <Radar
                    key={modelName}
                    name={modelName}
                    dataKey={modelName}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.3}
                    isAnimationActive={false}
                  />
                ))}
                <Legend />
                <Tooltip formatter={(value) => value.toFixed(4)} />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Metrics Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Detailed Metrics Comparison
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Metric</th>
                    {modelNames.map(modelName => (
                      <th key={modelName} style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {modelName}
                      </th>
                    ))}
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Best Model</th>
                  </tr>
                </thead>
                <tbody>
                  {metricKeys.map(metric => {
                    // Find best model for this metric
                    let bestModelForMetric = modelNames[0];
                    let bestValue = data.comparison_results[bestModelForMetric]?.metrics[metric] || 0;
                    
                    modelNames.forEach(modelName => {
                      const value = data.comparison_results[modelName]?.metrics[metric] || 0;
                      
                      if (isLowerBetter(metric)) {
                        if (value < bestValue) {
                          bestValue = value;
                          bestModelForMetric = modelName;
                        }
                      } else {
                        if (value > bestValue) {
                          bestValue = value;
                          bestModelForMetric = modelName;
                        }
                      }
                    });
                    
                    return (
                      <tr key={metric}>
                        <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                          <strong>{formatMetricName(metric)}</strong>
                        </td>
                        {modelNames.map(modelName => {
                          const value = data.comparison_results[modelName]?.metrics[metric] || 0;
                          const isBest = modelName === bestModelForMetric;
                          
                          return (
                            <td 
                              key={`${metric}-${modelName}`} 
                              style={{ 
                                padding: '8px', 
                                textAlign: 'right', 
                                borderBottom: '1px solid #ddd',
                                fontWeight: isBest ? 'bold' : 'normal',
                                backgroundColor: isBest ? '#f0f8ff' : 'transparent'
                              }}
                            >
                              {value.toFixed(4)}
                            </td>
                          );
                        })}
                        <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                          <Chip 
                            label={bestModelForMetric} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelComparisonChart;