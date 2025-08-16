import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';

interface LoadingIndicatorProps {
  fullscreen?: boolean;
  overlay?: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'linear' | 'skeleton';
  progress?: number; // For determinate progress (0-100)
  height?: number | string;
  width?: number | string;
  transparent?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullscreen = false,
  overlay = false,
  message = 'Loading...',
  size = 'medium',
  variant = 'circular',
  progress,
  height,
  width,
  transparent = false
}) => {
  const theme = useTheme();
  
  // Determine spinner size based on the size prop
  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      case 'medium':
      default:
        return 40;
    }
  };
  
  // Determine container styles based on props
  const getContainerStyles = () => {
    if (fullscreen) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: transparent 
          ? alpha(theme.palette.background.paper, 0.7)
          : theme.palette.background.paper
      };
    }
    
    if (overlay) {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: transparent 
          ? alpha(theme.palette.background.paper, 0.7)
          : theme.palette.background.paper
      };
    }
    
    return {
      height: height || '100%',
      width: width || '100%',
      backgroundColor: transparent ? 'transparent' : undefined
    };
  };
  
  // Render the appropriate loading indicator based on variant
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress 
              variant={progress !== undefined ? 'determinate' : 'indeterminate'} 
              value={progress} 
              sx={{ height: size === 'small' ? 4 : size === 'large' ? 8 : 6 }}
            />
            {progress !== undefined && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center" 
                sx={{ mt: 1 }}
              >
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
        );
        
      case 'skeleton':
        // For skeleton loading, we'll use a series of animated boxes
        return (
          <Box sx={{ width: '100%', maxWidth: width || 400 }}>
            {[...Array(5)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  height: index === 0 ? 40 : 20,
                  width: `${100 - (index * 5)}%`,
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                  mb: 1,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': {
                      opacity: 0.6,
                    },
                    '50%': {
                      opacity: 1,
                    },
                    '100%': {
                      opacity: 0.6,
                    },
                  },
                }}
              />
            ))}
          </Box>
        );
        
      case 'circular':
      default:
        return (
          <CircularProgress 
            size={getSpinnerSize()} 
            variant={progress !== undefined ? 'determinate' : 'indeterminate'} 
            value={progress} 
          />
        );
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...getContainerStyles()
      }}
    >
      {!transparent && !overlay && !fullscreen ? (
        <Paper
          elevation={1}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            minWidth: 200,
          }}
        >
          {renderLoadingIndicator()}
          
          {message && (
            <Typography 
              variant={size === 'small' ? 'caption' : 'body2'} 
              color="text.secondary" 
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </Paper>
      ) : (
        <>
          {renderLoadingIndicator()}
          
          {message && (
            <Typography 
              variant={size === 'small' ? 'caption' : 'body1'} 
              color="text.secondary" 
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default LoadingIndicator;