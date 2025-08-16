import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  CircularProgress,
  Grid,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { register } from '../../store/slices/authSlice';

// Step labels for the registration process
const steps = ['Account Details', 'Personal Information', 'Preferences'];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Multi-step form state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Account Details
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Information
    firstName: '',
    lastName: '',
    phone: '',
    
    // Step 3: Preferences
    receiveUpdates: true,
    agreeToTerms: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    switch (activeStep) {
      case 0: // Account Details
        if (!formData.email) {
          newErrors.email = 'Email is required';
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
          isValid = false;
        }
        
        if (!formData.password) {
          newErrors.password = 'Password is required';
          isValid = false;
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
          isValid = false;
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
          isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
          isValid = false;
        }
        break;
        
      case 1: // Personal Information
        if (!formData.firstName) {
          newErrors.firstName = 'First name is required';
          isValid = false;
        }
        
        if (!formData.lastName) {
          newErrors.lastName = 'Last name is required';
          isValid = false;
        }
        
        if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
          isValid = false;
        }
        break;
        
      case 2: // Preferences
        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = 'You must agree to the terms and conditions';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate a successful registration after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dispatch register action
      await dispatch(register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        preferences: {
          receiveUpdates: formData.receiveUpdates
        }
      }) as any);
      
      // Redirect to login page
      navigate('/login', { 
        state: { 
          registrationSuccess: true,
          email: formData.email
        } 
      });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
        
      case 1:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  disabled={loading}
                />
              </Grid>
            </Grid>
            
            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone || 'Optional'}
              disabled={loading}
            />
          </>
        );
        
      case 2:
        return (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  name="receiveUpdates"
                  color="primary"
                  checked={formData.receiveUpdates}
                  onChange={handleChange}
                  disabled={loading}
                />
              }
              label="I want to receive updates about products, services and trading insights"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  color="primary"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link component={RouterLink} to="/terms">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link component={RouterLink} to="/privacy">
                    Privacy Policy
                  </Link>
                </Typography>
              }
            />
            {errors.agreeToTerms && (
              <Typography variant="caption" color="error">
                {errors.agreeToTerms}
              </Typography>
            )}
          </>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Account
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Join NinjaTech Trading to access advanced trading tools and analytics
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {getStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<BackIcon />}
          disabled={activeStep === 0 || loading}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RegisterIcon />}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NextIcon />}
            disabled={loading}
          >
            Next
          </Button>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" variant="body2">
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;