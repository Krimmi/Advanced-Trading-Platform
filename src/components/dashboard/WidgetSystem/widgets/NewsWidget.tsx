/**
 * News Widget
 * 
 * This widget displays financial news from various sources with
 * filtering options and customizable display.
 */

import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { WidgetProps } from '../WidgetRegistry';

// Default settings for the widget
const DEFAULT_SETTINGS = {
  sources: ['bloomberg', 'reuters', 'wsj', 'cnbc', 'ft'],
  categories: ['markets', 'economy', 'companies', 'technology'],
  displayMode: 'list', // 'list' or 'card'
  showImages: true,
  articlesCount: 10,
  sortBy: 'latest' // 'latest', 'popular', 'relevant'
};

// Sample news data (in a real app, this would come from an API)
const SAMPLE_NEWS_DATA = [
  {
    id: '1',
    title: 'Fed Signals Potential Rate Cut as Inflation Cools',
    summary: 'Federal Reserve officials indicated they could begin cutting interest rates in the coming months if inflation continues to ease, minutes from their latest meeting showed.',
    source: 'bloomberg',
    category: 'economy',
    author: 'John Smith',
    publishedAt: '2025-08-14T14:30:00Z',
    url: 'https://bloomberg.com/news/fed-signals-rate-cut',
    imageUrl: 'https://example.com/images/fed-building.jpg',
    isBookmarked: false,
    isRead: false
  },
  {
    id: '2',
    title: 'Apple Unveils New AI Features for iPhone 17',
    summary: 'Apple announced a suite of new artificial intelligence features coming to the iPhone 17, including enhanced Siri capabilities and on-device language processing.',
    source: 'cnbc',
    category: 'technology',
    author: 'Sarah Johnson',
    publishedAt: '2025-08-14T12:15:00Z',
    url: 'https://cnbc.com/tech/apple-ai-features',
    imageUrl: 'https://example.com/images/iphone-17.jpg',
    isBookmarked: true,
    isRead: false
  },
  {
    id: '3',
    title: 'Oil Prices Surge on Middle East Tensions',
    summary: 'Crude oil prices jumped 3% on Thursday as geopolitical tensions in the Middle East raised concerns about potential supply disruptions.',
    source: 'reuters',
    category: 'markets',
    author: 'Michael Wong',
    publishedAt: '2025-08-14T10:45:00Z',
    url: 'https://reuters.com/business/energy/oil-prices-surge',
    imageUrl: 'https://example.com/images/oil-rig.jpg',
    isBookmarked: false,
    isRead: true
  },
  {
    id: '4',
    title: 'Tesla Breaks Ground on New Gigafactory in India',
    summary: 'Tesla has begun construction on its new manufacturing facility in India, marking the company\'s expansion into one of the world\'s fastest-growing automotive markets.',
    source: 'wsj',
    category: 'companies',
    author: 'Priya Patel',
    publishedAt: '2025-08-14T09:20:00Z',
    url: 'https://wsj.com/business/autos/tesla-india-factory',
    imageUrl: 'https://example.com/images/tesla-factory.jpg',
    isBookmarked: false,
    isRead: false
  },
  {
    id: '5',
    title: 'Amazon Acquires AI Startup for $2.5 Billion',
    summary: 'Amazon announced the acquisition of an artificial intelligence startup specializing in natural language processing for $2.5 billion, its largest AI acquisition to date.',
    source: 'ft',
    category: 'technology',
    author: 'David Chen',
    publishedAt: '2025-08-14T08:00:00Z',
    url: 'https://ft.com/tech/amazon-acquisition',
    imageUrl: 'https://example.com/images/amazon-hq.jpg',
    isBookmarked: true,
    isRead: false
  },
  {
    id: '6',
    title: 'Global Markets Rally as Economic Data Beats Expectations',
    summary: 'Stock markets around the world rallied on Thursday after a series of economic reports showed stronger-than-expected growth in major economies.',
    source: 'bloomberg',
    category: 'markets',
    author: 'Emma Wilson',
    publishedAt: '2025-08-14T07:30:00Z',
    url: 'https://bloomberg.com/markets/global-rally',
    imageUrl: 'https://example.com/images/stock-market.jpg',
    isBookmarked: false,
    isRead: false
  },
  {
    id: '7',
    title: 'Cryptocurrency Regulation Bill Advances in Congress',
    summary: 'A bipartisan bill establishing a regulatory framework for cryptocurrencies advanced in Congress, providing clarity for the industry while imposing new requirements.',
    source: 'cnbc',
    category: 'economy',
    author: 'Robert Taylor',
    publishedAt: '2025-08-13T22:15:00Z',
    url: 'https://cnbc.com/crypto/regulation-bill',
    imageUrl: 'https://example.com/images/cryptocurrency.jpg',
    isBookmarked: false,
    isRead: true
  },
  {
    id: '8',
    title: 'Microsoft Expands Cloud Services with New Data Centers',
    summary: 'Microsoft announced plans to open new data centers in Africa and the Middle East, expanding its global cloud infrastructure to meet growing demand.',
    source: 'reuters',
    category: 'companies',
    author: 'James Brown',
    publishedAt: '2025-08-13T18:40:00Z',
    url: 'https://reuters.com/technology/microsoft-data-centers',
    imageUrl: 'https://example.com/images/data-center.jpg',
    isBookmarked: false,
    isRead: false
  },
  {
    id: '9',
    title: 'Inflation Data Shows Continued Moderation in Prices',
    summary: 'The latest Consumer Price Index report showed inflation continuing to moderate, with core prices rising less than economists had forecast.',
    source: 'wsj',
    category: 'economy',
    author: 'Lisa Martinez',
    publishedAt: '2025-08-13T16:10:00Z',
    url: 'https://wsj.com/economy/inflation-data',
    imageUrl: 'https://example.com/images/inflation-chart.jpg',
    isBookmarked: false,
    isRead: false
  },
  {
    id: '10',
    title: 'Google Faces New Antitrust Challenge in Europe',
    summary: 'European regulators announced a new antitrust investigation into Google\'s advertising technology practices, potentially leading to additional fines.',
    source: 'ft',
    category: 'companies',
    author: 'Thomas Schmidt',
    publishedAt: '2025-08-13T14:25:00Z',
    url: 'https://ft.com/technology/google-antitrust',
    imageUrl: 'https://example.com/images/google-logo.jpg',
    isBookmarked: false,
    isRead: true
  }
];

