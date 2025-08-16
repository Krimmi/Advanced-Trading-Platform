import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { marketDataService } from '../../services/api/marketData/MarketDataServiceFactory';

interface StockQuoteCardProps {
  symbol: string;
  provider?: 'alphaVantage' | 'polygon' | 'iexCloud' | 'auto';
}

/**
 * Component that displays a stock quote in a card format
 */
const StockQuoteCard: React.FC<StockQuoteCardProps> = ({ 
  symbol, 
  provider = 'auto' 
}) => {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const quoteData = await marketDataService.getQuote(symbol, provider);
        setQuote(quoteData);
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch quote');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();

    // Refresh quote every 60 seconds
    const intervalId = setInterval(fetchQuote, 60000);

    return () => clearInterval(intervalId);
  }, [symbol, provider]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format large numbers
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Format date/time
  const formatTimestamp = (timestamp: string | number): string => {
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 400 }}>
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : quote ? (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h5" component="div">
                  {symbol}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {formatTimestamp(quote.timestamp)}
                </Typography>
              </Box>
              <Chip 
                size="small" 
                label={provider === 'auto' ? 'Auto' : provider} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={2}>
              <Typography variant="h4" component="div">
                {formatCurrency(quote.price)}
              </Typography>
              <Box display="flex" alignItems="center">
                {quote.change >= 0 ? (
                  <ArrowUpward fontSize="small" color="success" />
                ) : (
                  <ArrowDownward fontSize="small" color="error" />
                )}
                <Typography 
                  variant="body1" 
                  color={quote.change >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                  ml={0.5}
                >
                  {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
                </Typography>
              </Box>
            </Box>
            
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2,
                '& > div': {
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">Open</Typography>
                <Typography variant="body2">{formatCurrency(quote.open)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Previous Close</Typography>
                <Typography variant="body2">{formatCurrency(quote.previousClose)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">High</Typography>
                <Typography variant="body2">{formatCurrency(quote.high)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Low</Typography>
                <Typography variant="body2">{formatCurrency(quote.low)}</Typography>
              </Box>
              <Box gridColumn="span 2">
                <Typography variant="caption" color="text.secondary">Volume</Typography>
                <Typography variant="body2">{formatNumber(quote.volume)}</Typography>
              </Box>
            </Box>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default StockQuoteCard;