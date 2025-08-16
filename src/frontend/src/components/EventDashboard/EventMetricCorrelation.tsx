import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';
import correlationAnalysisService from '../../services/correlationAnalysisService';

interface EventMetricCorrelationProps {
  symbol: string;
  eventTypes: string[];
}

interface CorrelationData {
  eventType: string;
  metric: string;
  correlationCoefficient: number;
  pValue: number;
  dataPoints: Array<{
    x: number;
    y: number;
    date: string;
    eventId: string;
  }>;
}

const availableMetrics = [
  { value: 'price_change_1d', label: 'Price Change (1 Day)' },
  { value: 'price_change_5d', label: 'Price Change (5 Days)' },
  { value: 'price_change_30d', label: 'Price Change (30 Days)' },
  { value: 'volume_change_1d', label: 'Volume Change (1 Day)' },
  { value: 'volume_change_5d', label: 'Volume Change (5 Days)' },
  { value: 'volatility_change_30d', label: 'Volatility Change (30 Days)' },
  { value: 'pe_ratio_change', label: 'P/E Ratio Change' },
  { value: 'eps_surprise', label: 'EPS Surprise' },
  { value: 'revenue_surprise', label: 'Revenue Surprise' }
];

const EventMetricCorrelation: React.FC<EventMetricCorrelationProps> = ({ symbol, eventTypes }) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('price_change_5d');
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventTypes.length > 0 && !selectedEventType) {
      setSelectedEventType(eventTypes[0]);
    }
  }, [eventTypes]);

  useEffect(() => {
    if (selectedEventType && selectedMetric) {
      fetchCorrelationData();
    }
  }, [selectedEventType, selectedMetric]);

  const fetchCorrelationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await correlationAnalysisService.getEventMetricCorrelation(
        symbol,
        selectedEventType,
        selectedMetric
      );
      setCorrelationData(data);
    } catch (err) {
      console.error('Error fetching correlation data:', err);
      setError('Failed to fetch correlation data. Please try again later.');
      setCorrelationData(null);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationStrength = (coefficient: number): string => {
    const absCoef = Math.abs(coefficient);
    if (absCoef < 0.3) return 'Weak';
    if (absCoef < 0.7) return 'Moderate';
    return 'Strong';
  };

  const getCorrelationColor = (coefficient: number): string => {
    if (coefficient > 0.7) return '#4caf50'; // Strong positive - green
    if (coefficient > 0.3) return '#8bc34a'; // Moderate positive - light green
    if (coefficient > -0.3) return '#9e9e9e'; // Weak - gray
    if (coefficient > -0.7) return '#ff9800'; // Moderate negative - orange
    return '#f44336'; // Strong negative - red
  };

  const formatPValue = (pValue: number): string => {
    if (pValue < 0.001) return 'p < 0.001 (Highly Significant)';
    if (pValue < 0.01) return `p = ${pValue.toFixed(3)} (Very Significant)`;
    if (pValue < 0.05) return `p = ${pValue.toFixed(3)} (Significant)`;
    if (pValue < 0.1) return `p = ${pValue.toFixed(3)} (Marginally Significant)`;
    return `p = ${pValue.toFixed(3)} (Not Significant)`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2">Date: {data.date}</Typography>
          <Typography variant="body2">
            {availableMetrics.find(m => m.value === selectedMetric)?.label}: {data.y.toFixed(2)}
          </Typography>
          <Typography variant="body2">Event ID: {data.eventId}</Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Correlation Analysis
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="event-type-select-label">Event Type</InputLabel>
              <Select
                labelId="event-type-select-label"
                id="event-type-select"
                value={selectedEventType}
                label="Event Type"
                onChange={(e) => setSelectedEventType(e.target.value)}
              >
                {eventTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="metric-select-label">Metric</InputLabel>
              <Select
                labelId="metric-select-label"
                id="metric-select"
                value={selectedMetric}
                label="Metric"
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                {availableMetrics.map((metric) => (
                  <MenuItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {correlationData && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Correlation Statistics
                </Typography>
                <Typography variant="body2">
                  Correlation Coefficient: {correlationData.correlationCoefficient.toFixed(3)}
                </Typography>
                <Typography variant="body2">
                  Strength: {getCorrelationStrength(correlationData.correlationCoefficient)}
                </Typography>
                <Typography variant="body2">
                  Statistical Significance: {formatPValue(correlationData.pValue)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, height: '600px' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : correlationData && correlationData.dataPoints.length > 0 ? (
              <Box sx={{ height: '100%' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  {selectedEventType.replace(/_/g, ' ')} vs. {availableMetrics.find(m => m.value === selectedMetric)?.label}
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 60, left: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x" 
                      name="Event Occurrence" 
                      type="number"
                      domain={['dataMin - 1', 'dataMax + 1']}
                    >
                      <Label value="Event Occurrence (chronological order)" position="bottom" offset={20} />
                    </XAxis>
                    <YAxis 
                      dataKey="y" 
                      name={availableMetrics.find(m => m.value === selectedMetric)?.label}
                    >
                      <Label 
                        value={availableMetrics.find(m => m.value === selectedMetric)?.label} 
                        position="left" 
                        angle={-90} 
                        offset={-15} 
                      />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Scatter 
                      name={`${selectedEventType.replace(/_/g, ' ')} Events`} 
                      data={correlationData.dataPoints} 
                      fill={getCorrelationColor(correlationData.correlationCoefficient)}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1">
                  No correlation data available for the selected parameters
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventMetricCorrelation;