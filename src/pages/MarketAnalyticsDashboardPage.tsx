import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import MarketInsightsDashboard from '../components/dashboard/MarketInsightsDashboard';
import { MarketDataService } from '../services/market-data/MarketDataService';
import { MarketAnalyticsService } from '../services/analytics/MarketAnalyticsService';
import { MarketPredictionService } from '../services/ml/MarketPredictionService';

/**
 * Market Analytics Dashboard Page
 * 
 * This page serves as a container for the MarketInsightsDashboard component
 * and handles service initialization.
 */
const MarketAnalyticsDashboardPage: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize market data service
        const marketDataService = MarketDataService.getInstance();
        await marketDataService.initialize({
          alpaca: {
            apiKey: process.env.REACT_APP_ALPACA_API_KEY || 'demo_api_key',
            apiSecret: process.env.REACT_APP_ALPACA_API_SECRET || 'demo_api_secret',
            paperTrading: true
          }
        });
        
        // Initialize analytics service
        const analyticsService = MarketAnalyticsService.getInstance();
        await analyticsService.initialize();
        
        // Initialize prediction service
        const predictionService = MarketPredictionService.getInstance();
        await predictionService.initialize();
        
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing services:', error);
        setError('Failed to initialize market data services. Please try again later.');
        setIsInitializing(false);
      }
    };
    
    initializeServices();
  }, []);
  
  // Render loading state
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <MarketInsightsDashboard />
    </Box>
  );
};

export default MarketAnalyticsDashboardPage;