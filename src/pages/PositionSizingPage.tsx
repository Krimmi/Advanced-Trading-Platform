import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  Alert,
  AlertTitle,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  AccountBalance as AccountBalanceIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import CorrelationVisualizationPanel from '../components/risk/CorrelationVisualizationPanel';
import PositionSizingPanel from '../components/risk/PositionSizingPanel';
import { positionTrackingService } from '../services/api/trading/PositionTrackingService';
import { Portfolio, Position, PositionSizingRecommendation } from '../services/risk/models/RiskModels';
import { PositionSizingResult } from '../services/risk/PositionSizingService';

const PositionSizingPage: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<Record<string, Record<string, number>> | null>(null);
  const [positionSizeResult, setPositionSizeResult] = useState<PositionSizingResult | null>(null);
  const [recommendations, setRecommendations] = useState<PositionSizingRecommendation[] | null>(null);
  
  // Load portfolio data
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get portfolio summary
        const portfolioSummary = await positionTrackingService.getPortfolioSummary();
        
        // Convert to Portfolio format
        const portfolio: Portfolio = {
          id: 'main-portfolio',
          name: 'Main Portfolio',
          positions: portfolioSummary.positions.map(p => ({
            symbol: p.symbol,
            quantity: p.quantity,
            price: p.currentPrice,
            value: p.marketValue,
            currency: p.currency,
            assetClass: p.assetClass || 'equity',
            sector: p.sector,
            industry: p.industry,
            country: p.country,
            exchange: p.exchange
          })),
          cash: 0, // This would come from account data
          currency: 'USD',
          totalValue: portfolioSummary.totalValue,
          lastUpdated: Date.now()
        };
        
        setPortfolio(portfolio);
      } catch (err) {
        console.error('Error loading portfolio:', err);
        setError('Failed to load portfolio data. Using sample portfolio instead.');
        
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
              assetClass: 'equity',
              sector: 'Technology',
              industry: 'Consumer Electronics',
              country: 'US',
              exchange: 'NASDAQ'
            },
            {
              symbol: 'MSFT',
              quantity: 50,
              price: 325.75,
              value: 16287.5,
              currency: 'USD',
              assetClass: 'equity',
              sector: 'Technology',
              industry: 'Software',
              country: 'US',
              exchange: 'NASDAQ'
            },
            {
              symbol: 'GOOGL',
              quantity: 25,
              price: 138.50,
              value: 3462.5,
              currency: 'USD',
              assetClass: 'equity',
              sector: 'Technology',
              industry: 'Internet Content & Information',
              country: 'US',
              exchange: 'NASDAQ'
            },
            {
              symbol: 'AMZN',
              quantity: 30,
              price: 145.20,
              value: 4356,
              currency: 'USD',
              assetClass: 'equity',
              sector: 'Consumer Cyclical',
              industry: 'Internet Retail',
              country: 'US',
              exchange: 'NASDAQ'
            },
            {
              symbol: 'META',
              quantity: 40,
              price: 325.80,
              value: 13032,
              currency: 'USD',
              assetClass: 'equity',
              sector: 'Technology',
              industry: 'Internet Content & Information',
              country: 'US',
              exchange: 'NASDAQ'
            }
          ],
          cash: 10000,
          currency: 'USD',
          totalValue: 64663,
          lastUpdated: Date.now()
        };
        
        setPortfolio(samplePortfolio);
      } finally {
        setLoading(false);
      }
    };
    
    loadPortfolio();
  }, []);
  
  // Handle correlation calculation
  const handleCorrelationCalculated = (matrix: Record<string, Record<string, number>>) => {
    setCorrelationMatrix(matrix);
  };
  
  // Handle position size calculation
  const handlePositionSizeCalculated = (result: PositionSizingResult) => {
    setPositionSizeResult(result);
  };
  
  // Handle recommendations calculation
  const handleRecommendationsCalculated = (recs: PositionSizingRecommendation[]) => {
    setRecommendations(recs);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Position Sizing & Risk Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Optimize your position sizes based on risk parameters and portfolio correlation
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>
      
      {/* Error Message */}
      {error && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <AlertTitle>Warning</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* Portfolio Summary */}
      {portfolio && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.light, 0.05)
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Portfolio Value
                  </Typography>
                  <Typography variant="h5">
                    ${portfolio.totalValue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChartIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Positions
                  </Typography>
                  <Typography variant="h5">
                    {portfolio.positions.length}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.success.main, mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cash Available
                  </Typography>
                  <Typography variant="h5">
                    ${portfolio.cash.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Correlation Visualization */}
        <Grid item xs={12}>
          <CorrelationVisualizationPanel
            portfolio={portfolio || undefined}
            onCorrelationCalculated={handleCorrelationCalculated}
            height={600}
          />
        </Grid>
        
        {/* Position Sizing */}
        <Grid item xs={12}>
          <PositionSizingPanel
            portfolio={portfolio || undefined}
            accountValue={portfolio?.totalValue || 100000}
            onPositionSizeCalculated={handlePositionSizeCalculated}
            onRecommendationsCalculated={handleRecommendationsCalculated}
            height={700}
          />
        </Grid>
        
        {/* Risk Management Tips */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.info.light, 0.05)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <InfoIcon sx={{ fontSize: 24, color: theme.palette.info.main, mr: 1 }} />
              <Typography variant="h6">
                Risk Management Best Practices
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Position Sizing
                </Typography>
                <Typography variant="body2">
                  • Limit risk to 1-2% of your account per trade<br />
                  • Consider correlation when sizing related positions<br />
                  • Use smaller size for higher volatility assets<br />
                  • Adjust position size based on conviction level<br />
                  • Scale into positions rather than entering all at once
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Portfolio Construction
                </Typography>
                <Typography variant="body2">
                  • Diversify across uncorrelated assets<br />
                  • Balance risk across different sectors<br />
                  • Consider market regime when allocating capital<br />
                  • Maintain appropriate cash reserves<br />
                  • Regularly rebalance to maintain target allocations
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Risk Monitoring
                </Typography>
                <Typography variant="body2">
                  • Track portfolio correlation changes over time<br />
                  • Monitor Value at Risk (VaR) for your portfolio<br />
                  • Conduct regular stress tests using historical scenarios<br />
                  • Set alerts for significant correlation changes<br />
                  • Review position sizing after significant market moves
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PositionSizingPage;