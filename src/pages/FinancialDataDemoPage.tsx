import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import FinancialDataCard from '../components/market/FinancialDataCard';
import NewsCard from '../components/market/NewsCard';
import SentimentAnalysisCard from '../components/market/SentimentAnalysisCard';
import StockQuoteCard from '../components/market/StockQuoteCard';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const FinancialDataDemoPage: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [inputSymbol, setInputSymbol] = useState<string>('AAPL');
  const [tabValue, setTabValue] = useState<number>(0);

  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputSymbol(event.target.value.toUpperCase());
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim());
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Financial Data & News API Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This page demonstrates the integration of financial data, news, and sentiment analysis APIs.
        Enter a stock symbol to view its data.
      </Typography>

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
              >
                Load Data
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {symbol && (
        <>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StockQuoteCard symbol={symbol} />
              </Grid>
              <Grid item xs={12} md={6}>
                <NewsCard symbol={symbol} limit={3} />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="financial data tabs">
                <Tab label="Company Profile & Financials" {...a11yProps(0)} />
                <Tab label="News & Sentiment" {...a11yProps(1)} />
              </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
              <FinancialDataCard symbol={symbol} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <SentimentAnalysisCard symbol={symbol} />
                </Grid>
                <Grid item xs={12}>
                  <NewsCard symbol={symbol} limit={10} />
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </>
      )}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Top Financial News
      </Typography>
      <NewsCard category="business" limit={5} title="Top Business News" />
    </Container>
  );
};

export default FinancialDataDemoPage;