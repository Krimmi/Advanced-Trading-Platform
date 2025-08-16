import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button,
  Divider,
  Alert
} from '@mui/material';
import StockQuoteCard from '../components/market/StockQuoteCard';

/**
 * Demo page for showcasing market data services
 */
const MarketDataDemoPage: React.FC = () => {
  // State for the stock symbols to display
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN']);
  
  // State for the new symbol input
  const [newSymbol, setNewSymbol] = useState<string>('');
  
  // State for the selected provider
  const [provider, setProvider] = useState<'auto' | 'alphaVantage' | 'polygon' | 'iexCloud'>('auto');

  // Handle adding a new symbol
  const handleAddSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  // Handle removing a symbol
  const handleRemoveSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Market Data Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page demonstrates the use of different market data providers. You can switch between providers
        and add/remove stock symbols to see real-time market data.
      </Alert>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="provider-select-label">Data Provider</InputLabel>
              <Select
                labelId="provider-select-label"
                id="provider-select"
                value={provider}
                label="Data Provider"
                onChange={(e) => setProvider(e.target.value as any)}
              >
                <MenuItem value="auto">Auto (Best Available)</MenuItem>
                <MenuItem value="alphaVantage">Alpha Vantage</MenuItem>
                <MenuItem value="polygon">Polygon.io</MenuItem>
                <MenuItem value="iexCloud">IEX Cloud</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box display="flex" gap={2}>
              <TextField
                label="Add Symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., TSLA"
                fullWidth
                inputProps={{ maxLength: 5 }}
              />
              <Button 
                variant="contained" 
                onClick={handleAddSymbol}
                disabled={!newSymbol || symbols.includes(newSymbol.toUpperCase())}
              >
                Add
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Stock Quotes
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {symbols.map((symbol) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={symbol}>
            <Box position="relative">
              <StockQuoteCard symbol={symbol} provider={provider} />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleRemoveSymbol(symbol)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  minWidth: 'auto',
                  width: 30,
                  height: 30,
                  p: 0
                }}
              >
                X
              </Button>
            </Box>
          </Grid>
        ))}
        
        {symbols.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="warning">
              No symbols added. Add a stock symbol using the form above.
            </Alert>
          </Grid>
        )}
      </Grid>
      
      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Note: Market data is refreshed every 60 seconds. Some providers may have rate limits or require API keys.
        </Typography>
      </Box>
    </Container>
  );
};

export default MarketDataDemoPage;