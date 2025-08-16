import React, { useState } from 'react';
import { Box, Typography, useTheme, Tooltip as MuiTooltip } from '@mui/material';

export interface HeatmapCell {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
  tooltip?: string;
  color?: string;
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
  subtitle?: string;
  width?: number | string;
  height?: number | string;
  colorRange?: string[];
  minValue?: number;
  maxValue?: number;
  showLegend?: boolean;
  cellSize?: number | { width: number, height: number };
  cellPadding?: number;
  valueFormatter?: (value: number) => string;
  onCellClick?: (cell: HeatmapCell) => void;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  xLabels,
  yLabels,
  title,
  subtitle,
  width = '100%',
  height = 400,
  colorRange,
  minValue,
  maxValue,
  showLegend = true,
  cellSize = { width: 40, height: 40 },
  cellPadding = 2,
  valueFormatter = (value) => value.toFixed(2) + '%',
  onCellClick,
}) => {
  const theme = useTheme();
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Determine min and max values if not provided
  const calculatedMin = minValue !== undefined ? minValue : Math.min(...data.map(d => d.value));
  const calculatedMax = maxValue !== undefined ? maxValue : Math.max(...data.map(d => d.value));
  
  // Default color range if not provided
  const defaultColorRange = colorRange || [
    theme.palette.error.light,
    theme.palette.error.main,
    theme.palette.warning.light,
    theme.palette.warning.main,
    theme.palette.success.light,
    theme.palette.success.main,
  ];

  // Calculate color for a value
  const getColor = (value: number): string => {
    if (value === null || value === undefined) return theme.palette.grey[300];
    
    // If color is directly provided in the cell data
    const cell = data.find(d => d.value === value);
    if (cell && cell.color) return cell.color;
    
    // Calculate color based on the range
    const normalizedValue = (value - calculatedMin) / (calculatedMax - calculatedMin);
    const colorIndex = Math.min(
      Math.floor(normalizedValue * defaultColorRange.length),
      defaultColorRange.length - 1
    );
    
    return defaultColorRange[colorIndex];
  };

  // Handle cell hover
  const handleCellHover = (cell: HeatmapCell | null) => {
    setHoveredCell(cell);
  };

  // Handle cell click
  const handleCellClick = (cell: HeatmapCell) => {
    if (onCellClick) {
      onCellClick(cell);
    }
  };

  // Calculate cell dimensions
  const cellWidth = typeof cellSize === 'number' ? cellSize : cellSize.width;
  const cellHeight = typeof cellSize === 'number' ? cellSize : cellSize.height;
  
  // Calculate chart dimensions
  const chartWidth = xLabels.length * (cellWidth + cellPadding) + 100; // Extra space for y-axis labels
  const chartHeight = yLabels.length * (cellHeight + cellPadding) + 50; // Extra space for x-axis labels

  // Create legend gradient
  const legendGradient = defaultColorRange.map((color, index) => ({
    color,
    position: index / (defaultColorRange.length - 1) * 100
  }));

  return (
    <Box sx={{ width, height, overflow: 'auto' }}>
      {/* Chart Header */}
      <Box sx={{ mb: 2 }}>
        {title && (
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {/* Chart Container */}
      <Box sx={{ position: 'relative', width: chartWidth, height: chartHeight }}>
        {/* Y-axis Labels */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 100, height: '100%' }}>
          {yLabels.map((label, index) => (
            <Box
              key={`y-${label}`}
              sx={{
                position: 'absolute',
                top: index * (cellHeight + cellPadding) + cellHeight / 2,
                right: 10,
                transform: 'translateY(-50%)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 90,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* X-axis Labels */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 100, width: 'calc(100% - 100px)', height: 50 }}>
          {xLabels.map((label, index) => (
            <Box
              key={`x-${label}`}
              sx={{
                position: 'absolute',
                left: index * (cellWidth + cellPadding) + cellWidth / 2,
                bottom: 10,
                transform: 'translateX(-50%)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: cellWidth * 1.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Heatmap Cells */}
        <Box sx={{ position: 'absolute', top: 0, left: 100, width: 'calc(100% - 100px)', height: 'calc(100% - 50px)' }}>
          {data.map((cell, index) => {
            const xIndex = xLabels.indexOf(cell.x.toString());
            const yIndex = yLabels.indexOf(cell.y.toString());
            
            if (xIndex === -1 || yIndex === -1) return null;
            
            const cellColor = getColor(cell.value);
            const textColor = theme.palette.getContrastText(cellColor);
            
            return (
              <MuiTooltip
                key={`cell-${index}`}
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {cell.label || `${cell.y} - ${cell.x}`}
                    </Typography>
                    <Typography variant="body2">
                      Value: {valueFormatter(cell.value)}
                    </Typography>
                    {cell.tooltip && (
                      <Typography variant="body2">
                        {cell.tooltip}
                      </Typography>
                    )}
                  </Box>
                }
                arrow
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: xIndex * (cellWidth + cellPadding),
                    top: yIndex * (cellHeight + cellPadding),
                    width: cellWidth,
                    height: cellHeight,
                    backgroundColor: cellColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: onCellClick ? 'pointer' : 'default',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      zIndex: 1,
                    },
                  }}
                  onMouseEnter={() => handleCellHover(cell)}
                  onMouseLeave={() => handleCellHover(null)}
                  onClick={() => handleCellClick(cell)}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: textColor,
                      fontWeight: 'medium',
                      userSelect: 'none',
                    }}
                  >
                    {valueFormatter(cell.value)}
                  </Typography>
                </Box>
              </MuiTooltip>
            );
          })}
        </Box>
        
        {/* Legend */}
        {showLegend && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -40,
              left: 100,
              width: 'calc(100% - 100px)',
              height: 30,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: 10,
                background: `linear-gradient(to right, ${legendGradient.map(g => `${g.color} ${g.position}%`).join(', ')})`,
                borderRadius: 1,
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {valueFormatter(calculatedMin)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {valueFormatter(calculatedMax)}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HeatmapChart;