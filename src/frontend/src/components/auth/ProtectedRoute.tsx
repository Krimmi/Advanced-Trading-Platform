import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchCurrentUser } from '../../store/slices/authSlice';
import LoadingIndicator from '../common/LoadingIndicator';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * A wrapper component that protects routes requiring authentication.
 * If the user is not authenticated, they will be redirected to the login page.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectPath = '/login' 
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    // If authenticated but no user data, fetch the user profile
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser() as any);
    }
  }, [dispatch, isAuthenticated, user]);
  
  // Show loading indicator while checking authentication or fetching user data
  if (loading) {
    return <LoadingIndicator />;
  }
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  // If authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;