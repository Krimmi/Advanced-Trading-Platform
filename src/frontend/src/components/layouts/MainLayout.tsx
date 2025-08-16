import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Folder as FolderIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  AccountCircle,
  Close as CloseIcon,
} from '@mui/icons-material';

// Import from Redux store
import { RootState } from '../../store';
import { toggleTheme } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications } from '../../store/slices/alertsSlice';

// Constants
const DRAWER_WIDTH = 260;

// Styled components
const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  paddingRight: 24,
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: DRAWER_WIDTH,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// Navigation items
const mainNavItems = [
  { name: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { name: 'Market Overview', icon: <TrendingUpIcon />, path: '/market' },
  { name: 'Stock Screener', icon: <FilterListIcon />, path: '/screener' },
  { name: 'Portfolio', icon: <FolderIcon />, path: '/portfolio' },
  { name: 'Watchlists', icon: <VisibilityIcon />, path: '/watchlist' },
  { name: 'Alerts', icon: <NotificationsIcon />, path: '/alerts' },
  { name: 'ML Predictions', icon: <PsychologyIcon />, path: '/ml-predictions' },
];

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [open, setOpen] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme: themeMode } = useSelector((state: RootState) => state.ui);
  const { notifications } = useSelector((state: RootState) => state.alerts);
  
  // Derived state
  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationAnchorEl);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  // Effects
  useEffect(() => {
    // Close drawer on mobile when route changes
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  useEffect(() => {
    // Fetch notifications on mount
    dispatch(fetchNotifications() as any);
    
    // Set up interval to fetch notifications
    const interval = setInterval(() => {
      dispatch(fetchNotifications() as any);
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
  // Handlers
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationAnchorEl(null);
  };
  
  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stock/${searchQuery.trim().toUpperCase()}`);
      setSearchQuery('');
    }
  };
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };
  
  // Render profile menu
  const renderProfileMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <CloseIcon fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );
  
  // Render notifications menu
  const renderNotificationsMenu = (
    <Menu
      anchorEl={notificationAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isNotificationsOpen}
      onClose={handleNotificationsClose}
      PaperProps={{
        style: {
          maxHeight: 400,
          width: 360,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Notifications</Typography>
        <Typography variant="body2" color="text.secondary">
          {unreadNotificationsCount} unread
        </Typography>
      </Box>
      <Divider />
      {notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No notifications
          </Typography>
        </Box>
      ) : (
        notifications.slice(0, 5).map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={() => handleNotificationsClose()}
            sx={{
              backgroundColor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: notification.read ? undefined : alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="body1" noWrap>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(notification.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </MenuItem>
        ))
      )}
      <Divider />
      <Box sx={{ p: 1 }}>
        <MenuItem onClick={() => { handleNotificationsClose(); navigate('/alerts'); }}>
          <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
            View all notifications
          </Typography>
        </MenuItem>
      </Box>
    </Menu>
  );
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <StyledAppBar position="fixed" open={open}>
        <StyledToolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ display: { xs: 'none', sm: 'block' }, flexGrow: 1 }}
          >
            Ultimate Hedge Fund App
          </Typography>
          
          {/* Search */}
          <form onSubmit={handleSearch}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search stock…"
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Search>
          </form>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Theme toggle */}
          <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={handleThemeToggle}>
              {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={unreadNotificationsCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Profile */}
          <Tooltip title="Account">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                alt={user?.firstName || 'User'}
              >
                {user?.firstName?.[0] || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </StyledToolbar>
      </StyledAppBar>
      
      {/* Drawer */}
      <StyledDrawer variant="permanent" open={open}>
        <StyledToolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </StyledToolbar>
        <Divider />
        <List component="nav">
          {mainNavItems.map((item) => (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.name} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => handleNavigation('/settings')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </StyledDrawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StyledToolbar />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
      
      {/* Menus */}
      {renderProfileMenu}
      {renderNotificationsMenu}
    </Box>
  );
};

export default MainLayout;