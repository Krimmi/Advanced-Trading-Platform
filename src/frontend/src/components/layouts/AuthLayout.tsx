import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const AuthContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'light' 
    ? theme.palette.grey[100] 
    : theme.palette.background.default,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 450,
  width: '100%',
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
}));

const AuthLayout: React.FC = () => {
  const theme = useTheme();

  return (
    <AuthContainer
      sx={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
      }}
    >
      <Container maxWidth="sm">
        <LogoContainer>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'white',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
            }}
          >
            Ultimate Hedge Fund
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
              mt: 1,
            }}
          >
            Advanced Trading Platform
          </Typography>
        </LogoContainer>
        
        <AuthPaper>
          <Outlet />
        </AuthPaper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="white">
            © {new Date().getFullYear()} Ultimate Hedge Fund App. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </AuthContainer>
  );
};

export default AuthLayout;