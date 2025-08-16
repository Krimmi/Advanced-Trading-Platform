import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Container,
  Alert,
  AlertTitle,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Widgets as WidgetsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { RootState } from '../../store';
import PersonalizedDashboard from '../../components/dashboard/PersonalizedDashboard';

const DashboardDemo: React.FC = () => {
  const theme = useTheme();
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Personalized Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your trading experience with personalized dashboards and widgets
        </Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <AlertTitle>New Feature</AlertTitle>
        We've added personalized dashboards! Create multiple dashboards, add widgets, and arrange them to suit your trading style.
        <Box sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" startIcon={<WidgetsIcon />} sx={{ mr: 1 }}>
            Explore Widget Marketplace
          </Button>
          <Button size="small" variant="text" startIcon={<SettingsIcon />}>
            Dashboard Settings
          </Button>
        </Box>
      </Alert>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, 
          mb: 4, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 1 }} />
            Your Personalized Dashboard
          </Typography>
        </Box>
        
        <Box sx={{ p: 0 }}>
          <PersonalizedDashboard userId={user?.id || 'user-1'} />
        </Box>
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          About Personalized Dashboards
        </Typography>
        <Typography variant="body1" paragraph>
          Our personalized dashboard system allows you to create multiple dashboards tailored to your specific needs. 
          Whether you're focused on market analysis, portfolio management, or active trading, you can configure your 
          workspace to display exactly the information you need.
        </Typography>
        <Typography variant="body1" paragraph>
          Key features include:
        </Typography>
        <ul>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Multiple Dashboards:</strong> Create separate dashboards for different purposes or trading strategies
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Customizable Layout:</strong> Drag, resize, and arrange widgets to create your ideal layout
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Widget Marketplace:</strong> Choose from a growing library of specialized widgets
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Configurable Settings:</strong> Customize each widget's settings to display the information you need
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Persistent Layouts:</strong> Your dashboard configurations are saved automatically
            </Typography>
          </li>
        </ul>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Widget Marketplace
        </Typography>
        <Typography variant="body1" paragraph>
          The Widget Marketplace offers a growing collection of specialized widgets designed to enhance your trading experience.
          From market data and portfolio analytics to news feeds and trading tools, you'll find widgets for every aspect of your
          trading workflow.
        </Typography>
        <Typography variant="body1" paragraph>
          Popular widget categories include:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              flex: '1 1 200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Market Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay informed with real-time market data, indices, top movers, and sector performance.
            </Typography>
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              flex: '1 1 200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Portfolio Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor your portfolio performance, asset allocation, positions, and risk metrics.
            </Typography>
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              flex: '1 1 200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Trading Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Execute trades, monitor orders, view charts, and track your trading history.
            </Typography>
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              flex: '1 1 200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Analytics Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access advanced analytics, performance metrics, and risk analysis tools.
            </Typography>
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              flex: '1 1 200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              News & Research Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay updated with news feeds, research reports, and market insights.
            </Typography>
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              flex: '1 1 200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              ML & AI Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Leverage machine learning insights, predictions, and anomaly detection.
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" startIcon={<WidgetsIcon />} size="large">
            Explore Widget Marketplace
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardDemo;