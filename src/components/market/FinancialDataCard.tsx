import React, { useState, useEffect } from 'react';
import { financialDataService } from '../../services/api/financialData/FinancialDataServiceFactory';
import { CompanyProfile, FinancialRatios } from '../../services/api/financialData/FinancialDataService';
import { Card, CardContent, CardHeader, Typography, Grid, Divider, CircularProgress, Box } from '@mui/material';

interface FinancialDataCardProps {
  symbol: string;
}

const FinancialDataCard: React.FC<FinancialDataCardProps> = ({ symbol }) => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [ratios, setRatios] = useState<FinancialRatios | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch company profile and financial ratios in parallel
        const [profileData, ratiosData] = await Promise.all([
          financialDataService.getCompanyProfile(symbol),
          financialDataService.getFinancialRatios(symbol)
        ]);
        
        setProfile(profileData);
        setRatios(ratiosData);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <CardHeader title={`${symbol} Financial Data`} />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title={`${symbol} Financial Data`} />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={profile?.name || symbol} 
        subheader={`${profile?.exchange}: ${symbol} | ${profile?.sector} | ${profile?.industry}`} 
      />
      <CardContent>
        <Typography variant="body2" paragraph>
          {profile?.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">Company Information</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">CEO</Typography>
                <Typography variant="body2">{profile?.ceo || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Employees</Typography>
                <Typography variant="body2">{profile?.employees?.toLocaleString() || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Website</Typography>
                <Typography variant="body2">
                  <a href={profile?.website} target="_blank" rel="noopener noreferrer">
                    {profile?.website}
                  </a>
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Headquarters</Typography>
                <Typography variant="body2">
                  {[profile?.address, profile?.city, profile?.state, profile?.zip, profile?.country]
                    .filter(Boolean)
                    .join(', ')}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">Key Financial Ratios</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">P/E Ratio</Typography>
                <Typography variant="body2">{ratios?.peRatio?.toFixed(2) || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">P/B Ratio</Typography>
                <Typography variant="body2">{ratios?.pbRatio?.toFixed(2) || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">P/S Ratio</Typography>
                <Typography variant="body2">{ratios?.psRatio?.toFixed(2) || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">EV/EBITDA</Typography>
                <Typography variant="body2">{ratios?.evToEbitda?.toFixed(2) || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Profit Margin</Typography>
                <Typography variant="body2">
                  {ratios?.profitMargin ? `${(ratios.profitMargin * 100).toFixed(2)}%` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Dividend Yield</Typography>
                <Typography variant="body2">
                  {ratios?.dividendYield ? `${(ratios.dividendYield * 100).toFixed(2)}%` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">ROE</Typography>
                <Typography variant="body2">
                  {ratios?.returnOnEquity ? `${(ratios.returnOnEquity * 100).toFixed(2)}%` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">ROA</Typography>
                <Typography variant="body2">
                  {ratios?.returnOnAssets ? `${(ratios.returnOnAssets * 100).toFixed(2)}%` : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FinancialDataCard;