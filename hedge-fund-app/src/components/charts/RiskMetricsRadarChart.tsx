import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

export interface RiskMetric {
  name: string;
  fullName?: string;
  description?: string;
  min?: number;
  max?: number;
  benchmark?: number;
  ideal?: 'high' | 'low' | 'mid';
}

export interface RiskMetricsData {
  id: string;
  name: string;
  color?: string;
  metrics: Record<string, number>;
}

interface RiskMetricsRadarChartProps {
  data: RiskMetricsData[];
  metrics: RiskMetric[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showAxisLabels?: boolean;
  valueFormatter?: (value: number, metricName: string) => string;
  nameFormatter?: (name: string) => string;
}

const RiskMetricsRadarChart: React.FC<RiskMetricsRadarChartProps> = ({
  data,
  metrics,
  title,
  subtitle,
  height = 400,
  width = '100%',
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showAxisLabels = true,
  valueFormatter = (value, metricName) => value.toFixed(2),
  nameFormatter = (name) => name,
}) => {
  const theme = useTheme();

  // Default colors if not provided in data
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  // Transform data for radar chart
  const chartData = metrics.map(metric => {
    const dataPoint: any = {
      metric: metric.name,
      fullName: metric.fullName || metric.name,
      description: metric.description || '',
    };

    // Add each portfolio's value for this metric
    data.forEach(portfolio => {
      dataPoint[portfolio.id] = portfolio.metrics[metric.name] || 0;
    });

    // Add benchmark if available
    if (metric.benchmark !== undefined) {
      dataPoint.benchmark = metric.benchmark;
    }

    return dataPoint;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metric = metrics.find(m => m.name === label);
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            maxWidth: 250,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {metric?.fullName || label}
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
                {entry.name}: {valueFormatter(entry.value, label)}
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

  return (
    <Box sx={{ width, height }}>
      {/* Chart Header */}
      <Box sx={{ mb: 2 }}>
        {title && (
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={typeof height === 'number' ? height - 50 : '90%'}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          {showGrid && <PolarGrid stroke={theme.palette.divider} />}
          
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: theme.palette.text.primary }}
            tickFormatter={nameFormatter}
          />
          
          {showAxisLabels && (
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              tick={{ fill: theme.palette.text.secondary }}
            />
          )}
          
          {/* Portfolio metrics */}
          {data.map((portfolio, index) => (
            <Radar
              key={portfolio.id}
              name={portfolio.name}
              dataKey={portfolio.id}
              stroke={portfolio.color || defaultColors[index % defaultColors.length]}
              fill={portfolio.color || defaultColors[index % defaultColors.length]}
              fillOpacity={0.2}
            />
          ))}
          
          {/* Benchmark if available */}
          {metrics.some(m => m.benchmark !== undefined) && (
            <Radar
              name="Benchmark"
              dataKey="benchmark"
              stroke={theme.palette.grey[500]}
              strokeDasharray="5 5"
              fill="none"
            />
          )}
          
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span style={{ color: theme.palette.text.primary }}>
                  {value}
                </span>
              )}
            />
          )}
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RiskMetricsRadarChart;