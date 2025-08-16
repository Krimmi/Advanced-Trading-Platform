import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, Switch, TextField } from '@mui/material';
import * as d3 from 'd3';

interface HeatmapCell {
  row: number;
  col: number;
  value: number;
  rowLabel: string;
  colLabel: string;
}

interface HeatmapVisualizationProps {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  width?: number;
  height?: number;
  title?: string;
  colorScale?: [string, string, string];
  showLabels?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  isLoading?: boolean;
  minValue?: number;
  maxValue?: number;
  onCellClick?: (row: number, col: number, value: number) => void;
  cellTooltip?: (row: number, col: number, value: number) => string;
  rowCategories?: { [key: string]: string };
  colCategories?: { [key: string]: string };
  categoryColors?: { [key: string]: string };
}

const HeatmapVisualizationComponent: React.FC<HeatmapVisualizationProps> = ({
  data,
  rowLabels,
  colLabels,
  width = 800,
  height = 600,
  title = 'Heatmap Visualization',
  colorScale = ['#4575b4', '#ffffbf', '#d73027'], // Blue to yellow to red
  showLabels = true,
  showValues = true,
  showLegend = true,
  isLoading = false,
  minValue,
  maxValue,
  onCellClick,
  cellTooltip,
  rowCategories,
  colCategories,
  categoryColors
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [showDendrograms, setShowDendrograms] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'original' | 'hierarchical' | 'value'>('original');
  const [valueThreshold, setValueThreshold] = useState<[number, number]>([-1, 1]);
  
  // Process data into a flat array of cells for easier manipulation
  const flattenedData = React.useMemo(() => {
    const cells: HeatmapCell[] = [];
    data.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        cells.push({
          row: rowIndex,
          col: colIndex,
          value,
          rowLabel: rowLabels[rowIndex],
          colLabel: colLabels[colIndex]
        });
      });
    });
    return cells;
  }, [data, rowLabels, colLabels]);
  
  // Determine value range
  const dataMinValue = React.useMemo(() => minValue !== undefined ? minValue : d3.min(flattenedData, d => d.value) || -1, [flattenedData, minValue]);
  const dataMaxValue = React.useMemo(() => maxValue !== undefined ? maxValue : d3.max(flattenedData, d => d.value) || 1, [flattenedData, maxValue]);
  
  // Create the heatmap visualization
  useEffect(() => {
    if (!svgRef.current || isLoading || data.length === 0) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up margins and dimensions
    const margin = { top: 50, right: 50, bottom: 100, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Determine cell size
    const cellWidth = innerWidth / colLabels.length;
    const cellHeight = innerHeight / rowLabels.length;
    
    // Create SVG
    const svg = d3.select(svgRef.current);
    
    // Create container group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create color scale
    const colorScaleFunc = d3.scaleLinear<string>()
      .domain([dataMinValue, 0, dataMaxValue])
      .range(colorScale as any)
      .clamp(true);
    
    // Create row and column scales
    const rowScale = d3.scaleBand()
      .domain(rowLabels)
      .range([0, innerHeight])
      .padding(0.05);
    
    const colScale = d3.scaleBand()
      .domain(colLabels)
      .range([0, innerWidth])
      .padding(0.05);
    
    // Add row labels if enabled
    if (showLabels) {
      const rowLabelsGroup = g.append('g')
        .attr('class', 'row-labels');
      
      rowLabelsGroup.selectAll('.row-label')
        .data(rowLabels)
        .enter()
        .append('text')
        .attr('class', 'row-label')
        .attr('x', -5)
        .attr('y', (d, i) => rowScale(d)! + rowScale.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '10px')
        .text(d => d)
        .style('font-weight', d => {
          const isHighlighted = searchTerm && d.toLowerCase().includes(searchTerm.toLowerCase());
          return isHighlighted ? 'bold' : 'normal';
        })
        .style('fill', d => {
          const isHighlighted = searchTerm && d.toLowerCase().includes(searchTerm.toLowerCase());
          return isHighlighted ? '#d73027' : '#000';
        });
      
      // Add row category indicators if available
      if (rowCategories) {
        const uniqueCategories = new Set(Object.values(rowCategories));
        const categoryWidth = 10;
        
        rowLabelsGroup.selectAll('.row-category')
          .data(rowLabels)
          .enter()
          .append('rect')
          .attr('class', 'row-category')
          .attr('x', -margin.left + 10)
          .attr('y', d => rowScale(d)!)
          .attr('width', categoryWidth)
          .attr('height', rowScale.bandwidth())
          .attr('fill', d => {
            const category = rowCategories[d];
            return categoryColors && category ? categoryColors[category] : '#ccc';
          });
        
        // Add category legend
        if (uniqueCategories.size > 0) {
          const categoryLegend = svg.append('g')
            .attr('class', 'category-legend')
            .attr('transform', `translate(10, ${margin.top})`);
          
          Array.from(uniqueCategories).forEach((category, i) => {
            categoryLegend.append('rect')
              .attr('x', 0)
              .attr('y', i * 20)
              .attr('width', 10)
              .attr('height', 10)
              .attr('fill', categoryColors && categoryColors[category] || '#ccc');
            
            categoryLegend.append('text')
              .attr('x', 15)
              .attr('y', i * 20 + 9)
              .attr('font-size', '10px')
              .text(category);
          });
        }
      }
    }
    
    // Add column labels if enabled
    if (showLabels) {
      const colLabelsGroup = g.append('g')
        .attr('class', 'col-labels');
      
      colLabelsGroup.selectAll('.col-label')
        .data(colLabels)
        .enter()
        .append('text')
        .attr('class', 'col-label')
        .attr('x', (d, i) => colScale(d)! + colScale.bandwidth() / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'bottom')
        .attr('font-size', '10px')
        .attr('transform', (d, i) => `rotate(-45, ${colScale(d)! + colScale.bandwidth() / 2}, -5)`)
        .text(d => d)
        .style('font-weight', d => {
          const isHighlighted = searchTerm && d.toLowerCase().includes(searchTerm.toLowerCase());
          return isHighlighted ? 'bold' : 'normal';
        })
        .style('fill', d => {
          const isHighlighted = searchTerm && d.toLowerCase().includes(searchTerm.toLowerCase());
          return isHighlighted ? '#d73027' : '#000';
        });
      
      // Add column category indicators if available
      if (colCategories) {
        const categoryHeight = 10;
        
        colLabelsGroup.selectAll('.col-category')
          .data(colLabels)
          .enter()
          .append('rect')
          .attr('class', 'col-category')
          .attr('x', d => colScale(d)!)
          .attr('y', -margin.top + 10)
          .attr('width', colScale.bandwidth())
          .attr('height', categoryHeight)
          .attr('fill', d => {
            const category = colCategories[d];
            return categoryColors && category ? categoryColors[category] : '#ccc';
          });
      }
    }
    
    // Add heatmap cells
    const cells = g.append('g')
      .attr('class', 'cells')
      .selectAll('.cell')
      .data(flattenedData)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => colScale(d.colLabel)!)
      .attr('y', d => rowScale(d.rowLabel)!)
      .attr('width', colScale.bandwidth())
      .attr('height', rowScale.bandwidth())
      .attr('fill', d => {
        // Apply value threshold filter
        if (d.value < valueThreshold[0] || d.value > valueThreshold[1]) {
          return colorScaleFunc(d.value);
        }
        return '#f5f5f5'; // Light gray for values within threshold
      })
      .attr('stroke', d => {
        const cellKey = `${d.rowLabel}-${d.colLabel}`;
        return highlightedCells.has(cellKey) ? '#000' : 'none';
      })
      .attr('stroke-width', d => {
        const cellKey = `${d.rowLabel}-${d.colLabel}`;
        return highlightedCells.has(cellKey) ? 2 : 0;
      })
      .attr('opacity', d => {
        // Apply search filter
        if (searchTerm) {
          const rowMatch = d.rowLabel.toLowerCase().includes(searchTerm.toLowerCase());
          const colMatch = d.colLabel.toLowerCase().includes(searchTerm.toLowerCase());
          return rowMatch || colMatch ? 1 : 0.3;
        }
        return 1;
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', 2);
        
        setHoveredCell(d);
      })
      .on('mouseout', function() {
        const d = d3.select(this).datum() as HeatmapCell;
        const cellKey = `${d.rowLabel}-${d.colLabel}`;
        
        d3.select(this)
          .attr('stroke', highlightedCells.has(cellKey) ? '#000' : 'none')
          .attr('stroke-width', highlightedCells.has(cellKey) ? 2 : 0);
        
        setHoveredCell(null);
      })
      .on('click', function(event, d) {
        if (onCellClick) {
          onCellClick(d.row, d.col, d.value);
        }
        
        // Toggle cell highlight
        const cellKey = `${d.rowLabel}-${d.colLabel}`;
        const newHighlightedCells = new Set(highlightedCells);
        
        if (newHighlightedCells.has(cellKey)) {
          newHighlightedCells.delete(cellKey);
        } else {
          newHighlightedCells.add(cellKey);
        }
        
        setHighlightedCells(newHighlightedCells);
      });
    
    // Add cell values if enabled
    if (showValues) {
      g.append('g')
        .attr('class', 'cell-values')
        .selectAll('.cell-value')
        .data(flattenedData)
        .enter()
        .append('text')
        .attr('class', 'cell-value')
        .attr('x', d => colScale(d.colLabel)! + colScale.bandwidth() / 2)
        .attr('y', d => rowScale(d.rowLabel)! + rowScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('fill', d => {
          // Use white text for dark backgrounds, black text for light backgrounds
          const color = d3.color(colorScaleFunc(d.value));
          if (!color) return '#000';
          
          // Calculate perceived brightness
          const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
          return brightness > 125 ? '#000' : '#fff';
        })
        .text(d => d.value.toFixed(2))
        .style('display', d => {
          // Hide text for values within threshold
          if (d.value >= valueThreshold[0] && d.value <= valueThreshold[1]) {
            return 'none';
          }
          return null;
        });
    }
    
    // Add color legend if enabled
    if (showLegend) {
      const legendWidth = 200;
      const legendHeight = 20;
      const legendX = (width - legendWidth) / 2;
      const legendY = height - 30;
      
      const legendScale = d3.scaleLinear()
        .domain([dataMinValue, 0, dataMaxValue])
        .range([0, legendWidth / 2, legendWidth]);
      
      const legendAxis = d3.axisBottom(legendScale)
        .tickSize(6)
        .tickValues([dataMinValue, 0, dataMaxValue])
        .tickFormat(d3.format('.2f'));
      
      const defs = svg.append('defs');
      
      const gradient = defs.append('linearGradient')
        .attr('id', 'heatmap-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale[0]);
      
      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', colorScale[1]);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale[2]);
      
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`);
      
      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#heatmap-gradient)');
      
      legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .call(legendAxis);
      
      legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', legendHeight + 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('Correlation Value');
    }
    
  }, [
    data,
    rowLabels,
    colLabels,
    width,
    height,
    isLoading,
    colorScale,
    showLabels,
    showValues,
    showLegend,
    dataMinValue,
    dataMaxValue,
    searchTerm,
    highlightedCells,
    valueThreshold,
    rowCategories,
    colCategories,
    categoryColors
  ]);
  
  // Handle search term change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle dendrogram toggle
  const handleDendrogramToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowDendrograms(event.target.checked);
  };
  
  // Handle sort method change
  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortBy(event.target.value as 'original' | 'hierarchical' | 'value');
  };
  
  // Handle value threshold change
  const handleValueThresholdChange = (event: Event, newValue: number | number[]) => {
    setValueThreshold(newValue as [number, number]);
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', mb: 2, gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Search Labels"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                label="Sort By"
                size="small"
              >
                <MenuItem value="original">Original Order</MenuItem>
                <MenuItem value="hierarchical">Hierarchical Clustering</MenuItem>
                <MenuItem value="value">Value</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showDendrograms}
                  onChange={handleDendrogramToggle}
                />
              }
              label="Show Dendrograms"
            />
            
            <Box sx={{ width: 200 }}>
              <Typography variant="body2" gutterBottom>Value Threshold</Typography>
              <Slider
                value={valueThreshold}
                onChange={handleValueThresholdChange}
                min={dataMinValue}
                max={dataMaxValue}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={x => x.toFixed(2)}
              />
            </Box>
          </Box>
          
          <Box sx={{ position: 'relative', width, height }}>
            <svg ref={svgRef} width={width} height={height} />
            
            {hoveredCell && (
              <Box sx={{ 
                position: 'absolute', 
                top: 10, 
                right: 10, 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                p: 1,
                borderRadius: 1,
                boxShadow: 1
              }}>
                <Typography variant="body2" fontWeight="bold">
                  {hoveredCell.rowLabel} × {hoveredCell.colLabel}
                </Typography>
                <Typography variant="body1">
                  Value: {hoveredCell.value.toFixed(4)}
                </Typography>
                {cellTooltip && (
                  <Typography variant="caption" display="block">
                    {cellTooltip(hoveredCell.row, hoveredCell.col, hoveredCell.value)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Click on cells to highlight them. Use the search box to filter by label.
              {valueThreshold[0] !== dataMinValue || valueThreshold[1] !== dataMaxValue ? 
                ` Values between ${valueThreshold[0].toFixed(2)} and ${valueThreshold[1].toFixed(2)} are filtered out.` : ''}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default HeatmapVisualizationComponent;