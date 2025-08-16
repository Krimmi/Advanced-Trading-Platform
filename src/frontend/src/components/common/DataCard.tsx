import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Tooltip, 
  IconButton, 
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Types
interface DataCardProps {
  title: string;
  value?: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  loading?: boolean;
  onClick?: () => void;
  minHeight?: number | string;
  children?: React.ReactNode;
}

// Styled components
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'clickable'
})<{ clickable?: boolean }>(({ theme, clickable }) => ({
  height: '100%',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
  ...(clickable && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
  }),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
}));

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  tooltip,
  trend,
  trendValue,
  loading = false,
  onClick,
  minHeight = 140,
  children,
}) => {
  const theme = useTheme();
  
  // Determine trend color
  const getTrendColor = () => {
    if (trend === 'up') return theme.palette.success.main;
    if (trend === 'down') return theme.palette.error.main;
    return theme.palette.text.secondary;
  };
  
  // Determine trend icon
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };
  
  return (
    <StyledCard 
      variant="outlined" 
      clickable={!!onClick}
      onClick={onClick}
      sx={{ minHeight }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <IconButton size="small" sx={{ ml: 1, mt: -0.5 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && (
            <IconWrapper sx={{ mr: 2 }}>
              {icon}
            </IconWrapper>
          )}
          
          <Box>
            {loading ? (
              <Skeleton variant="text" width={120} height={40} />
            ) : (
              <Typography variant="h4" component="div">
                {value !== undefined && value !== null ? value : '—'}
              </Typography>
            )}
            
            {(trend || trendValue) && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getTrendColor(),
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {getTrendIcon()} {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {children && (
          <>
            <Divider sx={{ my: 2 }} />
            {children}
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default DataCard;