import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Tabs, 
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import MarketInsightsPanel from '../components/MarketInsightsPanel';
import { featureFlags } from '../services/featureFlags/featureFlags';
import { performanceMonitoring, MetricType, usePerformanceTracking } from '../services/monitoring/performanceMonitoring';
import { captureException } from '../services/monitoring/errorTracking';
import { unifiedDataProvider } from '../services/api/UnifiedDataProvider';
import { secretsManager } from '../utils/secretsManager';

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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `market-tab-${index}`,
    'aria-controls': `market-tabpanel-${index}`,
  };
}

const MarketInsightsPage: React.FC = () => {
  // State
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [inputSymbol, setInputSymbol] = useState<string>('AAPL');
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [tradingSignal, setTradingSignal] = useState<any>(null);
  const [anomalyDetected, setAnomalyDetected] = useState<any>(null);
  const [popularSymbols, setPopularSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']);
  
  // Performance tracking
  const performance = usePerformanceTracking('MarketInsightsPage', MetricType.COMPONENT_RENDER);
  
  // Feature flags
  const mlFeaturesEnabled = featureFlags.isEnabled('ml-predictions');
  const anomalyDetectionEnabled = featureFlags.isEnabled('anomaly-detection');
  const advancedChartsEnabled = featureFlags.isEnabled('advanced-charts');
  
  // Check if API keys are configured
  const [apiKeysConfigured, setApiKeysConfigured] = useState<boolean>(false);
  
  useEffect(() => {
    // Start performance tracking
    performance.start();
    
    // Check API keys
    const hasAlphaVantage = secretsManager.hasApiKey('alphaVantage');
    const hasPolygon = secretsManager.hasApiKey('polygon');
    const hasIexCloud = secretsManager.hasApiKey('iexCloud');
    
    setApiKeysConfigured(hasAlphaVantage || hasPolygon || hasIexCloud);
    
    // Prefetch data for popular symbols
    const prefetchData = async () => {
      try {
        await unifiedDataProvider.prefetchData(popularSymbols, {
          useAllProviders: false
        });
      } catch (error) {
        console.warn('Error prefetching data:', error);
      }
    };
    
    prefetchData();
    
    // End performance tracking
    performance.end(true);
    
    return () => {
      // Clean up any resources if needed
    };
  }, []);
  
  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputSymbol(event.target.value.toUpperCase());
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim());
      
      // Track symbol search
      performanceMonitoring.trackMetric(
        `SymbolSearch.${inputSymbol.trim()}`,
        MetricType.USER_INTERACTION,
        0,
        true,
        { symbol: inputSymbol.trim() }
      );
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSignalGenerated = (signal: any) => {
    setTradingSignal(signal);
    
    // Show notification for strong signals
    if (signal.strength > 0.7) {
      setNotification({
        open: true,
        message: `Strong ${signal.signalType.toUpperCase()} signal detected for ${symbol} with ${(signal.confidence * 100).toFixed(0)}% confidence`,
        severity: signal.signalType === 'buy' ? 'success' : 'warning'
      });
    }
  };
  
  const handleAnomalyDetected = (anomaly: any) => {
    setAnomalyDetected(anomaly);
    
    // Show notification for high confidence anomalies
    if (anomaly.confidence > 0.7) {
      setNotification({
        open: true,
        message: `Market anomaly detected for ${symbol} with ${(anomaly.confidence * 100).toFixed(0)}% confidence`,
        severity: 'warning'
      });
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  const handleQuickSymbolSelect = (selectedSymbol: string) => {
    setInputSymbol(selectedSymbol);
    setSymbol(selectedSymbol);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Market Insights Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive market analysis with real-time data, predictive analytics, and anomaly detection.
      </Typography>

      {!apiKeysConfigured && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          API keys are not configured. Some features may use mock data. 
          <Button 
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }}
            onClick={() => window.location.href = '/settings'}
          >
            Configure API Keys
          </Button>
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Stock Symbol"
                variant="outlined"
                value={inputSymbol}
                onChange={handleSymbolChange}
                placeholder="e.g., AAPL, MSFT, GOOGL"
                helperText="Enter a valid stock symbol"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                sx={{ height: '56px' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Analyze'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {popularSymbols.map((popularSymbol) => (
                  <Button 
                    key={popularSymbol}
                    variant={symbol === popularSymbol ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleQuickSymbolSelect(popularSymbol)}
                  >
                    {popularSymbol}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }}
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      <Box sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="market insights tabs">
            <Tab label="Market Insights" {...a11yProps(0)} />
            {mlFeaturesEnabled && <Tab label="Predictive Analytics" {...a11yProps(1)} />}
            {anomalyDetectionEnabled && <Tab label="Anomaly Detection" {...a11yProps(2)} />}
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <MarketInsightsPanel 
            symbol={symbol} 
            onSignalGenerated={handleSignalGenerated}
            onAnomalyDetected={handleAnomalyDetected}
          />
        </TabPanel>
        
        {mlFeaturesEnabled && (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" gutterBottom>
              Predictive Analytics for {symbol}
            </Typography>
            {tradingSignal ? (
              <Box>
                <Alert 
                  severity={tradingSignal.signalType === 'buy' ? 'success' : tradingSignal.signalType === 'sell' ? 'warning' : 'info'}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6">
                    {tradingSignal.signalType.toUpperCase()} Signal Detected
                  </Typography>
                  <Typography variant="body1">
                    Confidence: {(tradingSignal.confidence * 100).toFixed(0)}% | 
                    Strength: {(tradingSignal.strength * 100).toFixed(0)}% | 
                    Predicted Change: {(tradingSignal.predictedChange * 100).toFixed(2)}%
                  </Typography>
                </Alert>
                
                <Typography variant="h6">Rationale:</Typography>
                <ul>
                  {tradingSignal.rationale.map((reason: string, index: number) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </Box>
            ) : (
              <Typography variant="body1">
                No predictive signals available for {symbol}. Please check back later or try another symbol.
              </Typography>
            )}
          </TabPanel>
        )}
        
        {anomalyDetectionEnabled && (
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h5" gutterBottom>
              Anomaly Detection for {symbol}
            </Typography>
            {anomalyDetected ? (
              <Box>
                <Alert 
                  severity="warning"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6">
                    Market Anomaly Detected
                  </Typography>
                  <Typography variant="body1">
                    Confidence: {(anomalyDetected.confidence * 100).toFixed(0)}% | 
                    Anomaly Score: {(anomalyDetected.anomalyScore * 100).toFixed(0)}%
                  </Typography>
                </Alert>
                
                <Typography variant="h6">Contributing Factors:</Typography>
                <ul>
                  {anomalyDetected.contributingFeatures.map((feature: any, index: number) => (
                    <li key={index}>
                      {feature.feature}: {(feature.contribution * 100).toFixed(0)}% contribution
                    </li>
                  ))}
                </ul>
              </Box>
            ) : (
              <Typography variant="body1">
                No anomalies detected for {symbol}. Market behavior appears normal.
              </Typography>
            )}
          </TabPanel>
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MarketInsightsPage;