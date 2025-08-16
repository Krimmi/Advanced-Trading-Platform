import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Chip, 
  Divider, 
  Rating, 
  Grid, 
  IconButton, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as AddIcon, 
  Check as CheckIcon, 
  Star as StarIcon, 
  Download as DownloadIcon, 
  Info as InfoIcon, 
  Code as CodeIcon, 
  Description as DescriptionIcon, 
  Image as ImageIcon, 
  Update as UpdateIcon, 
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  OpenInNew as OpenInNewIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

import { WidgetMetadata } from '../../services/marketplace/MarketplaceService';

interface WidgetDetailPanelProps {
  widget: WidgetMetadata;
  open: boolean;
  onClose: () => void;
  isInstalled: boolean;
  isFavorite: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onToggleFavorite: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`widget-detail-tabpanel-${index}`}
      aria-labelledby={`widget-detail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WidgetDetailPanel: React.FC<WidgetDetailPanelProps> = ({ 
  widget, 
  open, 
  onClose, 
  isInstalled, 
  isFavorite, 
  onInstall, 
  onUninstall, 
  onToggleFavorite 
}) => {
  const theme = useTheme();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="widget-detail-dialog-title"
      scroll="paper"
    >
      <DialogTitle id="widget-detail-dialog-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            {widget.name}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} md={8}>
            {/* Screenshot */}
            <Box 
              sx={{ 
                position: 'relative',
                mb: 2,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: theme.shadows[2]
              }}
            >
              <Box
                component="img"
                src={widget.screenshots[currentImageIndex]}
                alt={`${widget.name} screenshot`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
              
              {/* Screenshot navigation */}
              {widget.screenshots.length > 1 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 1,
                  gap: 1
                }}>
                  {widget.screenshots.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: index === currentImageIndex ? theme.palette.primary.main : theme.palette.grey[300],
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="widget details tabs"
              >
                <Tab label="Overview" />
                <Tab label="Features" />
                <Tab label="Documentation" />
                <Tab label="Updates" />
              </Tabs>
            </Box>
            
            {/* Overview tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body1" paragraph>
                {widget.description}
              </Typography>
              
              <Typography variant="body1" paragraph>
                This {widget.category.toLowerCase()} widget provides essential functionality for traders and investors 
                looking to enhance their dashboard with {widget.name.toLowerCase()} capabilities. 
                It integrates seamlessly with the rest of your trading platform and can be customized to suit your specific needs.
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Key Benefits
              </Typography>
              
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Seamless integration with your dashboard" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Customizable settings to match your workflow" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Real-time data updates and notifications" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Responsive design that works on all screen sizes" />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {widget.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            </TabPanel>
            
            {/* Features tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Real-time Data Updates" 
                    secondary="Stay informed with the latest market information" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Customizable Display Options" 
                    secondary="Configure the widget to show exactly what you need" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Interactive Elements" 
                    secondary="Click and interact with data points for more information" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Responsive Design" 
                    secondary="Automatically adjusts to fit your dashboard layout" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Theme Support" 
                    secondary="Matches your platform's light or dark theme" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Data Export" 
                    secondary="Export data to CSV or Excel for further analysis" 
                  />
                </ListItem>
              </List>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Technical Specifications
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Supported Data Sources</Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding>
                      <ListItemText primary="• Market data providers" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="• Historical price databases" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="• News and social media feeds" />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Performance Impact</Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding>
                      <ListItemText primary="• Low memory footprint" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="• Optimized rendering" />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="• Efficient data caching" />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Documentation tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Documentation
              </Typography>
              
              <Typography variant="body1" paragraph>
                Comprehensive documentation is available to help you get the most out of this widget.
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="User Guide" 
                    secondary="Learn how to use all features of the widget" 
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    endIcon={<OpenInNewIcon />}
                    href={widget.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </Button>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="API Reference" 
                    secondary="Technical documentation for developers" 
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    endIcon={<OpenInNewIcon />}
                    href={`${widget.documentationUrl}/api`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </Button>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ImageIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Demo" 
                    secondary="See the widget in action" 
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    endIcon={<OpenInNewIcon />}
                    href={widget.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </Button>
                </ListItem>
              </List>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Installation
              </Typography>
              
              <Typography variant="body1" paragraph>
                This widget can be installed directly from the marketplace with a single click. 
                Once installed, it will be available in the widget selector when editing your dashboards.
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Configuration
              </Typography>
              
              <Typography variant="body1" paragraph>
                After adding the widget to your dashboard, you can configure it by:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Click the settings icon in the widget header" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Adjust parameters in the settings dialog" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Save changes to update the widget" />
                </ListItem>
              </List>
            </TabPanel>
            
            {/* Updates tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Version History
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <UpdateIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Version ${widget.version} (Current)`} 
                    secondary={`Released on ${formatDate(widget.lastUpdated)}`} 
                  />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText 
                    secondary={
                      <>
                        • Added new customization options<br />
                        • Improved performance for large datasets<br />
                        • Fixed display issues in dark mode<br />
                        • Enhanced accessibility features
                      </>
                    } 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <UpdateIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Version 0.9.0" 
                    secondary="Released on May 15, 2025" 
                  />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText 
                    secondary={
                      <>
                        • Initial marketplace release<br />
                        • Core functionality implemented<br />
                        • Basic customization options
                      </>
                    } 
                  />
                </ListItem>
              </List>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Upcoming Features
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Advanced filtering options" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Additional visualization types" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText primary="Integration with machine learning models" />
                </ListItem>
              </List>
            </TabPanel>
          </Grid>
          
          {/* Right column */}
          <Grid item xs={12} md={4}>
            {/* Action buttons */}
            <Box sx={{ mb: 3 }}>
              {isInstalled ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth
                    startIcon={<CloseIcon />}
                    onClick={onUninstall}
                  >
                    Uninstall
                  </Button>
                  <Button 
                    variant="outlined" 
                    color={isFavorite ? 'primary' : 'inherit'}
                    fullWidth
                    startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    onClick={onToggleFavorite}
                  >
                    {isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </Button>
                </Box>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  size="large"
                  startIcon={widget.isPremium ? <DownloadIcon /> : <AddIcon />}
                  onClick={onInstall}
                >
                  {widget.isPremium ? `Buy for $${widget.price}` : 'Install Free'}
                </Button>
              )}
            </Box>
            
            {/* Widget info */}
            <Box 
              sx={{ 
                p: 2, 
                mb: 3, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: theme.palette.background.default
              }}
            >
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Author" 
                    secondary={widget.author} 
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CategoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Category" 
                    secondary={widget.category} 
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CalendarTodayIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Released" 
                    secondary={formatDate(widget.releaseDate)} 
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <UpdateIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={formatDate(widget.lastUpdated)} 
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Downloads" 
                    secondary={formatNumber(widget.downloadCount)} 
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <StarIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Rating" 
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={widget.rating} precision={0.5} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({widget.ratingCount})
                        </Typography>
                      </Box>
                    } 
                  />
                </ListItem>
              </List>
            </Box>
            
            {/* Related widgets */}
            <Typography variant="subtitle1" gutterBottom>
              Related Widgets
            </Typography>
            
            <List disablePadding>
              <ListItem 
                sx={{ 
                  mb: 1, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1
                }}
              >
                <ListItemText 
                  primary="Portfolio Allocation Widget" 
                  secondary="Visualize your asset allocation" 
                />
              </ListItem>
              <ListItem 
                sx={{ 
                  mb: 1, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1
                }}
              >
                <ListItemText 
                  primary="Performance Analytics Widget" 
                  secondary="Track your portfolio performance" 
                />
              </ListItem>
              <ListItem 
                sx={{ 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1
                }}
              >
                <ListItemText 
                  primary="Risk Metrics Widget" 
                  secondary="Monitor key risk indicators" 
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {widget.demoUrl && (
          <Button 
            color="primary" 
            endIcon={<OpenInNewIcon />}
            href={widget.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Demo
          </Button>
        )}
        {!isInstalled && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={widget.isPremium ? <DownloadIcon /> : <AddIcon />}
            onClick={onInstall}
          >
            {widget.isPremium ? 'Buy' : 'Install'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WidgetDetailPanel;