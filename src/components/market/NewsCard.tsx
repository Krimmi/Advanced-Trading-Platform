import React, { useState, useEffect } from 'react';
import { newsService } from '../../services/api/news/NewsServiceFactory';
import { NewsArticle } from '../../services/api/news/NewsService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  CircularProgress, 
  Box,
  Chip,
  Link,
  Avatar
} from '@mui/material';
import { format } from 'date-fns';

interface NewsCardProps {
  symbol?: string;
  category?: string;
  limit?: number;
  title?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  symbol, 
  category, 
  limit = 5,
  title = symbol ? `${symbol} News` : 'Top Financial News'
}) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let articles: NewsArticle[];
        
        if (symbol) {
          // Get news for a specific symbol
          articles = await newsService.getSymbolNews(symbol, limit);
        } else {
          // Get top news, optionally filtered by category
          articles = await newsService.getTopNews(category, limit);
        }
        
        setNews(articles);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [symbol, category, limit]);

  // Function to get sentiment color
  const getSentimentColor = (sentiment?: { score: number; label: string }) => {
    if (!sentiment) return 'default';
    
    switch (sentiment.label) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title={title} />
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
        <CardHeader title={title} />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <Typography>No news articles found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <List disablePadding>
          {news.map((article, index) => (
            <React.Fragment key={article.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                <ListItemText
                  primary={
                    <Link 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      color="inherit"
                      underline="hover"
                      sx={{ fontWeight: 'medium' }}
                    >
                      {article.title}
                    </Link>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', mt: 0.5, mb: 1 }}
                      >
                        {article.summary}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {article.sentiment && (
                          <Chip 
                            label={article.sentiment.label.charAt(0).toUpperCase() + article.sentiment.label.slice(1)} 
                            size="small" 
                            color={getSentimentColor(article.sentiment) as any}
                            sx={{ mr: 1 }}
                          />
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          {article.source} • {formatDate(article.publishedAt)}
                        </Typography>
                        
                        {article.symbols && article.symbols.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                            {article.symbols.map(sym => (
                              <Chip 
                                key={sym} 
                                label={sym} 
                                size="small" 
                                variant="outlined" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </React.Fragment>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default NewsCard;