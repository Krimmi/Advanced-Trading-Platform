import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  ButtonGroup,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import ForumIcon from '@mui/icons-material/Forum';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import VerifiedIcon from '@mui/icons-material/Verified';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SocialMediaSentimentPanelProps {
  data: {
    sentimentDistribution: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
    };
    platformDistribution: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
    };
    postFrequency: {
      hourly: {
        labels: string[];
        data: number[];
      };
      daily: {
        labels: string[];
        data: number[];
      };
    };
    topInfluencers: {
      author: string;
      platform: string;
      followers: number;
      posts: number;
      averageEngagement: number;
      averageSentiment: number;
      sentimentColor: string;
      isVerified: boolean;
    }[];
  };
  onTimeframeChange?: (days: number) => void;
}

const SocialMediaSentimentPanel: React.FC<SocialMediaSentimentPanelProps> = ({ data, onTimeframeChange }) => {
  const [frequencyTab, setFrequencyTab] = useState<number>(0);
  
  const handleFrequencyTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setFrequencyTab(newValue);
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <TwitterIcon />;
      case 'reddit':
        return <RedditIcon />;
      case 'stocktwits':
        return <ForumIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'youtube':
        return <YouTubeIcon />;
      default:
        return <ForumIcon />;
    }
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Doughnut chart options
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed.toFixed(1) + '%';
            }
            return label;
          }
        }
      }
    },
    cutout: '70%'
  };
  
  // Bar chart options for post frequency
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: frequencyTab === 0 ? 'Hourly Post Distribution' : 'Daily Post Distribution'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Post Count'
        }
      },
      x: {
        title: {
          display: true,
          text: frequencyTab === 0 ? 'Hour of Day' : 'Date'
        }
      }
    }
  };
  
  // Prepare data for post frequency chart
  const frequencyChartData = {
    labels: frequencyTab === 0 ? data.postFrequency.hourly.labels : data.postFrequency.daily.labels,
    datasets: [
      {
        data: frequencyTab === 0 ? data.postFrequency.hourly.data : data.postFrequency.daily.data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Sentiment Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Distribution
              </Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={{
                    labels: data.sentimentDistribution.labels,
                    datasets: [
                      {
                        data: data.sentimentDistribution.data,
                        backgroundColor: data.sentimentDistribution.backgroundColor,
                        borderWidth: 1
                      }
                    ]
                  }} 
                  options={doughnutOptions} 
                />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                {data.sentimentDistribution.labels.map((label, index) => (
                  <Chip 
                    key={index}
                    label={`${label}: ${data.sentimentDistribution.data[index].toFixed(1)}%`}
                    sx={{ 
                      m: 0.5, 
                      backgroundColor: data.sentimentDistribution.backgroundColor[index],
                      color: '#fff'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Platform Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Platform Distribution
              </Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={{
                    labels: data.platformDistribution.labels,
                    datasets: [
                      {
                        data: data.platformDistribution.data,
                        backgroundColor: data.platformDistribution.backgroundColor,
                        borderWidth: 1
                      }
                    ]
                  }} 
                  options={doughnutOptions} 
                />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                {data.platformDistribution.labels.map((label, index) => (
                  <Chip 
                    key={index}
                    icon={getPlatformIcon(label)}
                    label={`${label}: ${data.platformDistribution.data[index].toFixed(1)}%`}
                    sx={{ 
                      m: 0.5, 
                      backgroundColor: data.platformDistribution.backgroundColor[index],
                      color: '#fff'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Post Frequency Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={frequencyTab} onChange={handleFrequencyTabChange} aria-label="post frequency tabs">
                  <Tab label="Hourly" />
                  <Tab label="Daily" />
                </Tabs>
              </Box>
              <Box sx={{ height: 250 }}>
                <Bar options={barOptions} data={frequencyChartData} />
              </Box>
              {onTimeframeChange && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <ButtonGroup size="small">
                    <Button onClick={() => onTimeframeChange(7)}>7D</Button>
                    <Button onClick={() => onTimeframeChange(30)}>30D</Button>
                    <Button onClick={() => onTimeframeChange(90)}>90D</Button>
                  </ButtonGroup>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Top Influencers */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Influencers
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Author</TableCell>
                      <TableCell>Platform</TableCell>
                      <TableCell align="right">Followers</TableCell>
                      <TableCell align="right">Posts</TableCell>
                      <TableCell align="right">Avg. Engagement</TableCell>
                      <TableCell>Sentiment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topInfluencers.map((influencer, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {influencer.author}
                            {influencer.isVerified && (
                              <VerifiedIcon sx={{ ml: 0.5, fontSize: 16, color: '#1DA1F2' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getPlatformIcon(influencer.platform)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {influencer.platform}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(influencer.followers)}</TableCell>
                        <TableCell align="right">{influencer.posts}</TableCell>
                        <TableCell align="right">{formatNumber(influencer.averageEngagement)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={influencer.averageSentiment.toFixed(2)} 
                            size="small"
                            sx={{ 
                              backgroundColor: `${influencer.sentimentColor}20`,
                              color: influencer.sentimentColor,
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Social Media Metrics Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Media Metrics Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Sentiment Analysis
                    </Typography>
                    <Typography variant="body2">
                      Social media sentiment is predominantly 
                      {data.sentimentDistribution.data[0] > data.sentimentDistribution.data[2] ? ' positive' : 
                       data.sentimentDistribution.data[2] > data.sentimentDistribution.data[0] ? ' negative' : ' neutral'}, 
                      with {Math.max(...data.sentimentDistribution.data).toFixed(1)}% of posts showing 
                      {data.sentimentDistribution.data.indexOf(Math.max(...data.sentimentDistribution.data)) === 0 ? ' positive' : 
                       data.sentimentDistribution.data.indexOf(Math.max(...data.sentimentDistribution.data)) === 2 ? ' negative' : ' neutral'} sentiment.
                      This indicates {data.sentimentDistribution.data[0] > 50 ? 'strong bullish' : 
                                    data.sentimentDistribution.data[2] > 50 ? 'strong bearish' : 
                                    data.sentimentDistribution.data[0] > data.sentimentDistribution.data[2] ? 'slightly bullish' : 
                                    data.sentimentDistribution.data[2] > data.sentimentDistribution.data[0] ? 'slightly bearish' : 'neutral'} social sentiment.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Platform Insights
                    </Typography>
                    <Typography variant="body2">
                      Most discussions are happening on {data.platformDistribution.labels[data.platformDistribution.data.indexOf(Math.max(...data.platformDistribution.data))]}, 
                      accounting for {Math.max(...data.platformDistribution.data).toFixed(1)}% of all posts.
                      {data.platformDistribution.labels.length > 1 ? 
                        ` ${data.platformDistribution.labels[1]} is the second most active platform with ${data.platformDistribution.data[1].toFixed(1)}% of posts.` : ''}
                      This distribution suggests where the most impactful conversations are taking place.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Influencer Impact
                    </Typography>
                    <Typography variant="body2">
                      {data.topInfluencers.length > 0 ? 
                        `The most influential author is ${data.topInfluencers[0].author} on ${data.topInfluencers[0].platform} with ${formatNumber(data.topInfluencers[0].followers)} followers. ` : 
                        'No significant influencers identified. '}
                      {data.topInfluencers.some(i => i.averageSentiment > 0.2) ? 
                        `Top influencers are generally positive about the stock. ` : 
                        data.topInfluencers.some(i => i.averageSentiment < -0.2) ? 
                        `Top influencers are generally negative about the stock. ` : 
                        `Top influencers have mixed or neutral sentiment about the stock. `}
                      Influencer sentiment can significantly impact retail investor behavior.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SocialMediaSentimentPanel;