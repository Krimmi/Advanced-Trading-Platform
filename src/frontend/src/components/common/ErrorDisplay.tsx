import React from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorDisplayProps {
  message?: string;
  details?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message = 'An error occurred',
  details,
  onRetry,
  fullPage = false,
}) => {
  const theme = useTheme();

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
        width: '100%',
      }}
    >
      <ErrorIcon
        color="error"
        sx={{ fontSize: fullPage ? 64 : 48, mb: 2 }}
      />
      <Typography
        variant={fullPage ? 'h4' : 'h6'}
        component="h2"
        color="error"
        gutterBottom
      >
        {message}
      </Typography>
      
      {details && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 500 }}
        >
          {details}
        </Typography>
      )}
      
      {onRetry && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 600,
            width: '100%',
            py: 6,
            px: 4,
            borderRadius: 2,
          }}
        >
          {content}
        </Paper>
      </Box>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'light'
          ? theme.palette.error.light + '10'  // 10% opacity
          : theme.palette.error.dark + '10',
        border: `1px solid ${theme.palette.error.main + '30'}`,  // 30% opacity
      }}
    >
      {content}
    </Paper>
  );
};

export default ErrorDisplay;