import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Main pages
import DashboardPage from './pages/dashboard/DashboardPage';
import DashboardDemo from './pages/dashboard/DashboardDemo';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import MarketOverviewPage from './pages/market/MarketOverviewPage';
import StockDetailPage from './pages/market/StockDetailPage';
import PortfolioPage from './pages/portfolio/PortfolioPage';
import PortfolioDetailPage from './pages/portfolio/PortfolioDetailPage';
import TradingPage from './pages/trading/TradingPage';
import MLDashboardPage from './pages/ml/MLDashboardPage';
import MLModelDetailPage from './pages/ml/MLModelDetailPage';
import BacktestingPage from './pages/analytics/BacktestingPage';
import PerformancePage from './pages/analytics/PerformancePage';
import AlertsPage from './pages/analytics/AlertsPage';
import SettingsPage from './pages/settings/SettingsPage';

// Auth components
import ProtectedRoute from './components/common/ProtectedRoute';

// Store
import { RootState } from './store';
import { fetchCurrentUser } from './store/slices/authSlice';

// Services
import { authService } from './services/auth';

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
        
        <Route path="/dashboard/personalized" element={
          <ProtectedRoute>
            <DashboardDemo />
          </ProtectedRoute>
        } />
        
        <Route path="/marketplace" element={
          <ProtectedRoute>
            <MarketplacePage />
          </ProtectedRoute>
        } />
        
        <Route path="/market" element={
          <ProtectedRoute>
            <MarketOverviewPage />
          </ProtectedRoute>
        } />
        
        <Route path="/market/:symbol" element={
          <ProtectedRoute>
            <StockDetailPage />
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
        
        <Route path="/trading" element={
          <ProtectedRoute>
            <TradingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/ml" element={
          <ProtectedRoute>
            <MLDashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/ml/predictions" element={
          <ProtectedRoute>
            <MLPredictionPage />
          </ProtectedRoute>
        } />
        
        <Route path="/ml/:id" element={
          <ProtectedRoute>
            <MLModelDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/backtesting" element={
          <ProtectedRoute>
            <BacktestingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/performance" element={
          <ProtectedRoute>
            <PerformancePage />
          </ProtectedRoute>
        } />
        
        <Route path="/alerts" element={
          <ProtectedRoute>
            <AlertsPage />
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