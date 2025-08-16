import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip, Button, Card, CardContent, CardActions, Link } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import alternativeDataService, { NewsItem } from '../../services/alternativeDataService';

interface NewsDataVisualizationProps {
  symbol: string;
}

const NewsDataVisualization: React.FC<NewsDataVisualizationProps> = ({ symbol }) => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('30');
  const [source, setSource] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch news data
        const request: any = {
          symbols: [symbol],
          limit: 50
        };
        
        if (source !== 'all') {
          request.sources = [source];
        }
        
        if (category !== 'all') {
          request.categories = [category];
        }

        const newsResults = await alternativeDataService.getNews(request);
        setNewsData(newsResults);

        // Extract available sources and categories
        const sources = Array.from(new Set(newsResults.map(item => item.source)));
        const categories = Array.from(new Set(newsResults.flatMap(item => item.categories)));
        
        setAvailableSources(sources);
        setAvailableCategories(categories);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching news data:', err);
        setError('Failed to load news data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, source, category]);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handleSourceChange = (event: SelectChangeEvent) => {
    setSource(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  };

  // Process news data for visualization
  
  // Calculate sentiment distribution
  const sentimentDistribution = {
    positive: newsData.filter(item => item.sentiment?.sentiment === 'positive').length,
    neutral: newsData.filter(item => item.sentiment?.sentiment === 'neutral').length,
    negative: newsData.filter(item => item.sentiment?.sentiment === 'negative').length
  };

  const sentimentData = [
    { name: 'Positive', value: sentimentDistribution.positive, color: '#4caf50' },
    { name: 'Neutral', value: sentimentDistribution.neutral, color: '#ff9800' },
    { name: 'Negative', value: sentimentDistribution.negative, color: '#f44336' }
  ];

  // Calculate source distribution
  const sourceDistribution = newsData.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceDistributionData = Object.keys(sourceDistribution).map(key => ({
    name: key,
    value: sourceDistribution[key]
  }));

  // Calculate category distribution
  const categoryDistribution = newsData.reduce((acc, item) => {
    item.categories.forEach(cat => {
      acc[cat] = (acc[cat] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const categoryDistributionData = Object.keys(categoryDistribution).map(key => ({
    name: key,
    value: categoryDistribution[key]
  }));

  // Group news by date
  const newsByDate = newsData.reduce((acc, item) => {
    const date = new Date(item.publishedAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const newsByDateData = Object.keys(newsByDate).map(key => ({
    date: key,
    count: newsByDate[key]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="source-select-label">Source</InputLabel>
              <Select
                labelId="source-select-label"
                id="source-select"
                value={source}
                label="Source"
                onChange={handleSourceChange}
              >
                <MenuItem value="all">All Sources</MenuItem>
                {availableSources.map((src) => (
                  <MenuItem key={src} value={src}>{src}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={category}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* News Volume Over Time */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              News Volume Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={newsByDateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="News Articles" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sentiment Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              News Sentiment Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} articles`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Source Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              News Source Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sourceDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Articles" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              News Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Articles" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent News Articles */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent News Articles
            </Typography>
            <Grid container spacing={2}>
              {newsData.slice(0, 6).map((article, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {article.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        {article.categories.map((cat, i) => (
                          <Chip 
                            key={i} 
                            label={cat} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: article.sentiment?.score > 0.6 ? '#4caf50' : 
                                    article.sentiment?.score < 0.4 ? '#f44336' : '#ff9800',
                            mr: 1
                          }}
                        />
                        <Typography variant="body2">
                          {article.sentiment?.score > 0.6 ? 'Positive' : 
                           article.sentiment?.score < 0.4 ? 'Negative' : 'Neutral'}
                          {' '}({(article.sentiment?.score * 100).toFixed(0)}%)
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {article.summary.length > 150 ? `${article.summary.substring(0, 150)}...` : article.summary}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" component={Link} href={article.url} target="_blank" rel="noopener">
                        Read More
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NewsDataVisualization;