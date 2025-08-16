import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  LineData, 
  HistogramData, 
  TimeRange 
} from 'lightweight-charts';
import { Box, useTheme } from '@mui/material';

// Types of technical indicators
export type IndicatorType = 
  | 'sma' 
  | 'ema' 
  | 'bollinger' 
  | 'rsi' 
  | 'macd' 
  | 'atr' 
  | 'stochastic' 
  | 'volume';

interface IndicatorSeries {
  type: 'line' | 'histogram';
  data: LineData[] | HistogramData[];
  color: string;
  lineWidth?: number;
  priceLineVisible?: boolean;
  lastValueVisible?: boolean;
  title?: string;
}

interface TechnicalIndicatorChartProps {
  indicators: IndicatorSeries[];
  width?: number | string;
  height?: number | string;
  timeRange?: TimeRange;
  autosize?: boolean;
  priceScaleMode?: 'normal' | 'logarithmic' | 'percentage';
  onTimeRangeChange?: (range: TimeRange) => void;
  onCrosshairMove?: (values: Map<ISeriesApi<any>, number> | null, time: number | null) => void;
  mainChartTimeScale?: IChartApi | null; // For syncing with main chart
}

const TechnicalIndicatorChart: React.FC<TechnicalIndicatorChartProps> = ({
  indicators,
  width = '100%',
  height = 150,
  timeRange,
  autosize = true,
  priceScaleMode = 'normal',
  onTimeRangeChange,
  onCrosshairMove,
  mainChartTimeScale = null,
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<any>[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const newChart = createChart(chartContainerRef.current, {
      width: autosize ? chartContainerRef.current.clientWidth : (typeof width === 'number' ? width : 800),
      height: typeof height === 'number' ? height : 150,
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

    // Create series for each indicator
    const newSeries: ISeriesApi<any>[] = indicators.map(indicator => {
      if (indicator.type === 'line') {
        const lineSeries = newChart.addLineSeries({
          color: indicator.color,
          lineWidth: indicator.lineWidth || 2,
          priceLineVisible: indicator.priceLineVisible !== undefined ? indicator.priceLineVisible : false,
          lastValueVisible: indicator.lastValueVisible !== undefined ? indicator.lastValueVisible : true,
          title: indicator.title,
        });
        lineSeries.setData(indicator.data as LineData[]);
        return lineSeries;
      } else {
        const histogramSeries = newChart.addHistogramSeries({
          color: indicator.color,
          priceLineVisible: indicator.priceLineVisible !== undefined ? indicator.priceLineVisible : false,
          lastValueVisible: indicator.lastValueVisible !== undefined ? indicator.lastValueVisible : true,
          title: indicator.title,
        });
        histogramSeries.setData(indicator.data as HistogramData[]);
        return histogramSeries;
      }
    });

    // Set time range if provided
    if (timeRange) {
      newChart.timeScale().setVisibleRange(timeRange);
    }

    // Subscribe to time range changes
    if (onTimeRangeChange) {
      newChart.timeScale().subscribeVisibleTimeRangeChange(onTimeRangeChange);
    }

    // Subscribe to crosshair move
    if (onCrosshairMove) {
      newChart.subscribeCrosshairMove((param) => {
        if (param.point === undefined) {
          onCrosshairMove(null, null);
          return;
        }

        const time = param.time as number | undefined;
        onCrosshairMove(param.seriesPrices, time || null);
      });
    }

    // Sync with main chart if provided
    if (mainChartTimeScale) {
      // Disable user time scale control on this chart
      newChart.timeScale().applyOptions({
        handleScroll: false,
        handleScale: false,
      });

      // Subscribe to main chart time range changes
      const syncTimeScale = () => {
        const mainVisibleRange = mainChartTimeScale.timeScale().getVisibleRange();
        if (mainVisibleRange) {
          newChart.timeScale().setVisibleRange(mainVisibleRange);
        }
      };

      // Initial sync
      syncTimeScale();

      // Set up sync interval
      const syncInterval = setInterval(syncTimeScale, 100);

      // Clean up interval on unmount
      return () => {
        clearInterval(syncInterval);
      };
    }

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
    setSeries(newSeries);

    // Cleanup on unmount
    return () => {
      if (onTimeRangeChange && newChart) {
        newChart.timeScale().unsubscribeVisibleTimeRangeChange(onTimeRangeChange);
      }
      if (onCrosshairMove && newChart) {
        newChart.unsubscribeCrosshairMove();
      }
      if (resizeObserverRef.current && chartContainerRef.current) {
        resizeObserverRef.current.unobserve(chartContainerRef.current);
        resizeObserverRef.current = null;
      }
      newChart.remove();
    };
  }, []);

  // Update data when indicators change
  useEffect(() => {
    if (chart && series.length === indicators.length) {
      indicators.forEach((indicator, index) => {
        if (series[index]) {
          series[index].setData(indicator.data as any);
        }
      });
    }
  }, [indicators, series]);

  // Update time range when it changes
  useEffect(() => {
    if (chart && timeRange && !mainChartTimeScale) {
      chart.timeScale().setVisibleRange(timeRange);
    }
  }, [timeRange, chart, mainChartTimeScale]);

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

  return (
    <Box
      ref={chartContainerRef}
      sx={{
        width: width,
        height: height,
        '& .tv-lightweight-charts': {
          width: '100% !important',
          height: '100% !important',
        },
      }}
    />
  );
};

export default TechnicalIndicatorChart;