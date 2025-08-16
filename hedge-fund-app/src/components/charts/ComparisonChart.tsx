import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  LineData, 
  TimeRange,
  ColorType
} from 'lightweight-charts';
import { Box, useTheme } from '@mui/material';

export interface ComparisonSeries {
  id: string;
  name: string;
  data: LineData[];
  color: string;
  visible?: boolean;
}

interface ComparisonChartProps {
  series: ComparisonSeries[];
  width?: number | string;
  height?: number | string;
  timeRange?: TimeRange;
  autosize?: boolean;
  priceScaleMode?: 'normal' | 'logarithmic' | 'percentage';
  onTimeRangeChange?: (range: TimeRange) => void;
  onCrosshairMove?: (values: Map<ISeriesApi<any>, number> | null, time: number | null) => void;
  onSeriesClick?: (seriesId: string) => void;
  legend?: boolean;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({
  series,
  width = '100%',
  height = 400,
  timeRange,
  autosize = true,
  priceScaleMode = 'percentage', // Default to percentage for comparison
  onTimeRangeChange,
  onCrosshairMove,
  onSeriesClick,
  legend = true,
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const legendContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [lineSeries, setLineSeries] = useState<Record<string, ISeriesApi<'Line'>>>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [legendData, setLegendData] = useState<Record<string, { price: number | null, color: string, name: string }>>({});

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const newChart = createChart(chartContainerRef.current, {
      width: autosize ? chartContainerRef.current.clientWidth : (typeof width === 'number' ? width : 800),
      height: typeof height === 'number' ? height : 400,
      layout: {
        background: { color: theme.palette.background.paper },
        textColor: theme.palette.text.primary,
      },
      grid: {
        vertLines: { color: theme.palette.divider },
        horzLines: { color: theme.palette.divider },
      },
      timeScale: {
        borderColor: theme.palette.divider,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: theme.palette.divider,
        mode: priceScaleMode,
      },
      crosshair: {
        mode: 0, // Normal mode
        vertLine: {
          color: theme.palette.primary.main,
          width: 1,
          style: 1, // Solid line
          labelBackgroundColor: theme.palette.primary.main,
        },
        horzLine: {
          color: theme.palette.primary.main,
          width: 1,
          style: 1, // Solid line
          labelBackgroundColor: theme.palette.primary.main,
        },
      },
    });

    // Create series for each comparison item
    const newLineSeries: Record<string, ISeriesApi<'Line'>> = {};
    
    series.forEach((s) => {
      const lineSeries = newChart.addLineSeries({
        color: s.color as ColorType,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: s.name,
        visible: s.visible !== undefined ? s.visible : true,
      });
      
      lineSeries.setData(s.data);
      newLineSeries[s.id] = lineSeries;
      
      // Initialize legend data
      setLegendData(prev => ({
        ...prev,
        [s.id]: {
          price: s.data.length > 0 ? (s.data[s.data.length - 1] as LineData).value : null,
          color: s.color,
          name: s.name
        }
      }));
    });

    // Set time range if provided
    if (timeRange) {
      newChart.timeScale().setVisibleRange(timeRange);
    }

    // Subscribe to time range changes
    if (onTimeRangeChange) {
      newChart.timeScale().subscribeVisibleTimeRangeChange(onTimeRangeChange);
    }

    // Subscribe to crosshair move for legend updates
    newChart.subscribeCrosshairMove((param) => {
      if (param.point === undefined) {
        // Reset to last values when crosshair is not on the chart
        const updatedLegendData: Record<string, { price: number | null, color: string, name: string }> = {};
        
        series.forEach((s) => {
          updatedLegendData[s.id] = {
            price: s.data.length > 0 ? (s.data[s.data.length - 1] as LineData).value : null,
            color: s.color,
            name: s.name
          };
        });
        
        setLegendData(updatedLegendData);
        
        if (onCrosshairMove) {
          onCrosshairMove(null, null);
        }
        return;
      }

      // Update legend with crosshair values
      const updatedLegendData: Record<string, { price: number | null, color: string, name: string }> = {};
      const seriesPrices = new Map<ISeriesApi<any>, number>();
      
      Object.entries(newLineSeries).forEach(([id, series]) => {
        const price = param.seriesPrices.get(series) as number | undefined;
        const s = series.find(s => s.id === id);
        
        updatedLegendData[id] = {
          price: price || null,
          color: s ? s.color : '#000000',
          name: s ? s.name : id
        };
        
        if (price !== undefined) {
          seriesPrices.set(series, price);
        }
      });
      
      setLegendData(updatedLegendData);
      
      const time = param.time as number | undefined;
      if (onCrosshairMove) {
        onCrosshairMove(seriesPrices, time || null);
      }
    });

    // Set up resize observer if autosize is enabled
    if (autosize && chartContainerRef.current) {
      resizeObserverRef.current = new ResizeObserver(entries => {
        const { width: newWidth } = entries[0].contentRect;
        newChart.applyOptions({ width: newWidth });
      });
      resizeObserverRef.current.observe(chartContainerRef.current);
    }

    // Save references
    setChart(newChart);
    setLineSeries(newLineSeries);

    // Cleanup on unmount
    return () => {
      if (onTimeRangeChange && newChart) {
        newChart.timeScale().unsubscribeVisibleTimeRangeChange(onTimeRangeChange);
      }
      newChart.unsubscribeCrosshairMove();
      if (resizeObserverRef.current && chartContainerRef.current) {
        resizeObserverRef.current.unobserve(chartContainerRef.current);
        resizeObserverRef.current = null;
      }
      newChart.remove();
    };
  }, []);

