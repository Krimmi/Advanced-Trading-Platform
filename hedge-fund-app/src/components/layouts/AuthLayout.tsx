import React from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';

const AuthLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
        backgroundImage: 'linear-gradient(to bottom right, rgba(0,0,0,0.05), rgba(0,0,0,0.15))',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}
        >
          NinjaTech Trading
        </Typography>
      </Box>

      {/* Main Content */}
      <Container 
        maxWidth="md" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={isMobile ? 0 : 6}
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%',
            overflow: 'hidden',
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Left Side - Image/Branding */}
          {!isMobile && (
            <Box
              sx={{
                width: '40%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to NinjaTech
              </Typography>
              <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                Advanced hedge fund trading platform with AI-powered analytics and portfolio optimization
              </Typography>
              <Box
                component="img"
                src="/logo.png"
                alt="NinjaTech Trading"
                sx={{
                  width: '60%',
                  maxWidth: 200,
                  opacity: 0.9,
                  display: 'none', // Hide until you have a logo
                }}
              />
            </Box>
          )}

          {/* Right Side - Auth Form */}
          <Box
            sx={{
              width: isMobile ? '100%' : '60%',
              p: 4,
            }}
          >
            <Outlet />
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          mt: 'auto',
          textAlign: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} NinjaTech Trading. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;