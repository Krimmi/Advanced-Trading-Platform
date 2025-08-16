import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
  Typography,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material';
import { createAlert } from '../../store/slices/alertsSlice';
import { marketService } from '../../services';

// Alert types
const alertTypes = [
  { value: 'price', label: 'Price Alert' },
  { value: 'price_change_percent', label: 'Price Change %' },
  { value: 'volume', label: 'Volume Alert' },
  { value: 'moving_average_cross', label: 'Moving Average Cross' },
  { value: 'rsi', label: 'RSI Alert' },
  { value: 'macd', label: 'MACD Alert' },
  { value: 'bollinger_band', label: 'Bollinger Band Alert' },
  { value: 'earnings', label: 'Earnings Alert' },
  { value: 'news', label: 'News Alert' },
  { value: 'custom', label: 'Custom Alert' }
];

// Alert conditions by type
const alertConditions = {
  price: [
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'equal_to', label: 'Equal To' },
    { value: 'between', label: 'Between' }
  ],
  price_change_percent: [
    { value: 'percent_increase', label: 'Increases By %' },
    { value: 'percent_decrease', label: 'Decreases By %' }
  ],
  volume: [
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' }
  ],
  moving_average_cross: [
    { value: 'crosses_above', label: 'Crosses Above' },
    { value: 'crosses_below', label: 'Crosses Below' }
  ],
  rsi: [
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' }
  ],
  macd: [
    { value: 'crosses_above', label: 'Crosses Above' },
    { value: 'crosses_below', label: 'Crosses Below' }
  ],
  bollinger_band: [
    { value: 'crosses_upper', label: 'Crosses Upper Band' },
    { value: 'crosses_lower', label: 'Crosses Lower Band' }
  ],
  earnings: [
    { value: 'before', label: 'Before Earnings' },
    { value: 'after', label: 'After Earnings' }
  ],
  news: [
    { value: 'contains', label: 'Contains Keywords' }
  ],
  custom: [
    { value: 'custom', label: 'Custom Condition' }
  ]
};

// Alert frequencies
const alertFrequencies = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'always', label: 'Every Trigger' }
];

interface CreateAlertFormProps {
  onClose: () => void;
}

