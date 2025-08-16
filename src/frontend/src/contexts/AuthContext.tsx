import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Import services
import { authService } from '../services';

// Define user type
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'analyst';
  permissions: string[];
  avatar?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if there's a token in localStorage
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Verify token and get user data
          const userData = await authService.getCurrentUser();
          setUser(userData as User);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Authentication error:', err);
        setUser(null);
        localStorage.removeItem('authToken');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call login API
      const response = await authService.login(email, password);
      
      // Save token to localStorage
      localStorage.setItem('authToken', response.token);
      
      // Get user data
      const userData = await authService.getCurrentUser();
      setUser(userData as User);
      
      // Redirect to dashboard or intended page
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      setUser(null);
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await authService.logout();
      
      // Clear token and user data
      localStorage.removeItem('authToken');
      setUser(null);
      
      // Redirect to login page
      navigate('/login');
      
      setIsLoading(false);
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even if API fails, clear local data
      localStorage.removeItem('authToken');
      setUser(null);
      navigate('/login');
      
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call register API
      await authService.register({
        email,
        password,
        firstName,
        lastName
      });
      
      // Redirect to login page
      navigate('/login', { state: { message: 'Registration successful. Please login.' } });
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call reset password API
      await authService.resetPassword(email);
      
      // Redirect to login page
      navigate('/login', { state: { message: 'Password reset email sent. Please check your inbox.' } });
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call update profile API
      const updatedUser = await authService.updateProfile(userData);
      
      // Update user data
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setIsLoading(false);
    }
  };

  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permission
    return user.permissions.includes(permission);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        register,
        resetPassword,
        updateProfile,
        hasPermission,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect routes
export const withAuth = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        // Redirect to login page with return url
        navigate('/login', { state: { from: location } });
      }
    }, [isAuthenticated, isLoading, navigate, location]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? <Component {...props} /> : null;
  };
};

// HOC to check permissions
export const withPermission = (permission: string) => (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { hasPermission, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !hasPermission(permission)) {
        // Redirect to unauthorized page
        navigate('/unauthorized');
      }
    }, [hasPermission, permission, isLoading, navigate]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return hasPermission(permission) ? <Component {...props} /> : null;
  };
};