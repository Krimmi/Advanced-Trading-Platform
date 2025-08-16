import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  IconButton,
  Typography,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  autoHideDuration?: number;
  showProgress?: boolean;
  action?: React.ReactNode;
  data?: any;
}

// Transition component for notifications
function SlideTransition(props: TransitionProps) {
  return <Slide {...props} direction="left" />;
}

const NotificationSystem: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  
  // State for tracking progress of auto-hiding notifications
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  // Handle notification close
  const handleClose = (id: string) => {
    dispatch(removeNotification(id));
  };
  
  // Update progress for auto-hiding notifications
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};
    const intervals: Record<string, NodeJS.Timeout> = {};
    
    notifications.forEach(notification => {
      if (notification.autoHideDuration && notification.showProgress) {
        // Initialize progress for this notification
        setProgress(prev => ({
          ...prev,
          [notification.id]: 0
        }));
        
        // Set up interval to update progress
        const intervalDuration = 100; // Update every 100ms
        const steps = notification.autoHideDuration / intervalDuration;
        let currentStep = 0;
        
        intervals[notification.id] = setInterval(() => {
          currentStep++;
          const newProgress = (currentStep / steps) * 100;
          
          setProgress(prev => ({
            ...prev,
            [notification.id]: newProgress
          }));
          
          if (currentStep >= steps) {
            clearInterval(intervals[notification.id]);
          }
        }, intervalDuration);
        
        // Set up timer to close notification
        timers[notification.id] = setTimeout(() => {
          handleClose(notification.id);
        }, notification.autoHideDuration);
      }
    });
    
    // Cleanup timers and intervals on unmount or when notifications change
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [notifications, dispatch]);
  
  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };
  
  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{
            mb: `${index * 8}px`, // Stack notifications with spacing
          }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            icon={getNotificationIcon(notification.type)}
            sx={{
              width: '100%',
              minWidth: 300,
              maxWidth: 400,
              boxShadow: theme.shadows[6],
              position: 'relative',
              overflow: 'hidden',
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {notification.action}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => handleClose(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            {notification.title && (
              <AlertTitle sx={{ fontWeight: 'bold' }}>
                {notification.title}
              </AlertTitle>
            )}
            
            <Typography variant="body2">
              {notification.message}
            </Typography>
            
            {/* Progress bar for auto-hiding notifications */}
            {notification.showProgress && notification.autoHideDuration && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 4,
                  backgroundColor: alpha('#fff', 0.3),
                  width: `${progress[notification.id] || 0}%`,
                  transition: 'width 0.1s linear',
                }}
              />
            )}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationSystem;