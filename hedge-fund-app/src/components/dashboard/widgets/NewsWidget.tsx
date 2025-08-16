import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  Divider, 
  Button, 
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Newspaper as NewspaperIcon, 
  OpenInNew as OpenInNewIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon
} from '@mui/icons-material';

interface NewsWidgetProps {
  settings: {
    sources?: string[];
    categories?: string[];
    limit?: number;
  };
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceId: string;
  category: string;
  timestamp: Date;
  url: string;
  imageUrl?: string;
  summary?: string;
  isBookmarked: boolean;
}

const NewsWidget: React.FC<NewsWidgetProps> = ({ settings }) => {
  const theme = useTheme();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Default settings
  const sources = settings.sources || ['bloomberg', 'reuters', 'wsj', 'ft', 'cnbc'];
  const categories = settings.categories || ['markets', 'economy', 'companies'];
  const limit = settings.limit || 10;
  
  // Load news data
  useEffect(() => {
    const fetchNewsData = () => {
      setIsLoading(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        // Mock news data
        const mockNews: NewsItem[] = [
          {
            id: 'news-1',
            title: 'Fed Signals Potential Rate Cut in September Meeting',
            source: 'Bloomberg',
            sourceId: 'bloomberg',
            category: 'economy',
            timestamp: new Date('2025-08-14T10:30:00'),
            url: 'https://example.com/news/1',
            imageUrl: 'https://source.unsplash.com/random/100x100?finance,fed',
            summary: 'Federal Reserve officials indicated they are prepared to cut interest rates at their next meeting in September, citing progress on inflation.',
            isBookmarked: false
          },
          {
            id: 'news-2',
            title: 'Tech Stocks Rally as Earnings Beat Expectations',
            source: 'Reuters',
            sourceId: 'reuters',
            category: 'markets',
            timestamp: new Date('2025-08-14T09:15:00'),
            url: 'https://example.com/news/2',
            imageUrl: 'https://source.unsplash.com/random/100x100?tech,stocks',
            summary: 'Technology stocks surged on Thursday as major companies reported better-than-expected quarterly results, boosting market sentiment.',
            isBookmarked: true
          },
          {
            id: 'news-3',
            title: 'Oil Prices Drop on Increased Supply Concerns',
            source: 'Financial Times',
            sourceId: 'ft',
            category: 'commodities',
            timestamp: new Date('2025-08-14T08:45:00'),
            url: 'https://example.com/news/3',
            imageUrl: 'https://source.unsplash.com/random/100x100?oil,energy',
            summary: 'Crude oil prices fell sharply on Thursday as OPEC+ members discussed increasing production quotas amid growing global demand concerns.',
            isBookmarked: false
          },
          {
            id: 'news-4',
            title: 'Major Acquisition: Tech Giant to Buy AI Startup for $5B',
            source: 'Wall Street Journal',
            sourceId: 'wsj',
            category: 'companies',
            timestamp: new Date('2025-08-14T07:30:00'),
            url: 'https://example.com/news/4',
            imageUrl: 'https://source.unsplash.com/random/100x100?ai,technology',
            summary: 'A leading technology company announced plans to acquire an artificial intelligence startup in a deal valued at $5 billion, marking one of the largest AI acquisitions to date.',
            isBookmarked: false
          },
          {
            id: 'news-5',
            title: 'Retail Sales Exceed Forecasts, Consumer Spending Remains Strong',
            source: 'CNBC',
            sourceId: 'cnbc',
            category: 'economy',
            timestamp: new Date('2025-08-13T16:45:00'),
            url: 'https://example.com/news/5',
            imageUrl: 'https://source.unsplash.com/random/100x100?retail,shopping',
            summary: 'U.S. retail sales rose more than expected in July, indicating resilient consumer spending despite higher interest rates and inflation concerns.',
            isBookmarked: false
          },
          {
            id: 'news-6',
            title: 'Cryptocurrency Market Volatility Increases as Regulations Loom',
            source: 'Bloomberg',
            sourceId: 'bloomberg',
            category: 'markets',
            timestamp: new Date('2025-08-13T14:20:00'),
            url: 'https://example.com/news/6',
            imageUrl: 'https://source.unsplash.com/random/100x100?crypto,bitcoin',
            summary: 'Bitcoin and other cryptocurrencies experienced increased volatility as investors reacted to potential new regulations being discussed by global financial authorities.',
            isBookmarked: true
          },
          {
            id: 'news-7',
            title: 'Healthcare Sector Outperforms as New Drug Approvals Accelerate',
            source: 'Reuters',
            sourceId: 'reuters',
            category: 'markets',
            timestamp: new Date('2025-08-13T11:10:00'),
            url: 'https://example.com/news/7',
            imageUrl: 'https://source.unsplash.com/random/100x100?healthcare,medical',
            summary: 'Healthcare stocks led market gains as the FDA announced an accelerated approval process for several breakthrough treatments, boosting pharmaceutical companies.',
            isBookmarked: false
          },
          {
            id: 'news-8',
            title: 'Housing Market Shows Signs of Cooling as Mortgage Rates Rise',
            source: 'Wall Street Journal',
            sourceId: 'wsj',
            category: 'economy',
            timestamp: new Date('2025-08-13T09:30:00'),
            url: 'https://example.com/news/8',
            imageUrl: 'https://source.unsplash.com/random/100x100?housing,realestate',
            summary: 'The U.S. housing market is showing early signs of cooling as mortgage rates climb above 6%, leading to decreased demand and longer listing times in major markets.',
            isBookmarked: false
          }
        ];
        
        // Filter by sources and categories if specified
        let filtered = mockNews;
        if (sources.length > 0) {
          filtered = filtered.filter(item => sources.includes(item.sourceId));
        }
        if (categories.length > 0) {
          filtered = filtered.filter(item => categories.includes(item.category));
        }
        
        // Apply limit
        filtered = filtered.slice(0, limit);
        
        setNewsItems(filtered);
        setIsLoading(false);
      }, 1000);
    };
    
    // Initial fetch
    fetchNewsData();
  }, [sources, categories, limit]);
  
  // Toggle bookmark
  const handleToggleBookmark = (id: string) => {
    setNewsItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };
  
  // Filter by category
  const handleFilterByCategory = (category: string | null) => {
    setActiveFilter(category);
  };
  
  // Get unique categories from news items
  const uniqueCategories = Array.from(new Set(newsItems.map(item => item.category)));
  
  // Filter news items by active filter
  const filteredNews = activeFilter
    ? newsItems.filter(item => item.category === activeFilter)
    : newsItems;
  
  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2">Loading news...</Typography>
      </Box>
    );
  }
  
  if (newsItems.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2" color="text.secondary">No news articles found</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Category filters */}
      <Box sx={{ p: 2, pb: 1, overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="All"
            color={activeFilter === null ? 'primary' : 'default'}
            onClick={() => handleFilterByCategory(null)}
            size="small"
          />
          {uniqueCategories.map(category => (
            <Chip
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              color={activeFilter === category ? 'primary' : 'default'}
              onClick={() => handleFilterByCategory(category)}
              size="small"
            />
          ))}
        </Box>
      </Box>
      
      <Divider />
      
      {/* News list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List disablePadding>
          {filteredNews.map((news) => (
            <React.Fragment key={news.id}>
              <ListItem
                alignItems="flex-start"
                sx={{ py: 1.5, px: 2 }}
                secondaryAction={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleToggleBookmark(news.id)}
                    >
                      {news.isBookmarked ? (
                        <BookmarkIcon fontSize="small" color="primary" />
                      ) : (
                        <BookmarkBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  {news.imageUrl ? (
                    <Avatar
                      alt={news.source}
                      src={news.imageUrl}
                      variant="rounded"
                      sx={{ width: 56, height: 56 }}
                    />
                  ) : (
                    <Avatar
                      sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main }}
                      variant="rounded"
                    >
                      <NewspaperIcon />
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                      {news.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" component="span">
                          {news.source}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'text.disabled',
                            mx: 0.8
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" component="span">
                          {formatRelativeTime(news.timestamp)}
                        </Typography>
                      </Box>
                      {news.summary && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {news.summary}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ ml: 1.5 }}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
      
      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          {filteredNews.length} articles
        </Typography>
        <Button size="small" variant="text" endIcon={<OpenInNewIcon />}>
          View More
        </Button>
      </Box>
    </Box>
  );
};

export default NewsWidget;