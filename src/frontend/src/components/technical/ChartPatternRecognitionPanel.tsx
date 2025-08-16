import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { technicalService, technicalServiceExtensions } from '../../services';
import { ChartPattern } from '../../services/technicalService';

interface ChartPatternRecognitionPanelProps {
  symbol: string;
}

const ChartPatternRecognitionPanel: React.FC<ChartPatternRecognitionPanelProps> = ({ symbol }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<string>('daily');
  const [patterns, setPatterns] = useState<ChartPattern[]>([]);
  const [availablePatterns, setAvailablePatterns] = useState<any[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);

  useEffect(() => {
    const fetchAvailablePatterns = async () => {
      try {
        const patternsData = await technicalService.getChartPatterns(symbol, timeframe as any);
        setPatterns(patternsData);
      } catch (error) {
        console.error('Error fetching chart patterns:', error);
      }
    };

    if (symbol) {
      fetchAvailablePatterns();
    }
  }, [symbol, timeframe]);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handlePatternChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedPatterns(event.target.value as string[]);
  };

  const handleScanPatterns = async () => {
    setLoading(true);
    try {
      const patternsData = await technicalService.getChartPatterns(symbol, timeframe as any);
      setPatterns(patternsData);
    } catch (error) {
      console.error('Error scanning for patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternColor = (pattern: ChartPattern) => {
    // Determine if pattern is bullish or bearish based on name or other properties
    const patternName = pattern.pattern.toLowerCase();
    if (
      patternName.includes('bullish') ||
      patternName.includes('bottom') ||
      patternName.includes('support') ||
      patternName.includes('reversal') && pattern.priceTarget && pattern.priceTarget > 0
    ) {
      return theme.palette.success.main;
    } else if (
      patternName.includes('bearish') ||
      patternName.includes('top') ||
      patternName.includes('resistance') ||
      patternName.includes('reversal') && pattern.priceTarget && pattern.priceTarget < 0
    ) {
      return theme.palette.error.main;
    } else {
      return theme.palette.info.main;
    }
  };

  const getPatternIcon = (pattern: ChartPattern) => {
    // Determine if pattern is bullish or bearish based on name or other properties
    const patternName = pattern.pattern.toLowerCase();
    if (
      patternName.includes('bullish') ||
      patternName.includes('bottom') ||
      patternName.includes('support') ||
      patternName.includes('reversal') && pattern.priceTarget && pattern.priceTarget > 0
    ) {
      return <TrendingUpIcon color="success" />;
    } else if (
      patternName.includes('bearish') ||
      patternName.includes('top') ||
      patternName.includes('resistance') ||
      patternName.includes('reversal') && pattern.priceTarget && pattern.priceTarget < 0
    ) {
      return <TrendingDownIcon color="error" />;
    } else {
      return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Chart Pattern Recognition</Typography>
            <Typography variant="body2" color="textSecondary">
              Analyzing {symbol} for technical chart patterns
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-select-label"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="minute">1 Minute</MenuItem>
                <MenuItem value="5min">5 Minutes</MenuItem>
                <MenuItem value="15min">15 Minutes</MenuItem>
                <MenuItem value="30min">30 Minutes</MenuItem>
                <MenuItem value="hourly">1 Hour</MenuItem>
                <MenuItem value="4hour">4 Hours</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleScanPatterns}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Scan for Patterns'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detected Patterns
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : patterns.length === 0 ? (
                <Alert severity="info">
                  No chart patterns detected for {symbol} on {timeframe} timeframe.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pattern</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Probability</TableCell>
                        <TableCell>Price Target</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patterns.map((pattern, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {getPatternIcon(pattern)}
                              <Typography sx={{ ml: 1 }}>{pattern.pattern}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pattern.pattern.toLowerCase().includes('bullish') ? 'Bullish' : 'Bearish'}
                              color={pattern.pattern.toLowerCase().includes('bullish') ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(pattern.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(pattern.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {(pattern.probability * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            {pattern.priceTarget ? `$${pattern.priceTarget.toFixed(2)}` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pattern Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {patterns.length === 0 ? (
                <Alert severity="info">
                  Select a pattern to view detailed information.
                </Alert>
              ) : (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {patterns[0].pattern}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {patterns[0].pattern.toLowerCase().includes('bullish')
                      ? `This is a bullish pattern that typically indicates a potential upward movement. The pattern formed between ${new Date(patterns[0].startDate).toLocaleDateString()} and ${new Date(patterns[0].endDate).toLocaleDateString()}.`
                      : `This is a bearish pattern that typically indicates a potential downward movement. The pattern formed between ${new Date(patterns[0].startDate).toLocaleDateString()} and ${new Date(patterns[0].endDate).toLocaleDateString()}.`}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    The pattern has a {(patterns[0].probability * 100).toFixed(1)}% probability of being valid.
                    {patterns[0].priceTarget && ` The projected price target is $${patterns[0].priceTarget.toFixed(2)}.`}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Trading Considerations:
                  </Typography>
                  
                  <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                    <li>Confirm the pattern with other technical indicators</li>
                    <li>Check for volume confirmation</li>
                    <li>Consider the overall market trend</li>
                    <li>Set appropriate stop-loss levels</li>
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pattern Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {patterns.length === 0 ? (
                <Alert severity="info">
                  No patterns detected to show statistics.
                </Alert>
              ) : (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="caption">Bullish Patterns</Typography>
                        <Typography variant="h6">
                          {patterns.filter(p => p.pattern.toLowerCase().includes('bullish')).length}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="caption">Bearish Patterns</Typography>
                        <Typography variant="h6">
                          {patterns.filter(p => p.pattern.toLowerCase().includes('bearish')).length}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="caption">Avg. Probability</Typography>
                        <Typography variant="h6">
                          {(patterns.reduce((sum, p) => sum + p.probability, 0) / patterns.length * 100).toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="caption">Total Patterns</Typography>
                        <Typography variant="h6">
                          {patterns.length}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChartPatternRecognitionPanel;