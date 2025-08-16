import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip, Card, CardContent, Avatar, IconButton } from '@mui/material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import ChatIcon from '@mui/icons-material/Chat';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ShareIcon from '@mui/icons-material/Share';
import alternativeDataService, { SocialMediaMention } from '../../services/alternativeDataService';

interface SocialMediaDataVisualizationProps {
  symbol: string;
}

const SocialMediaDataVisualization: React.FC<SocialMediaDataVisualizationProps> = ({ symbol }) => {
  const [socialData, setSocialData] = useState<SocialMediaMention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('30');
  const [platform, setPlatform] = useState<string>('all');
  const [minEngagement, setMinEngagement] = useState<string>('0');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch social media data
        const request: any = {
          symbols: [symbol],
          limit: 100
        };
        
        if (platform !== 'all') {
          request.platforms = [platform];
        }
        
        if (parseInt(minEngagement) > 0) {
          request.minEngagement = parseInt(minEngagement);
        }

        const socialResults = await alternativeDataService.getSocialMediaMentions(request);
        setSocialData(socialResults);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching social media data:', err);
        setError('Failed to load social media data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, platform, minEngagement]);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handlePlatformChange = (event: SelectChangeEvent) => {
    setPlatform(event.target.value);
  };

  const handleEngagementChange = (event: SelectChangeEvent) => {
    setMinEngagement(event.target.value);
  };

  // Process social media data for visualization
  
  // Calculate sentiment distribution
  const sentimentDistribution = {
    positive: socialData.filter(item => item.sentiment?.sentiment === 'positive').length,
    neutral: socialData.filter(item => item.sentiment?.sentiment === 'neutral').length,
    negative: socialData.filter(item => item.sentiment?.sentiment === 'negative').length
  };

  const sentimentData = [
    { name: 'Positive', value: sentimentDistribution.positive, color: '#4caf50' },
    { name: 'Neutral', value: sentimentDistribution.neutral, color: '#ff9800' },
    { name: 'Negative', value: sentimentDistribution.negative, color: '#f44336' }
  ];

  // Calculate platform distribution
  const platformDistribution = socialData.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformDistributionData = Object.keys(platformDistribution).map(key => ({
    name: key,
    value: platformDistribution[key]
  }));

  // Group posts by date
  const postsByDate = socialData.reduce((acc, item) => {
    const date = new Date(item.publishedAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const postsByDateData = Object.keys(postsByDate).map(key => ({
    date: key,
    count: postsByDate[key]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate engagement metrics
  const engagementByPlatform = socialData.reduce((acc, item) => {
    if (!acc[item.platform]) {
      acc[item.platform] = {
        likes: 0,
        comments: 0,
        shares: 0,
        total: 0
      };
    }
    acc[item.platform].likes += item.likes;
    acc[item.platform].comments += item.comments;
    acc[item.platform].shares += item.shares;
    acc[item.platform].total += item.engagement;
    return acc;
  }, {} as Record<string, { likes: number, comments: number, shares: number, total: number }>);

  const engagementData = Object.keys(engagementByPlatform).map(key => ({
    name: key,
    likes: engagementByPlatform[key].likes,
    comments: engagementByPlatform[key].comments,
    shares: engagementByPlatform[key].shares,
    total: engagementByPlatform[key].total
  }));

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <TwitterIcon />;
      case 'reddit':
        return <RedditIcon />;
      case 'stocktwits':
        return <ChatIcon />;
      default:
        return <ChatIcon />;
    }
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
              <InputLabel id="platform-select-label">Platform</InputLabel>
              <Select
                labelId="platform-select-label"
                id="platform-select"
                value={platform}
                label="Platform"
                onChange={handlePlatformChange}
              >
                <MenuItem value="all">All Platforms</MenuItem>
                <MenuItem value="twitter">Twitter</MenuItem>
                <MenuItem value="reddit">Reddit</MenuItem>
                <MenuItem value="stocktwits">StockTwits</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="engagement-select-label">Min Engagement</InputLabel>
              <Select
                labelId="engagement-select-label"
                id="engagement-select"
                value={minEngagement}
                label="Min Engagement"
                onChange={handleEngagementChange}
              >
                <MenuItem value="0">All Posts</MenuItem>
                <MenuItem value="10">10+</MenuItem>
                <MenuItem value="50">50+</MenuItem>
                <MenuItem value="100">100+</MenuItem>
                <MenuItem value="500">500+</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Social Media Volume Over Time */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Social Media Mentions Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={postsByDateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Mentions" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sentiment Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Distribution
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
                <Tooltip formatter={(value) => [`${value} posts`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Platform Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Platform Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={platformDistributionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Posts" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Engagement Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Engagement Metrics by Platform
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={engagementData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="likes" name="Likes" stackId="a" fill="#8884d8" />
                <Bar dataKey="comments" name="Comments" stackId="a" fill="#82ca9d" />
                <Bar dataKey="shares" name="Shares" stackId="a" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Social Media Posts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Social Media Posts
            </Typography>
            <Grid container spacing={2}>
              {socialData.slice(0, 6).map((post, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: post.platform === 'twitter' ? '#1DA1F2' : post.platform === 'reddit' ? '#FF4500' : '#1E88E5' }}>
                          {getPlatformIcon(post.platform)}
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1">
                            {post.author}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {post.platform} • {new Date(post.publishedAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: post.sentiment?.score > 0.6 ? '#4caf50' : 
                                      post.sentiment?.score < 0.4 ? '#f44336' : '#ff9800',
                              mr: 1
                            }}
                          />
                          <Typography variant="body2">
                            {post.sentiment?.score > 0.6 ? 'Positive' : 
                             post.sentiment?.score < 0.4 ? 'Negative' : 'Neutral'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {post.content}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        {post.symbols.map((sym, i) => (
                          <Chip 
                            key={i} 
                            label={sym} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton size="small" color="default">
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2">{post.likes}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton size="small" color="default">
                            <ChatIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2">{post.comments}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton size="small" color="default">
                            <ShareIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2">{post.shares}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
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

export default SocialMediaDataVisualization;