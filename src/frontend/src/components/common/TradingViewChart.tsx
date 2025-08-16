import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

// Define props interface
interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  container_id: string;
  height?: number | string;
  width?: number | string;
  theme?: 'light' | 'dark';
  toolbar_bg?: string;
  studies?: string[];
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  show_popup_button?: boolean;
  withdateranges?: boolean;
  hide_legend?: boolean;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  interval = '1D',
  container_id,
  height = 500,
  width = '100%',
  theme,
  toolbar_bg,
  studies = [],
  hide_side_toolbar = false,
  allow_symbol_change = false,
  save_image = true,
  show_popup_button = false,
  withdateranges = true,
  hide_legend = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const chartRef = useRef<any>(null);
  const muiTheme = useTheme();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Use MUI theme if no theme is provided
  const chartTheme = theme || (muiTheme.palette.mode === 'dark' ? 'dark' : 'light');
  
  // Use toolbar background color from theme if not provided
  const toolbarBg = toolbar_bg || (chartTheme === 'dark' ? '#1E1E1E' : '#F5F5F5');

  useEffect(() => {
    // Function to load TradingView widget script
    const loadTradingViewScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.TradingView) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TradingView widget'));
        document.head.appendChild(script);
        scriptRef.current = script;
      });
    };

    // Function to create TradingView widget
    const createWidget = () => {
      if (!window.TradingView) {
        setError('TradingView library not loaded');
        setIsLoading(false);
        return;
      }

      try {
        // Create widget configuration
        const widgetOptions: any = {
          symbol: symbol,
          interval: interval,
          container_id: container_id,
          datafeed_url: 'https://demo_feed.tradingview.com',
          library_path: 'https://unpkg.com/charting_library/',
          locale: 'en',
          disabled_features: [
            'header_symbol_search',
            'header_compare',
          ],
          enabled_features: [],
          client_id: 'tradingview.com',
          user_id: 'public_user_id',
          fullscreen: false,
          autosize: true,
          studies_overrides: {},
          theme: chartTheme,
          toolbar_bg: toolbarBg,
          overrides: {
            'mainSeriesProperties.style': 1,
            'symbolWatermarkProperties.color': 'rgba(0, 0, 0, 0)',
          },
        };

        // Add optional features
        if (hide_side_toolbar) {
          widgetOptions.disabled_features.push('left_toolbar');
        }

        if (!allow_symbol_change) {
          widgetOptions.disabled_features.push('header_symbol_search', 'symbol_search_hot_key');
        }

        if (!save_image) {
          widgetOptions.disabled_features.push('saveAsImage');
        }

        if (show_popup_button) {
          widgetOptions.enabled_features.push('show_popup_button');
        }

        if (!withdateranges) {
          widgetOptions.disabled_features.push('timeframes_toolbar');
        }

        if (hide_legend) {
          widgetOptions.disabled_features.push('legend_widget');
        }

        // Add studies if provided
        if (studies && studies.length > 0) {
          widgetOptions.studies = studies;
        }

        // Create new widget
        if (chartRef.current) {
          chartRef.current.remove();
        }

        // Create new TradingView widget
        chartRef.current = new window.TradingView.widget(widgetOptions);
        setIsLoading(false);
      } catch (err) {
        console.error('Error creating TradingView widget:', err);
        setError('Failed to create chart');
        setIsLoading(false);
      }
    };

    // Main initialization function
    const initializeChart = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await loadTradingViewScript();
        createWidget();
      } catch (err) {
        console.error('Error initializing TradingView chart:', err);
        setError('Failed to load TradingView chart');
        setIsLoading(false);
      }
    };

    initializeChart();

    // Cleanup function
    return () => {
      if (chartRef.current && chartRef.current.remove) {
        chartRef.current.remove();
      }
    };
  }, [symbol, interval, container_id, chartTheme, toolbarBg, studies, hide_side_toolbar, allow_symbol_change, save_image, show_popup_button, withdateranges, hide_legend]);

  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: 'relative',
        backgroundColor: chartTheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            zIndex: 10,
            p: 2,
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Chart Error
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Box>
      )}
      
      <div
        id={container_id}
        ref={containerRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
    </Box>
  );
};

export default TradingViewChart;