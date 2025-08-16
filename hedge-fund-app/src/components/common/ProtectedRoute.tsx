import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If admin access is required, check if user is an admin
  if (requireAdmin && user?.role !== 'admin') {
    // Redirect to dashboard if they don't have admin privileges
    return <Navigate to="/dashboard" replace />;
  }
  
  // If authenticated and has required permissions, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;