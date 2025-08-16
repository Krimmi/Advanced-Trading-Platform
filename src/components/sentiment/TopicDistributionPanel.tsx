import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import ReactWordcloud from 'react-wordcloud';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface TopicDistributionPanelProps {
  data: {
    topics: {
      name: string;
      percentage: number;
      sentiment: number;
      sentimentColor: string;
      keywords: string[];
    }[];
    wordCloud: {
      text: string;
      value: number;
      sentiment: number;
    }[];
  };
  title?: string;
}

const TopicDistributionPanel: React.FC<TopicDistributionPanelProps> = ({ 
  data,
  title = "Topic Distribution Analysis"
}) => {
  const theme = useTheme();
  
  // Prepare data for topic distribution chart
  const chartData = {
    labels: data.topics.map(topic => topic.name),
    datasets: [
      {
        data: data.topics.map(topic => topic.percentage),
        backgroundColor: data.topics.map(topic => topic.sentimentColor),
        borderWidth: 1
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const topic = data.topics[context.dataIndex];
            return [
              `${topic.name}: ${topic.percentage.toFixed(1)}%`,
              `Sentiment: ${topic.sentiment.toFixed(2)}`
            ];
          }
        }
      }
    }
  };
  
  // Prepare data for word cloud
  const wordCloudData = data.wordCloud.map(word => ({
    text: word.text,
    value: word.value,
    color: word.sentiment > 0.2 ? '#4CAF50' : 
           word.sentiment < -0.2 ? '#F44336' : 
           '#9E9E9E'
  }));
  
  const wordCloudOptions = {
    colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#F44336'],
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Arial',
    fontSizes: [12, 40],
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 90],
    scale: 'sqrt',
    spiral: 'archimedean',
    transitionDuration: 1000
  };
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Topic Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Topic Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Word Cloud */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Keyword Cloud
              </Typography>
              <Box sx={{ height: 300 }}>
                {wordCloudData.length > 0 ? (
                  <ReactWordcloud words={wordCloudData} options={wordCloudOptions} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No keyword data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Topic Details */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Topic Details
              </Typography>
              <Grid container spacing={2}>
                {data.topics.map((topic, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        borderLeft: `4px solid ${topic.sentimentColor}`
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">{topic.name}</Typography>
                        <Chip 
                          label={`${topic.percentage.toFixed(1)}%`} 
                          size="small"
                          sx={{ backgroundColor: `${topic.sentimentColor}20`, color: topic.sentimentColor }}
                        />
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Sentiment: {topic.sentiment.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Key terms:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {topic.keywords.slice(0, 5).map((keyword, keywordIndex) => (
                          <Chip 
                            key={keywordIndex} 
                            label={keyword} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                        {topic.keywords.length > 5 && (
                          <Chip 
                            label={`+${topic.keywords.length - 5} more`} 
                            size="small" 
                            variant="outlined"
                            sx={{ backgroundColor: theme.palette.grey[100] }}
                          />
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Topic Analysis Summary */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Topic Analysis Summary
              </Typography>
              <Typography variant="body2">
                {data.topics.length > 0 ? (
                  <>
                    Analysis identified {data.topics.length} distinct topics in the content, with{' '}
                    <strong>{data.topics[0].name}</strong> being the most prevalent topic ({data.topics[0].percentage.toFixed(1)}% of content).
                    {' '}
                    {data.topics.filter(t => t.sentiment > 0.2).length > 0 ? (
                      <>
                        The most positive sentiment is associated with the topic{' '}
                        <strong>{data.topics.filter(t => t.sentiment > 0.2).sort((a, b) => b.sentiment - a.sentiment)[0]?.name}</strong>.
                        {' '}
                      </>
                    ) : null}
                    {data.topics.filter(t => t.sentiment < -0.2).length > 0 ? (
                      <>
                        The most negative sentiment is associated with the topic{' '}
                        <strong>{data.topics.filter(t => t.sentiment < -0.2).sort((a, b) => a.sentiment - b.sentiment)[0]?.name}</strong>.
                        {' '}
                      </>
                    ) : null}
                    The overall topic sentiment is{' '}
                    {data.topics.reduce((sum, topic) => sum + topic.sentiment * (topic.percentage / 100), 0) > 0.2 ? 'positive' : 
                     data.topics.reduce((sum, topic) => sum + topic.sentiment * (topic.percentage / 100), 0) < -0.2 ? 'negative' : 'neutral'}.
                  </>
                ) : (
                  'No topic data available for analysis.'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TopicDistributionPanel;