  // Update data when series change
  useEffect(() => {
    if (chart && Object.keys(lineSeries).length > 0) {
      series.forEach((s) => {
        if (lineSeries[s.id]) {
          lineSeries[s.id].setData(s.data);
          
          // Update visibility if changed
          if (s.visible !== undefined) {
            lineSeries[s.id].applyOptions({
              visible: s.visible
            });
          }
        }
      });
    }
  }, [series, lineSeries]);

  // Update time range when it changes
  useEffect(() => {
    if (chart && timeRange) {
      chart.timeScale().setVisibleRange(timeRange);
    }
  }, [timeRange, chart]);

  // Update theme when it changes
  useEffect(() => {
    if (chart) {
      chart.applyOptions({
        layout: {
          background: { color: theme.palette.background.paper },
          textColor: theme.palette.text.primary,
        },
        grid: {
          vertLines: { color: theme.palette.divider },
          horzLines: { color: theme.palette.divider },
        },
        timeScale: {
          borderColor: theme.palette.divider,
        },
        rightPriceScale: {
          borderColor: theme.palette.divider,
        },
        crosshair: {
          vertLine: {
            color: theme.palette.primary.main,
            labelBackgroundColor: theme.palette.primary.main,
          },
          horzLine: {
            color: theme.palette.primary.main,
            labelBackgroundColor: theme.palette.primary.main,
          },
        },
      });
    }
  }, [theme, chart]);

  // Handle legend item click to toggle visibility
  const handleLegendItemClick = (seriesId: string) => {
    if (onSeriesClick) {
      onSeriesClick(seriesId);
    }
  };

  return (
    <Box sx={{ width, height: typeof height === 'number' ? height + (legend ? 30 : 0) : height }}>
      {legend && (
        <Box
          ref={legendContainerRef}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 1,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: theme.palette.background.default,
          }}
        >
          {Object.entries(legendData).map(([id, data]) => (
            <Box
              key={id}
              onClick={() => handleLegendItemClick(id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                opacity: series.find(s => s.id === id)?.visible === false ? 0.5 : 1,
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: data.color,
                  mr: 1,
                }}
              />
              <Box>
                <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 'medium' }}>
                  {data.name}
                </Box>
                {data.price !== null && (
                  <Box component="span" sx={{ fontSize: '0.875rem', ml: 1 }}>
                    {data.price.toFixed(2)}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      
      <Box
        ref={chartContainerRef}
        sx={{
          width: '100%',
          height: legend ? `calc(100% - 30px)` : '100%',
          '& .tv-lightweight-charts': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      />
    </Box>
  );
};

export default ComparisonChart;