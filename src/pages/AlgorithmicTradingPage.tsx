import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import StrategyManagementPanel from '../components/algorithmic-trading/StrategyManagementPanel';
import StrategyPerformanceChart from '../components/algorithmic-trading/StrategyPerformanceChart';
import { AlgorithmicTradingService } from '../services/algorithmic-trading/AlgorithmicTradingService';
import { StrategyType } from '../services/algorithmic-trading/registry/StrategyFactory';
import { IStrategy } from '../services/algorithmic-trading/strategies/IStrategy';

/**
 * Algorithmic Trading Page Component
 */
const AlgorithmicTradingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<IStrategy | null>(null);
  const [strategies, setStrategies] = useState<IStrategy[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Initialize the algorithmic trading service
  useEffect(() => {
    const initializeService = async () => {
      try {
        const tradingService = AlgorithmicTradingService.getInstance();
        await tradingService.initialize({
          executionService: {
            symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'NFLX', 'NVDA']
          }
        });
        
        setIsInitialized(true);
        
        // Create a sample strategy for demonstration
        await createSampleStrategy();
        
        // Load strategies
        loadStrategies();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing algorithmic trading service:', error);
        setError('Failed to initialize algorithmic trading service');
        setIsLoading(false);
      }
    };
    
    initializeService();
  }, []);
  
  // Create a sample strategy for demonstration
  const createSampleStrategy = async () => {
    try {
      const tradingService = AlgorithmicTradingService.getInstance();
      
      // Check if we already have strategies
      const existingStrategies = tradingService.getAllStrategies();
      if (existingStrategies.length > 0) {
        return;
      }
      
      // Create a sample moving average crossover strategy
      const strategy = await tradingService.createStrategy(
        StrategyType.MOVING_AVERAGE_CROSSOVER,
        {
          parameters: {
            fastPeriod: 10,
            slowPeriod: 30,
            symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'NFLX', 'NVDA'],
            positionSize: 0.1,
            stopLossPercent: 0.02,
            takeProfitPercent: 0.04
          }
        }
      );
      
      // Generate some mock trades for demonstration
      await generateMockTrades(strategy);
      
      setSelectedStrategy(strategy);
    } catch (error) {
      console.error('Error creating sample strategy:', error);
      showNotification('Failed to create sample strategy', 'error');
    }
  };
  
  // Generate mock trades for demonstration
  const generateMockTrades = async (strategy: IStrategy) => {
    // Access the private _tradeHistory field using type assertion
    const strategyAny = strategy as any;
    
    // Generate 20 mock trades
    const now = new Date();
    const trades = [];
    
    let equity = 100;
    
    for (let i = 0; i < 20; i++) {
      const isWin = Math.random() > 0.4; // 60% win rate
      const symbol = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'NFLX', 'NVDA'][
        Math.floor(Math.random() * 8)
      ];
      const entryPrice = 100 + Math.random() * 50;
      const pnlPercent = isWin ? 0.01 + Math.random() * 0.03 : -(0.01 + Math.random() * 0.02);
      const exitPrice = entryPrice * (1 + pnlPercent);
      const pnl = entryPrice * pnlPercent * 100; // Assuming 100 shares
      
      equity += pnl;
      
      const entryTime = new Date(now.getTime() - (20 - i) * 24 * 60 * 60 * 1000);
      const exitTime = new Date(entryTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      
      trades.push({
        id: `mock_trade_${i}`,
        symbol,
        direction: 'LONG',
        entryPrice,
        entryTime,
        entrySignalType: 'BUY',
        exitPrice,
        exitTime,
        exitSignalType: 'SELL',
        quantity: 100,
        pnl,
        pnlPercentage: pnlPercent,
        status: 'CLOSED',
        metadata: {}
      });
    }
    
    // Add the mock trades to the strategy
    strategyAny._tradeHistory = trades;
    
    // Update performance metrics
    strategyAny.updatePerformanceMetrics();
  };
  
  // Load strategies from the registry
  const loadStrategies = () => {
    try {
      const tradingService = AlgorithmicTradingService.getInstance();
      const allStrategies = tradingService.getAllStrategies();
      setStrategies(allStrategies);
      
      // Select the first strategy if none is selected
      if (!selectedStrategy && allStrategies.length > 0) {
        setSelectedStrategy(allStrategies[0]);
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
      showNotification('Failed to load strategies', 'error');
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle strategy selection
  const handleStrategySelect = (strategy: IStrategy) => {
    setSelectedStrategy(strategy);
  };
  
  // Show notification
  const showNotification = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Algorithmic Trading
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Strategy Management" />
          <Tab label="Performance Analysis" />
          <Tab label="Backtesting" disabled />
          <Tab label="Live Trading" disabled />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && (
        <StrategyManagementPanel />
      )}
      
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Select Strategy
              </Typography>
              {strategies.map((strategy) => (
                <Button
                  key={strategy.id}
                  fullWidth
                  variant={selectedStrategy?.id === strategy.id ? 'contained' : 'outlined'}
                  color="primary"
                  sx={{ mb: 1 }}
                  onClick={() => handleStrategySelect(strategy)}
                >
                  {strategy.name}
                </Button>
              ))}
              {strategies.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No strategies available
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            {selectedStrategy ? (
              <StrategyPerformanceChart strategy={selectedStrategy} />
            ) : (
              <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Typography variant="body1" color="textSecondary">
                  Select a strategy to view performance
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
      
      {activeTab === 2 && (
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="h6" color="textSecondary">
            Backtesting functionality coming soon
          </Typography>
        </Paper>
      )}
      
      {activeTab === 3 && (
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="h6" color="textSecondary">
            Live trading functionality coming soon
          </Typography>
        </Paper>
      )}
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AlgorithmicTradingPage;