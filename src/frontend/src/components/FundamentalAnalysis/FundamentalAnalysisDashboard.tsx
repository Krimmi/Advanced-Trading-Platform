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
  Chip
} from '@mui/material';
import { useParams } from 'react-router-dom';
import financialAnalysisService from '../../services/financialAnalysisService';
import valuationService from '../../services/valuationService';
import FinancialRatioVisualization from './FinancialRatioVisualization';
import ValuationModelVisualization from './ValuationModelVisualization';
import FinancialStatementAnalysis from './FinancialStatementAnalysis';
import CompanyComparison from './CompanyComparison';
import GrowthAnalysis from './GrowthAnalysis';

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
      id={`fundamental-tabpanel-${index}`}
      aria-labelledby={`fundamental-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  marketCap: number;
  employees: number;
  website: string;
  ceo: string;
  exchange: string;
}

const FundamentalAnalysisDashboard: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [valuationData, setValuationData] = useState<any>(null);
  const [peerSymbols, setPeerSymbols] = useState<string[]>([]);

  useEffect(() => {
    if (symbol) {
      fetchCompanyData();
    }
  }, [symbol]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      // Fetch company profile
      const profile = await financialAnalysisService.getCompanyProfile(symbol as string);
      setCompanyProfile(profile);

      // Fetch financial ratios
      const ratios = await financialAnalysisService.getFinancialRatios(symbol as string);
      setFinancialRatios(ratios);

      // Fetch valuation data
      const valuation = await valuationService.getValuationSummary(symbol as string);
      setValuationData(valuation);

      // Fetch peer companies
      const peers = await financialAnalysisService.getPeerCompanies(symbol as string);
      setPeerSymbols(peers);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Fundamental Analysis: {symbol}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : companyProfile ? (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5">{companyProfile.name}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                  <Chip label={companyProfile.exchange} size="small" color="primary" />
                  <Chip label={companyProfile.sector} size="small" color="secondary" />
                  <Chip label={companyProfile.industry} size="small" variant="outlined" />
                </Box>
                <Typography variant="body1" paragraph>
                  {companyProfile.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Company Information</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Market Cap</Typography>
                      <Typography variant="body1">{formatMarketCap(companyProfile.marketCap)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">CEO</Typography>
                      <Typography variant="body1">{companyProfile.ceo}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Employees</Typography>
                      <Typography variant="body1">{companyProfile.employees.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Website</Typography>
                      <Typography variant="body1" component="a" href={companyProfile.website} target="_blank" sx={{ textDecoration: 'none' }}>
                        {companyProfile.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="fundamental analysis tabs">
              <Tab label="Financial Ratios" />
              <Tab label="Valuation Models" />
              <Tab label="Financial Statements" />
              <Tab label="Peer Comparison" />
              <Tab label="Growth Analysis" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {financialRatios ? (
                <FinancialRatioVisualization 
                  symbol={symbol as string} 
                  financialRatios={financialRatios} 
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {valuationData ? (
                <ValuationModelVisualization 
                  symbol={symbol as string} 
                  valuationData={valuationData} 
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <FinancialStatementAnalysis symbol={symbol as string} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <CompanyComparison 
                mainSymbol={symbol as string} 
                peerSymbols={peerSymbols} 
              />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <GrowthAnalysis symbol={symbol as string} />
            </TabPanel>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error">
            Could not load company data for {symbol}
          </Typography>
          <Typography variant="body1">
            Please check if the symbol is correct and try again.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FundamentalAnalysisDashboard;