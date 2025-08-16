/**
 * Widget Detail Panel
 * 
 * This component displays detailed information about a widget,
 * including description, screenshots, ratings, and installation options.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Rating,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import UpdateIcon from '@mui/icons-material/Update';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletIcon from '@mui/icons-material/Tablet';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LanguageIcon from '@mui/icons-material/Language';
import HelpIcon from '@mui/icons-material/Help';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';

import { WidgetMetadata, WidgetReview } from '../models/WidgetMetadata';
import MarketplaceService from '../services/MarketplaceService';

// Material UI icons mapping
const iconMapping: Record<string, React.ElementType> = {
  TrendingUp: require('@mui/icons-material/TrendingUp').default,
  AccountBalanceWallet: require('@mui/icons-material/AccountBalanceWallet').default,
  ListAlt: require('@mui/icons-material/ListAlt').default,
  Article: require('@mui/icons-material/Article').default,
  CalendarToday: require('@mui/icons-material/CalendarToday').default,
  ShowChart: require('@mui/icons-material/ShowChart').default,
  CurrencyBitcoin: require('@mui/icons-material/CurrencyBitcoin').default,
  CallSplit: require('@mui/icons-material/CallSplit').default
};

interface WidgetDetailPanelProps {
  widget: WidgetMetadata;
  onBack: () => void;
  onInstall: (widgetId: string) => void;
  isInstalling: boolean;
  isInstalled: boolean;
  dashboardId?: string;
}

const WidgetDetailPanel: React.FC<WidgetDetailPanelProps> = ({
  widget,
  onBack,
  onInstall,
  isInstalling,
  isInstalled,
  dashboardId
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedScreenshot, setSelectedScreenshot] = useState<number>(0);
  const marketplaceService = MarketplaceService.getInstance();
  
  // Get icon component
  const IconComponent = iconMapping[widget.icon] || iconMapping.TrendingUp;
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  // Handle install
  const handleInstall = () => {
    onInstall(widget.id);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Render rating distribution
  const renderRatingDistribution = () => {
    if (!widget.rating) return null;
    
    const { distribution, totalRatings } = widget.rating;
    
    return (
      <Box sx={{ mt: 2 }}>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = distribution[rating as keyof typeof distribution] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ minWidth: 15 }}>
                {rating}
              </Typography>
              <StarIcon sx={{ fontSize: 16, mx: 0.5, color: theme.palette.warning.main }} />
              <Box
                sx={{
                  flexGrow: 1,
                  height: 8,
                  bgcolor: alpha(theme.palette.warning.main, 0.2),
                  borderRadius: 1,
                  mr: 1,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${percentage}%`,
                    bgcolor: theme.palette.warning.main,
                    borderRadius: 1
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ minWidth: 30 }}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };
  
  // Render reviews
  const renderReviews = () => {
    if (!widget.reviews || widget.reviews.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No reviews yet
          </Typography>
        </Box>
      );
    }
    
    return (
      <List disablePadding>
        {widget.reviews.map((review, index) => (
          <React.Fragment key={review.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem alignItems="flex-start" sx={{ py: 2 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ mr: 2 }}>{review.userName.charAt(0)}</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">
                      {review.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(review.date)}
                    </Typography>
                  </Box>
                  <Rating value={review.rating} size="small" readOnly />
                </Box>
                
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {review.comment}
                </Typography>
                
                {review.reply && (
                  <Box
                    sx={{
                      mt: 2,
                      ml: 4,
                      p: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2">
                      {review.reply.authorName} (Developer)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      {formatDate(review.reply.date)}
                    </Typography>
                    <Typography variant="body2">
                      {review.reply.comment}
                    </Typography>
                  </Box>
                )}
              </Box>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: theme.palette.background.paper, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {widget.name}
          </Typography>
          {widget.verified && (
            <Tooltip title="Verified Widget">
              <VerifiedIcon color="primary" sx={{ ml: 1 }} />
            </Tooltip>
          )}
          {widget.official && (
            <Chip
              label="Official"
              color="primary"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
          {widget.featured && (
            <Chip
              label="Featured"
              color="secondary"
              size="small"
              icon={<FavoriteIcon />}
              sx={{ ml: 1 }}
            />
          )}
          {new Date(widget.created) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
            <Chip
              label="New"
              color="info"
              size="small"
              icon={<NewReleasesIcon />}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            By {widget.author.name}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Version {widget.version}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Updated {formatDate(widget.updated)}
          </Typography>
        </Box>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Screenshots" value="screenshots" />
          <Tab label="Reviews" value="reviews" />
          <Tab label="Details" value="details" />
        </Tabs>
      </Box>
      
      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {widget.longDescription || widget.description}
              </Typography>
              
              {widget.screenshots.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Screenshots
                  </Typography>
                  <Box
                    component="img"
                    src={widget.screenshots[0].url}
                    alt={widget.screenshots[0].caption}
                    sx={{
                      width: '100%',
                      height: 300,
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {widget.screenshots[0].caption}
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <IconComponent sx={{ fontSize: 64, color: theme.palette.primary.main }} />
                </Box>
                
                <Button
                  fullWidth
                  variant={isInstalled ? "outlined" : "contained"}
                  color={isInstalled ? "success" : "primary"}
                  size="large"
                  startIcon={isInstalled ? <CheckIcon /> : <AddIcon />}
                  onClick={handleInstall}
                  disabled={isInstalling}
                  sx={{ mb: 2 }}
                >
                  {isInstalling ? (
                    <CircularProgress size={24} />
                  ) : isInstalled ? (
                    dashboardId ? "Add to Dashboard" : "Installed"
                  ) : (
                    "Install"
                  )}
                </Button>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DownloadIcon sx={{ mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2">
                    {widget.installCount.toLocaleString()} installations
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <UpdateIcon sx={{ mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2">
                    Updated {formatDate(widget.updated)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1, display: 'flex' }}>
                    {widget.compatibility.desktop && (
                      <Tooltip title="Desktop Compatible">
                        <DesktopWindowsIcon sx={{ opacity: 0.7, mr: 0.5 }} />
                      </Tooltip>
                    )}
                    {widget.compatibility.tablet && (
                      <Tooltip title="Tablet Compatible">
                        <TabletIcon sx={{ opacity: 0.7, mr: 0.5 }} />
                      </Tooltip>
                    )}
                    {widget.compatibility.mobile && (
                      <Tooltip title="Mobile Compatible">
                        <PhoneAndroidIcon sx={{ opacity: 0.7 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2">
                    Compatible with {[
                      widget.compatibility.desktop && 'Desktop',
                      widget.compatibility.tablet && 'Tablet',
                      widget.compatibility.mobile && 'Mobile'
                    ].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Category
                </Typography>
                <Chip
                  label={widget.category.charAt(0).toUpperCase() + widget.category.slice(1)}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {widget.tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                {widget.links && Object.values(widget.links).some(link => !!link) && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Links
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {widget.links.website && (
                        <Tooltip title="Website">
                          <IconButton
                            size="small"
                            component="a"
                            href={widget.links.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LanguageIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {widget.links.support && (
                        <Tooltip title="Support">
                          <IconButton
                            size="small"
                            component="a"
                            href={widget.links.support}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <HelpIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {widget.links.github && (
                        <Tooltip title="GitHub">
                          <IconButton
                            size="small"
                            component="a"
                            href={widget.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <GitHubIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {widget.links.twitter && (
                        <Tooltip title="Twitter">
                          <IconButton
                            size="small"
                            component="a"
                            href={widget.links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <TwitterIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </>
                )}
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Ratings
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                      {widget.rating?.averageScore.toFixed(1) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /5
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating
                    value={widget.rating?.averageScore || 0}
                    precision={0.5}
                    readOnly
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({widget.rating?.totalRatings || 0} ratings)
                  </Typography>
                </Box>
                
                {renderRatingDistribution()}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Screenshots Tab */}
        {activeTab === 'screenshots' && (
          <Box>
            {widget.screenshots.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No screenshots available
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  component="img"
                  src={widget.screenshots[selectedScreenshot].url}
                  alt={widget.screenshots[selectedScreenshot].caption}
                  sx={{
                    width: '100%',
                    maxHeight: 500,
                    objectFit: 'contain',
                    borderRadius: 1,
                    mb: 2
                  }}
                />
                
                <Typography variant="body1" align="center" gutterBottom>
                  {widget.screenshots[selectedScreenshot].caption}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3, justifyContent: 'center' }}>
                  {widget.screenshots.map((screenshot, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={screenshot.thumbnailUrl || screenshot.url}
                      alt={screenshot.caption}
                      onClick={() => setSelectedScreenshot(index)}
                      sx={{
                        width: 120,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: index === selectedScreenshot ? `2px solid ${theme.palette.primary.main}` : 'none',
                        opacity: index === selectedScreenshot ? 1 : 0.7,
                        transition: 'all 0.2s',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
        
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                User Reviews
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  value={widget.rating?.averageScore || 0}
                  precision={0.5}
                  readOnly
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({widget.rating?.totalRatings || 0})
                </Typography>
              </Box>
            </Box>
            
            {renderReviews()}
          </Box>
        )}
        
        {/* Details Tab */}
        {activeTab === 'details' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Widget Information
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Version"
                    secondary={widget.version}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <UpdateIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(widget.updated)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Settings"
                    secondary={
                      widget.settings?.hasGlobalSettings
                        ? 'Global and instance settings'
                        : widget.settings?.hasInstanceSettings
                        ? 'Instance settings only'
                        : 'No settings'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Permissions"
                    secondary={
                      widget.permissions && widget.permissions.length > 0
                        ? widget.permissions.join(', ')
                        : 'No special permissions required'
                    }
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Developer Information
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <Avatar>{widget.author.name.charAt(0)}</Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={widget.author.name}
                    secondary={widget.author.organization || 'Independent Developer'}
                  />
                </ListItem>
                {widget.author.website && (
                  <ListItem
                    button
                    component="a"
                    href={widget.author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ListItemIcon>
                      <LanguageIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Website"
                      secondary={widget.author.website}
                    />
                  </ListItem>
                )}
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Version History
              </Typography>
              <List disablePadding>
                {widget.versions.map((version, index) => (
                  <ListItem key={version.version}>
                    <ListItemText
                      primary={`Version ${version.version} (${formatDate(version.releaseDate)})`}
                      secondary={version.changelog}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        )}
      </Box>
      
      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper }}>
        <Button
          variant={isInstalled ? "outlined" : "contained"}
          color={isInstalled ? "success" : "primary"}
          size="large"
          startIcon={isInstalled ? <CheckIcon /> : <AddIcon />}
          onClick={handleInstall}
          disabled={isInstalling}
        >
          {isInstalling ? (
            <CircularProgress size={24} />
          ) : isInstalled ? (
            dashboardId ? "Add to Dashboard" : "Installed"
          ) : (
            "Install"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default WidgetDetailPanel;