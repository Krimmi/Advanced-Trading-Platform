import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, CandlestickData, HistogramData, TimeRange } from 'lightweight-charts';
import { Box, CircularProgress, Typography, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Types
interface StockChartProps {
  symbol: string;
  data: CandlestickData[] | LineData[];
  volumeData?: HistogramData[];
  chartType?: 'candlestick' | 'line';
  timeframe?: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' | 'max';
  onTimeframeChange?: (timeframe: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' | 'max') => void;
  height?: number;
  loading?: boolean;
  error?: string | null;
}

// Styled components
const ChartContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  zIndex: 10,
}));

const ErrorOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  zIndex: 10,
  padding: theme.spacing(2),
  textAlign: 'center',
}));

const TimeframeContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 5,
}));

const StockChart: React.FC<StockChartProps> = ({
  symbol,
  data,
  volumeData,
  chartType = 'candlestick',
  timeframe = '1m',
  onTimeframeChange,
  height = 400,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' | 'max'>(timeframe);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
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
        mode: 1,
      },
    });
    
    // Create price series
    let priceSeries;
    if (chartType === 'candlestick') {
      priceSeries = chart.addCandlestickSeries({
        upColor: theme.palette.success.main,
        downColor: theme.palette.error.main,
        borderVisible: false,
        wickUpColor: theme.palette.success.main,
        wickDownColor: theme.palette.error.main,
      });
    } else {
      priceSeries = chart.addLineSeries({
        color: theme.palette.primary.main,
        lineWidth: 2,
      });
    }
    
    // Create volume series if volume data is provided
    let volumeSeries = null;
    if (volumeData) {
      volumeSeries = chart.addHistogramSeries({
        color: theme.palette.primary.light,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }
    
    // Set data
    if (data.length > 0) {
      priceSeries.setData(data);
      
      if (volumeSeries && volumeData) {
        volumeSeries.setData(volumeData);
      }
      
      // Fit content
      chart.timeScale().fitContent();
    }
    
    // Save references
    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    volumeSeriesRef.current = volumeSeries;
    
    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        priceSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, [theme, chartType, height]);
  
  // Update data when it changes
  useEffect(() => {
    if (priceSeriesRef.current && data.length > 0) {
      priceSeriesRef.current.setData(data);
      
      if (volumeSeriesRef.current && volumeData) {
        volumeSeriesRef.current.setData(volumeData);
      }
      
      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data, volumeData]);
  
  // Handle timeframe change
  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' | 'max' | null
  ) => {
    if (newTimeframe !== null) {
      setSelectedTimeframe(newTimeframe);
      if (onTimeframeChange) {
        onTimeframeChange(newTimeframe);
      }
    }
  };
  
  return (
    <ChartContainer sx={{ height }}>
      {loading && (
        <LoadingOverlay>
          <CircularProgress />
        </LoadingOverlay>
      )}
      
      {error && (
        <ErrorOverlay>
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        </ErrorOverlay>
      )}
      
      <TimeframeContainer>
        <ToggleButtonGroup
          size="small"
          value={selectedTimeframe}
          exclusive
          onChange={handleTimeframeChange}
          aria-label="timeframe"
        >
          <ToggleButton value="1d" aria-label="1 day">
            1D
          </ToggleButton>
          <ToggleButton value="5d" aria-label="5 days">
            5D
          </ToggleButton>
          <ToggleButton value="1m" aria-label="1 month">
            1M
          </ToggleButton>
          <ToggleButton value="3m" aria-label="3 months">
            3M
          </ToggleButton>
          <ToggleButton value="6m" aria-label="6 months">
            6M
          </ToggleButton>
          <ToggleButton value="1y" aria-label="1 year">
            1Y
          </ToggleButton>
          <ToggleButton value="5y" aria-label="5 years">
            5Y
          </ToggleButton>
          <ToggleButton value="max" aria-label="maximum">
            MAX
          </ToggleButton>
        </ToggleButtonGroup>
      </TimeframeContainer>
      
      <Box ref={chartContainerRef} sx={{ width: '100%', height: '100%' }} />
    </ChartContainer>
  );
};

export default StockChart;