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
  Brush,
  Area,
  ComposedChart,
  AreaChart
} from 'recharts';
import { Box, Typography, useTheme, Chip, Stack } from '@mui/material';

export interface PerformanceDataPoint {
  date: string | number; // Can be timestamp or formatted date string
  value: number;
  benchmark?: number;
  drawdown?: number;
  [key: string]: any; // Additional metrics
}

export interface PerformanceSeries {
  id: string;
  name: string;
  data: PerformanceDataPoint[];
  color?: string;
  visible?: boolean;
  type?: 'line' | 'area';
  yAxisId?: string;
}

interface PerformanceLineChartProps {
  series: PerformanceSeries[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showBrush?: boolean;
  showDrawdown?: boolean;
  showBenchmark?: boolean;
  showPercentage?: boolean;
  dateFormat?: string;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string | number) => string;
  timeRanges?: string[];
  onTimeRangeChange?: (range: string) => void;
  onSeriesToggle?: (seriesId: string, visible: boolean) => void;
}

const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({
  series,
  title,
  subtitle,
  height = 400,
  width = '100%',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showBrush = false,
  showDrawdown = false,
  showBenchmark = true,
  showPercentage = true,
  dateFormat,
  valueFormatter = (value) => showPercentage ? `${value.toFixed(2)}%` : `$${value.toLocaleString()}`,
  dateFormatter = (date) => typeof date === 'string' ? date : new Date(date).toLocaleDateString(),
  timeRanges = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX'],
  onTimeRangeChange,
  onSeriesToggle,
}) => {
  const theme = useTheme();
  const [activeTimeRange, setActiveTimeRange] = useState<string>(timeRanges[0]);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    series.reduce((acc, s) => ({ ...acc, [s.id]: s.visible !== false }), {})
  );

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
                {entry.name}: {valueFormatter(entry.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Determine if we need a dual axis (for drawdown)
  const needsDualAxis = showDrawdown && series.some(s => s.data.some(d => d.drawdown !== undefined));

  // Prepare chart data - merge all series data points
  const chartData = series.length > 0 
    ? series[0].data.map((point, i) => {
        const mergedPoint: any = { date: point.date };
        
        series.forEach(s => {
          if (s.data[i]) {
            mergedPoint[s.id] = s.data[i].value;
            
            if (showBenchmark && s.data[i].benchmark !== undefined) {
              mergedPoint[`${s.id}_benchmark`] = s.data[i].benchmark;
            }
            
            if (showDrawdown && s.data[i].drawdown !== undefined) {
              mergedPoint[`${s.id}_drawdown`] = s.data[i].drawdown;
            }
          }
        });
        
        return mergedPoint;
      })
    : [];

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
        
        {/* Time Range Selector */}
        {timeRanges && timeRanges.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
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
      </Box>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={typeof height === 'number' ? height - 50 : '90%'}>
        {showDrawdown ? (
          <ComposedChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis 
              dataKey="date" 
              tick={{ fill: theme.palette.text.secondary }}
              tickFormatter={dateFormatter}
              stroke={theme.palette.divider}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: theme.palette.text.secondary }}
              tickFormatter={valueFormatter}
              stroke={theme.palette.divider}
              domain={['auto', 'auto']}
            />
            {needsDualAxis && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: theme.palette.text.secondary }}
                tickFormatter={(value) => `${value.toFixed(2)}%`}
                stroke={theme.palette.divider}
                domain={[0, 'dataMax']}
              />
            )}
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={(e) => handleSeriesToggle(e.dataKey)} />}
            
            {/* Zero reference line */}
            <ReferenceLine y={0} stroke={theme.palette.divider} />
            
            {/* Performance lines */}
            {series.map((s, i) => (
              visibleSeries[s.id] && (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color || defaultColors[i % defaultColors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  yAxisId="left"
                />
              )
            ))}
            
            {/* Benchmark lines */}
            {showBenchmark && series.map((s, i) => (
              visibleSeries[s.id] && s.data.some(d => d.benchmark !== undefined) && (
                <Line
                  key={`${s.id}_benchmark`}
                  type="monotone"
                  dataKey={`${s.id}_benchmark`}
                  name={`${s.name} Benchmark`}
                  stroke={s.color || defaultColors[i % defaultColors.length]}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                  yAxisId="left"
                />
              )
            ))}
            
            {/* Drawdown areas */}
            {showDrawdown && series.map((s, i) => (
              visibleSeries[s.id] && s.data.some(d => d.drawdown !== undefined) && (
                <Area
                  key={`${s.id}_drawdown`}
                  type="monotone"
                  dataKey={`${s.id}_drawdown`}
                  name={`${s.name} Drawdown`}
                  fill={s.color || defaultColors[i % defaultColors.length]}
                  fillOpacity={0.2}
                  stroke={s.color || defaultColors[i % defaultColors.length]}
                  strokeWidth={1}
                  yAxisId={needsDualAxis ? "right" : "left"}
                />
              )
            ))}
            
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
        ) : (
          <LineChart data={chartData}>
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
            
            {/* Zero reference line */}
            <ReferenceLine y={0} stroke={theme.palette.divider} />
            
            {/* Performance lines */}
            {series.map((s, i) => (
              visibleSeries[s.id] && (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color || defaultColors[i % defaultColors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )
            ))}
            
            {/* Benchmark lines */}
            {showBenchmark && series.map((s, i) => (
              visibleSeries[s.id] && s.data.some(d => d.benchmark !== undefined) && (
                <Line
                  key={`${s.id}_benchmark`}
                  type="monotone"
                  dataKey={`${s.id}_benchmark`}
                  name={`${s.name} Benchmark`}
                  stroke={s.color || defaultColors[i % defaultColors.length]}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                />
              )
            ))}
            
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
          </LineChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default PerformanceLineChart;