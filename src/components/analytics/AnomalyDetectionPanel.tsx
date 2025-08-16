import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Import chart components (assuming we're using recharts)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from 'recharts';

// Import types
import { AnomalyData, Anomaly } from '../../types/analytics';

interface AnomalyDetectionPanelProps {
  data: AnomalyData;
}

const AnomalyDetectionPanel: React.FC<AnomalyDetectionPanelProps> = ({ data }) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedAnomalyId, setExpandedAnomalyId] = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  
  // Colors for severity levels
  const severityColors = {
    critical: theme.palette.error.main,
    high: theme.palette.error.light,
    medium: theme.palette.warning.main,
    low: theme.palette.warning.light,
    info: theme.palette.info.main
  };
  
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };
  
  const handleSeverityChange = (event: SelectChangeEvent) => {
    setSelectedSeverity(event.target.value);
  };
  
  const handleExpandAnomaly = (anomalyId: string) => {
    setExpandedAnomalyId(expandedAnomalyId === anomalyId ? null : anomalyId);
  };
  
  const handleSelectAnomaly = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
  };
  
  // Filter anomalies based on selected category and severity
  const filteredAnomalies = data.anomalies.filter(anomaly => {
    const categoryMatch = selectedCategory === 'all' || anomaly.category === selectedCategory;
    const severityMatch = selectedSeverity === 'all' || anomaly.severity === selectedSeverity;
    return categoryMatch && severityMatch;
  });
  
  // Get severity icon based on severity level
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ErrorIcon sx={{ color: severityColors[severity as keyof typeof severityColors] }} />;
      case 'medium':
      case 'low':
        return <WarningIcon sx={{ color: severityColors[severity as keyof typeof severityColors] }} />;
      default:
        return <InfoIcon sx={{ color: severityColors.info }} />;
    }
  };
  
  // Get trend icon based on direction
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <TrendingFlatIcon />;
    }
  };
  
  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Render the anomaly summary cards
  const renderSummaryCards = () => {
    const { summary } = data;
    
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Anomalies
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {summary.totalAnomalies}
                </Typography>
                <Badge 
                  badgeContent={summary.newAnomalies} 
                  color="error"
                  max={99}
                >
                  <NotificationsIcon />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Critical/High
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {summary.criticalAnomalies + summary.highAnomalies}
                </Typography>
                <ErrorIcon sx={{ color: theme.palette.error.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Market Volatility
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {summary.marketVolatility}%
                </Typography>
                {summary.volatilityDirection === 'up' ? (
                  <TrendingUpIcon sx={{ color: theme.palette.error.main }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.success.main }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Anomaly Risk Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {summary.riskScore}/100
                </Typography>
                <Chip 
                  label={summary.riskLevel} 
                  color={
                    summary.riskLevel === 'High' ? 'error' : 
                    summary.riskLevel === 'Medium' ? 'warning' : 
                    'success'
                  }
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render the anomaly list
  const renderAnomalyList = () => {
    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }} component={Paper} variant="outlined">
        {filteredAnomalies.length > 0 ? (
          filteredAnomalies.map((anomaly) => (
            <React.Fragment key={anomaly.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="view" onClick={() => handleSelectAnomaly(anomaly)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="expand" onClick={() => handleExpandAnomaly(anomaly.id)}>
                      {expandedAnomalyId === anomaly.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                }
                sx={{
                  borderLeft: `4px solid ${severityColors[anomaly.severity as keyof typeof severityColors]}`,
                  bgcolor: expandedAnomalyId === anomaly.id ? 
                    alpha(severityColors[anomaly.severity as keyof typeof severityColors], 0.1) : 
                    'inherit'
                }}
              >
                <ListItemIcon>
                  {getSeverityIcon(anomaly.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" component="span">
                        {anomaly.title}
                      </Typography>
                      <Chip 
                        label={anomaly.category} 
                        size="small" 
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {anomaly.symbol} - {formatTimestamp(anomaly.timestamp)}
                      </Typography>
                      {!expandedAnomalyId && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {anomaly.description}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              <Collapse in={expandedAnomalyId === anomaly.id} timeout="auto" unmountOnExit>
                <Box sx={{ p: 2, pl: 9 }}>
                  <Typography variant="body2" paragraph>
                    {anomaly.description}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Details</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell component="th" scope="row">Severity</TableCell>
                              <TableCell>
                                <Chip 
                                  label={anomaly.severity.toUpperCase()} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: severityColors[anomaly.severity as keyof typeof severityColors],
                                    color: '#fff'
                                  }} 
                                />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Confidence</TableCell>
                              <TableCell>{(anomaly.confidence * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Detected</TableCell>
                              <TableCell>{formatTimestamp(anomaly.timestamp)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Status</TableCell>
                              <TableCell>
                                <Chip 
                                  label={anomaly.status} 
                                  color={
                                    anomaly.status === 'Active' ? 'error' : 
                                    anomaly.status === 'Monitoring' ? 'warning' : 
                                    'default'
                                  }
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Metrics</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableBody>
                            {anomaly.metrics.map((metric) => (
                              <TableRow key={metric.name}>
                                <TableCell component="th" scope="row">{metric.name}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {metric.value}
                                    {getTrendIcon(metric.direction)}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText 
              primary="No anomalies found" 
              secondary="No anomalies match the current filter criteria" 
            />
          </ListItem>
        )}
      </List>
    );
  };
  
  // Render the anomaly detail view
  const renderAnomalyDetail = () => {
    if (!selectedAnomaly) return null;
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div">
              {selectedAnomaly.title}
            </Typography>
            <IconButton onClick={() => setSelectedAnomaly(null)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Anomaly Details
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedAnomaly.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Metrics
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {selectedAnomaly.metrics.map((metric) => (
                        <TableRow key={metric.name}>
                          <TableCell component="th" scope="row">{metric.name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {metric.value}
                              {getTrendIcon(metric.direction)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense>
                  {selectedAnomaly.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Historical Data
              </Typography>
              <Box sx={{ height: 200, mb: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedAnomaly.historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }} />
                    <YAxis />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={theme.palette.primary.main} 
                      dot={false} 
                    />
                    <ReferenceLine 
                      x={selectedAnomaly.timestamp} 
                      stroke={theme.palette.error.main} 
                      label="Anomaly" 
                    />
                    {selectedAnomaly.thresholds.map((threshold, index) => (
                      <ReferenceLine 
                        key={index}
                        y={threshold.value} 
                        stroke={threshold.type === 'upper' ? theme.palette.error.light : theme.palette.warning.light} 
                        strokeDasharray="3 3" 
                        label={threshold.type === 'upper' ? 'Upper Threshold' : 'Lower Threshold'} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Related Indicators
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={selectedAnomaly.relatedIndicators}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {selectedAnomaly.relatedIndicators[0] && 
                      Object.keys(selectedAnomaly.relatedIndicators[0])
                        .filter(key => key !== 'timestamp')
                        .map((key, index) => (
                          <Area 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            stackId="1"
                            stroke={theme.palette.primary[`${300 + (index * 100)}`]} 
                            fill={alpha(theme.palette.primary[`${300 + (index * 100)}`], 0.6)} 
                          />
                        ))
                    }
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category-select"
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {data.categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="severity-label">Severity</InputLabel>
              <Select
                labelId="severity-label"
                id="severity-select"
                value={selectedSeverity}
                label="Severity"
                onChange={handleSeverityChange}
              >
                <MenuItem value="all">All Severities</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      {renderSummaryCards()}
      
      <Box sx={{ mt: 3, flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={selectedAnomaly ? 6 : 12} sx={{ height: selectedAnomaly ? '100%' : 'auto' }}>
            {renderAnomalyList()}
          </Grid>
          {selectedAnomaly && (
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              {renderAnomalyDetail()}
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default AnomalyDetectionPanel;