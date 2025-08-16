import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ButtonGroup,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import ForumIcon from '@mui/icons-material/Forum';
import SentimentAnalyticsService from '../../services/sentimentAnalyticsService';

interface TrendingTickersPanelProps {
  platform?: string;
  count?: number;
}

const TrendingTickersPanel: React.FC<TrendingTickersPanelProps> = ({ 
  platform = 'all',
  count = 10
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trendingTickers, setTrendingTickers] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(platform);
  
  const sentimentService = new SentimentAnalyticsService();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await sentimentService.getTrendingTickers(selectedPlatform, count);
        setTrendingTickers(data);
      } catch (err) {
        console.error('Error fetching trending tickers:', err);
        setError('Failed to load trending tickers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPlatform, count]);
  
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <TwitterIcon />;
      case 'reddit':
        return <RedditIcon />;
      case 'stocktwits':
        return <ForumIcon />;
      default:
        return null;
    }
  };
  
  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 10) return <TrendingUpIcon sx={{ color: '#4CAF50' }} />;
    if (changePercent < -10) return <TrendingDownIcon sx={{ color: '#F44336' }} />;
    return <TrendingFlatIcon sx={{ color: '#9E9E9E' }} />;
  };
  
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return '#4CAF50';
    if (sentiment > 0.2) return '#8BC34A';
    if (sentiment > -0.2) return '#9E9E9E';
    if (sentiment > -0.5) return '#FF9800';
    return '#F44336';
  };
  
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Trending Tickers
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Trending Tickers
        </Typography>
        <ButtonGroup size="small">
          <Button 
            onClick={() => handlePlatformChange('all')} 
            variant={selectedPlatform === 'all' ? 'contained' : 'outlined'}
          >
            All
          </Button>
          <Button 
            onClick={() => handlePlatformChange('twitter')} 
            variant={selectedPlatform === 'twitter' ? 'contained' : 'outlined'}
            startIcon={<TwitterIcon />}
          >
            Twitter
          </Button>
          <Button 
            onClick={() => handlePlatformChange('reddit')} 
            variant={selectedPlatform === 'reddit' ? 'contained' : 'outlined'}
            startIcon={<RedditIcon />}
          >
            Reddit
          </Button>
          <Button 
            onClick={() => handlePlatformChange('stocktwits')} 
            variant={selectedPlatform === 'stocktwits' ? 'contained' : 'outlined'}
            startIcon={<ForumIcon />}
          >
            StockTwits
          </Button>
        </ButtonGroup>
      </Box>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ticker</TableCell>
              <TableCell align="right">Mentions</TableCell>
              <TableCell>Sentiment</TableCell>
              <TableCell align="right">Change</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trendingTickers.map((ticker, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="bold">
                    {ticker.ticker}
                  </Typography>
                </TableCell>
                <TableCell align="right">{ticker.mentionCount}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getSentimentColor(ticker.sentiment),
                        mr: 1
                      }}
                    />
                    <Typography variant="body2">
                      {ticker.sentiment.toFixed(2)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {getTrendIcon(ticker.changePercent)}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        ml: 0.5,
                        color: ticker.changePercent > 0 ? '#4CAF50' : 
                               ticker.changePercent < 0 ? '#F44336' : 
                               'text.secondary'
                      }}
                    >
                      {ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(1)}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {trendingTickers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No trending tickers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Trending tickers based on social media mentions and sentiment analysis. 
          Change percentage indicates the increase or decrease in mentions over the past 24 hours.
        </Typography>
      </Box>
    </Paper>
  );
};

export default TrendingTickersPanel;