import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Collapse,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      errorInfo
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset the error state if props change and resetOnPropsChange is true
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps !== this.props
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  toggleDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={this.state.showDetails}
          onReset={this.handleReset}
          onToggleDetails={this.toggleDetails}
        />
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

// Separate functional component for the error display
interface ErrorDisplayProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  onReset: () => void;
  onToggleDetails: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorInfo,
  showDetails,
  onReset,
  onToggleDetails
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.error.main}`,
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.error.dark 
          : theme.palette.error.light,
        color: theme.palette.error.contrastText,
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ErrorIcon color="error" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h5" component="h2" color="error">
          Something went wrong
        </Typography>
      </Box>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        {error?.message || 'An unexpected error occurred.'}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={onReset}
        >
          Try Again
        </Button>
        
        <Button
          variant="outlined"
          color="inherit"
          startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={onToggleDetails}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </Box>
      
      <Collapse in={showDetails}>
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Error Details:
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 300,
              borderRadius: 1
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {error?.stack || error?.toString() || 'No error details available'}
            </pre>
          </Paper>
          
          {errorInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Component Stack:
              </Typography>
              
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: 300,
                  borderRadius: 1
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {errorInfo.componentStack}
                </pre>
              </Paper>
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <BugReportIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              If this issue persists, please contact support with the details above.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ErrorBoundary;