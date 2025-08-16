import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  refreshToken,
  updateProfile,
  AuthState
} from '../slices/authSlice';

describe('Auth Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
  });
  
  it('should handle initial state', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle login.pending', () => {
    store.dispatch({ type: login.pending.type });
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  it('should handle login.fulfilled', () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockToken = 'test-token';
    
    store.dispatch({
      type: login.fulfilled.type,
      payload: { user: mockUser, token: mockToken }
    });
    
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle login.rejected', () => {
    const errorMessage = 'Invalid credentials';
    
    store.dispatch({
      type: login.rejected.type,
      payload: errorMessage
    });
    
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
  
  it('should handle logout', () => {
    // First login
    store.dispatch({
      type: login.fulfilled.type,
      payload: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token'
      }
    });
    
    // Then logout
    store.dispatch(logout());
    
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
  
  it('should handle refreshToken.fulfilled', () => {
    const newToken = 'new-test-token';
    
    store.dispatch({
      type: refreshToken.fulfilled.type,
      payload: { token: newToken }
    });
    
    const state = store.getState().auth;
    expect(state.token).toBe(newToken);
  });
  
  it('should handle updateProfile.fulfilled', () => {
    const initialUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const updatedUser = { ...initialUser, name: 'Updated Name' };
    
    // First login
    store.dispatch({
      type: login.fulfilled.type,
      payload: {
        user: initialUser,
        token: 'test-token'
      }
    });
    
    // Then update profile
    store.dispatch({
      type: updateProfile.fulfilled.type,
      payload: updatedUser
    });
    
    const state = store.getState().auth;
    expect(state.user).toEqual(updatedUser);
  });
});