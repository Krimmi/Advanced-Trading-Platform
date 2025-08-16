/**
 * Strategy Dashboard Demo
 * 
 * This file demonstrates how to use the Strategy Dashboard components and services
 */

import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography } from '@mui/material';

// Import the Strategy Dashboard
import { StrategyDashboardPage } from '../components/strategy';

// Import types
import { RiskLevel, Timeframe } from '../models/strategy/StrategyTypes';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// API key for the services
const API_KEY = 'your-api-key-here';

// User preferences
const userPreferences = {
  riskTolerance: RiskLevel.MODERATE,
  preferredTimeframes: [Timeframe.DAILY, Timeframe.WEEKLY],
  preferredStrategyTypes: [],
  excludedStrategyTypes: [],
  preferredMarketConditions: [],
  maxComplexity: 70,
  minSharpeRatio: 1.0,
  maxDrawdown: -0.15,
  minWinRate: 0.5,
  customTags: []
};

// Demo App
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box component="header" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Container maxWidth="lg">
            <Typography variant="h5" component="h1">
              NinjaTech AI - Hedge Fund Trading Application
            </Typography>
            <Typography variant="subtitle1">
              Strategy Dashboard Demo
            </Typography>
          </Container>
        </Box>
        
        <Box component="main" sx={{ flexGrow: 1 }}>
          <StrategyDashboardPage 
            apiKey={API_KEY}
            userPreferences={userPreferences}
          />
        </Box>
        
        <Box component="footer" sx={{ p: 2, bgcolor: 'grey.200' }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              © {new Date().getFullYear()} NinjaTech AI. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// Render the app
const rootElement = document.getElementById('root');
render(<App />, rootElement);

/**
 * Usage Instructions:
 * 
 * 1. Set up your API key in the API_KEY constant
 * 2. Customize user preferences if needed
 * 3. Import this file in your application
 * 4. Render the App component
 * 
 * This demo shows how to integrate the Strategy Dashboard into a React application.
 * The dashboard provides access to strategy recommendations, backtesting, optimization,
 * explanations, and risk analysis.
 * 
 * To use individual components instead of the full dashboard:
 * 
 * import { 
 *   StrategyRecommendationPanel, 
 *   StrategyBacktestPanel,
 *   StrategyExplanationPanel 
 * } from '../components/strategy';
 * 
 * Then render the components with the required props:
 * 
 * <StrategyRecommendationPanel 
 *   apiKey={API_KEY}
 *   ticker="AAPL"
 *   userPreferences={userPreferences}
 *   onStrategySelect={handleStrategySelect}
 * />
 */