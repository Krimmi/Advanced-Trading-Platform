import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  ButtonGroup,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Link,
  Tab,
  Tabs,
  LinearProgress,
  Avatar
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArticleIcon from '@mui/icons-material/Article';
import CategoryIcon from '@mui/icons-material/Category';
import { useTheme } from '@mui/material/styles';

interface NewsSentimentPanelProps {
  data: {
    impact: {
      impactMetrics: {
        name: string;
        score: number;
        classification: string;
        confidence: number;
        color: string;
      }[];
      significantArticles: {
        title: string;
        url: string;
        date: string;
        sentiment: number;
        sentimentColor: string;
        relevance: number;
      }[];
    };
    trends: {
      trends: {
        name: string;
        value: number;
        changePercent: number;
        direction: string;
        directionIcon: string;
        color: string;
      }[];
    };
    categories: {
      category: string;
      count: number;
      items: any[];
    }[];
  };
  onTimeframeChange?: (days: number) => void;
  currentTimeframe?: number;
}

const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({ 
  data, 
  onTimeframeChange,
  currentTimeframe = 30
}) => {
  const theme = useTheme();
  const [categoryTab, setCategoryTab] = useState(0);
  
  const handleCategoryTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCategoryTab(newValue);
  };
  
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
      case 'increasing':
        return <TrendingUpIcon sx={{ color: '#4CAF50' }} />;
      case 'deteriorating':
      case 'decreasing':
        return <TrendingDownIcon sx={{ color: '#F44336' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: '#9E9E9E' }} />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* News Impact Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                News Impact Analysis
              </Typography>
              <Grid container spacing={2}>
                {data.impact.impactMetrics.map((metric, index) => (
                  <Grid item xs={12} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        borderLeft: `4px solid ${metric.color}`,
                        backgroundColor: `${metric.color}10`
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{metric.name}</Typography>
                        <Chip 
                          label={metric.classification} 
                          size="small"
                          sx={{ 
                            backgroundColor: `${metric.color}20`,
                            color: metric.color,
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography 
                          variant="h5" 
                          component="div" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: metric.color
                          }}
                        >
                          {metric.score.toFixed(2)}
                        </Typography>
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={metric.confidence * 100} 
                              sx={{ 
                                flexGrow: 1, 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: `${metric.color}20`,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: metric.color
                                }
                              }} 
                            />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {(metric.confidence * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {onTimeframeChange && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <ButtonGroup size="small">
                    <Button 
                      onClick={() => onTimeframeChange(7)} 
                      variant={currentTimeframe === 7 ? 'contained' : 'outlined'}
                    >
                      7D
                    </Button>
                    <Button 
                      onClick={() => onTimeframeChange(30)} 
                      variant={currentTimeframe === 30 ? 'contained' : 'outlined'}
                    >
                      30D
                    </Button>
                    <Button 
                      onClick={() => onTimeframeChange(90)} 
                      variant={currentTimeframe === 90 ? 'contained' : 'outlined'}
                    >
                      90D
                    </Button>
                  </ButtonGroup>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Significant Articles */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Significant Articles
              </Typography>
              <List>
                {data.impact.significantArticles.map((article, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Link 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            underline="hover"
                            color="inherit"
                          >
                            {article.title}
                          </Link>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {article.date}
                            </Typography>
                            <Box sx={{ display: 'flex', ml: 'auto' }}>
                              <Chip 
                                label={`Sentiment: ${article.sentiment.toFixed(2)}`} 
                                size="small"
                                sx={{ 
                                  mr: 1,
                                  backgroundColor: `${article.sentimentColor}20`,
                                  color: article.sentimentColor
                                }}
                              />
                              <Chip 
                                label={`Relevance: ${(article.relevance * 100).toFixed(0)}%`} 
                                size="small"
                                sx={{ backgroundColor: theme.palette.grey[200] }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* News Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                News Trends
              </Typography>
              <Grid container spacing={2}>
                {data.trends.trends.map((trend, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        borderLeft: `4px solid ${trend.color}`,
                        backgroundColor: `${trend.color}10`
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{trend.name}</Typography>
                        {getTrendIcon(trend.direction)}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                        <Typography 
                          variant="h5" 
                          component="div" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: trend.color
                          }}
                        >
                          {trend.value.toFixed(2)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            ml: 1,
                            color: trend.changePercent > 0 ? '#4CAF50' : trend.changePercent < 0 ? '#F44336' : 'text.secondary'
                          }}
                        >
                          {formatPercentage(trend.changePercent)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textTransform: 'capitalize' }}>
                        {trend.direction}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* News Categories */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                News Categories
              </Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={categoryTab} 
                  onChange={handleCategoryTabChange} 
                  aria-label="news categories tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {data.categories.map((category, index) => (
                    <Tab 
                      key={index} 
                      label={`${category.category} (${category.count})`} 
                      id={`category-tab-${index}`}
                      aria-controls={`category-tabpanel-${index}`}
                    />
                  ))}
                </Tabs>
              </Box>
              {data.categories.map((category, index) => (
                <div
                  key={index}
                  role="tabpanel"
                  hidden={categoryTab !== index}
                  id={`category-tabpanel-${index}`}
                  aria-labelledby={`category-tab-${index}`}
                >
                  {categoryTab === index && (
                    <List dense>
                      {category.items.slice(0, 5).map((article, articleIndex) => (
                        <ListItem key={articleIndex} disablePadding>
                          <ListItemText
                            primary={
                              <Typography variant="body2" noWrap>
                                {article.title || `Article ${articleIndex + 1}`}
                              </Typography>
                            }
                            secondary={article.publishedAt ? formatDate(article.publishedAt) : ''}
                          />
                        </ListItem>
                      ))}
                      {category.items.length > 5 && (
                        <ListItem>
                          <Typography variant="body2" color="text.secondary">
                            And {category.items.length - 5} more articles...
                          </Typography>
                        </ListItem>
                      )}
                    </List>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* News Analysis Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                News Analysis Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AssessmentIcon sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Impact Assessment</Typography>
                    </Box>
                    <Typography variant="body2">
                      {data.impact.impactMetrics[0].classification === 'positive' ? 
                        'News coverage is predominantly positive, suggesting favorable market perception.' : 
                        data.impact.impactMetrics[0].classification === 'negative' ? 
                        'News coverage is predominantly negative, suggesting unfavorable market perception.' : 
                        'News coverage is relatively neutral, with balanced positive and negative sentiment.'}
                      {' '}Short-term impact is {data.impact.impactMetrics[1].classification.toLowerCase()}, 
                      while long-term impact is {data.impact.impactMetrics[2].classification.toLowerCase()}.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ArticleIcon sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Content Analysis</Typography>
                    </Box>
                    <Typography variant="body2">
                      {data.trends.trends.some(t => t.name === 'News Volume') ? 
                        `News volume is ${data.trends.trends.find(t => t.name === 'News Volume')?.direction}, ` : 
                        'News volume is stable, '}
                      {data.trends.trends.some(t => t.name === 'News Sentiment') ? 
                        `with sentiment ${data.trends.trends.find(t => t.name === 'News Sentiment')?.direction}. ` : 
                        'with stable sentiment. '}
                      Significant articles focus on 
                      {data.categories.length > 0 ? 
                        ` ${data.categories[0].category.toLowerCase()} (${data.categories[0].count} articles)` : 
                        ' various topics'}
                      {data.categories.length > 1 ? 
                        ` and ${data.categories[1].category.toLowerCase()} (${data.categories[1].count} articles).` : 
                        '.'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CategoryIcon sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Category Insights</Typography>
                    </Box>
                    <Typography variant="body2">
                      {data.categories.length > 0 ? 
                        `The most discussed category is ${data.categories[0].category} with ${data.categories[0].count} articles. ` : 
                        'No specific category dominates the news coverage. '}
                      {data.categories.some(c => c.category === 'Earnings' || c.category === 'Financial Results') ? 
                        'Earnings and financial results are significant topics in recent coverage. ' : ''}
                      {data.categories.some(c => c.category === 'Management Changes' || c.category === 'Leadership') ? 
                        'Management changes are being discussed in recent news. ' : ''}
                      {data.categories.some(c => c.category === 'Mergers & Acquisitions' || c.category === 'M&A') ? 
                        'M&A activity is featured in recent coverage. ' : ''}
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

export default NewsSentimentPanel;