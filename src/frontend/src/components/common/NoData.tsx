import React from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import { SentimentDissatisfied as NoDataIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface NoDataProps {
  message?: string;
  subMessage?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
}

const NoData: React.FC<NoDataProps> = ({
  message = 'No data available',
  subMessage,
  actionText,
  onAction,
  icon,
  compact = false,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: theme.palette.mode === 'light'
          ? theme.palette.grey[50]
          : theme.palette.grey[900],
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        minHeight: compact ? 100 : 200,
      }}
    >
      {icon || (
        <NoDataIcon
          sx={{
            fontSize: compact ? 40 : 64,
            color: theme.palette.text.secondary,
            opacity: 0.5,
            mb: 2,
          }}
        />
      )}
      
      <Typography
        variant={compact ? 'body1' : 'h6'}
        component="h3"
        color="text.primary"
        gutterBottom
      >
        {message}
      </Typography>
      
      {subMessage && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: actionText ? 2 : 0, maxWidth: 400 }}
        >
          {subMessage}
        </Typography>
      )}
      
      {actionText && onAction && (
        <Button
          variant="outlined"
          color="primary"
          size={compact ? 'small' : 'medium'}
          startIcon={<RefreshIcon />}
          onClick={onAction}
          sx={{ mt: compact ? 1 : 2 }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export default NoData;