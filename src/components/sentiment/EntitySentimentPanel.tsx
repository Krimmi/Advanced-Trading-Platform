import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface EntitySentimentPanelProps {
  data: {
    entities: {
      name: string;
      mentions: number;
      score: number;
      classification: string;
      color: string;
    }[];
  };
  title?: string;
}

const EntitySentimentPanel: React.FC<EntitySentimentPanelProps> = ({ 
  data,
  title = "Entity Sentiment Analysis"
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  // Filter entities based on search term
  const filteredEntities = data.entities.filter(entity => 
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Prepare data for top entities chart
  const topEntities = [...data.entities]
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);
  
  const chartData = {
    labels: topEntities.map(entity => entity.name),
    datasets: [
      {
        label: 'Mentions',
        data: topEntities.map(entity => entity.mentions),
        backgroundColor: topEntities.map(entity => entity.color),
        borderWidth: 1
      }
    ]
  };
  
  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const entity = topEntities[context.dataIndex];
            return [
              `Mentions: ${entity.mentions}`,
              `Sentiment: ${entity.score.toFixed(2)} (${entity.classification})`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Number of Mentions'
        }
      }
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Top Entities Chart */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Top Mentioned Entities
              </Typography>
              <Box sx={{ height: 350 }}>
                <Bar data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Entity Sentiment Table */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Entity Sentiment Details
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search entities"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity</TableCell>
                      <TableCell align="right">Mentions</TableCell>
                      <TableCell>Sentiment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEntities
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((entity, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {entity.name}
                          </TableCell>
                          <TableCell align="right">{entity.mentions}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip 
                                label={entity.score.toFixed(2)} 
                                size="small"
                                sx={{ 
                                  backgroundColor: `${entity.color}20`,
                                  color: entity.color,
                                  fontWeight: 'bold',
                                  mr: 1
                                }}
                              />
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {entity.classification}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredEntities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No entities found matching your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredEntities.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Entity Analysis Summary */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Entity Analysis Summary
              </Typography>
              <Typography variant="body2">
                {data.entities.length > 0 ? (
                  <>
                    Analysis identified {data.entities.length} unique entities, with{' '}
                    <strong>{data.entities[0].name}</strong> being the most frequently mentioned ({data.entities[0].mentions} mentions).
                    {' '}
                    {data.entities.filter(e => e.classification === 'positive').length > 0 ? (
                      <>
                        The most positively mentioned entity is{' '}
                        <strong>{data.entities.filter(e => e.classification === 'positive').sort((a, b) => b.score - a.score)[0]?.name}</strong>.
                        {' '}
                      </>
                    ) : null}
                    {data.entities.filter(e => e.classification === 'negative').length > 0 ? (
                      <>
                        The most negatively mentioned entity is{' '}
                        <strong>{data.entities.filter(e => e.classification === 'negative').sort((a, b) => a.score - b.score)[0]?.name}</strong>.
                        {' '}
                      </>
                    ) : null}
                    Overall sentiment is{' '}
                    {data.entities.reduce((sum, entity) => sum + entity.score * entity.mentions, 0) / 
                     data.entities.reduce((sum, entity) => sum + entity.mentions, 0) > 0.2 ? 'positive' : 
                     data.entities.reduce((sum, entity) => sum + entity.score * entity.mentions, 0) / 
                     data.entities.reduce((sum, entity) => sum + entity.mentions, 0) < -0.2 ? 'negative' : 'neutral'}.
                  </>
                ) : (
                  'No entity data available for analysis.'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EntitySentimentPanel;