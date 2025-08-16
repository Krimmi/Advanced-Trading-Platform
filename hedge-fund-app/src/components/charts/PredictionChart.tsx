import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart,
  Scatter,
  ErrorBar,
  Brush
} from 'recharts';
import { Box, Typography, useTheme, Chip, Stack, ToggleButtonGroup, ToggleButton } from '@mui/material';

export interface PredictionDataPoint {
  date: string | number; // Can be timestamp or formatted date string
  actual?: number;
  predicted?: number;
  lower?: number;
  upper?: number;
  [key: string]: any; // Additional metrics
}

export interface PredictionSeries {
  id: string;
  name: string;
  data: PredictionDataPoint[];
  color?: string;
  visible?: boolean;
}

interface PredictionChartProps {
  series: PredictionSeries[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showBrush?: boolean;
  showConfidenceInterval?: boolean;
  showCurrentDate?: boolean;
  dateFormat?: string;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string | number) => string;
  timeRanges?: string[];
  onTimeRangeChange?: (range: string) => void;
  onSeriesToggle?: (seriesId: string, visible: boolean) => void;
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  series,
  title,
  subtitle,
  height = 400,
  width = '100%',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showBrush = false,
  showConfidenceInterval = true,
  showCurrentDate = true,
  dateFormat,
  valueFormatter = (value) => `$${value.toLocaleString()}`,
  dateFormatter = (date) => typeof date === 'string' ? date : new Date(date).toLocaleDateString(),
  timeRanges = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL'],
  onTimeRangeChange,
  onSeriesToggle,
}) => {
  const theme = useTheme();
  const [activeTimeRange, setActiveTimeRange] = useState<string>(timeRanges[0]);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    series.reduce((acc, s) => ({ ...acc, [s.id]: s.visible !== false }), {})
  );
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  // Default colors if not provided in series
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setActiveTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };

  // Handle series toggle
  const handleSeriesToggle = (seriesId: string) => {
    const newVisibility = !visibleSeries[seriesId];
    setVisibleSeries({
      ...visibleSeries,
      [seriesId]: newVisibility,
    });
    
    if (onSeriesToggle) {
      onSeriesToggle(seriesId, newVisibility);
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'line' | 'area',
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {dateFormatter(label)}
          </Typography>
          
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'lower' || entry.dataKey === 'upper') return null;
            
            return (
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
                  {entry.name}: {valueFormatter(entry.value)}
                </Typography>
              </Box>
            );
          })}
          
          {showConfidenceInterval && payload.some((p: any) => p.dataKey === 'predicted') && (
            <Box sx={{ mt: 1, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
              <Typography variant="caption" color="text.secondary">
                Confidence Interval: {valueFormatter(payload.find((p: any) => p.dataKey === 'lower')?.value || 0)} - {valueFormatter(payload.find((p: any) => p.dataKey === 'upper')?.value || 0)}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Prepare chart data - merge all series data points
  const chartData = series.length > 0 
    ? series[0].data.map((point, i) => {
        const mergedPoint: any = { date: point.date };
        
        series.forEach(s => {
          if (s.data[i]) {
            if (s.data[i].actual !== undefined) mergedPoint.actual = s.data[i].actual;
            if (s.data[i].predicted !== undefined) mergedPoint.predicted = s.data[i].predicted;
            if (s.data[i].lower !== undefined) mergedPoint.lower = s.data[i].lower;
            if (s.data[i].upper !== undefined) mergedPoint.upper = s.data[i].upper;
            
            // Add any additional metrics
            Object.keys(s.data[i]).forEach(key => {
              if (!['date', 'actual', 'predicted', 'lower', 'upper'].includes(key)) {
                mergedPoint[key] = s.data[i][key];
              }
            });
          }
        });
        
        return mergedPoint;
      })
    : [];

  // Find the current date index for reference line
  const currentDateIndex = chartData.findIndex(d => {
    if (typeof d.date === 'string') {
      return new Date(d.date) <= new Date();
    }
    return d.date <= Date.now();
  });

  // Determine if we have prediction data
  const hasPrediction = chartData.some(d => d.predicted !== undefined);
  const hasConfidenceInterval = showConfidenceInterval && chartData.some(d => d.lower !== undefined && d.upper !== undefined);

  return (
    <Box sx={{ width, height: typeof height === 'number' ? height + 50 : height }}>
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
          {/* Time Range Selector */}
          {timeRanges && timeRanges.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {timeRanges.map((range) => (
                <Chip
                  key={range}
                  label={range}
                  size="small"
                  color={activeTimeRange === range ? 'primary' : 'default'}
                  variant={activeTimeRange === range ? 'filled' : 'outlined'}
                  onClick={() => handleTimeRangeChange(range)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          )}
          
          {/* Chart Type Selector */}
          <ToggleButtonGroup
            size="small"
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
          >
            <ToggleButton value="line" aria-label="line chart">
              Line
            </ToggleButton>
            <ToggleButton value="area" aria-label="area chart">
              Area
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={typeof height === 'number' ? height - 50 : '90%'}>
        <ComposedChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
          <XAxis 
            dataKey="date" 
            tick={{ fill: theme.palette.text.secondary }}
            tickFormatter={dateFormatter}
            stroke={theme.palette.divider}
          />
          <YAxis 
            tick={{ fill: theme.palette.text.secondary }}
            tickFormatter={valueFormatter}
            stroke={theme.palette.divider}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={(e) => handleSeriesToggle(e.dataKey)} />}
          
          {/* Confidence Interval Area */}
          {hasConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="transparent"
              fill={theme.palette.primary.main}
              fillOpacity={0.1}
              activeDot={false}
            />
          )}
          
          {hasConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="lower"
              stroke="transparent"
              fill={theme.palette.primary.main}
              fillOpacity={0.1}
              activeDot={false}
            />
          )}
          
          {/* Current Date Reference Line */}
          {showCurrentDate && currentDateIndex >= 0 && (
            <ReferenceLine
              x={chartData[currentDateIndex].date}
              stroke={theme.palette.warning.main}
              strokeDasharray="3 3"
              label={{
                value: 'Current',
                position: 'insideTopRight',
                fill: theme.palette.warning.main,
                fontSize: 12,
              }}
            />
          )}
          
          {/* Actual Data Line */}
          {chartType === 'line' ? (
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          ) : (
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={theme.palette.success.main}
              fill={theme.palette.success.main}
              fillOpacity={0.2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          )}
          
          {/* Prediction Line */}
          {hasPrediction && chartType === 'line' ? (
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          ) : hasPrediction && (
            <Area
              type="monotone"
              dataKey="predicted"
              name="Predicted"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          )}
          
          {/* Brush for time range selection */}
          {showBrush && (
            <Brush 
              dataKey="date" 
              height={30} 
              stroke={theme.palette.primary.main}
              tickFormatter={dateFormatter}
              travellerWidth={10}
              y={height - 70}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PredictionChart;