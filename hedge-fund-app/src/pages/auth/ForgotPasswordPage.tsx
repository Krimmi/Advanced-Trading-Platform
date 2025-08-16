import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Paper,
  Fade
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as BackIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

const ForgotPasswordPage: React.FC = () => {
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError(null);
    return true;
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(email)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to request a password reset
      // For demo purposes, we'll simulate a successful request after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      {!isSubmitted ? (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h4" component="h1" gutterBottom>
            Reset Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter your email address and we'll send you instructions to reset your password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
            sx={{ mt: 3, mb: 2, py: 1.2 }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/login" variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BackIcon fontSize="small" sx={{ mr: 0.5 }} />
              Back to Sign In
            </Link>
          </Box>
        </Box>
      ) : (
        <Fade in={isSubmitted}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              backgroundColor: 'transparent'
            }}
          >
            <SuccessIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            
            <Typography variant="h5" component="h2" gutterBottom align="center">
              Check Your Email
            </Typography>
            
            <Typography variant="body1" paragraph align="center">
              We've sent password reset instructions to:
            </Typography>
            
            <Typography variant="body1" fontWeight="bold" paragraph align="center">
              {email}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph align="center">
              If you don't receive an email within a few minutes, please check your spam folder or try again.
            </Typography>
            
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setIsSubmitted(false)}
              >
                Try a different email
              </Button>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                fullWidth
              >
                Return to Sign In
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default ForgotPasswordPage;