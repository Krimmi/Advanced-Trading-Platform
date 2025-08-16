import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  HistogramData, 
  TimeRange,
  ColorType
} from 'lightweight-charts';
import { Box, useTheme } from '@mui/material';

interface VolumeChartProps {
  data: HistogramData[];
  width?: number | string;
  height?: number | string;
  timeRange?: TimeRange;
  autosize?: boolean;
  onTimeRangeChange?: (range: TimeRange) => void;
  onCrosshairMove?: (volume: number | null, time: number | null) => void;
  mainChartTimeScale?: IChartApi | null; // For syncing with main chart
  priceData?: { time: number; close: number }[]; // For coloring volume bars based on price change
}

const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  width = '100%',
  height = 150,
  timeRange,
  autosize = true,
  onTimeRangeChange,
  onCrosshairMove,
  mainChartTimeScale = null,
  priceData = [],
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Histogram'> | null>(null);
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
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
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

    // Create volume series
    const newSeries = newChart.addHistogramSeries({
      color: theme.palette.primary.main,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
      title: 'Volume',
      // Color function for volume bars based on price change
      ...(priceData.length > 0 && {
        color: (data: HistogramData) => {
          // Find corresponding price data
          const pricePoint = priceData.find(p => p.time === data.time);
          if (!pricePoint) return theme.palette.primary.main as ColorType;
          
          // Find previous price point
          const index = priceData.findIndex(p => p.time === data.time);
          if (index <= 0) return theme.palette.primary.main as ColorType;
          
          const prevPricePoint = priceData[index - 1];
          
          // Color based on price change
          return pricePoint.close >= prevPricePoint.close 
            ? theme.palette.success.main as ColorType 
            : theme.palette.error.main as ColorType;
        }
      })
    });

    // Set data
    newSeries.setData(data);

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

        const volume = param.seriesPrices.get(newSeries) as number | undefined;
        const time = param.time as number | undefined;

        onCrosshairMove(volume || null, time || null);
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

  // Update data when it changes
  useEffect(() => {
    if (series && data.length > 0) {
      series.setData(data);
    }
  }, [data, series]);

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

    if (series && !priceData.length) {
      series.applyOptions({
        color: theme.palette.primary.main,
      });
    }
  }, [theme, chart, series]);

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

export default VolumeChart;