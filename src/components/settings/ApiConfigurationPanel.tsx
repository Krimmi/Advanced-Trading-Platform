import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { 
  DATA_SOURCE_CONFIG, 
  updateDataSourceConfig
} from '../../config/apiConfig';
import { secretsManager, useSecretsManager } from '../../utils/secretsManager';
import { config } from '../../config/environments';

/**
 * Component for configuring API keys and data source settings
 */
const ApiConfigurationPanel: React.FC = () => {
  // Get secrets manager hook
  const { getApiKey, setApiKey, hasApiKey } = useSecretsManager();
  
  // State for API keys
  const [apiKeys, setApiKeys] = useState({
    alphaVantage: getApiKey('alphaVantage') || '',
    polygon: getApiKey('polygon') || '',
    iexCloud: getApiKey('iexCloud') || '',
    alpacaApiKey: getApiKey('alpaca') || '',
    alpacaApiSecret: getApiKey('alpacaSecret') || '',
    alpacaPaper: true,
    financialModelingPrep: getApiKey('financialModelingPrep') || '',
    quandl: getApiKey('quandl') || '',
    newsApi: getApiKey('newsApi') || '',
    finnhub: getApiKey('finnhub') || ''
  });

  // State for data source config
  const [dataSourceConfig, setDataSourceConfig] = useState({
    useMockDataAsFallback: DATA_SOURCE_CONFIG.useMockDataAsFallback,
    forceMockData: DATA_SOURCE_CONFIG.forceMockData,
    enableApiCache: DATA_SOURCE_CONFIG.enableApiCache,
    marketDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.marketData / 1000, // Convert to seconds for UI
    fundamentalDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData / 1000,
    newsDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.newsData / 1000,
    portfolioDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.portfolioData / 1000,
    // New cache volatility levels
    lowVolatilityCacheTTL: config.cacheTTL.lowVolatility / 1000,
    mediumVolatilityCacheTTL: config.cacheTTL.mediumVolatility / 1000,
    highVolatilityCacheTTL: config.cacheTTL.highVolatility / 1000
  });

  // State for notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // State for API key validation
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});

  // Handle API key changes
  const handleApiKeyChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys({
      ...apiKeys,
      [key]: event.target.value
    });
  };

  // Handle data source config changes
  const handleConfigChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : 
                 event.target.type === 'number' ? Number(event.target.value) : 
                 event.target.value;
    
    setDataSourceConfig({
      ...dataSourceConfig,
      [key]: value
    });
  };

  // Save configuration
  const handleSave = () => {
    try {
      // Update API keys using secretsManager
      setApiKey('alphaVantage', apiKeys.alphaVantage);
      setApiKey('polygon', apiKeys.polygon);
      setApiKey('iexCloud', apiKeys.iexCloud);
      setApiKey('alpaca', apiKeys.alpacaApiKey);
      setApiKey('alpacaSecret', apiKeys.alpacaApiSecret);
      setApiKey('financialModelingPrep', apiKeys.financialModelingPrep);
      setApiKey('quandl', apiKeys.quandl);
      setApiKey('newsApi', apiKeys.newsApi);
      setApiKey('finnhub', apiKeys.finnhub);

      // Update data source config
      updateDataSourceConfig({
        useMockDataAsFallback: dataSourceConfig.useMockDataAsFallback,
        forceMockData: dataSourceConfig.forceMockData,
        enableApiCache: dataSourceConfig.enableApiCache,
        cacheTTL: {
          marketData: dataSourceConfig.marketDataCacheTTL * 1000, // Convert back to milliseconds
          fundamentalData: dataSourceConfig.fundamentalDataCacheTTL * 1000,
          newsData: dataSourceConfig.newsDataCacheTTL * 1000,
          portfolioData: dataSourceConfig.portfolioDataCacheTTL * 1000,
          // New cache volatility levels
          lowVolatility: dataSourceConfig.lowVolatilityCacheTTL * 1000,
          mediumVolatility: dataSourceConfig.mediumVolatilityCacheTTL * 1000,
          highVolatility: dataSourceConfig.highVolatilityCacheTTL * 1000
        }
      });

      // Show success notification
      setNotification({
        open: true,
        message: 'Configuration saved successfully',
        severity: 'success'
      });

      // Update key status
      checkApiKeys();
    } catch (error) {
      console.error('Error saving configuration:', error);
      setNotification({
        open: true,
        message: 'Error saving configuration',
        severity: 'error'
      });
    }
  };

  // Reset configuration
  const handleReset = () => {
    setApiKeys({
      alphaVantage: getApiKey('alphaVantage') || '',
      polygon: getApiKey('polygon') || '',
      iexCloud: getApiKey('iexCloud') || '',
      alpacaApiKey: getApiKey('alpaca') || '',
      alpacaApiSecret: getApiKey('alpacaSecret') || '',
      alpacaPaper: true,
      financialModelingPrep: getApiKey('financialModelingPrep') || '',
      quandl: getApiKey('quandl') || '',
      newsApi: getApiKey('newsApi') || '',
      finnhub: getApiKey('finnhub') || ''
    });

    setDataSourceConfig({
      useMockDataAsFallback: DATA_SOURCE_CONFIG.useMockDataAsFallback,
      forceMockData: DATA_SOURCE_CONFIG.forceMockData,
      enableApiCache: DATA_SOURCE_CONFIG.enableApiCache,
      marketDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.marketData / 1000,
      fundamentalDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData / 1000,
      newsDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.newsData / 1000,
      portfolioDataCacheTTL: DATA_SOURCE_CONFIG.cacheTTL.portfolioData / 1000,
      lowVolatilityCacheTTL: config.cacheTTL.lowVolatility / 1000,
      mediumVolatilityCacheTTL: config.cacheTTL.mediumVolatility / 1000,
      highVolatilityCacheTTL: config.cacheTTL.highVolatility / 1000
    });

    setNotification({
      open: true,
      message: 'Configuration reset to defaults',
      severity: 'info'
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Check API keys
  const checkApiKeys = () => {
    const status: Record<string, boolean> = {
      alphaVantage: hasApiKey('alphaVantage'),
      polygon: hasApiKey('polygon'),
      iexCloud: hasApiKey('iexCloud'),
      alpaca: hasApiKey('alpaca'),
      financialModelingPrep: hasApiKey('financialModelingPrep'),
      quandl: hasApiKey('quandl'),
      newsApi: hasApiKey('newsApi'),
      finnhub: hasApiKey('finnhub')
    };
    
    setKeyStatus(status);
  };

  // Check API keys on component mount
  useEffect(() => {
    checkApiKeys();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Configuration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Configure your API keys to use real market data. When API keys are not provided or when API calls fail, the application will use mock data.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                API Keys
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Market Data APIs
                    {keyStatus.alphaVantage || keyStatus.polygon || keyStatus.iexCloud ? (
                      <CheckIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    ) : (
                      <ErrorIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Alpha Vantage API Key"
                        value={apiKeys.alphaVantage}
                        onChange={handleApiKeyChange('alphaVantage')}
                        fullWidth
                        margin="normal"
                        helperText="Used for stock, forex, and crypto data"
                        InputProps={{
                          endAdornment: keyStatus.alphaVantage ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Polygon.io API Key"
                        value={apiKeys.polygon}
                        onChange={handleApiKeyChange('polygon')}
                        fullWidth
                        margin="normal"
                        helperText="Used for higher frequency market updates"
                        InputProps={{
                          endAdornment: keyStatus.polygon ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="IEX Cloud API Key"
                        value={apiKeys.iexCloud}
                        onChange={handleApiKeyChange('iexCloud')}
                        fullWidth
                        margin="normal"
                        helperText="Used for financial data and fundamentals"
                        InputProps={{
                          endAdornment: keyStatus.iexCloud ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Trading APIs
                    {keyStatus.alpaca ? (
                      <CheckIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    ) : (
                      <ErrorIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Alpaca API Key"
                        value={apiKeys.alpacaApiKey}
                        onChange={handleApiKeyChange('alpacaApiKey')}
                        fullWidth
                        margin="normal"
                        helperText="Used for trading and order management"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Alpaca API Secret"
                        value={apiKeys.alpacaApiSecret}
                        onChange={handleApiKeyChange('alpacaApiSecret')}
                        fullWidth
                        margin="normal"
                        type="password"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={apiKeys.alpacaPaper}
                            onChange={(e) => setApiKeys({
                              ...apiKeys,
                              alpacaPaper: e.target.checked
                            })}
                          />
                        }
                        label="Use Paper Trading (recommended for testing)"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Financial Data APIs
                    {keyStatus.financialModelingPrep || keyStatus.quandl ? (
                      <CheckIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    ) : (
                      <ErrorIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Financial Modeling Prep API Key"
                        value={apiKeys.financialModelingPrep}
                        onChange={handleApiKeyChange('financialModelingPrep')}
                        fullWidth
                        margin="normal"
                        helperText="Used for fundamental data and financial statements"
                        InputProps={{
                          endAdornment: keyStatus.financialModelingPrep ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Quandl API Key"
                        value={apiKeys.quandl}
                        onChange={handleApiKeyChange('quandl')}
                        fullWidth
                        margin="normal"
                        helperText="Used for alternative and economic datasets"
                        InputProps={{
                          endAdornment: keyStatus.quandl ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    News & Sentiment APIs
                    {keyStatus.newsApi || keyStatus.finnhub ? (
                      <CheckIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    ) : (
                      <ErrorIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="News API Key"
                        value={apiKeys.newsApi}
                        onChange={handleApiKeyChange('newsApi')}
                        fullWidth
                        margin="normal"
                        helperText="Used for financial news aggregation"
                        InputProps={{
                          endAdornment: keyStatus.newsApi ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Finnhub API Key"
                        value={apiKeys.finnhub}
                        onChange={handleApiKeyChange('finnhub')}
                        fullWidth
                        margin="normal"
                        helperText="Used for market news and sentiment analysis"
                        InputProps={{
                          endAdornment: keyStatus.finnhub ? (
                            <Tooltip title="API key configured">
                              <CheckIcon color="success" />
                            </Tooltip>
                          ) : null
                        }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Data Source Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={dataSourceConfig.useMockDataAsFallback}
                    onChange={handleConfigChange('useMockDataAsFallback')}
                  />
                }
                label="Use mock data as fallback"
              />
              <Tooltip title="When enabled, the application will use mock data if API calls fail">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataSourceConfig.forceMockData}
                      onChange={handleConfigChange('forceMockData')}
                    />
                  }
                  label="Force mock data (for testing)"
                />
                <Tooltip title="When enabled, the application will always use mock data, even if API keys are configured">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataSourceConfig.enableApiCache}
                      onChange={handleConfigChange('enableApiCache')}
                    />
                  }
                  label="Enable API response caching"
                />
                <Tooltip title="When enabled, API responses will be cached to reduce API calls">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Cache TTL Settings (seconds)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Market Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.marketDataCacheTTL}
                    onChange={handleConfigChange('marketDataCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Fundamental Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.fundamentalDataCacheTTL}
                    onChange={handleConfigChange('fundamentalDataCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="News Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.newsDataCacheTTL}
                    onChange={handleConfigChange('newsDataCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Portfolio Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.portfolioDataCacheTTL}
                    onChange={handleConfigChange('portfolioDataCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Advanced Cache Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Low Volatility Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.lowVolatilityCacheTTL}
                    onChange={handleConfigChange('lowVolatilityCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText="For data that rarely changes (e.g., company profiles)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Medium Volatility Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.mediumVolatilityCacheTTL}
                    onChange={handleConfigChange('mediumVolatilityCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText="For data that changes periodically (e.g., financial statements)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="High Volatility Data Cache TTL"
                    type="number"
                    value={dataSourceConfig.highVolatilityCacheTTL}
                    onChange={handleConfigChange('highVolatilityCacheTTL')}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText="For data that changes frequently (e.g., market quotes)"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </Box>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Source Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" gutterBottom>
                <strong>Using Real Data For:</strong>
              </Typography>
              <Box sx={{ ml: 2 }}>
                {Object.entries(keyStatus).some(([_, value]) => value) ? (
                  Object.entries(keyStatus).map(([key, value]) => (
                    value && (
                      <Typography key={key} variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <CheckIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Typography>
                    )
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No real data sources configured
                  </Typography>
                )}
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2 }} gutterBottom>
                <strong>Using Mock Data For:</strong>
              </Typography>
              <Box sx={{ ml: 2 }}>
                {Object.entries(keyStatus).some(([_, value]) => !value) ? (
                  Object.entries(keyStatus).map(([key, value]) => (
                    !value && (
                      <Typography key={key} variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <ErrorIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Typography>
                    )
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    All data sources using real data
                  </Typography>
                )}
              </Box>
              
              {dataSourceConfig.forceMockData && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Mock data is currently forced for all data sources
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApiConfigurationPanel;