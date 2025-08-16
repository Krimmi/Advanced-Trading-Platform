import { configureStore } from '@reduxjs/toolkit';
import authReducer, { 
  login, 
  logout, 
  fetchCurrentUser, 
  updateProfile,
  AuthState
} from '../authSlice';

// Mock the auth service
jest.mock('../../../services/auth', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    updateUserProfile: jest.fn()
  }
}));

import { authService } from '../../../services/auth';

describe('Auth Slice', () => {
  let store: any;
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      const state = store.getState().auth;
      
      expect(state).toEqual({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    });
  });
  
  describe('Login', () => {
    it('should handle login.pending', () => {
      store.dispatch({ type: login.pending.type });
      
      const state = store.getState().auth;
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle login.fulfilled', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      
      store.dispatch({ 
        type: login.fulfilled.type, 
        payload: user 
      });
      
      const state = store.getState().auth;
      
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.error).toBe(null);
    });
    
    it('should handle login.rejected', () => {
      const error = 'Invalid credentials';
      
      store.dispatch({ 
        type: login.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().auth;
      
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.error).toBe(error);
    });
    
    it('should call authService.login with credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      
      (authService.login as jest.Mock).mockResolvedValue(user);
      
      await store.dispatch(login(credentials));
      
      expect(authService.login).toHaveBeenCalledWith(credentials);
      
      const state = store.getState().auth;
      
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });
  });
  
  describe('Logout', () => {
    it('should handle logout action', () => {
      // First set up an authenticated state
      store.dispatch({ 
        type: login.fulfilled.type, 
        payload: { id: '1', email: 'test@example.com' } 
      });
      
      // Then dispatch logout
      store.dispatch(logout());
      
      const state = store.getState().auth;
      
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });
  
  describe('Fetch Current User', () => {
    it('should handle fetchCurrentUser.fulfilled', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(user);
      
      await store.dispatch(fetchCurrentUser());
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      
      const state = store.getState().auth;
      
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });
    
    it('should handle fetchCurrentUser.rejected', async () => {
      const error = 'User not found';
      
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error(error));
      
      await store.dispatch(fetchCurrentUser());
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      
      const state = store.getState().auth;
      
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error);
    });
  });
  
  describe('Update Profile', () => {
    it('should handle updateProfile.fulfilled', async () => {
      // Set up initial state with a user
      const initialUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      store.dispatch({ 
        type: login.fulfilled.type, 
        payload: initialUser 
      });
      
      // Update profile
      const updatedUser = { ...initialUser, name: 'Updated Name' };
      const profileData = { name: 'Updated Name' };
      
      (authService.updateUserProfile as jest.Mock).mockResolvedValue(updatedUser);
      
      await store.dispatch(updateProfile(profileData));
      
      expect(authService.updateUserProfile).toHaveBeenCalledWith(profileData);
      
      const state = store.getState().auth;
      
      expect(state.user).toEqual(updatedUser);
      expect(state.loading).toBe(false);
    });
  });
});