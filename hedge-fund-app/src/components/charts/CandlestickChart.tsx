import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData,
  HistogramData,
  TimeRange,
  MouseEventParams,
  DeepPartial,
  ChartOptions
} from 'lightweight-charts';
import { Box, useTheme } from '@mui/material';

// Types for technical indicators
export interface IndicatorConfig {
  id: string;
  type: 'sma' | 'ema' | 'bollinger' | 'rsi' | 'macd' | 'volume' | 'atr' | 'stochastic' | 'ichimoku' | 'pivot';
  params: Record<string, any>;
  visible: boolean;
  color?: string;
  priceScaleId?: string;
}

export interface OverlayIndicator {
  id: string;
  type: 'line' | 'histogram';
  data: LineData[] | HistogramData[];
  color: string;
  lineWidth?: number;
  priceLineVisible?: boolean;
  lastValueVisible?: boolean;
  title?: string;
  priceScaleId?: string;
}

export interface ChartInteractionOptions {
  zoomEnabled?: boolean;
  panEnabled?: boolean;
  selectionEnabled?: boolean;
  drawingEnabled?: boolean;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  width?: number | string;
  height?: number | string;
  timeRange?: TimeRange;
  autosize?: boolean;
  indicators?: OverlayIndicator[];
  interactionOptions?: ChartInteractionOptions;
  onTimeRangeChange?: (range: TimeRange) => void;
  onCrosshairMove?: (price: number | null, time: number | null) => void;
  onSelectionComplete?: (from: number, to: number) => void;
  chartOptions?: DeepPartial<ChartOptions>;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  width = '100%',
  height = 400,
  timeRange,
  autosize = true,
  indicators = [],
  interactionOptions = {
    zoomEnabled: true,
    panEnabled: true,
    selectionEnabled: false,
    drawingEnabled: false,
  },
  onTimeRangeChange,
  onCrosshairMove,
  onSelectionComplete,
  chartOptions = {},
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [indicatorSeries, setIndicatorSeries] = useState<Record<string, ISeriesApi<any>>>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with default options
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
      // Apply custom chart options
      ...chartOptions,
    });

    // Create candlestick series
    const newCandleSeries = newChart.addCandlestickSeries({
      upColor: theme.palette.success.main,
      downColor: theme.palette.error.main,
      borderVisible: false,
      wickUpColor: theme.palette.success.main,
      wickDownColor: theme.palette.error.main,
    });

    // Set data
    newCandleSeries.setData(data);

    // Add indicators
    const newIndicatorSeries: Record<string, ISeriesApi<any>> = {};
    
    indicators.forEach(indicator => {
      if (indicator.type === 'line') {
        const series = newChart.addLineSeries({
          color: indicator.color,
          lineWidth: indicator.lineWidth || 2,
          priceLineVisible: indicator.priceLineVisible !== undefined ? indicator.priceLineVisible : false,
          lastValueVisible: indicator.lastValueVisible !== undefined ? indicator.lastValueVisible : true,
          title: indicator.title,
          priceScaleId: indicator.priceScaleId,
        });
        series.setData(indicator.data as LineData[]);
        newIndicatorSeries[indicator.id] = series;
      } else if (indicator.type === 'histogram') {
        const series = newChart.addHistogramSeries({
          color: indicator.color,
          priceLineVisible: indicator.priceLineVisible !== undefined ? indicator.priceLineVisible : false,
          lastValueVisible: indicator.lastValueVisible !== undefined ? indicator.lastValueVisible : true,
          title: indicator.title,
          priceScaleId: indicator.priceScaleId,
        });
        series.setData(indicator.data as HistogramData[]);
        newIndicatorSeries[indicator.id] = series;
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
        const price = param.seriesPrices.get(newCandleSeries) as number | undefined;
        const time = param.time as number | undefined;
        onCrosshairMove(price || null, time || null);
      });
    }

    // Set up interaction options
    newChart.applyOptions({
      handleScale: interactionOptions.zoomEnabled,
      handleScroll: interactionOptions.panEnabled,
    });

    // Set up selection if enabled
    if (interactionOptions.selectionEnabled && onSelectionComplete) {
      chartContainerRef.current.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
          setIsSelecting(true);
          const time = newChart.timeScale().coordinateToTime(e.offsetX) as number;
          setSelectionStart(time);
        }
      });

      chartContainerRef.current.addEventListener('mouseup', (e) => {
        if (isSelecting && selectionStart !== null) {
          const time = newChart.timeScale().coordinateToTime(e.offsetX) as number;
          setIsSelecting(false);
          
          // Ensure start is before end
          const start = Math.min(selectionStart, time);
          const end = Math.max(selectionStart, time);
          
          if (onSelectionComplete) {
            onSelectionComplete(start, end);
          }
          
          setSelectionStart(null);
        }
      });
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
    setCandleSeries(newCandleSeries);
    setIndicatorSeries(newIndicatorSeries);

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
      
      // Remove event listeners
      if (interactionOptions.selectionEnabled && chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('mousedown', () => {});
        chartContainerRef.current.removeEventListener('mouseup', () => {});
      }
      
      newChart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (candleSeries && data.length > 0) {
      candleSeries.setData(data);
    }
  }, [data, candleSeries]);

  // Update indicators when they change
  useEffect(() => {
    if (!chart) return;

    // Remove old indicators that are no longer in the list
    Object.entries(indicatorSeries).forEach(([id, series]) => {
      if (!indicators.find(i => i.id === id)) {
        chart.removeSeries(series);
        delete indicatorSeries[id];
      }
    });

    // Update or add new indicators
    indicators.forEach(indicator => {
      if (indicatorSeries[indicator.id]) {
        // Update existing indicator
        indicatorSeries[indicator.id].setData(indicator.data as any);
        
        // Update options if needed
        indicatorSeries[indicator.id].applyOptions({
          color: indicator.color,
          lineWidth: indicator.type === 'line' ? indicator.lineWidth : undefined,
          priceLineVisible: indicator.priceLineVisible,
          lastValueVisible: indicator.lastValueVisible,
          title: indicator.title,
        });
      } else {
        // Add new indicator
        if (indicator.type === 'line') {
          const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: indicator.lineWidth || 2,
            priceLineVisible: indicator.priceLineVisible !== undefined ? indicator.priceLineVisible : false,
            lastValueVisible: indicator.lastValueVisible !== undefined ? indicator.lastValueVisible : true,
            title: indicator.title,
            priceScaleId: indicator.priceScaleId,
          });
          series.setData(indicator.data as LineData[]);
          indicatorSeries[indicator.id] = series;
        } else if (indicator.type === 'histogram') {
          const series = chart.addHistogramSeries({
            color: indicator.color,
            priceLineVisible: indicator.priceLineVisible !== undefined ? indicator.priceLineVisible : false,
            lastValueVisible: indicator.lastValueVisible !== undefined ? indicator.lastValueVisible : true,
            title: indicator.title,
            priceScaleId: indicator.priceScaleId,
          });
          series.setData(indicator.data as HistogramData[]);
          indicatorSeries[indicator.id] = series;
        }
      }
    });

    setIndicatorSeries({ ...indicatorSeries });
  }, [indicators, chart]);

  // Update time range when it changes
  useEffect(() => {
    if (chart && timeRange) {
      chart.timeScale().setVisibleRange(timeRange);
    }
  }, [timeRange, chart]);

  // Update interaction options when they change
  useEffect(() => {
    if (chart) {
      chart.applyOptions({
        handleScale: interactionOptions.zoomEnabled,
        handleScroll: interactionOptions.panEnabled,
      });
    }
  }, [interactionOptions, chart]);

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
    if (candleSeries) {
      candleSeries.applyOptions({
        upColor: theme.palette.success.main,
        downColor: theme.palette.error.main,
        wickUpColor: theme.palette.success.main,
        wickDownColor: theme.palette.error.main,
      });
    }
  }, [theme, chart, candleSeries]);

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
        position: 'relative',
      }}
    />
  );
};

export default CandlestickChart;