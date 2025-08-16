import { User } from '../../store/slices/authSlice';

// Mock user data for demo purposes
const MOCK_USER: User = {
  id: 'user-123',
  email: 'trader@ninjatech.ai',
  name: 'Alex Trader',
  firstName: 'Alex',
  lastName: 'Trader',
  role: 'user',
  avatar: 'https://i.pravatar.cc/300',
  preferences: {
    receiveUpdates: true,
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
};

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Authentication Service
 * 
 * In a real application, this would make API calls to a backend server.
 * For demo purposes, we're using localStorage and mock data.
 */
class AuthService {
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Login user
   */
  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<{ user: User; token: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, validate credentials against backend
    if (credentials.email !== 'trader@ninjatech.ai' && credentials.email !== 'admin@ninjatech.ai') {
      throw new Error('Invalid email or password');
    }

    // Create mock user based on email
    const user: User = {
      ...MOCK_USER,
      email: credentials.email,
      role: credentials.email === 'admin@ninjatech.ai' ? 'admin' : 'user',
    };

    // Generate mock token
    const token = `mock-jwt-token-${Math.random().toString(36).substring(2)}`;

    // Store in localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, token };
  }

  /**
   * Register new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    preferences?: {
      receiveUpdates: boolean;
    };
  }): Promise<{ success: boolean }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, send registration data to backend
    console.log('Registering user:', userData);

    return { success: true };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear local storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // In a real app, fetch user data from backend using stored token
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (!storedUser) {
      throw new Error('User not found');
    }

    return JSON.parse(storedUser);
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));

    // In a real app, send update to backend
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (!storedUser) {
      throw new Error('User not found');
    }

    const currentUser: User = JSON.parse(storedUser);
    const updatedUser = { ...currentUser, ...userData };

    // Update local storage
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  }

  /**
   * Change password
   */
  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, send password change request to backend
    console.log('Changing password:', passwordData);

    // Validate current password (mock validation)
    if (passwordData.currentPassword !== 'password') {
      throw new Error('Current password is incorrect');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, send password reset request to backend
    console.log('Requesting password reset for:', email);
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: { token: string; newPassword: string }): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, send reset token and new password to backend
    console.log('Resetting password with token:', resetData);
  }
}

export const authService = new AuthService();