const CreateAlertForm: React.FC<CreateAlertFormProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    alert_type: 'price',
    condition: 'greater_than',
    value: '',
    secondary_value: '',
    frequency: 'once',
    is_active: true,
    parameters: {}
  });
  
  // Form validation
  const [errors, setErrors] = useState({
    name: '',
    symbol: '',
    value: '',
    secondary_value: ''
  });
  
  // Stock symbol search
  const [symbolOptions, setSymbolOptions] = useState<string[]>([]);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  
  // Update condition when alert type changes
  useEffect(() => {
    const conditions = alertConditions[formData.alert_type as keyof typeof alertConditions];
    if (conditions && conditions.length > 0) {
      setFormData(prev => ({
        ...prev,
        condition: conditions[0].value
      }));
    }
  }, [formData.alert_type]);
  
  // Search for stock symbols
  useEffect(() => {
    const searchSymbols = async () => {
      if (symbolSearch.length < 2) return;
      
      setSymbolLoading(true);
      try {
        // This would be replaced with an actual API call in a real implementation
        // For now, we'll simulate a search result
        const results = await new Promise<string[]>(resolve => {
          setTimeout(() => {
            const mockResults = [
              'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'FB', 'NVDA', 'JPM', 'V', 'JNJ'
            ].filter(symbol => symbol.toLowerCase().includes(symbolSearch.toLowerCase()));
            resolve(mockResults);
          }, 500);
        });
        
        setSymbolOptions(results);
      } catch (error) {
        console.error('Error searching symbols:', error);
      } finally {
        setSymbolLoading(false);
      }
    };
    
    searchSymbols();
  }, [symbolSearch]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
    
    // Clear errors when field is updated
    if (name && name in errors) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle symbol selection
  const handleSymbolChange = (event: React.SyntheticEvent, value: string | null) => {
    setFormData({
      ...formData,
      symbol: value || ''
    });
    
    // Clear symbol error
    setErrors({
      ...errors,
      symbol: ''
    });
  };
  
  // Handle switch change
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    });
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {
      name: '',
      symbol: '',
      value: '',
      secondary_value: ''
    };
    let isValid = true;
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Alert name is required';
      isValid = false;
    }
    
    // Validate symbol
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Stock symbol is required';
      isValid = false;
    }
    
    // Validate value
    if (!formData.value && formData.alert_type !== 'news') {
      newErrors.value = 'Value is required';
      isValid = false;
    } else if (formData.alert_type !== 'news' && isNaN(Number(formData.value))) {
      newErrors.value = 'Value must be a number';
      isValid = false;
    }
    
    // Validate secondary value for 'between' condition
    if (formData.condition === 'between' && !formData.secondary_value) {
      newErrors.secondary_value = 'Upper value is required';
      isValid = false;
    } else if (formData.condition === 'between' && isNaN(Number(formData.secondary_value))) {
      newErrors.secondary_value = 'Upper value must be a number';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Prepare alert data
      const alertData = {
        ...formData,
        value: formData.alert_type !== 'news' ? parseFloat(formData.value) : formData.value,
        secondary_value: formData.secondary_value ? parseFloat(formData.secondary_value) : undefined
      };
      
      // Dispatch create alert action
      dispatch(createAlert(alertData) as any);
      
      // Close the form
      onClose();
    }
  };
  
  // Get value label based on alert type
  const getValueLabel = () => {
    switch (formData.alert_type) {
      case 'price':
        return 'Price Value';
      case 'price_change_percent':
        return 'Percentage (%)';
      case 'volume':
        return 'Volume';
      case 'moving_average_cross':
        return 'Moving Average Value';
      case 'rsi':
        return 'RSI Value';
      case 'macd':
        return 'MACD Value';
      case 'bollinger_band':
        return 'Band Value';
      case 'earnings':
        return 'Days Before/After';
      case 'news':
        return 'Keywords';
      default:
        return 'Value';
    }
  };
  
  // Get value type based on alert type
  const getValueType = () => {
    return formData.alert_type === 'news' ? 'text' : 'number';
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="name"
            label="Alert Name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <Autocomplete
            options={symbolOptions}
            loading={symbolLoading}
            onInputChange={(e, value) => setSymbolSearch(value)}
            onChange={handleSymbolChange}
            value={formData.symbol}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Stock Symbol"
                required
                error={!!errors.symbol}
                helperText={errors.symbol}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {symbolLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Alert Type</InputLabel>
            <Select
              name="alert_type"
              value={formData.alert_type}
              onChange={handleInputChange}
              label="Alert Type"
            >
              {alertTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Condition</InputLabel>
            <Select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              label="Condition"
            >
              {alertConditions[formData.alert_type as keyof typeof alertConditions]?.map((condition) => (
                <MenuItem key={condition.value} value={condition.value}>
                  {condition.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={formData.condition === 'between' ? 6 : 12}>
          <TextField
            name="value"
            label={getValueLabel()}
            type={getValueType()}
            fullWidth
            value={formData.value}
            onChange={handleInputChange}
            error={!!errors.value}
            helperText={errors.value}
            required={formData.alert_type !== 'news'}
            multiline={formData.alert_type === 'news'}
            rows={formData.alert_type === 'news' ? 2 : 1}
          />
        </Grid>
        
        {formData.condition === 'between' && (
          <Grid item xs={6}>
            <TextField
              name="secondary_value"
              label="Upper Value"
              type="number"
              fullWidth
              value={formData.secondary_value}
              onChange={handleInputChange}
              error={!!errors.secondary_value}
              helperText={errors.secondary_value}
              required
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              label="Frequency"
            >
              {alertFrequencies.map((freq) => (
                <MenuItem key={freq.value} value={freq.value}>
                  {freq.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {formData.frequency === 'once' && 'Alert will trigger only once and then deactivate'}
              {formData.frequency === 'daily' && 'Alert will trigger at most once per day'}
              {formData.frequency === 'always' && 'Alert will trigger every time the condition is met'}
            </FormHelperText>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                name="is_active"
                checked={formData.is_active}
                onChange={handleSwitchChange}
              />
            }
            label="Activate alert immediately"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create Alert
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateAlertForm;