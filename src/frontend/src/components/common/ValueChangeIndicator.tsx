import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon 
} from '@mui/icons-material';

interface ValueChangeIndicatorProps {
  value: number;
  percentage?: boolean;
  showIcon?: boolean;
  showValue?: boolean;
  iconOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  precision?: number;
  neutralThreshold?: number;
  tooltip?: string;
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
}

const ValueChangeIndicator: React.FC<ValueChangeIndicatorProps> = ({
  value,
  percentage = true,
  showIcon = true,
  showValue = true,
  iconOnly = false,
  size = 'medium',
  precision = 2,
  neutralThreshold = 0,
  tooltip,
  positiveColor,
  negativeColor,
  neutralColor,
}) => {
  const theme = useTheme();
  
  // Determine if the value is positive, negative, or neutral
  const isPositive = value > neutralThreshold;
  const isNegative = value < -neutralThreshold;
  const isNeutral = !isPositive && !isNegative;
  
  // Determine colors
  const colors = {
    positive: positiveColor || theme.palette.success.main,
    negative: negativeColor || theme.palette.error.main,
    neutral: neutralColor || theme.palette.text.secondary,
  };
  
  // Determine the color based on the value
  const color = isPositive ? colors.positive : (isNegative ? colors.negative : colors.neutral);
  
  // Format the value
  const formattedValue = `${isPositive ? '+' : ''}${value.toFixed(precision)}${percentage ? '%' : ''}`;
  
  // Determine icon size
  const iconSize = size === 'small' ? 'small' : (size === 'large' ? 'large' : 'medium');
  
  // Determine text variant
  const textVariant = size === 'small' ? 'caption' : (size === 'large' ? 'body1' : 'body2');
  
  // Render the appropriate icon
  const renderIcon = () => {
    if (!showIcon) return null;
    
    if (isPositive) {
      return <TrendingUpIcon fontSize={iconSize} sx={{ color }} />;
    } else if (isNegative) {
      return <TrendingDownIcon fontSize={iconSize} sx={{ color }} />;
    } else {
      return <TrendingFlatIcon fontSize={iconSize} sx={{ color }} />;
    }
  };
  
  const content = (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5,
        color,
      }}
    >
      {renderIcon()}
      {showValue && !iconOnly && (
        <Typography variant={textVariant} component="span" sx={{ fontWeight: 500, color }}>
          {formattedValue}
        </Typography>
      )}
    </Box>
  );
  
  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {content}
      </Tooltip>
    );
  }
  
  return content;
};

export default ValueChangeIndicator;