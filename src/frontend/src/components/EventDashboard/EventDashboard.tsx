import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab, CircularProgress, Button, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { FinancialEvent } from '../../services/eventService';
import eventService from '../../services/eventService';
import EventTimeline from './EventTimeline';
import EventImpactChart from './EventImpactChart';
import EventFilterPanel from './EventFilterPanel';
import EventDetailPanel from './EventDetailPanel';
import EventMetricCorrelation from './EventMetricCorrelation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EventDashboard: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<FinancialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FinancialEvent | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [loadingImpact, setLoadingImpact] = useState<boolean>(false);

  // Fetch events when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchEvents();
    }
  }, [symbol]);

  // Extract unique event types when events change
  useEffect(() => {
    if (events.length > 0) {
      const types = [...new Set(events.map(event => event.event_type))];
      setEventTypes(types);
      setFilteredEvents(events);
    }
  }, [events]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventService.getAllEvents(symbol as string, 365);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEventSelect = (event: FinancialEvent) => {
    setSelectedEvent(event);
    if (tabValue === 0) {
      setTabValue(2); // Switch to event details tab
    }
  };

  const handleFilterChange = (filteredEvents: FinancialEvent[]) => {
    setFilteredEvents(filteredEvents);
  };

  const handleAnalyzeImpact = async (eventType: string) => {
    setLoadingImpact(true);
    try {
      const analysis = await eventService.analyzeEventImpact(symbol as string, eventType);
      setImpactAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing event impact:', error);
    } finally {
      setLoadingImpact(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Event Analysis: {symbol}
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="event dashboard tabs">
          <Tab label="Timeline" />
          <Tab label="Impact Analysis" />
          <Tab label="Event Details" />
          <Tab label="Correlations" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <EventFilterPanel 
                    events={events} 
                    eventTypes={eventTypes} 
                    onFilterChange={handleFilterChange} 
                  />
                </Grid>
                <Grid item xs={12} md={9}>
                  <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
                    <EventTimeline 
                      events={filteredEvents} 
                      onEventSelect={handleEventSelect} 
                    />
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Event Types
                    </Typography>
                    {eventTypes.map((type) => (
                      <Box key={type} sx={{ mb: 1 }}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={() => handleAnalyzeImpact(type)}
                        >
                          {type.replace(/_/g, ' ')}
                        </Button>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Paper sx={{ p: 2, height: '600px' }}>
                    {loadingImpact ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : impactAnalysis ? (
                      <EventImpactChart impactAnalysis={impactAnalysis} />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body1">
                          Select an event type to analyze its impact
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {selectedEvent ? (
                <EventDetailPanel event={selectedEvent} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography variant="body1">
                    Select an event from the timeline to view details
                  </Typography>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <EventMetricCorrelation symbol={symbol as string} eventTypes={eventTypes} />
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default EventDashboard;