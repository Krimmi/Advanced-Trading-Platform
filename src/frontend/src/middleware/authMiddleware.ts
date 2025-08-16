/**
 * Authentication middleware for the Ultimate Hedge Fund & Trading Application.
 * Handles token refreshing and authentication state management.
 */
import { Middleware } from 'redux';
import { RootState } from '../store';
import authService from '../services/authService';
import { refreshToken, logout, setAuthenticated } from '../store/slices/authSlice';

// Time before token expiration to trigger refresh (in milliseconds)
const REFRESH_TOKEN_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export const authMiddleware: Middleware<{}, RootState> = store => next => action => {
  // Process the action first
  const result = next(action);
  
  // Get current state after action is processed
  const state = store.getState();
  
  // Check if we need to refresh the token
  if (state.auth.isAuthenticated && state.auth.token) {
    const expiresAtStr = localStorage.getItem('expires_at');
    
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      
      // If token is close to expiration, refresh it
      if (expiresAt - now < REFRESH_TOKEN_THRESHOLD) {
        store.dispatch(refreshToken());
      }
    }
  }
  
  // Check if token is still valid
  if (state.auth.isAuthenticated && !authService.isAuthenticated()) {
    // Token has expired or been removed, log out
    store.dispatch(logout());
  } else if (!state.auth.isAuthenticated && authService.isAuthenticated()) {
    // Token exists but state doesn't reflect it
    store.dispatch(setAuthenticated(true));
  }
  
  return result;
};

export default authMiddleware;