// Source display names and colors
const NEWS_SOURCES = {
  bloomberg: { name: 'Bloomberg', color: '#121212' },
  reuters: { name: 'Reuters', color: '#FF8000' },
  wsj: { name: 'Wall Street Journal', color: '#0080C6' },
  cnbc: { name: 'CNBC', color: '#005594' },
  ft: { name: 'Financial Times', color: '#FFF1E0' }
};

// Category display names
const NEWS_CATEGORIES = {
  markets: 'Markets',
  economy: 'Economy',
  companies: 'Companies',
  technology: 'Technology'
};

const NewsWidget: React.FC<WidgetProps> = ({
  id,
  settings,
  isEditing,
  onSettingsChange,
  loading,
  data
}) => {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Merge default settings with user settings
  const widgetSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // Use provided data or sample data
  const newsData = data || SAMPLE_NEWS_DATA;
  
  // Filter news based on settings and active category
  const filteredNews = newsData.filter(item => {
    const sourceMatch = widgetSettings.sources.includes(item.source);
    const categoryMatch = widgetSettings.categories.includes(item.category);
    const activeCategoryMatch = !activeCategory || item.category === activeCategory;
    
    return sourceMatch && categoryMatch && activeCategoryMatch;
  });
  
  // Sort news based on settings
  const sortedNews = [...filteredNews].sort((a, b) => {
    if (widgetSettings.sortBy === 'latest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    // Add other sorting options if needed
    return 0;
  }).slice(0, widgetSettings.articlesCount);
  
  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...widgetSettings,
        [key]: value
      });
    }
  };
  
  // Handle category change
  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
  };
  
  // Format published date
  const formatPublishedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  // If in editing mode, show settings
  if (isEditing) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Widget Settings
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            News Sources
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Sources</InputLabel>
            <Select
              multiple
              value={widgetSettings.sources}
              label="Sources"
              onChange={(e) => handleSettingChange('sources', e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip 
                      key={value} 
                      label={NEWS_SOURCES[value as keyof typeof NEWS_SOURCES]?.name || value} 
                      size="small" 
                    />
                  ))}
                </Box>
              )}
            >
              {Object.entries(NEWS_SOURCES).map(([key, { name }]) => (
                <MenuItem key={key} value={key}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Categories
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Categories</InputLabel>
            <Select
              multiple
              value={widgetSettings.categories}
              label="Categories"
              onChange={(e) => handleSettingChange('categories', e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip 
                      key={value} 
                      label={NEWS_CATEGORIES[value as keyof typeof NEWS_CATEGORIES] || value} 
                      size="small" 
                    />
                  ))}
                </Box>
              )}
            >
              {Object.entries(NEWS_CATEGORIES).map(([key, name]) => (
                <MenuItem key={key} value={key}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Display Settings
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Display Mode</InputLabel>
            <Select
              value={widgetSettings.displayMode}
              label="Display Mode"
              onChange={(e) => handleSettingChange('displayMode', e.target.value)}
            >
              <MenuItem value="list">List View</MenuItem>
              <MenuItem value="card">Card View</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={widgetSettings.showImages}
                onChange={(e) => handleSettingChange('showImages', e.target.checked)}
              />
            }
            label="Show Images"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Number of Articles
          </Typography>
          <TextField
            type="number"
            value={widgetSettings.articlesCount}
            onChange={(e) => handleSettingChange('articlesCount', parseInt(e.target.value))}
            fullWidth
            size="small"
            InputProps={{ inputProps: { min: 1, max: 50 } }}
          />
        </Box>
        
        <Box>
          <Typography variant="body2" gutterBottom>
            Sort By
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select
              value={widgetSettings.sortBy}
              label="Sort"
              onChange={(e) => handleSettingChange('sortBy', e.target.value)}
            >
              <MenuItem value="latest">Latest</MenuItem>
              <MenuItem value="popular">Most Popular</MenuItem>
              <MenuItem value="relevant">Most Relevant</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Category Tabs */}
          {widgetSettings.categories.length > 1 && (
            <Tabs
              value={activeCategory || 'all'}
              onChange={(e, value) => handleCategoryChange(value === 'all' ? null : value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="All" value="all" />
              {widgetSettings.categories.map(category => (
                <Tab 
                  key={category} 
                  label={NEWS_CATEGORIES[category as keyof typeof NEWS_CATEGORIES] || category} 
                  value={category} 
                />
              ))}
            </Tabs>
          )}
          
          {/* News Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {sortedNews.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No news articles found
                </Typography>
              </Box>
            ) : widgetSettings.displayMode === 'list' ? (
              <List disablePadding>
                {sortedNews.map((article, index) => (
                  <React.Fragment key={article.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: theme.palette.action.hover }
                      }}
                    >
                      {widgetSettings.showImages && article.imageUrl && (
                        <ListItemAvatar>
                          <Avatar 
                            variant="rounded" 
                            src={article.imageUrl}
                            alt={article.title}
                          >
                            <ArticleIcon />
                          </Avatar>
                        </ListItemAvatar>
                      )}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: article.isRead ? 'normal' : 'bold',
                                color: article.isRead ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {article.title}
                            </Typography>
                            <IconButton size="small" sx={{ ml: 1 }}>
                              {article.isBookmarked ? (
                                <BookmarkIcon fontSize="small" color="primary" />
                              ) : (
                                <BookmarkBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 0.5
                              }}
                            >
                              {article.summary}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.name || article.source}
                                size="small"
                                sx={{ 
                                  mr: 1,
                                  bgcolor: NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.color,
                                  color: theme.palette.getContrastText(
                                    NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.color || theme.palette.primary.main
                                  )
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatPublishedDate(article.publishedAt)}
                              </Typography>
                              <IconButton 
                                size="small" 
                                sx={{ ml: 'auto' }}
                                onClick={() => window.open(article.url, '_blank')}
                              >
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Grid container spacing={2}>
                {sortedNews.map(article => (
                  <Grid item xs={12} sm={6} key={article.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardActionArea 
                        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        {widgetSettings.showImages && article.imageUrl && (
                          <Box
                            sx={{
                              height: 140,
                              backgroundImage: `url(${article.imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              position: 'relative'
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                zIndex: 1
                              }}
                            >
                              <Chip
                                label={NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.name || article.source}
                                size="small"
                                sx={{ 
                                  bgcolor: NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.color,
                                  color: theme.palette.getContrastText(
                                    NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.color || theme.palette.primary.main
                                  )
                                }}
                              />
                            </Box>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 1
                              }}
                            >
                              {article.isBookmarked && (
                                <BookmarkIcon sx={{ color: theme.palette.primary.main }} />
                              )}
                            </Box>
                          </Box>
                        )}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="subtitle1"
                            component="h3"
                            gutterBottom
                            sx={{
                              fontWeight: article.isRead ? 'normal' : 'bold',
                              color: article.isRead ? 'text.secondary' : 'text.primary'
                            }}
                          >
                            {article.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1
                            }}
                          >
                            {article.summary}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            {!widgetSettings.showImages && (
                              <Chip
                                label={NEWS_SOURCES[article.source as keyof typeof NEWS_SOURCES]?.name || article.source}
                                size="small"
                              />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {formatPublishedDate(article.publishedAt)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default NewsWidget;