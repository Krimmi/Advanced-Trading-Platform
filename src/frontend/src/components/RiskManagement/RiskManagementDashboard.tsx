import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { useParams } from 'react-router-dom';
import riskManagementService, { PortfolioRiskMetrics } from '../../services/riskManagementService';
import portfolioConstructionService, { Portfolio } from '../../services/portfolioConstructionService';
import RiskMetricsPanel from './RiskMetricsPanel';
import StressTestingTool from './StressTestingTool';
import ScenarioAnalysisTool from './ScenarioAnalysisTool';
import RiskDecompositionChart from './RiskDecompositionChart';
import PortfolioRiskOverview from './PortfolioRiskOverview';
import HistoricalRiskChart from './HistoricalRiskChart';

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
      id={`risk-tabpanel-${index}`}
      aria-labelledby={`risk-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RiskManagementDashboard: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<PortfolioRiskMetrics | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [benchmark, setBenchmark] = useState<string>('SPY');
  const [timeframe, setTimeframe] = useState<string>('1y');
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolio and risk metrics when portfolioId changes
  useEffect(() => {
    if (portfolioId) {
      fetchPortfolioData();
    }
  }, [portfolioId, benchmark, timeframe]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch portfolio data
      const portfolioData = await portfolioConstructionService.getPortfolio(portfolioId);
      setPortfolio(portfolioData);

      // Fetch risk metrics
      const riskMetricsData = await riskManagementService.getPortfolioRiskMetrics(portfolioId, {
        benchmark,
      });
      setRiskMetrics(riskMetricsData);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBenchmarkChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setBenchmark(event.target.value as string);
  };

  const handleTimeframeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeframe(event.target.value as string);
  };

  const refreshData = () => {
    fetchPortfolioData();
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={refreshData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Risk Management {portfolio && `- ${portfolio.name}`}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Button variant="contained" onClick={refreshData} sx={{ mr: 2 }}>
            Refresh Data
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="benchmark-select-label">Benchmark</InputLabel>
            <Select
              labelId="benchmark-select-label"
              id="benchmark-select"
              value={benchmark}
              onChange={handleBenchmarkChange as any}
              label="Benchmark"
            >
              <MenuItem value="SPY">S&P 500 (SPY)</MenuItem>
              <MenuItem value="QQQ">NASDAQ (QQQ)</MenuItem>
              <MenuItem value="IWM">Russell 2000 (IWM)</MenuItem>
              <MenuItem value="EFA">MSCI EAFE (EFA)</MenuItem>
              <MenuItem value="AGG">US Aggregate Bond (AGG)</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
            <Select
              labelId="timeframe-select-label"
              id="timeframe-select"
              value={timeframe}
              onChange={handleTimeframeChange as any}
              label="Timeframe"
            >
              <MenuItem value="1m">1 Month</MenuItem>
              <MenuItem value="3m">3 Months</MenuItem>
              <MenuItem value="6m">6 Months</MenuItem>
              <MenuItem value="1y">1 Year</MenuItem>
              <MenuItem value="3y">3 Years</MenuItem>
              <MenuItem value="5y">5 Years</MenuItem>
              <MenuItem value="max">Max</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="risk management tabs">
          <Tab label="Risk Overview" />
          <Tab label="Stress Testing" />
          <Tab label="Scenario Analysis" />
          <Tab label="Risk Decomposition" />
          <Tab label="Historical Risk" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <RiskMetricsPanel 
                    riskMetrics={riskMetrics} 
                    portfolioName={portfolio?.name || ''} 
                    benchmark={benchmark} 
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <PortfolioRiskOverview 
                    portfolio={portfolio} 
                    riskMetrics={riskMetrics} 
                    benchmark={benchmark}
                    timeframe={timeframe}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <StressTestingTool portfolioId={portfolioId} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <ScenarioAnalysisTool portfolioId={portfolioId} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <RiskDecompositionChart portfolioId={portfolioId} />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <HistoricalRiskChart 
                portfolioId={portfolioId} 
                timeframe={timeframe} 
                benchmark={benchmark} 
              />
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default RiskManagementDashboard;