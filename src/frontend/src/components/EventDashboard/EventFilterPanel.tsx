import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Slider, 
  TextField,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FinancialEvent } from '../../services/eventService';

interface EventFilterPanelProps {
  events: FinancialEvent[];
  eventTypes: string[];
  onFilterChange: (filteredEvents: FinancialEvent[]) => void;
}

const EventFilterPanel: React.FC<EventFilterPanelProps> = ({ events, eventTypes, onFilterChange }) => {
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [impactRange, setImpactRange] = useState<number[]>([-1, 1]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState<string | false>('panel1');

  // Initialize selected event types with all event types
  useEffect(() => {
    if (eventTypes.length > 0 && selectedEventTypes.length === 0) {
      setSelectedEventTypes([...eventTypes]);
    }
  }, [eventTypes]);

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedEventTypes, impactRange, startDate, endDate]);

  const handleEventTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const eventType = event.target.name;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      setSelectedEventTypes([...selectedEventTypes, eventType]);
    } else {
      setSelectedEventTypes(selectedEventTypes.filter(type => type !== eventType));
    }
  };

  const handleImpactRangeChange = (event: Event, newValue: number | number[]) => {
    setImpactRange(newValue as number[]);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const applyFilters = () => {
    let filteredEvents = [...events];
    
    // Filter by event type
    if (selectedEventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        selectedEventTypes.includes(event.event_type)
      );
    }
    
    // Filter by impact score
    filteredEvents = filteredEvents.filter(event => 
      event.impact_score === null || 
      (event.impact_score >= impactRange[0] && event.impact_score <= impactRange[1])
    );
    
    // Filter by date range
    if (startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) >= startDate
      );
    }
    
    if (endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) <= endDate
      );
    }
    
    onFilterChange(filteredEvents);
  };

  const resetFilters = () => {
    setSelectedEventTypes([...eventTypes]);
    setImpactRange([-1, 1]);
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" size="small" onClick={resetFilters} fullWidth>
          Reset Filters
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Accordion 
        expanded={expanded === 'panel1'} 
        onChange={handleAccordionChange('panel1')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Event Types</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {eventTypes.map((eventType) => (
              <FormControlLabel
                key={eventType}
                control={
                  <Checkbox
                    checked={selectedEventTypes.includes(eventType)}
                    onChange={handleEventTypeChange}
                    name={eventType}
                  />
                }
                label={eventType.replace(/_/g, ' ')}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expanded === 'panel2'} 
        onChange={handleAccordionChange('panel2')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Impact Score</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Slider
              value={impactRange}
              onChange={handleImpactRangeChange}
              valueLabelDisplay="auto"
              min={-1}
              max={1}
              step={0.1}
              marks={[
                { value: -1, label: '-1' },
                { value: 0, label: '0' },
                { value: 1, label: '1' }
              ]}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Negative Impact
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Positive Impact
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expanded === 'panel3'} 
        onChange={handleAccordionChange('panel3')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Date Range</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mb: 2 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
            <Box>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
        </AccordionDetails>
      </Accordion>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {events.length} total events, {events.filter(event => selectedEventTypes.includes(event.event_type)).length} selected
        </Typography>
      </Box>
    </Paper>
  );
};

export default EventFilterPanel;