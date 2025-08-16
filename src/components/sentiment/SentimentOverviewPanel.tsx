import React from 'react';
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
  Stack
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SentimentOverviewPanelProps {
  data: {
    ticker: string;
    overallSentiment: {
      score: number;
      classification: string;
      color: string;
    };
    sourceSentiments: {
      source: string;
      score: number;
      classification: string;
      color: string;
    }[];
    sentimentTrend: {
      source: string;
      direction: string;
      magnitude: number;
      volatility: number;
      directionIcon: string;
    }[];
    timestamp: Date;
  };
  onTimeframeChange: (days: number) => void;
}

const SentimentOverviewPanel: React.FC<SentimentOverviewPanelProps> = ({ data, onTimeframeChange }) => {
  const getSentimentIcon = (classification: string) => {
    switch (classification.toLowerCase()) {
      case 'positive':
        return <SentimentSatisfiedAltIcon sx={{ color: '#4CAF50' }} />;
      case 'negative':
        return <SentimentVeryDissatisfiedIcon sx={{ color: '#F44336' }} />;
      default:
        return <SentimentNeutralIcon sx={{ color: '#9E9E9E' }} />;
    }
  };
  
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUpIcon sx={{ color: '#4CAF50' }} />;
      case 'deteriorating':
        return <TrendingDownIcon sx={{ color: '#F44336' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: '#9E9E9E' }} />;
    }
  };
  
  const formatSentimentScore = (score: number) => {
    return score.toFixed(2);
  };
  
  // Sample chart data (in a real implementation, this would come from the API)
  const chartData = {
    labels: ['30 Days Ago', '25 Days Ago', '20 Days Ago', '15 Days Ago', '10 Days Ago', '5 Days Ago', 'Today'],
    datasets: [
      {
        label: 'Overall Sentiment',
        data: [0.1, 0.15, 0.05, -0.1, -0.2, 0.3, data.overallSentiment.score],
        borderColor: data.overallSentiment.color,
        backgroundColor: `${data.overallSentiment.color}20`,
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sentiment Trend (30 Days)'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatSentimentScore(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        title: {
          display: true,
          text: 'Sentiment Score'
        }
      }
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Overall Sentiment Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Sentiment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', my: 2 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${data.overallSentiment.color}20`,
                    border: `4px solid ${data.overallSentiment.color}`,
                    mb: 2
                  }}
                >
                  <Typography variant="h3" component="div" sx={{ color: data.overallSentiment.color }}>
                    {formatSentimentScore(data.overallSentiment.score)}
                  </Typography>
                </Box>
                <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize', color: data.overallSentiment.color }}>
                  {data.overallSentiment.classification}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Last updated: {new Date(data.timestamp).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Source Sentiment Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment by Source
              </Typography>
              <Grid container spacing={2}>
                {data.sourceSentiments.map((source, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        borderLeft: `4px solid ${source.color}`
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1">{source.source}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {source.classification}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getSentimentIcon(source.classification)}
                        <Typography variant="h6" sx={{ ml: 1, color: source.color }}>
                          {formatSentimentScore(source.score)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Sentiment Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Sentiment Trend</Typography>
                <ButtonGroup size="small">
                  <Button onClick={() => onTimeframeChange(7)}>7D</Button>
                  <Button onClick={() => onTimeframeChange(30)} variant="contained">30D</Button>
                  <Button onClick={() => onTimeframeChange(90)}>90D</Button>
                </ButtonGroup>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line options={chartOptions} data={chartData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Sentiment Trend Analysis */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trend Analysis
              </Typography>
              <Stack spacing={2}>
                {data.sentimentTrend.map((trend, index) => (
                  <Paper 
                    key={index} 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">{trend.source}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {getTrendIcon(trend.direction)}
                        <Typography variant="body2" sx={{ ml: 0.5, textTransform: 'capitalize' }}>
                          {trend.direction}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Chip 
                        label={`Magnitude: ${trend.magnitude.toFixed(2)}`} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <Chip 
                        label={`Volatility: ${trend.volatility.toFixed(2)}`} 
                        size="small" 
                        color={trend.volatility > 0.5 ? "warning" : "default"}
                      />
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Key Insights */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Insights
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Sentiment Summary
                    </Typography>
                    <Typography variant="body2">
                      The overall sentiment for {data.ticker} is {data.overallSentiment.classification.toLowerCase()} with a score of {formatSentimentScore(data.overallSentiment.score)}. 
                      This indicates {data.overallSentiment.classification === 'positive' ? 'positive market perception' : 
                        data.overallSentiment.classification === 'negative' ? 'negative market perception' : 'neutral market perception'}.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Source Analysis
                    </Typography>
                    <Typography variant="body2">
                      {data.sourceSentiments.some(s => s.classification === 'positive') ? 
                        `Most positive sentiment comes from ${data.sourceSentiments.filter(s => s.classification === 'positive')[0]?.source}.` : 
                        'No sources show strongly positive sentiment.'} 
                      {data.sourceSentiments.some(s => s.classification === 'negative') ? 
                        ` Most negative sentiment comes from ${data.sourceSentiments.filter(s => s.classification === 'negative')[0]?.source}.` : 
                        ' No sources show strongly negative sentiment.'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Trend Insight
                    </Typography>
                    <Typography variant="body2">
                      {data.sentimentTrend.some(t => t.direction === 'improving') ? 
                        `Sentiment is improving in ${data.sentimentTrend.filter(t => t.direction === 'improving').length} sources, ` : 
                        'No sources show improving sentiment, '}
                      {data.sentimentTrend.some(t => t.direction === 'deteriorating') ? 
                        `deteriorating in ${data.sentimentTrend.filter(t => t.direction === 'deteriorating').length} sources, ` : 
                        'not deteriorating in any sources, '}
                      and stable in the remaining sources.
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

export default SentimentOverviewPanel;