/**
 * Authentication service for the Ultimate Hedge Fund & Trading Application.
 * Handles user authentication, token management, and session persistence.
 */
import { apiRequest } from './api';

// Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  username: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

// Auth service
const authService = {
  // Login user
  login: (data: LoginRequest) => {
    // Convert to form data for OAuth2 compatibility
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/api/auth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData,
    }).then(response => {
      // Store token and user info
      localStorage.setItem('token', response.access_token);
      
      // Calculate expiration time
      const expiresAt = Date.now() + response.expires_in * 1000;
      localStorage.setItem('expires_at', expiresAt.toString());
      
      // Store basic user info
      localStorage.setItem('user_id', response.user_id.toString());
      localStorage.setItem('username', response.username);
      
      return response;
    });
  },

  // Register user
  register: (data: RegisterRequest) => {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/api/user/register',
      data,
    }).then(response => {
      // Store token and user info
      localStorage.setItem('token', response.access_token);
      
      // Calculate expiration time
      const expiresAt = Date.now() + response.expires_in * 1000;
      localStorage.setItem('expires_at', expiresAt.toString());
      
      // Store basic user info
      localStorage.setItem('user_id', response.user_id.toString());
      localStorage.setItem('username', response.username);
      
      return response;
    });
  },

  // Logout user
  logout: () => {
    // Call logout endpoint
    return apiRequest<{ message: string }>({
      method: 'POST',
      url: '/api/auth/logout',
    }).finally(() => {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('user_profile');
    });
  },

  // Get current user profile
  getCurrentUser: () => {
    return apiRequest<UserProfile>({
      method: 'GET',
      url: '/api/auth/me',
    }).then(response => {
      // Store full user profile
      localStorage.setItem('user_profile', JSON.stringify(response));
      return response;
    });
  },

  // Refresh token
  refreshToken: () => {
    return apiRequest<{ access_token: string; token_type: string; expires_in: number }>({
      method: 'POST',
      url: '/api/auth/refresh',
    }).then(response => {
      // Update token in localStorage
      localStorage.setItem('token', response.access_token);
      
      // Calculate new expiration time
      const expiresAt = Date.now() + response.expires_in * 1000;
      localStorage.setItem('expires_at', expiresAt.toString());
      
      return response;
    });
  },

  // Request password reset
  requestPasswordReset: (data: PasswordResetRequest) => {
    return apiRequest<{ message: string }>({
      method: 'POST',
      url: '/api/user/forgot-password',
      data,
    });
  },

  // Change password (when logged in)
  changePassword: (data: PasswordChangeRequest) => {
    return apiRequest<{ message: string }>({
      method: 'PUT',
      url: '/api/user/change-password',
      data,
    });
  },

  // Update user profile
  updateProfile: (data: Partial<UserProfile>) => {
    return apiRequest<UserProfile>({
      method: 'PUT',
      url: '/api/user/profile',
      data,
    }).then(response => {
      // Update stored user profile
      localStorage.setItem('user_profile', JSON.stringify(response));
      return response;
    });
  },

  // Get stored user profile
  getStoredUser: (): UserProfile | null => {
    const profileStr = localStorage.getItem('user_profile');
    if (profileStr) {
      try {
        return JSON.parse(profileStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const expiresAtStr = localStorage.getItem('expires_at');
    
    if (!token || !expiresAtStr) {
      return false;
    }
    
    // Check if token is expired
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();
    
    if (now >= expiresAt) {
      // Token expired, clear auth data
      authService.logout();
      return false;
    }
    
    return true;
  },

  // Get token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Get user ID
  getUserId: (): number | null => {
    const userId = localStorage.getItem('user_id');
    return userId ? parseInt(userId, 10) : null;
  },

  // Get username
  getUsername: (): string | null => {
    return localStorage.getItem('username');
  },
  
  // Initialize authentication
  initAuth: async (): Promise<boolean> => {
    if (authService.isAuthenticated()) {
      try {
        // If token exists but close to expiry, refresh it
        const expiresAtStr = localStorage.getItem('expires_at');
        if (expiresAtStr) {
          const expiresAt = parseInt(expiresAtStr, 10);
          const now = Date.now();
          const fifteenMinutes = 15 * 60 * 1000;
          
          if (expiresAt - now < fifteenMinutes) {
            // Token expires soon, refresh it
            await authService.refreshToken();
          }
        }
        
        // If no stored profile, fetch it
        if (!authService.getStoredUser()) {
          await authService.getCurrentUser();
        }
        
        return true;
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
        return false;
      }
    }
    return false;
  }
};

export default authService;