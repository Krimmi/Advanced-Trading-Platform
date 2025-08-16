import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`impact-tabpanel-${index}`}
      aria-labelledby={`impact-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface EventImpactChartProps {
  impactAnalysis: any;
}

const EventImpactChart: React.FC<EventImpactChartProps> = ({ impactAnalysis }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const onPieEnter = (data: any, index: number) => {
    setActiveIndex(index);
  };

  // Prepare data for charts
  const prepareWindowData = () => {
    const eventType = Object.keys(impactAnalysis)[0];
    const windowData = [];
    
    if (impactAnalysis[eventType] && impactAnalysis[eventType].windows) {
      for (const [window, data] of Object.entries(impactAnalysis[eventType].windows)) {
        windowData.push({
          window: `${window} days`,
          avgReturn: (data as any).avg_return * 100,
          medianReturn: (data as any).median_return * 100,
          positiveRatio: (data as any).positive_count / ((data as any).positive_count + (data as any).negative_count) * 100
        });
      }
    }
    
    return windowData;
  };

  const preparePieData = () => {
    const eventType = Object.keys(impactAnalysis)[0];
    const data = impactAnalysis[eventType];
    
    if (!data) return [];
    
    return [
      { name: 'Positive', value: data.positive_count },
      { name: 'Negative', value: data.negative_count }
    ];
  };

  const windowData = prepareWindowData();
  const pieData = preparePieData();
  const eventType = Object.keys(impactAnalysis)[0];
  const eventData = impactAnalysis[eventType];

  const COLORS = [theme.palette.success.main, theme.palette.error.main];

  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-midAngle * Math.PI / 180);
    const cos = Math.cos(-midAngle * Math.PI / 180);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} events`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Impact Analysis: {eventType.replace(/_/g, ' ')}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom align="center">
                Event Count
              </Typography>
              <Typography variant="h3" align="center">
                {eventData?.count || 0}
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: COLORS[0], mr: 1 }} />
                  <Typography variant="body2">Positive: {eventData?.positive_count || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: COLORS[1], mr: 1 }} />
                  <Typography variant="body2">Negative: {eventData?.negative_count || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Impact Over Time
              </Typography>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="impact chart tabs">
                <Tab label="Returns" />
                <Tab label="Statistics" />
              </Tabs>
              
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={windowData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="window" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, '']} />
                      <Legend />
                      <Bar name="Average Return" dataKey="avgReturn" fill={theme.palette.primary.main} />
                      <Bar name="Median Return" dataKey="medianReturn" fill={theme.palette.secondary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Window</TableCell>
                        <TableCell align="right">Avg Return</TableCell>
                        <TableCell align="right">Median Return</TableCell>
                        <TableCell align="right">Positive Ratio</TableCell>
                        <TableCell align="right">Significance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(eventData?.windows || {}).map(([window, data]: [string, any]) => (
                        <TableRow key={window}>
                          <TableCell component="th" scope="row">
                            {window} days
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: data.avg_return > 0 ? 'success.main' : 'error.main' 
                            }}
                          >
                            {(data.avg_return * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: data.median_return > 0 ? 'success.main' : 'error.main' 
                            }}
                          >
                            {(data.median_return * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell align="right">
                            {((data.positive_count / (data.positive_count + data.negative_count)) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">
                            {data.significant ? 
                              <Typography variant="body2" color="success.main">Significant</Typography> : 
                              <Typography variant="body2" color="text.secondary">Not significant</Typography>
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventImpactChart;