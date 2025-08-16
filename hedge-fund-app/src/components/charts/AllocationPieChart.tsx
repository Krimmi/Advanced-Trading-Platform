import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Sector
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

export interface AllocationData {
  name: string;
  value: number;
  color?: string;
}

interface AllocationPieChartProps {
  data: AllocationData[];
  title?: string;
  height?: number | string;
  width?: number | string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  showLegend?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  showActiveShape?: boolean;
  valueFormatter?: (value: number) => string;
  nameFormatter?: (name: string) => string;
  onClick?: (data: AllocationData) => void;
}

const AllocationPieChart: React.FC<AllocationPieChartProps> = ({
  data,
  title,
  height = 400,
  width = '100%',
  innerRadius = '50%',
  outerRadius = '80%',
  showLegend = true,
  showLabels = false,
  showTooltip = true,
  showActiveShape = true,
  valueFormatter = (value) => `${value.toFixed(2)}%`,
  nameFormatter = (name) => name,
  onClick,
}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Default colors if not provided in data
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.info.light,
    theme.palette.warning.light,
    theme.palette.error.light,
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="subtitle2">{nameFormatter(data.name)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {valueFormatter(data.value)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Active shape for hover effect
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      value
    } = props;

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={theme.palette.text.primary}>
          {nameFormatter(payload.name)}
        </text>
        <text x={cx} y={cy} dy={10} textAnchor="middle" fill={theme.palette.text.secondary}>
          {valueFormatter(value)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius * 1.05}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius * 1.07}
          outerRadius={outerRadius * 1.1}
          fill={fill}
        />
      </g>
    );
  };

  // Handle pie sector click
  const handleClick = (data: any, index: number) => {
    if (onClick) {
      onClick(data);
    }
  };

  // Handle pie sector hover
  const handleMouseEnter = (data: any, index: number) => {
    if (showActiveShape) {
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (showActiveShape) {
      setActiveIndex(null);
    }
  };

  return (
    <Box sx={{ width, height, position: 'relative' }}>
      {title && (
        <Typography
          variant="h6"
          component="h3"
          align="center"
          gutterBottom
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={showLabels}
            label={showLabels ? (entry) => nameFormatter(entry.name) : undefined}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={showActiveShape ? renderActiveShape : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
                stroke={theme.palette.background.paper}
                strokeWidth={1}
              />
            ))}
          </Pie>
          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span style={{ color: theme.palette.text.primary }}>
                  {nameFormatter(value)}
                </span>
              )}
            />
          )}
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AllocationPieChart;