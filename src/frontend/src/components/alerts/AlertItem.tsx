import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Switch,
  Grid,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Timeline,
  ShowChart,
  Notifications,
  NotificationsActive,
  NotificationsOff,
  PriceChange,
  BarChart,
  Equalizer,
  NewReleases,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

// Types
interface Alert {
  id: number;
  name: string;
  description?: string;
  symbol: string;
  alert_type: string;
  condition: string;
  value: number;
  secondary_value?: number;
  is_active: boolean;
  last_triggered?: string;
  trigger_count: number;
  frequency: string;
}

interface AlertItemProps {
  alert: Alert;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onToggle: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onMenuOpen, onToggle }) => {
  // Get alert type icon
  const getAlertTypeIcon = () => {
    switch (alert.alert_type) {
      case 'price':
        return <AttachMoney />;
      case 'price_change_percent':
        return <PriceChange />;
      case 'volume':
        return <BarChart />;
      case 'moving_average_cross':
        return <Timeline />;
      case 'rsi':
        return <ShowChart />;
      case 'macd':
        return <Equalizer />;
      case 'bollinger_band':
        return <ShowChart />;
      case 'earnings':
        return <NewReleases />;
      case 'news':
        return <Notifications />;
      default:
        return <Notifications />;
    }
  };
  
  // Get condition text
  const getConditionText = () => {
    switch (alert.condition) {
      case 'greater_than':
        return `> ${alert.value}`;
      case 'less_than':
        return `< ${alert.value}`;
      case 'equal_to':
        return `= ${alert.value}`;
      case 'crosses_above':
        return `crosses above ${alert.value}`;
      case 'crosses_below':
        return `crosses below ${alert.value}`;
      case 'percent_increase':
        return `increases by ${alert.value}%`;
      case 'percent_decrease':
        return `decreases by ${alert.value}%`;
      case 'between':
        return `between ${alert.value} and ${alert.secondary_value}`;
      case 'outside':
        return `outside ${alert.value} and ${alert.secondary_value}`;
      default:
        return alert.condition;
    }
  };
  
  // Format alert type for display
  const formatAlertType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderLeft: 6, 
        borderColor: alert.is_active ? 'primary.main' : 'grey.400',
        opacity: alert.is_active ? 1 : 0.7,
        transition: 'all 0.3s ease'
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                mr: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                borderRadius: '50%',
                width: 40,
                height: 40
              }}
            >
              {getAlertTypeIcon()}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {alert.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {alert.symbol} • {formatAlertType(alert.alert_type)}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2" color="text.secondary">
            Condition
          </Typography>
          <Typography variant="body1">
            {getConditionText()}
          </Typography>
        </Grid>
        
        <Grid item xs={6} sm={3} md={2}>
          <Typography variant="body2" color="text.secondary">
            Frequency
          </Typography>
          <Chip 
            label={alert.frequency.charAt(0).toUpperCase() + alert.frequency.slice(1)} 
            size="small" 
            color={alert.frequency === 'once' ? 'default' : 'primary'}
          />
        </Grid>
        
        <Grid item xs={6} sm={3} md={1}>
          <Typography variant="body2" color="text.secondary" align="center">
            Triggers
          </Typography>
          <Typography variant="body1" align="center">
            {alert.trigger_count}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Tooltip title={alert.is_active ? "Disable Alert" : "Enable Alert"}>
              <Switch
                checked={alert.is_active}
                onChange={onToggle}
                color="primary"
              />
            </Tooltip>
            <IconButton onClick={onMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      
      {alert.last_triggered && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <NotificationsActive fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Last triggered: {new Date(alert.last_triggered).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AlertItem;