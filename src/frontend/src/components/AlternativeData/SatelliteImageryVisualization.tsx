import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Card, CardContent, CardMedia } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import alternativeDataService from '../../services/alternativeDataService';

interface SatelliteImageryVisualizationProps {
  symbol: string;
}

const SatelliteImageryVisualization: React.FC<SatelliteImageryVisualizationProps> = ({ symbol }) => {
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('retail_locations');
  const [timeframe, setTimeframe] = useState<string>('30');

  // Define location options based on the symbol
  const locationOptions = {
    'AAPL': ['retail_stores_us', 'retail_stores_china', 'manufacturing_facilities'],
    'AMZN': ['fulfillment_centers', 'distribution_centers', 'whole_foods_stores'],
    'WMT': ['retail_stores_us', 'distribution_centers', 'parking_lots'],
    'XOM': ['refineries', 'oil_storage', 'gas_stations'],
    'CVX': ['refineries', 'oil_fields', 'terminals'],
    'default': ['retail_locations', 'industrial_facilities', 'shipping_ports', 'energy_facilities']
  };

  // Get appropriate locations for the symbol
  const getLocationsForSymbol = () => {
    if (symbol in locationOptions) {
      return locationOptions[symbol as keyof typeof locationOptions];
    }
    return locationOptions.default;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeframe));

        // Format dates as YYYY-MM-DD
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch satellite imagery data
        const satelliteResults = await alternativeDataService.getSatelliteData(
          location, 
          startDateStr, 
          endDateStr
        );
        
        setSatelliteData(satelliteResults);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching satellite data:', err);
        setError('Failed to load satellite imagery data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, location, timeframe]);

  const handleLocationChange = (event: SelectChangeEvent) => {
    setLocation(event.target.value);
  };

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  // Process satellite data for visualization
  const processChartData = () => {
    if (!satelliteData || !satelliteData.data) return [];
    
    return satelliteData.data.map((item: any) => {
      // Create a data object based on the type of satellite data
      const dataPoint: any = {
        date: item.date,
      };
      
      // Add metrics based on the type of data
      if (satelliteData.type === 'retail') {
        dataPoint.occupancy = parseFloat((item.occupancy_rate * 100).toFixed(1));
        dataPoint.vehicles = item.vehicle_count;
      } else if (satelliteData.type === 'shipping') {
        dataPoint.containers = item.container_count;
        dataPoint.ships = item.ship_count;
        dataPoint.utilization = parseFloat((item.dock_utilization * 100).toFixed(1));
      } else if (satelliteData.type === 'energy') {
        dataPoint.storage = parseFloat((item.storage_level * 100).toFixed(1));
        dataPoint.volume = item.estimated_volume;
      } else {
        dataPoint.activity = parseFloat((item.activity_index * 100).toFixed(1));
        if (item.change_from_previous) {
          dataPoint.change = parseFloat((item.change_from_previous * 100).toFixed(1));
        }
      }
      
      return dataPoint;
    });
  };

  const chartData = processChartData();

  // Get chart configuration based on data type
  const getChartConfig = () => {
    if (!satelliteData) return null;
    
    switch (satelliteData.type) {
      case 'retail':
        return {
          title: 'Retail Location Activity',
          lines: [
            { dataKey: 'occupancy', name: 'Parking Occupancy (%)', stroke: '#8884d8' },
            { dataKey: 'vehicles', name: 'Vehicle Count', stroke: '#82ca9d', yAxisId: 'right' }
          ]
        };
      case 'shipping':
        return {
          title: 'Shipping Port Activity',
          lines: [
            { dataKey: 'containers', name: 'Container Count', stroke: '#8884d8', yAxisId: 'right' },
            { dataKey: 'ships', name: 'Ship Count', stroke: '#82ca9d', yAxisId: 'right' },
            { dataKey: 'utilization', name: 'Dock Utilization (%)', stroke: '#ffc658' }
          ]
        };
      case 'energy':
        return {
          title: 'Energy Storage Levels',
          lines: [
            { dataKey: 'storage', name: 'Storage Level (%)', stroke: '#8884d8' },
            { dataKey: 'volume', name: 'Estimated Volume', stroke: '#82ca9d', yAxisId: 'right' }
          ]
        };
      default:
        return {
          title: 'Activity Index',
          lines: [
            { dataKey: 'activity', name: 'Activity Index (%)', stroke: '#8884d8' },
            { dataKey: 'change', name: 'Change (%)', stroke: '#82ca9d' }
          ]
        };
    }
  };

  const chartConfig = getChartConfig();

  // Generate mock image URLs for demonstration
  const generateMockImageUrl = (date: string, index: number) => {
    // In a real implementation, these would be actual satellite image URLs
    const imageTypes = [
      'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1610374792793-f016b77ca51a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1564038057903-1d48b852b412?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1580974928064-f0aeef70895a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
    ];
    
    return imageTypes[index % imageTypes.length];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="location-select-label">Location</InputLabel>
              <Select
                labelId="location-select-label"
                id="location-select"
                value={location}
                label="Location"
                onChange={handleLocationChange}
              >
                {getLocationsForSymbol().map((loc) => (
                  <MenuItem key={loc} value={loc}>{loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-select-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="14">Last 14 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="60">Last 60 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>

      {satelliteData && (
        <Grid container spacing={3}>
          {/* Location Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {satelliteData.location_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Type: {satelliteData.type.charAt(0).toUpperCase() + satelliteData.type.slice(1)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Metrics: {satelliteData.metrics.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
            </Paper>
          </Grid>

          {/* Time Series Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {chartConfig?.title}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  {chartConfig?.lines.map((line, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={line.dataKey}
                      name={line.name}
                      stroke={line.stroke}
                      yAxisId={line.yAxisId || "left"}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Satellite Images */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Satellite Imagery
              </Typography>
              <Grid container spacing={2}>
                {satelliteData.data.slice(0, 6).map((item: any, index: number) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={item.image_url || generateMockImageUrl(item.date, index)}
                        alt={`Satellite image from ${item.date}`}
                      />
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {item.date}
                        </Typography>
                        {satelliteData.type === 'retail' && (
                          <>
                            <Typography variant="body2">
                              Occupancy Rate: {(item.occupancy_rate * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2">
                              Vehicle Count: {item.vehicle_count}
                            </Typography>
                          </>
                        )}
                        {satelliteData.type === 'shipping' && (
                          <>
                            <Typography variant="body2">
                              Container Count: {item.container_count}
                            </Typography>
                            <Typography variant="body2">
                              Ship Count: {item.ship_count}
                            </Typography>
                            <Typography variant="body2">
                              Dock Utilization: {(item.dock_utilization * 100).toFixed(1)}%
                            </Typography>
                          </>
                        )}
                        {satelliteData.type === 'energy' && (
                          <>
                            <Typography variant="body2">
                              Storage Level: {(item.storage_level * 100).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2">
                              Estimated Volume: {item.estimated_volume.toLocaleString()} units
                            </Typography>
                          </>
                        )}
                        {satelliteData.type === 'general' && (
                          <>
                            <Typography variant="body2">
                              Activity Index: {(item.activity_index * 100).toFixed(1)}%
                            </Typography>
                            {item.change_from_previous !== undefined && (
                              <Typography variant="body2">
                                Change: {(item.change_from_previous * 100).toFixed(1)}%
                              </Typography>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SatelliteImageryVisualization;