import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as RunIcon,
  Share as ShareIcon,
  ContentCopy as DuplicateIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import screenerService, { PresetScreen } from '../../services/screenerService';

interface SavedScreenersPanelProps {
  onLoadScreen: (screen: PresetScreen) => void;
  onRunScreen: (screen: PresetScreen) => void;
}

const SavedScreenersPanel: React.FC<SavedScreenersPanelProps> = ({
  onLoadScreen,
  onRunScreen,
}) => {
  const [savedScreens, setSavedScreens] = useState<PresetScreen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [screenToDelete, setScreenToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSavedScreens();
  }, []);

  const loadSavedScreens = async () => {
    setLoading(true);
    setError(null);
    try {
      const screens = await screenerService.getCustomScreens();
      setSavedScreens(screens);
    } catch (error) {
      console.error('Error loading saved screens:', error);
      setError('Failed to load your saved screens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScreen = async () => {
    if (!screenToDelete) return;

    try {
      await screenerService.deleteCustomScreen(screenToDelete);
      setSavedScreens(savedScreens.filter(screen => screen.id !== screenToDelete));
      setDeleteDialogOpen(false);
      setScreenToDelete(null);
    } catch (error) {
      console.error('Error deleting screen:', error);
      setError('Failed to delete screen. Please try again.');
    }
  };

  const handleDuplicateScreen = async (screen: PresetScreen) => {
    try {
      const duplicatedScreen = await screenerService.saveCustomScreen(
        `${screen.name} (Copy)`,
        screen.description || '',
        screen.filters,
        screen.sortBy,
        screen.sortDirection
      );
      setSavedScreens([...savedScreens, duplicatedScreen]);
    } catch (error) {
      console.error('Error duplicating screen:', error);
      setError('Failed to duplicate screen. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFilterSummary = (filters: any[]) => {
    if (filters.length === 0) return 'No filters';
    
    // Group filters by category
    const categories: Record<string, number> = {};
    filters.forEach(filter => {
      const category = filter.category || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories).map(([category, count]) => (
      `${category}: ${count}`
    )).join(', ');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Saved Screens
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSavedScreens}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : savedScreens.length === 0 ? (
        <Alert severity="info">
          You don't have any saved screens yet. Create and save a screen to see it here.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {savedScreens.map((screen) => (
            <Grid item xs={12} md={6} lg={4} key={screen.id}>
              <Card variant="outlined">
                <CardHeader
                  title={screen.name}
                  subheader={`Created: ${screen.createdAt ? formatDate(screen.createdAt) : 'N/A'}`}
                  action={
                    <Box>
                      {screen.isPublic && (
                        <Tooltip title="Public Screen">
                          <Chip size="small" label="Public" color="primary" sx={{ mr: 1 }} />
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  {screen.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {screen.description}
                    </Typography>
                  )}
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Filters:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Box display="flex" alignItems="center">
                        <FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {screen.filters.length} filter{screen.filters.length !== 1 ? 's' : ''}
                          {' - '}{getFilterSummary(screen.filters)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  
                  {screen.sortBy && (
                    <Typography variant="body2" color="textSecondary">
                      Sort by: <strong>{screen.sortBy}</strong> ({screen.sortDirection === 'asc' ? 'ascending' : 'descending'})
                    </Typography>
                  )}
                </CardContent>
                <Divider />
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onLoadScreen(screen)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<RunIcon />}
                    onClick={() => onRunScreen(screen)}
                    color="primary"
                  >
                    Run
                  </Button>
                  <Box flexGrow={1} />
                  <Tooltip title="Duplicate">
                    <IconButton size="small" onClick={() => handleDuplicateScreen(screen)}>
                      <DuplicateIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setScreenToDelete(screen.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Screen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this screen? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteScreen} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedScreenersPanel;