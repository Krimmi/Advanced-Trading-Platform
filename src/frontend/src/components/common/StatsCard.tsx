import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Grid, 
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Types
interface StatItem {
  label: string;
  value: string | number | null;
  valueColor?: string;
  tooltip?: string;
}

interface StatsCardProps {
  title: string;
  subtitle?: string;
  stats: StatItem[];
  loading?: boolean;
  columns?: 1 | 2 | 3 | 4;
  minHeight?: number | string;
  elevation?: number;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: theme.transitions.create(['box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const StatValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'valueColor',
})<{ valueColor?: string }>(({ theme, valueColor }) => ({
  fontWeight: 600,
  color: valueColor || theme.palette.text.primary,
}));

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  subtitle,
  stats,
  loading = false,
  columns = 2,
  minHeight = 'auto',
  elevation = 0,
}) => {
  const theme = useTheme();
  
  return (
    <StyledCard variant={elevation ? 'elevation' : 'outlined'} elevation={elevation} sx={{ minHeight }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {subtitle}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          {stats.map((stat, index) => (
            <Grid item xs={12 / columns} key={index}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" component="div">
                  {stat.label}
                </Typography>
                
                {loading ? (
                  <Skeleton variant="text" width={80} height={24} />
                ) : (
                  <StatValue variant="body1" valueColor={stat.valueColor}>
                    {stat.value !== undefined && stat.value !== null ? stat.value : '—'}
                  </StatValue>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </StyledCard>
  );
};

export default StatsCard;