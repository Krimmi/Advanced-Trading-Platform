import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

// Layout components
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Main pages
import DashboardPage from './pages/dashboard/DashboardPage';
import MarketOverviewPage from './pages/market/MarketOverviewPage';
import StockDetailPage from './pages/stock/StockDetailPage';
import ScreenerPage from './pages/screener/ScreenerPage';
import PortfolioPage from './pages/portfolio/PortfolioPage';
import PortfolioDetailPage from './pages/portfolio/PortfolioDetailPage';
import WatchlistPage from './pages/watchlist/WatchlistPage';
import AlertsPage from './pages/alerts/AlertsPage';
import MLPredictionsPage from './pages/ml/MLPredictionsPage';
import MLDashboardPage from './pages/ml/MLDashboardPage';
import UnifiedDashboardPage from './pages/ml/UnifiedDashboardPage';
import BacktestPage from './pages/backtest/BacktestPage';
import SettingsPage from './pages/settings/SettingsPage';

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Types and services
import { RootState } from './store';
import { fetchCurrentUser } from './store/slices/authSlice';
import authService from './services/authService';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Fetch current user data
          await dispatch(fetchCurrentUser() as any);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initAuth();
  }, [dispatch]);
  
  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      
      {/* Main app routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/market" element={
          <ProtectedRoute>
            <MarketOverviewPage />
          </ProtectedRoute>
        } />
        
        <Route path="/stock/:symbol" element={
          <ProtectedRoute>
            <StockDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/screener" element={
          <ProtectedRoute>
            <ScreenerPage />
          </ProtectedRoute>
        } />
        
        <Route path="/portfolio" element={
          <ProtectedRoute>
            <PortfolioPage />
          </ProtectedRoute>
        } />
        
        <Route path="/portfolio/:id" element={
          <ProtectedRoute>
            <PortfolioDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/watchlist" element={
          <ProtectedRoute>
            <WatchlistPage />
          </ProtectedRoute>
        } />
        
        <Route path="/alerts" element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/ml-predictions" element={
          <ProtectedRoute>
            <MLPredictionsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/ml-dashboard" element={
          <ProtectedRoute>
            <MLDashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/ml-unified" element={
          <ProtectedRoute>
            <UnifiedDashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/backtest" element={
          <ProtectedRoute>
            <BacktestPage />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;