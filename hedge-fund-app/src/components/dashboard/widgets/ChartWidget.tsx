import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  ButtonGroup, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  CandlestickChart as CandlestickChartIcon
} from '@mui/icons-material';

interface ChartWidgetProps {
  settings: {
    symbol?: string;
    timeframe?: string;
    chartType?: string;
    indicators?: string[];
  };
}

interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividend: number;
  dividendYield: number;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ settings }) => {
  const theme = useTheme();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState(settings.timeframe || '1D');
  const [activeChartType, setActiveChartType] = useState(settings.chartType || 'candle');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(settings.indicators || []);
  
  // Default settings
  const symbol = settings.symbol || 'AAPL';
  
  // Load chart data
  useEffect(() => {
    const fetchChartData = () => {
      setIsLoading(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        // Mock stock info
        const mockStockInfo: StockInfo = {
          symbol: symbol,
          name: getStockName(symbol),
          exchange: 'NASDAQ',
          currentPrice: 243.58,
          change: 5.67,
          changePercent: 2.45,
          open: 238.91,
          high: 245.12,
          low: 237.45,
          volume: 28456789,
          marketCap: 2450000000000,
          peRatio: 32.5,
          dividend: 0.92,
          dividendYield: 0.38
        };
        
        // Mock price data
        const mockPriceData: PriceData[] = generateMockPriceData(activeTimeframe);
        
        setStockInfo(mockStockInfo);
        setPriceData(mockPriceData);
        setIsLoading(false);
      }, 1000);
    };
    
    // Initial fetch
    fetchChartData();
  }, [symbol, activeTimeframe]);
  
  // Get stock name based on symbol
  const getStockName = (symbol: string): string => {
    const stockNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corp.',
      'SPY': 'SPDR S&P 500 ETF Trust'
    };
    
    return stockNames[symbol] || symbol;
  };
  
  // Generate mock price data
  const generateMockPriceData = (timeframe: string): PriceData[] => {
    const now = new Date();
    const data: PriceData[] = [];
    let points = 0;
    let interval = 0;
    let basePrice = 240;
    let volatility = 0;
    
    // Set parameters based on timeframe
    switch (timeframe) {
      case '1D':
        points = 78; // 1 data point every 5 minutes for 6.5 hours (trading day)
        interval = 5 * 60 * 1000; // 5 minutes in milliseconds
        volatility = 0.2;
        break;
      case '5D':
        points = 5 * 78; // 5 trading days
        interval = 5 * 60 * 1000;
        volatility = 0.3;
        break;
      case '1M':
        points = 23; // ~23 trading days in a month
        interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        volatility = 0.5;
        break;
      case '3M':
        points = 66; // ~66 trading days in 3 months
        interval = 24 * 60 * 60 * 1000;
        volatility = 0.8;
        break;
      case '6M':
        points = 126; // ~126 trading days in 6 months
        interval = 24 * 60 * 60 * 1000;
        volatility = 1.2;
        break;
      case '1Y':
        points = 252; // ~252 trading days in a year
        interval = 24 * 60 * 60 * 1000;
        volatility = 1.8;
        break;
      case '5Y':
        points = 60; // 60 months in 5 years
        interval = 30 * 24 * 60 * 60 * 1000; // 1 month in milliseconds
        volatility = 3;
        break;
      default:
        points = 78;
        interval = 5 * 60 * 1000;
        volatility = 0.2;
    }
    
    // Generate data points
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * interval));
      const change = (Math.random() - 0.5) * volatility;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
      const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      // Update base price for next iteration
      basePrice = close;
    }
    
    return data;
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setActiveTimeframe(timeframe);
  };
  
  // Handle chart type change
  const handleChartTypeChange = (chartType: string) => {
    setActiveChartType(chartType);
  };
  
  // Handle indicator toggle
  const handleIndicatorToggle = (indicator: string) => {
    setActiveIndicators(prev => {
      if (prev.includes(indicator)) {
        return prev.filter(i => i !== indicator);
      } else {
        return [...prev, indicator];
      }
    });
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000000000) {
      return (num / 1000000000000).toFixed(2) + 'T';
    }
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading chart data...</Typography>
      </Box>
    );
  }
  
  if (!stockInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2" color="error">Error loading chart data</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stock info header */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight="medium">
              {stockInfo.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stockInfo.name} • {stockInfo.exchange}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" component="div" fontWeight="medium">
              ${stockInfo.currentPrice.toFixed(2)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {stockInfo.change >= 0 ? (
                <>
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    +${stockInfo.change.toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="error.main" fontWeight="medium">
                    ${stockInfo.change.toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Open</Typography>
            <Typography variant="body2">${stockInfo.open.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">High</Typography>
            <Typography variant="body2">${stockInfo.high.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Low</Typography>
            <Typography variant="body2">${stockInfo.low.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Volume</Typography>
            <Typography variant="body2">{formatNumber(stockInfo.volume)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Market Cap</Typography>
            <Typography variant="body2">{formatNumber(stockInfo.marketCap)}</Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Chart controls */}
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => handleChartTypeChange('line')}
            variant={activeChartType === 'line' ? 'contained' : 'outlined'}
          >
            <ShowChartIcon fontSize="small" />
          </Button>
          <Button
            onClick={() => handleChartTypeChange('candle')}
            variant={activeChartType === 'candle' ? 'contained' : 'outlined'}
          >
            <CandlestickChartIcon fontSize="small" />
          </Button>
          <Button
            onClick={() => handleChartTypeChange('area')}
            variant={activeChartType === 'area' ? 'contained' : 'outlined'}
          >
            <TimelineIcon fontSize="small" />
          </Button>
          <Button
            onClick={() => handleChartTypeChange('bar')}
            variant={activeChartType === 'bar' ? 'contained' : 'outlined'}
          >
            <BarChartIcon fontSize="small" />
          </Button>
        </ButtonGroup>
        
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => handleTimeframeChange('1D')}
            variant={activeTimeframe === '1D' ? 'contained' : 'outlined'}
          >
            1D
          </Button>
          <Button
            onClick={() => handleTimeframeChange('5D')}
            variant={activeTimeframe === '5D' ? 'contained' : 'outlined'}
          >
            5D
          </Button>
          <Button
            onClick={() => handleTimeframeChange('1M')}
            variant={activeTimeframe === '1M' ? 'contained' : 'outlined'}
          >
            1M
          </Button>
          <Button
            onClick={() => handleTimeframeChange('3M')}
            variant={activeTimeframe === '3M' ? 'contained' : 'outlined'}
          >
            3M
          </Button>
          <Button
            onClick={() => handleTimeframeChange('1Y')}
            variant={activeTimeframe === '1Y' ? 'contained' : 'outlined'}
          >
            1Y
          </Button>
          <Button
            onClick={() => handleTimeframeChange('5Y')}
            variant={activeTimeframe === '5Y' ? 'contained' : 'outlined'}
          >
            5Y
          </Button>
        </ButtonGroup>
      </Box>
      
      {/* Chart area */}
      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        {/* Chart placeholder */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            backgroundColor: theme.palette.background.default
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {activeChartType.charAt(0).toUpperCase() + activeChartType.slice(1)} Chart for {symbol} ({activeTimeframe})
          </Typography>
        </Box>
        
        {/* Indicators */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['SMA', 'EMA', 'MACD', 'RSI', 'Bollinger Bands', 'Volume'].map(indicator => (
            <Chip
              key={indicator}
              label={indicator}
              size="small"
              color={activeIndicators.includes(indicator) ? 'primary' : 'default'}
              onClick={() => handleIndicatorToggle(indicator)}
              variant={activeIndicators.includes(indicator) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>
      
      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined">
            Trade
          </Button>
          <Button size="small" variant="contained">
            Full Analysis
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChartWidget;