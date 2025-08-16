import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Divider, 
  Card, 
  CardContent,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Button
} from '@mui/material';
import { FinancialEvent } from '../../services/eventService';
import { format } from 'date-fns';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import SourceIcon from '@mui/icons-material/Source';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface EventDetailPanelProps {
  event: FinancialEvent;
}

const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ event }) => {
  const theme = useTheme();
  const [relatedEvents, setRelatedEvents] = useState<FinancialEvent[]>([]);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('earnings')) {
      return <AttachMoneyIcon />;
    } else if (eventType.includes('dividend')) {
      return <AttachMoneyIcon />;
    } else if (eventType.includes('news')) {
      return <NewspaperIcon />;
    } else if (eventType.includes('technical')) {
      return <ShowChartIcon />;
    } else {
      return <NotificationsIcon />;
    }
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('earnings')) {
      return theme.palette.primary.main;
    } else if (eventType.includes('dividend')) {
      return theme.palette.success.main;
    } else if (eventType.includes('news')) {
      return theme.palette.info.main;
    } else if (eventType.includes('technical')) {
      return theme.palette.warning.main;
    } else {
      return theme.palette.secondary.main;
    }
  };

  const getImpactColor = (impactScore: number | null) => {
    if (impactScore === null) return theme.palette.grey[500];
    if (impactScore > 0.5) return theme.palette.success.main;
    if (impactScore > 0) return theme.palette.success.light;
    if (impactScore > -0.5) return theme.palette.error.light;
    return theme.palette.error.main;
  };

  const renderMetadataContent = () => {
    if (!event.metadata) return null;

    switch (event.event_type) {
      case 'earnings_announcement':
      case 'earnings_beat':
      case 'earnings_miss':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>EPS</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Actual</Typography>
                      <Typography variant="body1">${event.metadata.eps_actual?.toFixed(2) || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Estimate</Typography>
                      <Typography variant="body1">${event.metadata.eps_estimate?.toFixed(2) || 'N/A'}</Typography>
                    </Grid>
                    {event.metadata.eps_surprise_pct !== undefined && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Surprise</Typography>
                        <Typography 
                          variant="body1" 
                          color={event.metadata.eps_surprise_pct > 0 ? 'success.main' : 'error.main'}
                        >
                          {(event.metadata.eps_surprise_pct * 100).toFixed(2)}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Revenue</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Actual</Typography>
                      <Typography variant="body1">
                        ${(event.metadata.revenue_actual / 1e6).toFixed(2)}M
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Estimate</Typography>
                      <Typography variant="body1">
                        ${(event.metadata.revenue_estimate / 1e6).toFixed(2)}M
                      </Typography>
                    </Grid>
                    {event.metadata.revenue_surprise_pct !== undefined && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Surprise</Typography>
                        <Typography 
                          variant="body1" 
                          color={event.metadata.revenue_surprise_pct > 0 ? 'success.main' : 'error.main'}
                        >
                          {(event.metadata.revenue_surprise_pct * 100).toFixed(2)}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'dividend_declaration':
      case 'ex_dividend':
      case 'dividend_payment':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Dividend Details</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Amount" 
                        secondary={`$${event.metadata.amount?.toFixed(2) || 'N/A'} per share`} 
                      />
                    </ListItem>
                    {event.metadata.declaration_date && (
                      <ListItem>
                        <ListItemText 
                          primary="Declaration Date" 
                          secondary={format(new Date(event.metadata.declaration_date), 'MMM dd, yyyy')} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.ex_date && (
                      <ListItem>
                        <ListItemText 
                          primary="Ex-Dividend Date" 
                          secondary={format(new Date(event.metadata.ex_date), 'MMM dd, yyyy')} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.record_date && (
                      <ListItem>
                        <ListItemText 
                          primary="Record Date" 
                          secondary={format(new Date(event.metadata.record_date), 'MMM dd, yyyy')} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.payment_date && (
                      <ListItem>
                        <ListItemText 
                          primary="Payment Date" 
                          secondary={format(new Date(event.metadata.payment_date), 'MMM dd, yyyy')} 
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'merger_acquisition':
      case 'product_launch':
      case 'management_change':
      case 'legal_regulatory':
      case 'financial_results':
      case 'stock_split':
      case 'share_repurchase':
      case 'general_news':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>News Details</Typography>
                  {event.metadata.headline && (
                    <Typography variant="subtitle1" gutterBottom>
                      {event.metadata.headline}
                    </Typography>
                  )}
                  {event.metadata.content && (
                    <Typography variant="body2" paragraph>
                      {event.metadata.content}
                    </Typography>
                  )}
                  {event.metadata.url && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      href={event.metadata.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Read Full Article
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'golden_cross':
      case 'death_cross':
      case 'price_above_ma200':
      case 'price_below_ma200':
      case 'bullish_volume_spike':
      case 'bearish_volume_spike':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Technical Details</Typography>
                  <List dense>
                    {event.metadata.close_price && (
                      <ListItem>
                        <ListItemText 
                          primary="Close Price" 
                          secondary={`$${event.metadata.close_price.toFixed(2)}`} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.ma_50 && (
                      <ListItem>
                        <ListItemText 
                          primary="50-day MA" 
                          secondary={`$${event.metadata.ma_50.toFixed(2)}`} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.ma_200 && (
                      <ListItem>
                        <ListItemText 
                          primary="200-day MA" 
                          secondary={`$${event.metadata.ma_200.toFixed(2)}`} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.volume && (
                      <ListItem>
                        <ListItemText 
                          primary="Volume" 
                          secondary={`${(event.metadata.volume / 1e6).toFixed(2)}M shares`} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.avg_volume && (
                      <ListItem>
                        <ListItemText 
                          primary="Avg Volume (20-day)" 
                          secondary={`${(event.metadata.avg_volume / 1e6).toFixed(2)}M shares`} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.volume_ratio && (
                      <ListItem>
                        <ListItemText 
                          primary="Volume Ratio" 
                          secondary={`${event.metadata.volume_ratio.toFixed(2)}x average`} 
                        />
                      </ListItem>
                    )}
                    {event.metadata.price_change && (
                      <ListItem>
                        <ListItemText 
                          primary="Price Change" 
                          secondary={`${(event.metadata.price_change * 100).toFixed(2)}%`}
                          secondaryTypographyProps={{
                            color: event.metadata.price_change > 0 ? 'success.main' : 'error.main'
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            No additional details available for this event type.
          </Typography>
        );
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  bgcolor: getEventColor(event.event_type),
                  color: 'white',
                  p: 1,
                  borderRadius: '50%',
                  mr: 2
                }}
              >
                {getEventIcon(event.event_type)}
              </Box>
              <Typography variant="h5">
                {event.event_type.replace(/_/g, ' ')}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                {format(new Date(event.date), 'MMMM dd, yyyy')}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SourceIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                Source: {event.source}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <InfoIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
              <Typography variant="body1">
                {event.description}
              </Typography>
            </Box>
          </Grid>
          
          {event.impact_score !== null && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Impact Score: 
                </Typography>
                <Chip 
                  label={`${(event.impact_score * 100).toFixed(1)}%`}
                  size="small"
                  sx={{ 
                    ml: 1,
                    bgcolor: getImpactColor(event.impact_score),
                    color: 'white'
                  }}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Event Details
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        {renderMetadataContent()}
      </Paper>
    </Box>
  );
};

export default EventDetailPanel;