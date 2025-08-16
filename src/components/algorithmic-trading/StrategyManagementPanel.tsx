import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Grid, 
  IconButton, 
  List, 
  ListItem, 
  ListItemSecondaryAction, 
  ListItemText, 
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon, 
  Stop as StopIcon, 
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { AlgorithmicTradingService } from '../../services/algorithmic-trading/AlgorithmicTradingService';
import { StrategyType } from '../../services/algorithmic-trading/registry/StrategyFactory';
import { StrategyState } from '../../models/algorithmic-trading/StrategyTypes';

/**
 * Strategy Management Panel Component
 */
const StrategyManagementPanel: React.FC = () => {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newStrategyType, setNewStrategyType] = useState<StrategyType>(StrategyType.MOVING_AVERAGE_CROSSOVER);
  const [newStrategyConfig, setNewStrategyConfig] = useState<string>('');
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Get the algorithmic trading service
  const tradingService = AlgorithmicTradingService.getInstance();
  
  // Load strategies on component mount
  useEffect(() => {
    loadStrategies();
  }, []);
  
  // Load strategies from the registry
  const loadStrategies = () => {
    const allStrategies = tradingService.getAllStrategies();
    setStrategies(allStrategies);
  };
  
  // Handle strategy selection
  const handleSelectStrategy = (strategy: any) => {
    setSelectedStrategy(strategy);
  };
  
  // Handle strategy start
  const handleStartStrategy = async (strategyId: string) => {
    try {
      await tradingService.startStrategy(strategyId);
      loadStrategies();
    } catch (error) {
      console.error('Error starting strategy:', error);
      // Show error notification
    }
  };
  
  // Handle strategy pause
  const handlePauseStrategy = async (strategyId: string) => {
    try {
      await tradingService.pauseStrategy(strategyId);
      loadStrategies();
    } catch (error) {
      console.error('Error pausing strategy:', error);
      // Show error notification
    }
  };
  
  // Handle strategy stop
  const handleStopStrategy = async (strategyId: string) => {
    try {
      await tradingService.stopStrategy(strategyId);
      loadStrategies();
    } catch (error) {
      console.error('Error stopping strategy:', error);
      // Show error notification
    }
  };
  
  // Handle strategy reset
  const handleResetStrategy = async (strategyId: string) => {
    try {
      await tradingService.resetStrategy(strategyId);
      loadStrategies();
    } catch (error) {
      console.error('Error resetting strategy:', error);
      // Show error notification
    }
  };
  
  // Handle create dialog open
  const handleOpenCreateDialog = () => {
    setNewStrategyType(StrategyType.MOVING_AVERAGE_CROSSOVER);
    setNewStrategyConfig(JSON.stringify({
      parameters: {
        fastPeriod: 10,
        slowPeriod: 30,
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
        positionSize: 0.1,
        stopLossPercent: 0.02,
        takeProfitPercent: 0.04
      }
    }, null, 2));
    setConfigError(null);
    setIsCreateDialogOpen(true);
  };
  
  // Handle create dialog close
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };
  
  // Handle edit dialog open
  const handleOpenEditDialog = (strategy: any) => {
    setSelectedStrategy(strategy);
    setNewStrategyConfig(JSON.stringify(strategy.exportConfig(), null, 2));
    setConfigError(null);
    setIsEditDialogOpen(true);
  };
  
  // Handle edit dialog close
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };
  
  // Handle delete dialog open
  const handleOpenDeleteDialog = (strategy: any) => {
    setSelectedStrategy(strategy);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle delete dialog close
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };
  
  // Handle strategy type change
  const handleStrategyTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setNewStrategyType(event.target.value as StrategyType);
  };
  
  // Handle strategy config change
  const handleStrategyConfigChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewStrategyConfig(event.target.value);
    setConfigError(null);
  };
  
  // Handle create strategy
  const handleCreateStrategy = async () => {
    try {
      // Parse the config JSON
      const config = JSON.parse(newStrategyConfig);
      
      // Create the strategy
      await tradingService.createStrategy(newStrategyType, config);
      
      // Close the dialog and reload strategies
      handleCloseCreateDialog();
      loadStrategies();
    } catch (error) {
      console.error('Error creating strategy:', error);
      setConfigError(error instanceof Error ? error.message : 'Invalid configuration');
    }
  };
  
  // Handle update strategy
  const handleUpdateStrategy = async () => {
    if (!selectedStrategy) return;
    
    try {
      // Parse the config JSON
      const config = JSON.parse(newStrategyConfig);
      
      // Import the config to the strategy
      await selectedStrategy.importConfig(config);
      
      // Close the dialog and reload strategies
      handleCloseEditDialog();
      loadStrategies();
    } catch (error) {
      console.error('Error updating strategy:', error);
      setConfigError(error instanceof Error ? error.message : 'Invalid configuration');
    }
  };
  
  // Handle delete strategy
  const handleDeleteStrategy = async () => {
    if (!selectedStrategy) return;
    
    try {
      // Stop the strategy if it's running
      if (selectedStrategy.state === StrategyState.RUNNING) {
        await tradingService.stopStrategy(selectedStrategy.id);
      }
      
      // Unregister the strategy
      const registry = tradingService.strategyRegistry;
      registry.unregisterStrategy(selectedStrategy.id);
      
      // Close the dialog and reload strategies
      handleCloseDeleteDialog();
      loadStrategies();
      setSelectedStrategy(null);
    } catch (error) {
      console.error('Error deleting strategy:', error);
      // Show error notification
    }
  };
  
  // Get chip color based on strategy state
  const getStateChipColor = (state: StrategyState) => {
    switch (state) {
      case StrategyState.RUNNING:
        return 'success';
      case StrategyState.PAUSED:
        return 'warning';
      case StrategyState.STOPPED:
        return 'error';
      case StrategyState.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Box>
      <Card>
        <CardHeader 
          title="Strategy Management" 
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              New Strategy
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Available Strategies
              </Typography>
              <List>
                {strategies.map((strategy) => (
                  <ListItem 
                    key={strategy.id}
                    button
                    selected={selectedStrategy?.id === strategy.id}
                    onClick={() => handleSelectStrategy(strategy)}
                  >
                    <ListItemText 
                      primary={strategy.name} 
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span">
                            {strategy.description}
                          </Typography>
                          <br />
                          <Chip 
                            size="small" 
                            label={strategy.state} 
                            color={getStateChipColor(strategy.state) as any}
                            sx={{ mt: 1 }}
                          />
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="start"
                        onClick={() => handleStartStrategy(strategy.id)}
                        disabled={strategy.state === StrategyState.RUNNING}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="pause"
                        onClick={() => handlePauseStrategy(strategy.id)}
                        disabled={strategy.state !== StrategyState.RUNNING}
                      >
                        <PauseIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="stop"
                        onClick={() => handleStopStrategy(strategy.id)}
                        disabled={strategy.state !== StrategyState.RUNNING && strategy.state !== StrategyState.PAUSED}
                      >
                        <StopIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="reset"
                        onClick={() => handleResetStrategy(strategy.id)}
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(strategy)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleOpenDeleteDialog(strategy)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {strategies.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No strategies available" />
                  </ListItem>
                )}
              </List>
            </Grid>
            <Grid item xs={12} md={8}>
              {selectedStrategy ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedStrategy.name} - Details
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedStrategy.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedStrategy.parameters.map((param: any) => (
                      <Grid item xs={12} sm={6} md={4} key={param.name}>
                        <Typography variant="subtitle2">
                          {param.name}
                        </Typography>
                        <Typography variant="body2">
                          {Array.isArray(param.value) 
                            ? param.value.join(', ') 
                            : String(param.value)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {param.description}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Performance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2">Total Return</Typography>
                      <Typography variant="body2">
                        {selectedStrategy.performance.totalReturn.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2">Win Rate</Typography>
                      <Typography variant="body2">
                        {(selectedStrategy.performance.winRate * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2">Profit Factor</Typography>
                      <Typography variant="body2">
                        {selectedStrategy.performance.profitFactor.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="subtitle2">Max Drawdown</Typography>
                      <Typography variant="body2">
                        {selectedStrategy.performance.maxDrawdown.toFixed(2)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    Select a strategy to view details
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Create Strategy Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Strategy</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="strategy-type-label">Strategy Type</InputLabel>
            <Select
              labelId="strategy-type-label"
              value={newStrategyType}
              onChange={handleStrategyTypeChange as any}
              label="Strategy Type"
            >
              <MenuItem value={StrategyType.MOVING_AVERAGE_CROSSOVER}>Moving Average Crossover</MenuItem>
            </Select>
            <FormHelperText>Select the type of strategy to create</FormHelperText>
          </FormControl>
          <TextField
            label="Strategy Configuration"
            multiline
            rows={10}
            value={newStrategyConfig}
            onChange={handleStrategyConfigChange}
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!configError}
            helperText={configError || 'Enter the strategy configuration in JSON format'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateStrategy} color="primary" variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Strategy Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Strategy</DialogTitle>
        <DialogContent>
          <TextField
            label="Strategy Configuration"
            multiline
            rows={10}
            value={newStrategyConfig}
            onChange={handleStrategyConfigChange}
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!configError}
            helperText={configError || 'Edit the strategy configuration in JSON format'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateStrategy} color="primary" variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Strategy Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Strategy</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the strategy "{selectedStrategy?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteStrategy} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrategyManagementPanel;