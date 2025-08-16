import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoadingIndicatorProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  height?: string | number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 40,
  message = 'Loading...',
  fullScreen = false,
  height = '100%',
}) => {
  const theme = useTheme();

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullScreen ? '100vh' : height,
      }}
    >
      <CircularProgress size={size} thickness={4} />
      {message && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2, fontWeight: 500 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: theme.zIndex.modal + 1,
          backgroundColor: theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingIndicator;