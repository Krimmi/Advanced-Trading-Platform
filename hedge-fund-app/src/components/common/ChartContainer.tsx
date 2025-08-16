import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  GetApp as DownloadIcon,
  Image as ImageIcon,
  TableChart as TableChartIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  onRefresh?: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
  onViewAsTable?: () => void;
  onSettings?: () => void;
  infoTooltip?: string;
  actions?: React.ReactNode;
  footerContent?: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  height = 400,
  loading = false,
  error = null,
  children,
  onRefresh,
  onDownload,
  onFullscreen,
  onViewAsTable,
  onSettings,
  infoTooltip,
  actions,
  footerContent
}) => {
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    handleMenuClose();
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            
            {infoTooltip && (
              <Tooltip title={infoTooltip} arrow>
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {actions}
          
          {onRefresh && (
            <Tooltip title="Refresh data">
              <IconButton size="small" onClick={onRefresh} sx={{ ml: 1 }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="More options">
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {onFullscreen && (
              <MenuItem onClick={() => handleAction(onFullscreen)}>
                <ListItemIcon>
                  <FullscreenIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Fullscreen</ListItemText>
              </MenuItem>
            )}
            
            {onDownload && (
              <MenuItem onClick={() => handleAction(onDownload)}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download CSV</ListItemText>
              </MenuItem>
            )}
            
            {onDownload && (
              <MenuItem onClick={() => handleAction(onDownload)}>
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download Image</ListItemText>
              </MenuItem>
            )}
            
            {onViewAsTable && (
              <MenuItem onClick={() => handleAction(onViewAsTable)}>
                <ListItemIcon>
                  <TableChartIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View as Table</ListItemText>
              </MenuItem>
            )}
            
            {onSettings && (
              <>
                <Divider />
                <MenuItem onClick={() => handleAction(onSettings)}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Chart Settings</ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Chart Content */}
      <Box
        sx={{
          flexGrow: 1,
          height: height,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading chart data...
            </Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
            }}
          >
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              height: '100%',
              width: '100%',
              '& .recharts-wrapper': {
                width: '100% !important',
                height: '100% !important',
              },
            }}
          >
            {children}
          </Box>
        )}
      </Box>

      {/* Footer */}
      {footerContent && (
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          {footerContent}
        </Box>
      )}
    </Paper>
  );
};

export default ChartContainer;