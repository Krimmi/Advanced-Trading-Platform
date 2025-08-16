import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Button,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon 
} from '@mui/icons-material';

interface MarketOverviewWidgetProps {
  settings: {
    showIndices?: boolean;
    showTopMovers?: boolean;
    refreshInterval?: number;
  };
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MarketOverviewWidget: React.FC<MarketOverviewWidgetProps> = ({ settings }) => {
  const theme = useTheme();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Default settings
  const showIndices = settings.showIndices !== undefined ? settings.showIndices : true;
  const showTopMovers = settings.showTopMovers !== undefined ? settings.showTopMovers : true;
  const refreshInterval = settings.refreshInterval || 60;
  
  // Load market data
  useEffect(() => {
    const fetchMarketData = () => {
      setIsLoading(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        // Mock indices data
        const mockIndices: MarketIndex[] = [
          { name: 'S&P 500', symbol: 'SPX', value: 5123.45, change: 60.23, changePercent: 1.2 },
          { name: 'Nasdaq', symbol: 'IXIC', value: 16789.01, change: 248.67, changePercent: 1.5 },
          { name: 'Dow Jones', symbol: 'DJI', value: 38456.78, change: -115.34, changePercent: -0.3 },
          { name: 'Russell 2000', symbol: 'RUT', value: 2345.67, change: 18.56, changePercent: 0.8 }
        ];
        
        // Mock gainers data
        const mockGainers: MarketMover[] = [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 243.58, change: 5.67, changePercent: 2.45 },
          { symbol: 'MSFT', name: 'Microsoft Corp.', price: 387.92, change: 7.12, changePercent: 1.87 },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 192.36, change: 6.01, changePercent: 3.21 },
          { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 845.23, change: 23.45, changePercent: 2.85 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.45, change: 3.56, changePercent: 2.03 }
        ];
        
        // Mock losers data
        const mockLosers: MarketMover[] = [
          { symbol: 'TSLA', name: 'Tesla Inc.', price: 267.89, change: -7.65, changePercent: -2.78 },
          { symbol: 'META', name: 'Meta Platforms Inc.', price: 432.12, change: -8.34, changePercent: -1.89 },
          { symbol: 'NFLX', name: 'Netflix Inc.', price: 654.32, change: -12.45, changePercent: -1.87 },
          { symbol: 'DIS', name: 'Walt Disney Co.', price: 112.45, change: -2.34, changePercent: -2.04 },
          { symbol: 'INTC', name: 'Intel Corp.', price: 43.21, change: -1.23, changePercent: -2.77 }
        ];
        
        setIndices(mockIndices);
        setGainers(mockGainers);
        setLosers(mockLosers);
        setIsLoading(false);
      }, 1000);
    };
    
    // Initial fetch
    fetchMarketData();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchMarketData, refreshInterval * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2">Loading market data...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Market indices */}
      {showIndices && (
        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Market Indices
          </Typography>
          
          <List disablePadding>
            {indices.map((index) => (
              <ListItem key={index.symbol} disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium">
                      {index.name}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="body2">
                      {index.value.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {index.change >= 0 ? (
                        <>
                          <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption" color="success.main">
                            +{index.changePercent.toFixed(2)}%
                          </Typography>
                        </>
                      ) : (
                        <>
                          <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption" color="error.main">
                            {index.changePercent.toFixed(2)}%
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {/* Top movers */}
      {showTopMovers && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              aria-label="market movers tabs"
            >
              <Tab label="Top Gainers" />
              <Tab label="Top Losers" />
            </Tabs>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <TabPanel value={tabValue} index={0}>
              <List disablePadding sx={{ px: 2 }}>
                {gainers.map((stock) => (
                  <ListItem key={stock.symbol} disableGutters sx={{ py: 0.75 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {stock.symbol}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {stock.name}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body2">
                          ${stock.price.toFixed(2)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption" color="success.main">
                            +{stock.changePercent.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <List disablePadding sx={{ px: 2 }}>
                {losers.map((stock) => (
                  <ListItem key={stock.symbol} disableGutters sx={{ py: 0.75 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {stock.symbol}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {stock.name}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body2">
                          ${stock.price.toFixed(2)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption" color="error.main">
                            {stock.changePercent.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </TabPanel>
          </Box>
        </Box>
      )}
      
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
        <Button size="small" variant="text">
          View More
        </Button>
      </Box>
    </Box>
  );
};

export default MarketOverviewWidget;