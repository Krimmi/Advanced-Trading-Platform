import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  ButtonGroup,
  Button,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  CandlestickChart as CandlestickChartIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Import TradingView chart component
import TradingViewChart from './TradingViewChart';

// Import Redux store
import { RootState } from '../../store';

// Define props interface
interface TradingViewChartWrapperProps {
  symbol: string;
  title?: string;
  height?: number | string;
  showToolbar?: boolean;
  showIntervalSelector?: boolean;
  showChartTypeSelector?: boolean;
  showStudiesSelector?: boolean;
  allowFullscreen?: boolean;
  allowDownload?: boolean;
  onSymbolChange?: (symbol: string) => void;
}

// Define interval options
const intervalOptions = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
  { label: '1M', value: 'M' },
];

// Define chart type options
const chartTypeOptions = [
  { label: 'Line', value: 'line', icon: <ShowChartIcon fontSize="small" /> },
  { label: 'Candles', value: 'candles', icon: <CandlestickChartIcon fontSize="small" /> },
  { label: 'Bars', value: 'bars', icon: <BarChartIcon fontSize="small" /> },
  { label: 'Area', value: 'area', icon: <TimelineIcon fontSize="small" /> },
];

// Define common studies
const commonStudies = [
  { label: 'SMA 20', value: 'SMA@tv-basicstudies', params: { length: 20 } },
  { label: 'SMA 50', value: 'SMA@tv-basicstudies', params: { length: 50 } },
  { label: 'SMA 200', value: 'SMA@tv-basicstudies', params: { length: 200 } },
  { label: 'EMA 20', value: 'EMA@tv-basicstudies', params: { length: 20 } },
  { label: 'EMA 50', value: 'EMA@tv-basicstudies', params: { length: 50 } },
  { label: 'Bollinger Bands', value: 'BB@tv-basicstudies' },
  { label: 'RSI', value: 'RSI@tv-basicstudies' },
  { label: 'MACD', value: 'MACD@tv-basicstudies' },
  { label: 'Volume', value: 'Volume@tv-basicstudies' },
];

const TradingViewChartWrapper: React.FC<TradingViewChartWrapperProps> = ({
  symbol,
  title,
  height = 500,
  showToolbar = true,
  showIntervalSelector = true,
  showChartTypeSelector = true,
  showStudiesSelector = true,
  allowFullscreen = true,
  allowDownload = true,
  onSymbolChange,
}) => {
  // Generate a unique container ID
  const containerId = `tradingview_chart_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Get theme from MUI
  const theme = useTheme();
  
  // Get user preferences from Redux store
  const { userPreferences } = useSelector((state: RootState) => state.settings);
  
  // Local state
  const [interval, setInterval] = useState('D'); // Default to daily
  const [chartType, setChartType] = useState('candles');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studiesMenuAnchor, setStudiesMenuAnchor] = useState<null | HTMLElement>(null);
  const [intervalMenuAnchor, setIntervalMenuAnchor] = useState<null | HTMLElement>(null);
  const [chartTypeMenuAnchor, setChartTypeMenuAnchor] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Effect to set default preferences from user settings
  useEffect(() => {
    if (userPreferences?.chart_preferences) {
      // Set default interval
      const defaultTimeframe = userPreferences.chart_preferences.default_timeframe;
      if (defaultTimeframe) {
        // Map timeframe to TradingView interval
        switch (defaultTimeframe) {
          case '1d':
            setInterval('D');
            break;
          case '1w':
            setInterval('W');
            break;
          case '1m':
            setInterval('M');
            break;
          case '1h':
            setInterval('60');
            break;
          default:
            setInterval('D');
        }
      }
      
      // Set default studies
      if (userPreferences.chart_preferences.default_indicators) {
        const studies: string[] = [];
        userPreferences.chart_preferences.default_indicators.forEach(indicator => {
          switch (indicator) {
            case 'sma_20':
              studies.push('SMA 20');
              break;
            case 'sma_50':
              studies.push('SMA 50');
              break;
            case 'sma_200':
              studies.push('SMA 200');
              break;
            case 'ema_20':
              studies.push('EMA 20');
              break;
            case 'volume':
              studies.push('Volume');
              break;
            case 'rsi':
              studies.push('RSI');
              break;
            case 'macd':
              studies.push('MACD');
              break;
            default:
              break;
          }
        });
        setSelectedStudies(studies);
      }
    }
  }, [userPreferences]);
  
  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    setIntervalMenuAnchor(null);
  };
  
  // Handle chart type change
  const handleChartTypeChange = (newChartType: string) => {
    setChartType(newChartType);
    setChartTypeMenuAnchor(null);
  };
  
  // Handle study toggle
  const handleStudyToggle = (study: string) => {
    if (selectedStudies.includes(study)) {
      setSelectedStudies(selectedStudies.filter(s => s !== study));
    } else {
      setSelectedStudies([...selectedStudies, study]);
    }
  };
  
  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Handle download chart
  const handleDownloadChart = () => {
    // This would be implemented with the TradingView API
    console.log('Download chart');
  };
  
  // Map selected studies to TradingView format
  const mappedStudies = selectedStudies.map(study => {
    const foundStudy = commonStudies.find(s => s.label === study);
    return foundStudy ? foundStudy.value : '';
  }).filter(Boolean);
  
  // Get current interval label
  const currentIntervalLabel = intervalOptions.find(option => option.value === interval)?.label || '1D';
  
  // Get current chart type
  const currentChartType = chartTypeOptions.find(option => option.value === chartType);
  
  return (
    <Paper
      sx={{
        width: '100%',
        height: isFullscreen ? '100vh' : height,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 1300 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {showToolbar && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>
              {title || symbol}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showIntervalSelector && (
              <>
                <Button
                  size="small"
                  onClick={(e) => setIntervalMenuAnchor(e.currentTarget)}
                  sx={{ mr: 1 }}
                >
                  {currentIntervalLabel}
                </Button>
                <Menu
                  anchorEl={intervalMenuAnchor}
                  open={Boolean(intervalMenuAnchor)}
                  onClose={() => setIntervalMenuAnchor(null)}
                >
                  {intervalOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      selected={interval === option.value}
                      onClick={() => handleIntervalChange(option.value)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            
            {showChartTypeSelector && (
              <>
                <Tooltip title="Chart Type">
                  <IconButton
                    size="small"
                    onClick={(e) => setChartTypeMenuAnchor(e.currentTarget)}
                    sx={{ mr: 1 }}
                  >
                    {currentChartType?.icon || <ShowChartIcon />}
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={chartTypeMenuAnchor}
                  open={Boolean(chartTypeMenuAnchor)}
                  onClose={() => setChartTypeMenuAnchor(null)}
                >
                  {chartTypeOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      selected={chartType === option.value}
                      onClick={() => handleChartTypeChange(option.value)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.icon}
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            
            {showStudiesSelector && (
              <>
                <Tooltip title="Indicators">
                  <IconButton
                    size="small"
                    onClick={(e) => setStudiesMenuAnchor(e.currentTarget)}
                    sx={{ mr: 1 }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={studiesMenuAnchor}
                  open={Boolean(studiesMenuAnchor)}
                  onClose={() => setStudiesMenuAnchor(null)}
                >
                  {commonStudies.map((study) => (
                    <MenuItem
                      key={study.label}
                      onClick={() => handleStudyToggle(study.label)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1 }}>{study.label}</Typography>
                        {selectedStudies.includes(study.label) && <AddIcon fontSize="small" color="primary" />}
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            
            {allowFullscreen && (
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <IconButton
                  size="small"
                  onClick={handleFullscreenToggle}
                  sx={{ mr: 1 }}
                >
                  {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            
            {allowDownload && (
              <Tooltip title="Download Chart">
                <IconButton
                  size="small"
                  onClick={handleDownloadChart}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <TradingViewChart
          symbol={symbol}
          interval={interval}
          container_id={containerId}
          height="100%"
          width="100%"
          theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
          studies={mappedStudies}
          allow_symbol_change={Boolean(onSymbolChange)}
        />
      </Box>
    </Paper>
  );
};

export default TradingViewChartWrapper;