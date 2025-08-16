import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import VaRVisualizationPanel from '../components/risk/VaRVisualizationPanel';
import StressTestingPanel from '../components/risk/StressTestingPanel';
import { RiskCalculationServiceFactory } from '../services/risk/RiskCalculationServiceFactory';
import {
  Portfolio,
  Position,
  RiskAlert,
  RiskAlertLevel,
  AssetClass,
  RiskScenario
} from '../services/risk/models/RiskModels';

// Styled components
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const AlertItem = styled(Alert)<{ severity: RiskAlertLevel }>(({ theme, severity }) => {
  const severityMap = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    critical: 'error'
  };
  
  return {
    marginBottom: theme.spacing(2),
  };
});

const PortfolioSummaryCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const PortfolioStat = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const PortfolioStatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

const PortfolioStatValue = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold'
}));

/**
 * RiskManagementPage displays comprehensive risk management tools
 */
const RiskManagementPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [scenarios, setScenarios] = useState<RiskScenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);
  
  // Load portfolios and risk data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      
      // Get portfolios
      const portfolioData = await riskService.getAllPortfolios();
      setPortfolios(portfolioData);
      
      // Set selected portfolio if not already set
      if (portfolioData.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfolioData[0].id);
      }
      
      // Get risk alerts for selected portfolio
      if (selectedPortfolioId) {
        const alertsData = await riskService.getRiskAlerts(selectedPortfolioId);
        setRiskAlerts(alertsData);
      }
      
      // Get available scenarios
      const scenariosData = await riskService.getAvailableScenarios();
      setScenarios(scenariosData);
    } catch (err) {
      console.error('Error loading risk data:', err);
      setError(`Failed to load risk data: ${err instanceof Error ? err.message : String(err)}`);
      
      // Create sample portfolio if none exists
      if (portfolios.length === 0) {
        createSamplePortfolio();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create sample portfolio for demonstration
  const createSamplePortfolio = async () => {
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      
      // Create sample portfolio
      const samplePortfolio: Portfolio = {
        id: 'sample-portfolio',
        name: 'Sample Portfolio',
        positions: [
          {
            symbol: 'AAPL',
            quantity: 100,
            price: 175.25,
            value: 17525,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Technology',
            country: 'US'
          },
          {
            symbol: 'MSFT',
            quantity: 50,
            price: 325.75,
            value: 16287.5,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Technology',
            country: 'US'
          },
          {
            symbol: 'GOOGL',
            quantity: 25,
            price: 138.50,
            value: 3462.5,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Technology',
            country: 'US'
          },
          {
            symbol: 'AMZN',
            quantity: 30,
            price: 142.75,
            value: 4282.5,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Consumer Cyclical',
            country: 'US'
          },
          {
            symbol: 'BRK.B',
            quantity: 40,
            price: 355.20,
            value: 14208,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Financial Services',
            country: 'US'
          },
          {
            symbol: 'JNJ',
            quantity: 60,
            price: 162.50,
            value: 9750,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Healthcare',
            country: 'US'
          },
          {
            symbol: 'JPM',
            quantity: 75,
            price: 148.75,
            value: 11156.25,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Financial Services',
            country: 'US'
          },
          {
            symbol: 'V',
            quantity: 45,
            price: 245.30,
            value: 11038.5,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Financial Services',
            country: 'US'
          },
          {
            symbol: 'PG',
            quantity: 55,
            price: 152.80,
            value: 8404,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Consumer Defensive',
            country: 'US'
          },
          {
            symbol: 'UNH',
            quantity: 20,
            price: 485.60,
            value: 9712,
            currency: 'USD',
            assetClass: AssetClass.EQUITY,
            sector: 'Healthcare',
            country: 'US'
          }
        ],
        cash: 25000,
        currency: 'USD',
        totalValue: 130826.25,
        lastUpdated: Date.now()
      };
      
      // Save portfolio
      await riskService.savePortfolio(samplePortfolio);
      
      // Reload data
      await loadData();
      
      // Set selected portfolio
      setSelectedPortfolioId(samplePortfolio.id);
    } catch (err) {
      console.error('Error creating sample portfolio:', err);
      setError(`Failed to create sample portfolio: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle portfolio selection change
  const handlePortfolioChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedPortfolioId(event.target.value as string);
    
    // Load risk alerts for selected portfolio
    if (event.target.value) {
      loadRiskAlerts(event.target.value as string);
    }
  };
  
  // Load risk alerts for a portfolio
  const loadRiskAlerts = async (portfolioId: string) => {
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      const alertsData = await riskService.getRiskAlerts(portfolioId);
      setRiskAlerts(alertsData);
    } catch (err) {
      console.error('Error loading risk alerts:', err);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadData();
  };
  
  // Get selected portfolio
  const getSelectedPortfolio = (): Portfolio | undefined => {
    return portfolios.find(p => p.id === selectedPortfolioId);
  };
  
  // Format currency
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get asset allocation by asset class
  const getAssetAllocation = (portfolio: Portfolio): Record<string, { value: number, percentage: number }> => {
    const allocation: Record<string, { value: number, percentage: number }> = {};
    
    // Initialize with cash
    allocation['Cash'] = {
      value: portfolio.cash,
      percentage: portfolio.cash / portfolio.totalValue
    };
    
    // Add positions by asset class
    for (const position of portfolio.positions) {
      const assetClass = position.assetClass;
      
      if (!allocation[assetClass]) {
        allocation[assetClass] = {
          value: 0,
          percentage: 0
        };
      }
      
      allocation[assetClass].value += position.value;
      allocation[assetClass].percentage = allocation[assetClass].value / portfolio.totalValue;
    }
    
    return allocation;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }
  
  // Get selected portfolio
  const selectedPortfolio = getSelectedPortfolio();
  
  return (
    <PageContainer maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SectionTitle variant="h4">Risk Management</SectionTitle>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createSamplePortfolio}
          >
            Create Sample Portfolio
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* Portfolio Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Portfolio</InputLabel>
              <Select
                value={selectedPortfolioId}
                onChange={handlePortfolioChange}
                label="Select Portfolio"
              >
                {portfolios.map(portfolio => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name} ({formatCurrency(portfolio.totalValue, portfolio.currency)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Select a portfolio to view its risk metrics and analysis. If no portfolios are available, 
              you can create a sample portfolio for demonstration purposes.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {selectedPortfolio ? (
        <>
          {/* Portfolio Summary */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <PortfolioSummaryCard>
                <Typography variant="h6" gutterBottom>Portfolio Summary</Typography>
                <PortfolioStat>
                  <PortfolioStatLabel>Total Value</PortfolioStatLabel>
                  <PortfolioStatValue>
                    {formatCurrency(selectedPortfolio.totalValue, selectedPortfolio.currency)}
                  </PortfolioStatValue>
                </PortfolioStat>
                <PortfolioStat>
                  <PortfolioStatLabel>Cash</PortfolioStatLabel>
                  <PortfolioStatValue>
                    {formatCurrency(selectedPortfolio.cash, selectedPortfolio.currency)}
                  </PortfolioStatValue>
                </PortfolioStat>
                <PortfolioStat>
                  <PortfolioStatLabel>Invested</PortfolioStatLabel>
                  <PortfolioStatValue>
                    {formatCurrency(selectedPortfolio.totalValue - selectedPortfolio.cash, selectedPortfolio.currency)}
                  </PortfolioStatValue>
                </PortfolioStat>
                <PortfolioStat>
                  <PortfolioStatLabel>Positions</PortfolioStatLabel>
                  <PortfolioStatValue>{selectedPortfolio.positions.length}</PortfolioStatValue>
                </PortfolioStat>
                <PortfolioStat>
                  <PortfolioStatLabel>Last Updated</PortfolioStatLabel>
                  <PortfolioStatValue>
                    {new Date(selectedPortfolio.lastUpdated).toLocaleString()}
                  </PortfolioStatValue>
                </PortfolioStat>
              </PortfolioSummaryCard>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Asset Allocation</Typography>
                <Box>
                  {Object.entries(getAssetAllocation(selectedPortfolio)).map(([assetClass, data]) => (
                    <Box key={assetClass} sx={{ mb: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{assetClass}</Typography>
                        <Typography variant="body2">
                          {formatCurrency(data.value, selectedPortfolio.currency)} ({(data.percentage * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, mt: 0.5 }}>
                        <Box
                          sx={{
                            width: `${data.percentage * 100}%`,
                            bgcolor: assetClass === 'Cash' ? 'success.main' : 'primary.main',
                            height: 8,
                            borderRadius: 1
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Risk Alerts */}
          {riskAlerts.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>Risk Alerts</Typography>
              {riskAlerts.map(alert => (
                <Alert
                  key={alert.id}
                  severity={
                    alert.level === 'critical' ? 'error' : 
                    alert.level === 'high' ? 'error' :
                    alert.level === 'medium' ? 'warning' : 'info'
                  }
                  sx={{ mb: 2 }}
                >
                  <AlertTitle>{alert.title}</AlertTitle>
                  {alert.message}
                </Alert>
              ))}
            </Box>
          )}
          
          {/* Tabs */}
          <Paper>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Value at Risk (VaR)" />
              <Tab label="Stress Testing" />
              <Tab label="Position Sizing" />
              <Tab label="Correlation Analysis" />
            </Tabs>
            
            <TabPanel hidden={activeTab !== 0}>
              <VaRVisualizationPanel
                portfolioId={selectedPortfolioId}
                onRefresh={handleRefresh}
              />
            </TabPanel>
            
            <TabPanel hidden={activeTab !== 1}>
              <StressTestingPanel
                portfolioId={selectedPortfolioId}
                onRefresh={handleRefresh}
              />
            </TabPanel>
            
            <TabPanel hidden={activeTab !== 2}>
              <Typography variant="h6" gutterBottom>Position Sizing</Typography>
              <Typography paragraph>
                Position sizing recommendations help you optimize your portfolio allocation based on
                risk metrics, expected returns, and your risk tolerance.
              </Typography>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Position Sizing Methods</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Kelly Criterion</Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Optimizes position sizes based on edge and risk to maximize long-term growth rate.
                      </Typography>
                      <Button variant="outlined" size="small">
                        Generate Recommendations
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Equal Risk Contribution</Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Allocates capital so each position contributes equally to overall portfolio risk.
                      </Typography>
                      <Button variant="outlined" size="small">
                        Generate Recommendations
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Optimal F</Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Determines the optimal fraction of capital to risk on each position.
                      </Typography>
                      <Button variant="outlined" size="small">
                        Generate Recommendations
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="body2" color="textSecondary">
                This feature will be fully implemented in the next phase of development.
              </Typography>
            </TabPanel>
            
            <TabPanel hidden={activeTab !== 3}>
              <Typography variant="h6" gutterBottom>Correlation Analysis</Typography>
              <Typography paragraph>
                Correlation analysis helps you understand how different assets in your portfolio move
                in relation to each other, which is crucial for diversification and risk management.
              </Typography>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Correlation Settings</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Lookback Period (days)"
                      type="number"
                      defaultValue={252}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Correlation Method</InputLabel>
                      <Select
                        value="pearson"
                        label="Correlation Method"
                      >
                        <MenuItem value="pearson">Pearson</MenuItem>
                        <MenuItem value="spearman">Spearman</MenuItem>
                        <MenuItem value="kendall">Kendall</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button variant="contained" fullWidth>
                      Calculate Correlation
                    </Button>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="body2" color="textSecondary">
                This feature will be fully implemented in the next phase of development.
              </Typography>
            </TabPanel>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No Portfolio Selected</Typography>
          <Typography paragraph>
            Please select a portfolio or create a sample portfolio to view risk metrics.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createSamplePortfolio}
          >
            Create Sample Portfolio
          </Button>
        </Paper>
      )}
    </PageContainer>
  );
};

export default RiskManagementPage;