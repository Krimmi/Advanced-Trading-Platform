import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, Switch, TextField } from '@mui/material';
import * as d3 from 'd3';

interface Node {
  id: string;
  label: string;
  value: number;
  category?: string;
  color?: string;
  size?: number;
  tooltip?: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
  label?: string;
  color?: string;
  width?: number;
  tooltip?: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
  title?: string;
  colorScale?: string[];
  showLabels?: boolean;
  showLegend?: boolean;
  categories?: string[];
  onNodeClick?: (node: Node) => void;
  onLinkClick?: (link: Link) => void;
  isLoading?: boolean;
  minLinkStrength?: number;
  directed?: boolean;
  simulation?: {
    strength?: number;
    distance?: number;
    charge?: number;
  };
}

const NetworkGraphComponent: React.FC<NetworkGraphProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  title = 'Network Graph Visualization',
  colorScale = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  showLabels = true,
  showLegend = true,
  categories = [],
  onNodeClick,
  onLinkClick,
  isLoading = false,
  minLinkStrength = 0,
  directed = false,
  simulation = {
    strength: -100,
    distance: 100,
    charge: -300
  }
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [linkStrengthFilter, setLinkStrengthFilter] = useState<number>(minLinkStrength);
  const [nodeSearch, setNodeSearch] = useState<string>('');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [showArrows, setShowArrows] = useState<boolean>(directed);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
  const [hoveredElement, setHoveredElement] = useState<{ type: 'node' | 'link', data: Node | Link } | null>(null);
  
  // Create the network graph
  useEffect(() => {
    if (!svgRef.current || isLoading || nodes.length === 0) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Filter nodes based on selected category and search
    const filteredNodes = nodes.filter(node => {
      const categoryMatch = selectedCategory === 'all' || node.category === selectedCategory;
      const searchMatch = !nodeSearch || node.label.toLowerCase().includes(nodeSearch.toLowerCase()) || node.id.toLowerCase().includes(nodeSearch.toLowerCase());
      return categoryMatch && searchMatch;
    });
    
    // Get filtered node IDs
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links based on filtered nodes and link strength
    const filteredLinks = links.filter(link => {
      const nodesExist = filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
      const strengthMatch = Math.abs(link.value) >= linkStrengthFilter;
      return nodesExist && strengthMatch;
    });
    
    // Create color scale
    const uniqueCategories = Array.from(new Set(filteredNodes.map(d => d.category)));
    const colorScaleFunc = d3.scaleOrdinal<string>()
      .domain(uniqueCategories.map(String))
      .range(colorScale);
    
    // Create SVG
    const svg = d3.select(svgRef.current);
    
    // Create arrow marker for directed graphs
    if (showArrows) {
      svg.append('defs').selectAll('marker')
        .data(['arrow'])
        .enter().append('marker')
        .attr('id', d => d)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');
    }
    
    // Create container group with zoom capability
    const g = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Create force simulation
    const simulation = d3.forceSimulation<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link>()
      .force('link', d3.forceLink<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link>()
        .id((d: any) => d.id)
        .distance(simulation.distance || 100)
        .strength((d: any) => Math.abs(d.value) * 0.1))
      .force('charge', d3.forceManyBody().strength(simulation.charge || -300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));
    
    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke-width', d => d.width || Math.max(1, Math.abs(d.value) * 2))
      .attr('stroke', d => d.color || (d.value >= 0 ? '#1f77b4' : '#d62728'))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', showArrows ? 'url(#arrow)' : null)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', (d.width || Math.max(1, Math.abs(d.value) * 2)) * 1.5);
        setHoveredElement({ type: 'link', data: d });
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', d => d.width || Math.max(1, Math.abs(d.value) * 2));
        setHoveredElement(null);
      })
      .on('click', function(event, d) {
        if (onLinkClick) onLinkClick(d);
      });
    
    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredNodes)
      .enter().append('circle')
      .attr('r', d => d.size || Math.max(4, d.value || 4))
      .attr('fill', d => d.color || colorScaleFunc(d.category || ''))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', 2);
        setHoveredElement({ type: 'node', data: d });
        setHighlightedNode(d.id);
        
        // Highlight connected links and nodes
        link
          .attr('stroke-opacity', l => 
            l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
          )
          .attr('stroke-width', l => 
            l.source.id === d.id || l.target.id === d.id ? 
            (l.width || Math.max(1, Math.abs(l.value) * 2)) * 1.5 : 
            l.width || Math.max(1, Math.abs(l.value) * 2)
          );
        
        node
          .attr('opacity', n => 
            n.id === d.id || 
            filteredLinks.some(l => 
              (l.source.id === d.id && l.target.id === n.id) || 
              (l.target.id === d.id && l.source.id === n.id)
            ) ? 1 : 0.3
          );
        
        if (showLabels) {
          nodeLabels
            .attr('opacity', n => 
              n.id === d.id || 
              filteredLinks.some(l => 
                (l.source.id === d.id && l.target.id === n.id) || 
                (l.target.id === d.id && l.source.id === n.id)
              ) ? 1 : 0.3
            );
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);
        setHoveredElement(null);
        setHighlightedNode(null);
        
        // Reset highlights
        link
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', d => d.width || Math.max(1, Math.abs(d.value) * 2));
        
        node.attr('opacity', 1);
        
        if (showLabels) {
          nodeLabels.attr('opacity', 1);
        }
      })
      .on('click', function(event, d) {
        if (onNodeClick) onNodeClick(d);
      })
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d: any) => {
          if (!event.active && simulationRunning) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active && simulationRunning) simulation.alphaTarget(0);
          if (!simulationRunning) {
            d.fx = event.x;
            d.fy = event.y;
          } else {
            d.fx = null;
            d.fy = null;
          }
        })
      );
    
    // Add node labels if enabled
    let nodeLabels: d3.Selection<SVGTextElement, Node, SVGGElement, unknown>;
    if (showLabels) {
      nodeLabels = g.append('g')
        .attr('class', 'node-labels')
        .selectAll('text')
        .data(filteredNodes)
        .enter().append('text')
        .attr('dx', 12)
        .attr('dy', '.35em')
        .text(d => d.label)
        .style('font-size', '10px')
        .style('pointer-events', 'none');
    }
    
    // Add link labels if enabled and links have labels
    if (showLabels && filteredLinks.some(link => link.label)) {
      const linkLabels = g.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(filteredLinks.filter(link => link.label))
        .enter().append('text')
        .attr('dx', 5)
        .attr('dy', 0)
        .text(d => d.label || '')
        .style('font-size', '8px')
        .style('pointer-events', 'none')
        .style('fill', '#666');
    }
    
    // Update positions on simulation tick
    simulation.nodes(filteredNodes as (d3.SimulationNodeDatum & Node)[]).on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);
      
      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
      
      if (showLabels) {
        nodeLabels
          .attr('x', d => d.x!)
          .attr('y', d => d.y!);
      }
    });
    
    // Update links in simulation
    (simulation.force('link') as d3.ForceLink<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link>)
      .links(filteredLinks as (d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link)[]);
    
    // Stop simulation if not running
    if (!simulationRunning) {
      simulation.stop();
    }
    
    // Clean up on unmount
    return () => {
      simulation.stop();
    };
  }, [
    nodes, 
    links, 
    width, 
    height, 
    isLoading, 
    selectedCategory, 
    linkStrengthFilter, 
    nodeSearch, 
    showArrows, 
    simulationRunning
  ]);
  
  // Handle category change
  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCategory(event.target.value as string);
  };
  
  // Handle link strength filter change
  const handleLinkStrengthChange = (event: Event, newValue: number | number[]) => {
    setLinkStrengthFilter(newValue as number);
  };
  
  // Handle node search change
  const handleNodeSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNodeSearch(event.target.value);
  };
  
  // Handle arrow toggle
  const handleArrowToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowArrows(event.target.checked);
  };
  
  // Handle simulation toggle
  const handleSimulationToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationRunning(event.target.checked);
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
          <Box sx={{ display: 'flex', mb: 2, gap: 2, flexWrap: 'wrap' }}>
            {categories.length > 0 && (
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Category"
                  size="small"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Box sx={{ width: 200 }}>
              <Typography variant="body2" gutterBottom>Min Link Strength</Typography>
              <Slider
                value={linkStrengthFilter}
                onChange={handleLinkStrengthChange}
                min={0}
                max={1}
                step={0.05}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <TextField
              label="Search Nodes"
              variant="outlined"
              size="small"
              value={nodeSearch}
              onChange={handleNodeSearchChange}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showArrows}
                  onChange={handleArrowToggle}
                />
              }
              label="Show Arrows"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={simulationRunning}
                  onChange={handleSimulationToggle}
                />
              }
              label="Simulation"
            />
          </Box>
          
          <Box sx={{ position: 'relative', width, height }}>
            <svg ref={svgRef} width={width} height={height} />
            
            {hoveredElement && (
              <Box sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: 16, 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                p: 1,
                borderRadius: 1,
                boxShadow: 1
              }}>
                {hoveredElement.type === 'node' && (
                  <>
                    <Typography variant="body2" fontWeight="bold">
                      {(hoveredElement.data as Node).label}
                    </Typography>
                    <Typography variant="caption" display="block">
                      ID: {(hoveredElement.data as Node).id}
                    </Typography>
                    {(hoveredElement.data as Node).category && (
                      <Typography variant="caption" display="block">
                        Category: {(hoveredElement.data as Node).category}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block">
                      Value: {(hoveredElement.data as Node).value}
                    </Typography>
                    {(hoveredElement.data as Node).tooltip && (
                      <Typography variant="caption" display="block">
                        {(hoveredElement.data as Node).tooltip}
                      </Typography>
                    )}
                  </>
                )}
                
                {hoveredElement.type === 'link' && (
                  <>
                    <Typography variant="body2" fontWeight="bold">
                      Connection
                    </Typography>
                    <Typography variant="caption" display="block">
                      From: {(hoveredElement.data as Link).source.toString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      To: {(hoveredElement.data as Link).target.toString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Strength: {(hoveredElement.data as Link).value.toFixed(2)}
                    </Typography>
                    {(hoveredElement.data as Link).label && (
                      <Typography variant="caption" display="block">
                        Label: {(hoveredElement.data as Link).label}
                      </Typography>
                    )}
                    {(hoveredElement.data as Link).tooltip && (
                      <Typography variant="caption" display="block">
                        {(hoveredElement.data as Link).tooltip}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
          
          {showLegend && categories.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {categories.map((category, index) => (
                <Box key={category} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      backgroundColor: colorScale[index % colorScale.length],
                      borderRadius: '50%',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2">{category}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default NetworkGraphComponent;