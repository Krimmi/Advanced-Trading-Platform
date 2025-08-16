import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import alternativeDataService from '../../services/alternativeDataService';

interface SentimentAnalysisVisualizationProps {
  symbol: string;
}

const SentimentAnalysisVisualization: React.FC<SentimentAnalysisVisualizationProps> = ({ symbol }) => {
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [sentimentTrends, setSentimentTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('30');
  const [source, setSource] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch sentiment analysis data
        const request = {
          symbols: [symbol],
          limit: 100
        };
        
        if (source !== 'all') {
          request['sources'] = [source];
        }

        const sentimentResults = await alternativeDataService.getSentimentAnalysis(request);
        setSentimentData(sentimentResults);

        // Fetch sentiment trends
        const trendResults = await alternativeDataService.getSentimentTrends([symbol], parseInt(timeframe));
        setSentimentTrends(trendResults);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to load sentiment data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, source]);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handleSourceChange = (event: SelectChangeEvent) => {
    setSource(event.target.value);
  };

  // Process sentiment data for visualization
  const processedSentimentData = sentimentData.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleDateString(),
    score: parseFloat((item.score * 100).toFixed(1)),
    magnitude: parseFloat((item.magnitude * 100).toFixed(1)),
    source: item.source
  }));

  // Process sentiment trend data
  const processedTrendData = sentimentTrends.length > 0 && sentimentTrends[0]?.data ? 
    sentimentTrends[0].data.map(item => ({
      date: item.date,
      sentiment: parseFloat((item.sentiment * 100).toFixed(1)),
      volume: item.volume
    })) : [];

  // Calculate sentiment distribution
  const sentimentDistribution = {
    positive: sentimentData.filter(item => item.sentiment === 'positive').length,
    neutral: sentimentData.filter(item => item.sentiment === 'neutral').length,
    negative: sentimentData.filter(item => item.sentiment === 'negative').length
  };

  const distributionData = [
    { name: 'Positive', value: sentimentDistribution.positive },
    { name: 'Neutral', value: sentimentDistribution.neutral },
    { name: 'Negative', value: sentimentDistribution.negative }
  ];

  // Calculate source distribution
  const sourceDistribution = sentimentData.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {});

  const sourceDistributionData = Object.keys(sourceDistribution).map(key => ({
    name: key,
    value: sourceDistribution[key]
  }));

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
        <Grid item xs={12} md={6}>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
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
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="source-select-label">Source</InputLabel>
            <Select
              labelId="source-select-label"
              id="source-select"
              value={source}
              label="Source"
              onChange={handleSourceChange}
            >
              <MenuItem value="all">All Sources</MenuItem>
              <MenuItem value="twitter">Twitter</MenuItem>
              <MenuItem value="reddit">Reddit</MenuItem>
              <MenuItem value="news">News</MenuItem>
              <MenuItem value="stocktwits">StockTwits</MenuItem>
              <MenuItem value="sec_filings">SEC Filings</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sentiment Trend Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Trend Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={processedTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sentiment" stroke="#8884d8" name="Sentiment Score (%)" />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#82ca9d" name="Volume" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sentiment Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={distributionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Source Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Source Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sourceDistributionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Sentiment Data Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Sentiment Data
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Source</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Score</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Magnitude</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {processedSentimentData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.timestamp}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.source}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.score}%</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.magnitude}%</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: item.score > 60 ? 'success.main' : item.score < 40 ? 'error.main' : 'warning.main',
                            mr: 1
                          }}
                        />
                        {item.score > 60 ? 'Positive' : item.score < 40 ? 'Negative' : 'Neutral'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SentimentAnalysisVisualization;