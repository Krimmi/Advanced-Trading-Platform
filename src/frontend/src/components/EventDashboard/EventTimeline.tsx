import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, Divider, useTheme } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { FinancialEvent } from '../../services/eventService';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { format } from 'date-fns';

interface EventTimelineProps {
  events: FinancialEvent[];
  onEventSelect: (event: FinancialEvent) => void;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ events, onEventSelect }) => {
  const theme = useTheme();
  const [groupedEvents, setGroupedEvents] = useState<Record<string, FinancialEvent[]>>({});

  useEffect(() => {
    // Group events by month
    const grouped = events.reduce((acc: Record<string, FinancialEvent[]>, event) => {
      const date = new Date(event.date);
      const monthYear = format(date, 'MMMM yyyy');
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      
      acc[monthYear].push(event);
      return acc;
    }, {});
    
    // Sort events within each month by date (newest first)
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    
    // Sort months (newest first)
    const sortedGrouped: Record<string, FinancialEvent[]> = {};
    Object.keys(grouped)
      .sort((a, b) => {
        const dateA = new Date(grouped[a][0].date);
        const dateB = new Date(grouped[b][0].date);
        return dateB.getTime() - dateA.getTime();
      })
      .forEach(month => {
        sortedGrouped[month] = grouped[month];
      });
    
    setGroupedEvents(sortedGrouped);
  }, [events]);

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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Event Timeline
      </Typography>
      
      {Object.keys(groupedEvents).length === 0 ? (
        <Typography variant="body1" align="center" sx={{ py: 3 }}>
          No events found for the selected filters.
        </Typography>
      ) : (
        <Timeline position="right">
          {Object.entries(groupedEvents).map(([month, monthEvents]) => (
            <React.Fragment key={month}>
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="primary" variant="outlined">
                    <EventIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    {month}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {monthEvents.length} events
                  </Typography>
                </TimelineContent>
              </TimelineItem>
              
              {monthEvents.map((event) => (
                <TimelineItem key={event.id}>
                  <TimelineSeparator>
                    <TimelineDot sx={{ bgcolor: getEventColor(event.event_type) }}>
                      {getEventIcon(event.event_type)}
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover
                        },
                        borderLeft: event.impact_score !== null ? 
                          `4px solid ${getImpactColor(event.impact_score)}` : 'none'
                      }}
                      onClick={() => onEventSelect(event)}
                    >
                      <Typography variant="subtitle1" component="div">
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {event.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Chip 
                          label={event.event_type.replace(/_/g, ' ')} 
                          size="small" 
                          sx={{ bgcolor: getEventColor(event.event_type), color: 'white' }}
                        />
                        {event.impact_score !== null && (
                          <Chip 
                            label={`Impact: ${(event.impact_score * 100).toFixed(1)}%`}
                            size="small"
                            sx={{ 
                              bgcolor: getImpactColor(event.impact_score),
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </React.Fragment>
          ))}
        </Timeline>
      )}
    </Box>
  );
};

export default EventTimeline;