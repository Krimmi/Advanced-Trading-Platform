import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import alertsServiceExtensions, { ExecutionStrategy } from '../../services/alertsServiceExtensions';
import ExecutionRulesBuilder from './ExecutionRulesBuilder';

const AutomatedExecutionPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [strategies, setStrategies] = useState<ExecutionStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<ExecutionStrategy | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const strategiesData = await alertsServiceExtensions.getExecutionStrategies();
      setStrategies(strategiesData);
    } catch (error) {
      console.error('Error fetching execution strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    setDialogMode('create');
    setOpenDialog(true);
  };

  const handleEditStrategy = (strategy: ExecutionStrategy) => {
    setSelectedStrategy(strategy);
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    setStrategyToDelete(strategyId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteStrategy = async () => {
    if (strategyToDelete) {
      try {
        await alertsServiceExtensions.deleteExecutionStrategy(strategyToDelete);
        setStrategies(strategies.filter(strategy => strategy.id !== strategyToDelete));
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
    setDeleteConfirmOpen(false);
    setStrategyToDelete(null);
  };

  const handleToggleStrategy = async (strategyId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await alertsServiceExtensions.deactivateExecutionStrategy(strategyId);
      } else {
        await alertsServiceExtensions.activateExecutionStrategy(strategyId);
      }
      
      // Update the strategies list
      setStrategies(
        strategies.map((strategy) =>
          strategy.id === strategyId ? { ...strategy, isActive: !isActive } : strategy
        )
      );
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  const handleSaveStrategy = async (strategy: ExecutionStrategy) => {
    try {
      if (dialogMode === 'create') {
        const newStrategy = await alertsServiceExtensions.createExecutionStrategy(strategy);
        setStrategies([...strategies, newStrategy]);
      } else {
        const updatedStrategy = await alertsServiceExtensions.updateExecutionStrategy(
          strategy.id!,
          strategy
        );
        setStrategies(
          strategies.map((s) => (s.id === updatedStrategy.id ? updatedStrategy : s))
        );
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center">
              <SettingsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Automated Execution Strategies</Typography>
            </Box>
          }
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateStrategy}
            >
              New Strategy
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Conditions</TableCell>
                    <TableCell>Actions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Controls</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {strategies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No execution strategies found. Create one to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell>{strategy.name}</TableCell>
                        <TableCell>{strategy.description}</TableCell>
                        <TableCell>{strategy.conditions?.length || 0} conditions</TableCell>
                        <TableCell>{strategy.actions?.length || 0} actions</TableCell>
                        <TableCell>
                          <Chip
                            label={strategy.isActive ? 'Active' : 'Inactive'}
                            color={strategy.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {strategy.createdAt
                            ? format(new Date(strategy.createdAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex">
                            <Tooltip title={strategy.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={strategy.isActive ? 'error' : 'success'}
                                onClick={() => handleToggleStrategy(strategy.id!, strategy.isActive)}
                              >
                                {strategy.isActive ? <StopIcon /> : <PlayIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditStrategy(strategy)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton size="small">
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteStrategy(strategy.id!)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Strategy Editor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogContent>
          <ExecutionRulesBuilder
            strategy={selectedStrategy || undefined}
            onSave={handleSaveStrategy}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this execution strategy? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteStrategy} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AutomatedExecutionPanel;