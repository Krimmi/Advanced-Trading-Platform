import React, { useState, useEffect } from 'react';
import { newsService } from '../../services/api/news/NewsServiceFactory';
import { SentimentAnalysis, SentimentTrendResponse } from '../../services/api/news/NewsService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  CircularProgress, 
  Box,
  Grid,
  Divider,
  LinearProgress,
  Paper
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface SentimentAnalysisCardProps {
  symbol: string;
  days?: number;
}

const SentimentAnalysisCard: React.FC<SentimentAnalysisCardProps> = ({ symbol, days = 30 }) => {
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [trend, setTrend] = useState<SentimentTrendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch sentiment and trend data in parallel
        const [sentimentData, trendData] = await Promise.all([
          newsService.getSentiment(symbol),
          newsService.getSentimentTrend(symbol, days)
        ]);
        
        setSentiment(sentimentData);
        setTrend(trendData);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setError('Failed to load sentiment data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol, days]);

  // Function to get sentiment color
  const getSentimentColor = (score: number) => {
    if (score > 0.2) return '#4caf50'; // green
    if (score < -0.2) return '#f44336'; // red
    return '#ff9800'; // orange/amber for neutral
  };

  // Function to format sentiment score as percentage
  const formatSentimentScore = (score: number) => {
    // Convert -1 to 1 scale to 0 to 100 scale
    return Math.round(((score + 1) / 2) * 100);
  };

  // Function to get normalized progress value (0-100)
  const getNormalizedProgress = (score: number) => {
    // Convert -1 to 1 scale to 0 to 100 scale
    return ((score + 1) / 2) * 100;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title={`${symbol} Sentiment Analysis`} />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title={`${symbol} Sentiment Analysis`} />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={`${symbol} Sentiment Analysis`} />
      <CardContent>
        {sentiment && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Overall Sentiment</Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      width: 120,
                      height: 120,
                    }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={getNormalizedProgress(sentiment.overallScore)}
                      size={120}
                      thickness={5}
                      sx={{ color: getSentimentColor(sentiment.overallScore) }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h5" component="div" color="text.secondary">
                        {formatSentimentScore(sentiment.overallScore)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography variant="body1" align="center" sx={{ textTransform: 'capitalize', fontWeight: 'bold', color: getSentimentColor(sentiment.overallScore) }}>
                  {sentiment.overallLabel}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Based on {sentiment.newsCount} news articles and {sentiment.socialCount} social posts
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Sentiment Breakdown</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">News Sentiment</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={getNormalizedProgress(sentiment.newsScore)} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getSentimentColor(sentiment.newsScore),
                            }
                          }} 
                        />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">{formatSentimentScore(sentiment.newsScore)}%</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Social Media Sentiment</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={getNormalizedProgress(sentiment.socialScore)} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getSentimentColor(sentiment.socialScore),
                            }
                          }} 
                        />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">{formatSentimentScore(sentiment.socialScore)}%</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(sentiment.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {trend && trend.data.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Sentiment Trend ({days} Days)</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trend.data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis 
                          domain={[-1, 1]} 
                          tickFormatter={(value) => `${value.toFixed(1)}`}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value.toFixed(2)}`, 'Sentiment Score']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          name="Sentiment Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            )}
            
            {trend && trend.data.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Sentiment Volume</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trend.data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [`${value}`, 'Volume']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Bar dataKey="volume" fill="#82ca9d" name="Mention Volume" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysisCard;