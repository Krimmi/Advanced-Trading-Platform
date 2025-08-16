import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PlayArrow as RunIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIndicatorIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Types
export interface IndicatorParam {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  value: any;
  options?: string[] | number[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface Indicator {
  id: string;
  name: string;
  type: 'price' | 'volume' | 'momentum' | 'volatility' | 'trend' | 'custom';
  params: IndicatorParam[];
  description?: string;
}

export interface Condition {
  id: string;
  type: 'comparison' | 'crossover' | 'logic' | 'custom';
  leftOperand: {
    type: 'indicator' | 'price' | 'value';
    value: string | number;
    indicatorId?: string;
    field?: string;
  };
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'crosses_above' | 'crosses_below' | 'and' | 'or' | 'not';
  rightOperand: {
    type: 'indicator' | 'price' | 'value';
    value: string | number;
    indicatorId?: string;
    field?: string;
  };
  description?: string;
}

export interface Action {
  id: string;
  type: 'buy' | 'sell' | 'exit' | 'custom';
  params: {
    size?: 'all' | 'percent' | 'fixed' | 'risk_based';
    value?: number;
    limit?: number | null;
    stop?: number | null;
    trailingStop?: number | null;
    timeInForce?: 'day' | 'gtc' | 'ioc';
  };
  description?: string;
}

export interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  description?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  indicators: Indicator[];
  entryRules: Rule[];
  exitRules: Rule[];
  riskManagement: {
    maxPositionSize: number;
    maxDrawdown: number;
    stopLoss?: number;
    takeProfit?: number;
    trailingStop?: number;
  };
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
}

interface StrategyBuilderProps {
  initialStrategy?: Strategy;
  availableIndicators?: Indicator[];
  onSave?: (strategy: Strategy) => void;
  onRun?: (strategy: Strategy) => void;
  onTest?: (strategy: Strategy) => void;
  readOnly?: boolean;
}

const defaultIndicators: Indicator[] = [
  {
    id: 'sma',
    name: 'Simple Moving Average',
    type: 'trend',
    params: [
      { name: 'period', type: 'number', value: 20, min: 1, max: 200, step: 1, description: 'Number of periods' },
      { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
    ],
    description: 'Simple Moving Average (SMA) is an arithmetic moving average calculated by adding recent prices and dividing by the number of time periods.'
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average',
    type: 'trend',
    params: [
      { name: 'period', type: 'number', value: 20, min: 1, max: 200, step: 1, description: 'Number of periods' },
      { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
    ],
    description: 'Exponential Moving Average (EMA) is a type of moving average that places a greater weight on recent data points.'
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index',
    type: 'momentum',
    params: [
      { name: 'period', type: 'number', value: 14, min: 1, max: 100, step: 1, description: 'Number of periods' },
      { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
    ],
    description: 'Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements.'
  },
  {
    id: 'macd',
    name: 'MACD',
    type: 'momentum',
    params: [
      { name: 'fastPeriod', type: 'number', value: 12, min: 1, max: 100, step: 1, description: 'Fast period' },
      { name: 'slowPeriod', type: 'number', value: 26, min: 1, max: 100, step: 1, description: 'Slow period' },
      { name: 'signalPeriod', type: 'number', value: 9, min: 1, max: 100, step: 1, description: 'Signal period' },
      { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
    ],
    description: 'Moving Average Convergence Divergence (MACD) is a trend-following momentum indicator that shows the relationship between two moving averages of a security's price.'
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands',
    type: 'volatility',
    params: [
      { name: 'period', type: 'number', value: 20, min: 1, max: 100, step: 1, description: 'Number of periods' },
      { name: 'stdDev', type: 'number', value: 2, min: 0.1, max: 5, step: 0.1, description: 'Standard deviation multiplier' },
      { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
    ],
    description: 'Bollinger Bands are a type of statistical chart characterizing the prices and volatility over time of a financial instrument.'
  },
  {
    id: 'atr',
    name: 'Average True Range',
    type: 'volatility',
    params: [
      { name: 'period', type: 'number', value: 14, min: 1, max: 100, step: 1, description: 'Number of periods' }
    ],
    description: 'Average True Range (ATR) is a technical analysis indicator that measures market volatility.'
  },
  {
    id: 'volume',
    name: 'Volume',
    type: 'volume',
    params: [],
    description: 'Trading volume represents the total number of shares or contracts traded.'
  },
  {
    id: 'obv',
    name: 'On-Balance Volume',
    type: 'volume',
    params: [],
    description: 'On-Balance Volume (OBV) is a momentum indicator that uses volume flow to predict changes in stock price.'
  }
];

const defaultStrategy: Strategy = {
  id: 'new-strategy',
  name: 'New Strategy',
  description: 'A new trading strategy',
  indicators: [
    {
      id: 'sma-50',
      name: 'SMA 50',
      type: 'trend',
      params: [
        { name: 'period', type: 'number', value: 50, min: 1, max: 200, step: 1, description: 'Number of periods' },
        { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
      ],
      description: 'Simple Moving Average with period 50'
    },
    {
      id: 'sma-200',
      name: 'SMA 200',
      type: 'trend',
      params: [
        { name: 'period', type: 'number', value: 200, min: 1, max: 200, step: 1, description: 'Number of periods' },
        { name: 'source', type: 'select', value: 'close', options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'], description: 'Price source' }
      ],
      description: 'Simple Moving Average with period 200'
    }
  ],
  entryRules: [
    {
      id: 'golden-cross',
      name: 'Golden Cross',
      conditions: [
        {
          id: 'sma-cross',
          type: 'crossover',
          leftOperand: {
            type: 'indicator',
            value: 'sma-50',
            indicatorId: 'sma-50'
          },
          operator: 'crosses_above',
          rightOperand: {
            type: 'indicator',
            value: 'sma-200',
            indicatorId: 'sma-200'
          },
          description: 'SMA 50 crosses above SMA 200'
        }
      ],
      actions: [
        {
          id: 'buy-action',
          type: 'buy',
          params: {
            size: 'percent',
            value: 100
          },
          description: 'Buy with 100% of available capital'
        }
      ],
      enabled: true,
      description: 'Enter when SMA 50 crosses above SMA 200'
    }
  ],
  exitRules: [
    {
      id: 'death-cross',
      name: 'Death Cross',
      conditions: [
        {
          id: 'sma-cross-below',
          type: 'crossover',
          leftOperand: {
            type: 'indicator',
            value: 'sma-50',
            indicatorId: 'sma-50'
          },
          operator: 'crosses_below',
          rightOperand: {
            type: 'indicator',
            value: 'sma-200',
            indicatorId: 'sma-200'
          },
          description: 'SMA 50 crosses below SMA 200'
        }
      ],
      actions: [
        {
          id: 'sell-action',
          type: 'sell',
          params: {
            size: 'all'
          },
          description: 'Sell all positions'
        }
      ],
      enabled: true,
      description: 'Exit when SMA 50 crosses below SMA 200'
    }
  ],
  riskManagement: {
    maxPositionSize: 100,
    maxDrawdown: 10,
    stopLoss: 5,
    takeProfit: 15
  },
  timeframe: '1d'
};

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  initialStrategy,
  availableIndicators = defaultIndicators,
  onSave,
  onRun,
  onTest,
  readOnly = false
}) => {
  const theme = useTheme();
  const [strategy, setStrategy] = useState<Strategy>(initialStrategy || defaultStrategy);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [editingStrategy, setEditingStrategy] = useState<boolean>(false);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState<boolean>(false);
  const [showRuleDialog, setShowRuleDialog] = useState<boolean>(false);
  const [currentIndicator, setCurrentIndicator] = useState<Indicator | null>(null);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [isEntryRule, setIsEntryRule] = useState<boolean>(true);
  const [codeView, setCodeView] = useState<boolean>(false);
  const [strategyCode, setStrategyCode] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Generate strategy code on mount and when strategy changes
  useEffect(() => {
    generateStrategyCode();
  }, [strategy]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle strategy name/description change
  const handleStrategyChange = (field: keyof Strategy, value: any) => {
    setStrategy({
      ...strategy,
      [field]: value
    });
  };
  
  // Handle risk management change
  const handleRiskManagementChange = (field: keyof Strategy['riskManagement'], value: any) => {
    setStrategy({
      ...strategy,
      riskManagement: {
        ...strategy.riskManagement,
        [field]: value
      }
    });
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStrategy({
      ...strategy,
      timeframe: event.target.value as Strategy['timeframe']
    });
  };
  
  // Add indicator
  const handleAddIndicator = () => {
    setCurrentIndicator(null);
    setShowIndicatorDialog(true);
  };
  
  // Edit indicator
  const handleEditIndicator = (indicator: Indicator) => {
    setCurrentIndicator({ ...indicator });
    setShowIndicatorDialog(true);
  };
  
  // Delete indicator
  const handleDeleteIndicator = (indicatorId: string) => {
    // Check if indicator is used in any rules
    const isUsed = [...strategy.entryRules, ...strategy.exitRules].some(rule => 
      rule.conditions.some(condition => 
        condition.leftOperand.indicatorId === indicatorId || 
        condition.rightOperand.indicatorId === indicatorId
      )
    );
    
    if (isUsed) {
      alert('Cannot delete indicator because it is used in one or more rules.');
      return;
    }
    
    setStrategy({
      ...strategy,
      indicators: strategy.indicators.filter(ind => ind.id !== indicatorId)
    });
  };
  
  // Save indicator
  const handleSaveIndicator = (indicator: Indicator) => {
    const isNew = !strategy.indicators.some(ind => ind.id === indicator.id);
    
    if (isNew) {
      setStrategy({
        ...strategy,
        indicators: [...strategy.indicators, indicator]
      });
    } else {
      setStrategy({
        ...strategy,
        indicators: strategy.indicators.map(ind => 
          ind.id === indicator.id ? indicator : ind
        )
      });
    }
    
    setShowIndicatorDialog(false);
  };
  
  // Add rule
  const handleAddRule = (isEntry: boolean) => {
    setIsEntryRule(isEntry);
    setCurrentRule(null);
    setShowRuleDialog(true);
  };
  
  // Edit rule
  const handleEditRule = (rule: Rule, isEntry: boolean) => {
    setIsEntryRule(isEntry);
    setCurrentRule({ ...rule });
    setShowRuleDialog(true);
  };
  
  // Delete rule
  const handleDeleteRule = (ruleId: string, isEntry: boolean) => {
    if (isEntry) {
      setStrategy({
        ...strategy,
        entryRules: strategy.entryRules.filter(rule => rule.id !== ruleId)
      });
    } else {
      setStrategy({
        ...strategy,
        exitRules: strategy.exitRules.filter(rule => rule.id !== ruleId)
      });
    }
  };
  
  // Save rule
  const handleSaveRule = (rule: Rule) => {
    if (isEntryRule) {
      const isNew = !strategy.entryRules.some(r => r.id === rule.id);
      
      if (isNew) {
        setStrategy({
          ...strategy,
          entryRules: [...strategy.entryRules, rule]
        });
      } else {
        setStrategy({
          ...strategy,
          entryRules: strategy.entryRules.map(r => 
            r.id === rule.id ? rule : r
          )
        });
      }
    } else {
      const isNew = !strategy.exitRules.some(r => r.id === rule.id);
      
      if (isNew) {
        setStrategy({
          ...strategy,
          exitRules: [...strategy.exitRules, rule]
        });
      } else {
        setStrategy({
          ...strategy,
          exitRules: strategy.exitRules.map(r => 
            r.id === rule.id ? rule : r
          )
        });
      }
    }
    
    setShowRuleDialog(false);
  };
  
  // Toggle rule enabled state
  const handleToggleRule = (ruleId: string, isEntry: boolean) => {
    if (isEntry) {
      setStrategy({
        ...strategy,
        entryRules: strategy.entryRules.map(rule => 
          rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
        )
      });
    } else {
      setStrategy({
        ...strategy,
        exitRules: strategy.exitRules.map(rule => 
          rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
        )
      });
    }
  };
  
  // Handle drag and drop for rules
  const handleDragEnd = (result: any, isEntry: boolean) => {
    if (!result.destination) return;
    
    const items = isEntry ? [...strategy.entryRules] : [...strategy.exitRules];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setStrategy({
      ...strategy,
      ...(isEntry ? { entryRules: items } : { exitRules: items })
    });
  };
  
  // Generate pseudo-code for the strategy
  const generateStrategyCode = () => {
    let code = `// ${strategy.name}\n`;
    code += `// ${strategy.description || 'No description'}\n\n`;
    
    // Timeframe
    code += `// Timeframe: ${strategy.timeframe}\n\n`;
    
    // Indicators
    code += `// Indicators\n`;
    strategy.indicators.forEach(indicator => {
      code += `${indicator.name} = ${indicator.id}(${indicator.params.map(p => `${p.name}=${p.value}`).join(', ')})\n`;
    });
    
    code += `\n// Entry Rules\n`;
    strategy.entryRules.forEach(rule => {
      if (!rule.enabled) {
        code += `// [DISABLED] ${rule.name}\n`;
        return;
      }
      
      code += `// ${rule.name}\n`;
      code += `if (`;
      
      // Conditions
      rule.conditions.forEach((condition, index) => {
        if (index > 0) {
          code += ` AND `;
        }
        
        const leftOperand = condition.leftOperand.type === 'indicator' 
          ? condition.leftOperand.value 
          : condition.leftOperand.type === 'price' 
            ? 'price.' + condition.leftOperand.value 
            : condition.leftOperand.value;
            
        const rightOperand = condition.rightOperand.type === 'indicator' 
          ? condition.rightOperand.value 
          : condition.rightOperand.type === 'price' 
            ? 'price.' + condition.rightOperand.value 
            : condition.rightOperand.value;
        
        let operator = condition.operator;
        if (operator === 'crosses_above') {
          operator = 'crossesAbove';
        } else if (operator === 'crosses_below') {
          operator = 'crossesBelow';
        }
        
        if (operator === 'crossesAbove' || operator === 'crossesBelow') {
          code += `${operator}(${leftOperand}, ${rightOperand})`;
        } else {
          code += `${leftOperand} ${operator} ${rightOperand}`;
        }
      });
      
      code += `) {\n`;
      
      // Actions
      rule.actions.forEach(action => {
        if (action.type === 'buy') {
          const size = action.params.size === 'all' 
            ? 'all' 
            : action.params.size === 'percent' 
              ? `${action.params.value}%` 
              : action.params.size === 'fixed' 
                ? `${action.params.value} shares` 
                : `risk ${action.params.value}%`;
          
          code += `  buy(${size}`;
          
          if (action.params.limit) {
            code += `, limit=${action.params.limit}`;
          }
          
          if (action.params.stop) {
            code += `, stop=${action.params.stop}`;
          }
          
          code += `)\n`;
        } else if (action.type === 'sell') {
          const size = action.params.size === 'all' 
            ? 'all' 
            : action.params.size === 'percent' 
              ? `${action.params.value}%` 
              : `${action.params.value} shares`;
          
          code += `  sell(${size}`;
          
          if (action.params.limit) {
            code += `, limit=${action.params.limit}`;
          }
          
          if (action.params.stop) {
            code += `, stop=${action.params.stop}`;
          }
          
          code += `)\n`;
        } else if (action.type === 'exit') {
          code += `  exit(`;
          
          if (action.params.limit) {
            code += `limit=${action.params.limit}`;
          }
          
          if (action.params.stop) {
            code += `${action.params.limit ? ', ' : ''}stop=${action.params.stop}`;
          }
          
          code += `)\n`;
        }
      });
      
      code += `}\n\n`;
    });
    
    code += `// Exit Rules\n`;
    strategy.exitRules.forEach(rule => {
      if (!rule.enabled) {
        code += `// [DISABLED] ${rule.name}\n`;
        return;
      }
      
      code += `// ${rule.name}\n`;
      code += `if (`;
      
      // Conditions
      rule.conditions.forEach((condition, index) => {
        if (index > 0) {
          code += ` AND `;
        }
        
        const leftOperand = condition.leftOperand.type === 'indicator' 
          ? condition.leftOperand.value 
          : condition.leftOperand.type === 'price' 
            ? 'price.' + condition.leftOperand.value 
            : condition.leftOperand.value;
            
        const rightOperand = condition.rightOperand.type === 'indicator' 
          ? condition.rightOperand.value 
          : condition.rightOperand.type === 'price' 
            ? 'price.' + condition.rightOperand.value 
            : condition.rightOperand.value;
        
        let operator = condition.operator;
        if (operator === 'crosses_above') {
          operator = 'crossesAbove';
        } else if (operator === 'crosses_below') {
          operator = 'crossesBelow';
        }
        
        if (operator === 'crossesAbove' || operator === 'crossesBelow') {
          code += `${operator}(${leftOperand}, ${rightOperand})`;
        } else {
          code += `${leftOperand} ${operator} ${rightOperand}`;
        }
      });
      
      code += `) {\n`;
      
      // Actions
      rule.actions.forEach(action => {
        if (action.type === 'sell') {
          const size = action.params.size === 'all' 
            ? 'all' 
            : action.params.size === 'percent' 
              ? `${action.params.value}%` 
              : `${action.params.value} shares`;
          
          code += `  sell(${size}`;
          
          if (action.params.limit) {
            code += `, limit=${action.params.limit}`;
          }
          
          if (action.params.stop) {
            code += `, stop=${action.params.stop}`;
          }
          
          code += `)\n`;
        } else if (action.type === 'exit') {
          code += `  exit(`;
          
          if (action.params.limit) {
            code += `limit=${action.params.limit}`;
          }
          
          if (action.params.stop) {
            code += `${action.params.limit ? ', ' : ''}stop=${action.params.stop}`;
          }
          
          code += `)\n`;
        }
      });
      
      code += `}\n\n`;
    });
    
    // Risk management
    code += `// Risk Management\n`;
    code += `setMaxPositionSize(${strategy.riskManagement.maxPositionSize}%)\n`;
    code += `setMaxDrawdown(${strategy.riskManagement.maxDrawdown}%)\n`;
    
    if (strategy.riskManagement.stopLoss) {
      code += `setStopLoss(${strategy.riskManagement.stopLoss}%)\n`;
    }
    
    if (strategy.riskManagement.takeProfit) {
      code += `setTakeProfit(${strategy.riskManagement.takeProfit}%)\n`;
    }
    
    if (strategy.riskManagement.trailingStop) {
      code += `setTrailingStop(${strategy.riskManagement.trailingStop}%)\n`;
    }
    
    setStrategyCode(code);
  };
  
  // Validate strategy
  const validateStrategy = (): boolean => {
    const errors: string[] = [];
    
    // Check strategy name
    if (!strategy.name.trim()) {
      errors.push('Strategy name is required');
    }
    
    // Check indicators
    if (strategy.indicators.length === 0) {
      errors.push('At least one indicator is required');
    }
    
    // Check entry rules
    if (strategy.entryRules.length === 0) {
      errors.push('At least one entry rule is required');
    } else {
      const enabledEntryRules = strategy.entryRules.filter(rule => rule.enabled);
      if (enabledEntryRules.length === 0) {
        errors.push('At least one enabled entry rule is required');
      }
    }
    
    // Check exit rules
    if (strategy.exitRules.length === 0) {
      errors.push('At least one exit rule is required');
    } else {
      const enabledExitRules = strategy.exitRules.filter(rule => rule.enabled);
      if (enabledExitRules.length === 0) {
        errors.push('At least one enabled exit rule is required');
      }
    }
    
    // Check risk management
    if (strategy.riskManagement.maxPositionSize <= 0 || strategy.riskManagement.maxPositionSize > 100) {
      errors.push('Max position size must be between 1 and 100');
    }
    
    if (strategy.riskManagement.maxDrawdown <= 0 || strategy.riskManagement.maxDrawdown > 100) {
      errors.push('Max drawdown must be between 1 and 100');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (validateStrategy()) {
      if (onSave) {
        onSave(strategy);
      }
    }
  };
  
  // Handle run
  const handleRun = () => {
    if (validateStrategy()) {
      if (onRun) {
        onRun(strategy);
      }
    }
  };
  
  // Handle test
  const handleTest = () => {
    if (validateStrategy()) {
      if (onTest) {
        onTest(strategy);
      }
    }
  };
  
  // Render indicator dialog
  const renderIndicatorDialog = () => {
    const [indicator, setIndicator] = useState<Indicator>(
      currentIndicator || {
        id: `indicator-${Date.now()}`,
        name: '',
        type: 'price',
        params: [],
        description: ''
      }
    );
    
    const [selectedBaseIndicator, setSelectedBaseIndicator] = useState<Indicator | null>(
      currentIndicator 
        ? availableIndicators.find(ind => ind.id === currentIndicator.id) || null
        : null
    );
    
    const handleBaseIndicatorChange = (event: React.ChangeEvent<{ value: unknown }>) => {
      const baseIndicator = availableIndicators.find(ind => ind.id === event.target.value);
      if (baseIndicator) {
        setSelectedBaseIndicator(baseIndicator);
        setIndicator({
          ...indicator,
          id: `${baseIndicator.id}-${Date.now()}`,
          name: baseIndicator.name,
          type: baseIndicator.type,
          params: [...baseIndicator.params],
          description: baseIndicator.description
        });
      }
    };
    
    const handleIndicatorChange = (field: keyof Indicator, value: any) => {
      setIndicator({
        ...indicator,
        [field]: value
      });
    };
    
    const handleParamChange = (index: number, field: keyof IndicatorParam, value: any) => {
      const updatedParams = [...indicator.params];
      updatedParams[index] = {
        ...updatedParams[index],
        [field]: value
      };
      
      setIndicator({
        ...indicator,
        params: updatedParams
      });
    };
    
    const handleSave = () => {
      // Validate
      if (!indicator.name.trim()) {
        alert('Indicator name is required');
        return;
      }
      
      handleSaveIndicator(indicator);
    };
    
    return (
      <Dialog open={showIndicatorDialog} onClose={() => setShowIndicatorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentIndicator ? 'Edit Indicator' : 'Add Indicator'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="base-indicator-label">Base Indicator</InputLabel>
                <Select
                  labelId="base-indicator-label"
                  value={selectedBaseIndicator?.id || ''}
                  onChange={handleBaseIndicatorChange}
                  disabled={!!currentIndicator}
                >
                  <MenuItem value="">
                    <em>Select an indicator</em>
                  </MenuItem>
                  {availableIndicators.map((ind) => (
                    <MenuItem key={ind.id} value={ind.id}>
                      {ind.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Indicator Name"
                value={indicator.name}
                onChange={(e) => handleIndicatorChange('name', e.target.value)}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="indicator-type-label">Type</InputLabel>
                <Select
                  labelId="indicator-type-label"
                  value={indicator.type}
                  onChange={(e) => handleIndicatorChange('type', e.target.value)}
                >
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                  <MenuItem value="momentum">Momentum</MenuItem>
                  <MenuItem value="volatility">Volatility</MenuItem>
                  <MenuItem value="trend">Trend</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={indicator.description || ''}
                onChange={(e) => handleIndicatorChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Parameters
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {indicator.params.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No parameters for this indicator
                </Typography>
              ) : (
                indicator.params.map((param, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">
                          {param.name}
                          {param.description && (
                            <Tooltip title={param.description}>
                              <IconButton size="small">
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        {param.type === 'number' ? (
                          param.min !== undefined && param.max !== undefined ? (
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {param.value} {param.min !== undefined && param.max !== undefined && `(${param.min} - ${param.max})`}
                              </Typography>
                              <Slider
                                value={param.value}
                                onChange={(e, value) => handleParamChange(index, 'value', value)}
                                min={param.min}
                                max={param.max}
                                step={param.step || 1}
                                valueLabelDisplay="auto"
                              />
                            </Box>
                          ) : (
                            <TextField
                              fullWidth
                              type="number"
                              value={param.value}
                              onChange={(e) => handleParamChange(index, 'value', parseFloat(e.target.value))}
                              InputProps={{
                                inputProps: {
                                  min: param.min,
                                  max: param.max,
                                  step: param.step || 1
                                }
                              }}
                            />
                          )
                        ) : param.type === 'select' ? (
                          <FormControl fullWidth>
                            <Select
                              value={param.value}
                              onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                            >
                              {param.options?.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : param.type === 'boolean' ? (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={param.value}
                                onChange={(e) => handleParamChange(index, 'value', e.target.checked)}
                              />
                            }
                            label={param.value ? 'Yes' : 'No'}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            value={param.value}
                            onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIndicatorDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render rule dialog
  const renderRuleDialog = () => {
    const [rule, setRule] = useState<Rule>(
      currentRule || {
        id: `rule-${Date.now()}`,
        name: '',
        conditions: [],
        actions: [],
        enabled: true,
        description: ''
      }
    );
    
    const [currentCondition, setCurrentCondition] = useState<Condition | null>(null);
    const [currentAction, setCurrentAction] = useState<Action | null>(null);
    const [showConditionDialog, setShowConditionDialog] = useState<boolean>(false);
    const [showActionDialog, setShowActionDialog] = useState<boolean>(false);
    
    const handleRuleChange = (field: keyof Rule, value: any) => {
      setRule({
        ...rule,
        [field]: value
      });
    };
    
    const handleAddCondition = () => {
      setCurrentCondition(null);
      setShowConditionDialog(true);
    };
    
    const handleEditCondition = (condition: Condition) => {
      setCurrentCondition({ ...condition });
      setShowConditionDialog(true);
    };
    
    const handleDeleteCondition = (conditionId: string) => {
      setRule({
        ...rule,
        conditions: rule.conditions.filter(c => c.id !== conditionId)
      });
    };
    
    const handleSaveCondition = (condition: Condition) => {
      const isNew = !rule.conditions.some(c => c.id === condition.id);
      
      if (isNew) {
        setRule({
          ...rule,
          conditions: [...rule.conditions, condition]
        });
      } else {
        setRule({
          ...rule,
          conditions: rule.conditions.map(c => 
            c.id === condition.id ? condition : c
          )
        });
      }
      
      setShowConditionDialog(false);
    };
    
    const handleAddAction = () => {
      setCurrentAction(null);
      setShowActionDialog(true);
    };
    
    const handleEditAction = (action: Action) => {
      setCurrentAction({ ...action });
      setShowActionDialog(true);
    };
    
    const handleDeleteAction = (actionId: string) => {
      setRule({
        ...rule,
        actions: rule.actions.filter(a => a.id !== actionId)
      });
    };
    
    const handleSaveAction = (action: Action) => {
      const isNew = !rule.actions.some(a => a.id === action.id);
      
      if (isNew) {
        setRule({
          ...rule,
          actions: [...rule.actions, action]
        });
      } else {
        setRule({
          ...rule,
          actions: rule.actions.map(a => 
            a.id === action.id ? action : a
          )
        });
      }
      
      setShowActionDialog(false);
    };
    
    const handleSave = () => {
      // Validate
      if (!rule.name.trim()) {
        alert('Rule name is required');
        return;
      }
      
      if (rule.conditions.length === 0) {
        alert('At least one condition is required');
        return;
      }
      
      if (rule.actions.length === 0) {
        alert('At least one action is required');
        return;
      }
      
      handleSaveRule(rule);
    };
    
    // Render condition dialog
    const renderConditionDialog = () => {
      const [condition, setCondition] = useState<Condition>(
        currentCondition || {
          id: `condition-${Date.now()}`,
          type: 'comparison',
          leftOperand: {
            type: 'indicator',
            value: '',
            indicatorId: ''
          },
          operator: '>',
          rightOperand: {
            type: 'value',
            value: 0
          },
          description: ''
        }
      );
      
      const handleConditionChange = (field: keyof Condition, value: any) => {
        setCondition({
          ...condition,
          [field]: value
        });
      };
      
      const handleLeftOperandChange = (field: keyof Condition['leftOperand'], value: any) => {
        setCondition({
          ...condition,
          leftOperand: {
            ...condition.leftOperand,
            [field]: value
          }
        });
      };
      
      const handleRightOperandChange = (field: keyof Condition['rightOperand'], value: any) => {
        setCondition({
          ...condition,
          rightOperand: {
            ...condition.rightOperand,
            [field]: value
          }
        });
      };
      
      const handleLeftTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const type = event.target.value as 'indicator' | 'price' | 'value';
        setCondition({
          ...condition,
          leftOperand: {
            type,
            value: type === 'value' ? 0 : '',
            indicatorId: type === 'indicator' ? '' : undefined,
            field: type === 'price' ? 'close' : undefined
          }
        });
      };
      
      const handleRightTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const type = event.target.value as 'indicator' | 'price' | 'value';
        setCondition({
          ...condition,
          rightOperand: {
            type,
            value: type === 'value' ? 0 : '',
            indicatorId: type === 'indicator' ? '' : undefined,
            field: type === 'price' ? 'close' : undefined
          }
        });
      };
      
      const handleSave = () => {
        // Validate
        if (condition.leftOperand.type === 'indicator' && !condition.leftOperand.indicatorId) {
          alert('Left indicator is required');
          return;
        }
        
        if (condition.rightOperand.type === 'indicator' && !condition.rightOperand.indicatorId) {
          alert('Right indicator is required');
          return;
        }
        
        handleSaveCondition(condition);
      };
      
      return (
        <Dialog open={showConditionDialog} onClose={() => setShowConditionDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentCondition ? 'Edit Condition' : 'Add Condition'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="condition-type-label">Condition Type</InputLabel>
                  <Select
                    labelId="condition-type-label"
                    value={condition.type}
                    onChange={(e) => handleConditionChange('type', e.target.value)}
                  >
                    <MenuItem value="comparison">Comparison</MenuItem>
                    <MenuItem value="crossover">Crossover</MenuItem>
                    <MenuItem value="logic">Logic</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Left Operand
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id="left-type-label">Type</InputLabel>
                      <Select
                        labelId="left-type-label"
                        value={condition.leftOperand.type}
                        onChange={handleLeftTypeChange}
                      >
                        <MenuItem value="indicator">Indicator</MenuItem>
                        <MenuItem value="price">Price</MenuItem>
                        <MenuItem value="value">Value</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={8}>
                    {condition.leftOperand.type === 'indicator' ? (
                      <FormControl fullWidth>
                        <InputLabel id="left-indicator-label">Indicator</InputLabel>
                        <Select
                          labelId="left-indicator-label"
                          value={condition.leftOperand.indicatorId || ''}
                          onChange={(e) => {
                            const indicatorId = e.target.value as string;
                            const indicator = strategy.indicators.find(ind => ind.id === indicatorId);
                            handleLeftOperandChange('indicatorId', indicatorId);
                            handleLeftOperandChange('value', indicatorId);
                          }}
                        >
                          <MenuItem value="">
                            <em>Select an indicator</em>
                          </MenuItem>
                          {strategy.indicators.map((ind) => (
                            <MenuItem key={ind.id} value={ind.id}>
                              {ind.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : condition.leftOperand.type === 'price' ? (
                      <FormControl fullWidth>
                        <InputLabel id="left-price-label">Price Field</InputLabel>
                        <Select
                          labelId="left-price-label"
                          value={condition.leftOperand.field || 'close'}
                          onChange={(e) => {
                            handleLeftOperandChange('field', e.target.value);
                            handleLeftOperandChange('value', e.target.value);
                          }}
                        >
                          <MenuItem value="open">Open</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="close">Close</MenuItem>
                          <MenuItem value="volume">Volume</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={condition.leftOperand.value}
                        onChange={(e) => handleLeftOperandChange('value', parseFloat(e.target.value))}
                      />
                    )}
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="operator-label">Operator</InputLabel>
                  <Select
                    labelId="operator-label"
                    value={condition.operator}
                    onChange={(e) => handleConditionChange('operator', e.target.value)}
                  >
                    {condition.type === 'comparison' ? (
                      <>
                        <MenuItem value=">">Greater Than (&gt;)</MenuItem>
                        <MenuItem value="<">Less Than (&lt;)</MenuItem>
                        <MenuItem value=">=">Greater Than or Equal (&gt;=)</MenuItem>
                        <MenuItem value="<=">Less Than or Equal (&lt;=)</MenuItem>
                        <MenuItem value="==">Equal (==)</MenuItem>
                        <MenuItem value="!=">Not Equal (!=)</MenuItem>
                      </>
                    ) : condition.type === 'crossover' ? (
                      <>
                        <MenuItem value="crosses_above">Crosses Above</MenuItem>
                        <MenuItem value="crosses_below">Crosses Below</MenuItem>
                      </>
                    ) : condition.type === 'logic' ? (
                      <>
                        <MenuItem value="and">AND</MenuItem>
                        <MenuItem value="or">OR</MenuItem>
                        <MenuItem value="not">NOT</MenuItem>
                      </>
                    ) : (
                      <>
                        <MenuItem value=">">Greater Than (&gt;)</MenuItem>
                        <MenuItem value="<">Less Than (&lt;)</MenuItem>
                        <MenuItem value=">=">Greater Than or Equal (&gt;=)</MenuItem>
                        <MenuItem value="<=">Less Than or Equal (&lt;=)</MenuItem>
                        <MenuItem value="==">Equal (==)</MenuItem>
                        <MenuItem value="!=">Not Equal (!=)</MenuItem>
                        <MenuItem value="crosses_above">Crosses Above</MenuItem>
                        <MenuItem value="crosses_below">Crosses Below</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Right Operand
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id="right-type-label">Type</InputLabel>
                      <Select
                        labelId="right-type-label"
                        value={condition.rightOperand.type}
                        onChange={handleRightTypeChange}
                      >
                        <MenuItem value="indicator">Indicator</MenuItem>
                        <MenuItem value="price">Price</MenuItem>
                        <MenuItem value="value">Value</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={8}>
                    {condition.rightOperand.type === 'indicator' ? (
                      <FormControl fullWidth>
                        <InputLabel id="right-indicator-label">Indicator</InputLabel>
                        <Select
                          labelId="right-indicator-label"
                          value={condition.rightOperand.indicatorId || ''}
                          onChange={(e) => {
                            const indicatorId = e.target.value as string;
                            const indicator = strategy.indicators.find(ind => ind.id === indicatorId);
                            handleRightOperandChange('indicatorId', indicatorId);
                            handleRightOperandChange('value', indicatorId);
                          }}
                        >
                          <MenuItem value="">
                            <em>Select an indicator</em>
                          </MenuItem>
                          {strategy.indicators.map((ind) => (
                            <MenuItem key={ind.id} value={ind.id}>
                              {ind.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : condition.rightOperand.type === 'price' ? (
                      <FormControl fullWidth>
                        <InputLabel id="right-price-label">Price Field</InputLabel>
                        <Select
                          labelId="right-price-label"
                          value={condition.rightOperand.field || 'close'}
                          onChange={(e) => {
                            handleRightOperandChange('field', e.target.value);
                            handleRightOperandChange('value', e.target.value);
                          }}
                        >
                          <MenuItem value="open">Open</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="close">Close</MenuItem>
                          <MenuItem value="volume">Volume</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={condition.rightOperand.value}
                        onChange={(e) => handleRightOperandChange('value', parseFloat(e.target.value))}
                      />
                    )}
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={condition.description || ''}
                  onChange={(e) => handleConditionChange('description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConditionDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      );
    };
    
    // Render action dialog
    const renderActionDialog = () => {
      const [action, setAction] = useState<Action>(
        currentAction || {
          id: `action-${Date.now()}`,
          type: isEntryRule ? 'buy' : 'sell',
          params: {
            size: 'all',
            value: 100
          },
          description: ''
        }
      );
      
      const handleActionChange = (field: keyof Action, value: any) => {
        setAction({
          ...action,
          [field]: value
        });
      };
      
      const handleParamChange = (field: keyof Action['params'], value: any) => {
        setAction({
          ...action,
          params: {
            ...action.params,
            [field]: value
          }
        });
      };
      
      const handleSizeTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const sizeType = event.target.value as 'all' | 'percent' | 'fixed' | 'risk_based';
        setAction({
          ...action,
          params: {
            ...action.params,
            size: sizeType,
            value: sizeType === 'all' ? undefined : sizeType === 'percent' ? 100 : 1
          }
        });
      };
      
      const handleSave = () => {
        // Validate
        if (action.params.size !== 'all' && (action.params.value === undefined || action.params.value <= 0)) {
          alert('Size value must be greater than 0');
          return;
        }
        
        handleSaveAction(action);
      };
      
      return (
        <Dialog open={showActionDialog} onClose={() => setShowActionDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentAction ? 'Edit Action' : 'Add Action'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="action-type-label">Action Type</InputLabel>
                  <Select
                    labelId="action-type-label"
                    value={action.type}
                    onChange={(e) => handleActionChange('type', e.target.value)}
                  >
                    {isEntryRule ? (
                      <MenuItem value="buy">Buy</MenuItem>
                    ) : (
                      <>
                        <MenuItem value="sell">Sell</MenuItem>
                        <MenuItem value="exit">Exit</MenuItem>
                      </>
                    )}
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {action.type !== 'exit' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="size-type-label">Size Type</InputLabel>
                      <Select
                        labelId="size-type-label"
                        value={action.params.size || 'all'}
                        onChange={handleSizeTypeChange}
                      >
                        <MenuItem value="all">All Available</MenuItem>
                        <MenuItem value="percent">Percent of Available</MenuItem>
                        <MenuItem value="fixed">Fixed Size</MenuItem>
                        {action.type === 'buy' && (
                          <MenuItem value="risk_based">Risk-Based</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {action.params.size !== 'all' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label={action.params.size === 'percent' ? 'Percent' : action.params.size === 'risk_based' ? 'Risk Percent' : 'Shares'}
                        value={action.params.value || ''}
                        onChange={(e) => handleParamChange('value', parseFloat(e.target.value))}
                        InputProps={{
                          inputProps: {
                            min: 0,
                            step: action.params.size === 'fixed' ? 1 : 0.1
                          },
                          endAdornment: action.params.size === 'percent' || action.params.size === 'risk_based' ? '%' : null
                        }}
                        margin="normal"
                      />
                    </Grid>
                  )}
                </>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Limit Price"
                  value={action.params.limit || ''}
                  onChange={(e) => handleParamChange('limit', e.target.value ? parseFloat(e.target.value) : null)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stop Price"
                  value={action.params.stop || ''}
                  onChange={(e) => handleParamChange('stop', e.target.value ? parseFloat(e.target.value) : null)}
                  margin="normal"
                />
              </Grid>
              
              {action.type !== 'exit' && (
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="time-in-force-label">Time in Force</InputLabel>
                    <Select
                      labelId="time-in-force-label"
                      value={action.params.timeInForce || 'day'}
                      onChange={(e) => handleParamChange('timeInForce', e.target.value)}
                    >
                      <MenuItem value="day">Day</MenuItem>
                      <MenuItem value="gtc">Good Till Canceled</MenuItem>
                      <MenuItem value="ioc">Immediate or Cancel</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={action.description || ''}
                  onChange={(e) => handleActionChange('description', e.target.value)}
                  multiline
                  rows={2}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowActionDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      );
    };
    
    return (
      <>
        <Dialog open={showRuleDialog} onClose={() => setShowRuleDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentRule ? `Edit ${isEntryRule ? 'Entry' : 'Exit'} Rule` : `Add ${isEntryRule ? 'Entry' : 'Exit'} Rule`}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={rule.name}
                  onChange={(e) => handleRuleChange('name', e.target.value)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={rule.enabled}
                      onChange={(e) => handleRuleChange('enabled', e.target.checked)}
                    />
                  }
                  label={rule.enabled ? 'Enabled' : 'Disabled'}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={rule.description || ''}
                  onChange={(e) => handleRuleChange('description', e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Conditions
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddCondition}
                  >
                    Add Condition
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {rule.conditions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No conditions added yet. Add at least one condition.
                  </Typography>
                ) : (
                  rule.conditions.map((condition, index) => (
                    <Box key={condition.id} sx={{ mb: 2, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          Condition {index + 1}
                        </Typography>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditCondition(condition)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteCondition(condition.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          label={condition.leftOperand.type === 'indicator' 
                            ? strategy.indicators.find(ind => ind.id === condition.leftOperand.indicatorId)?.name || condition.leftOperand.value
                            : condition.leftOperand.type === 'price'
                              ? `Price.${condition.leftOperand.field}`
                              : condition.leftOperand.value
                          }
                          color="primary"
                          variant="outlined"
                        />
                        
                        <Chip
                          label={condition.operator === 'crosses_above' 
                            ? 'Crosses Above' 
                            : condition.operator === 'crosses_below'
                              ? 'Crosses Below'
                              : condition.operator
                          }
                          color="secondary"
                        />
                        
                        <Chip
                          label={condition.rightOperand.type === 'indicator' 
                            ? strategy.indicators.find(ind => ind.id === condition.rightOperand.indicatorId)?.name || condition.rightOperand.value
                            : condition.rightOperand.type === 'price'
                              ? `Price.${condition.rightOperand.field}`
                              : condition.rightOperand.value
                          }
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      {condition.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {condition.description}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Actions
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddAction}
                  >
                    Add Action
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {rule.actions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No actions added yet. Add at least one action.
                  </Typography>
                ) : (
                  rule.actions.map((action, index) => (
                    <Box key={action.id} sx={{ mb: 2, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          Action {index + 1}
                        </Typography>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditAction(action)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteAction(action.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          label={action.type.toUpperCase()}
                          color={action.type === 'buy' ? 'success' : action.type === 'sell' ? 'error' : 'warning'}
                        />
                        
                        {action.type !== 'exit' && (
                          <Chip
                            label={action.params.size === 'all' 
                              ? 'All Available' 
                              : action.params.size === 'percent'
                                ? `${action.params.value}%`
                                : action.params.size === 'fixed'
                                  ? `${action.params.value} shares`
                                  : `Risk ${action.params.value}%`
                            }
                            variant="outlined"
                          />
                        )}
                        
                        {action.params.limit && (
                          <Chip
                            label={`Limit: ${action.params.limit}`}
                            variant="outlined"
                          />
                        )}
                        
                        {action.params.stop && (
                          <Chip
                            label={`Stop: ${action.params.stop}`}
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      {action.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {action.description}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRuleDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {showConditionDialog && renderConditionDialog()}
        {showActionDialog && renderActionDialog()}
      </>
    );
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Strategy Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            {editingStrategy ? (
              <TextField
                fullWidth
                label="Strategy Name"
                value={strategy.name}
                onChange={(e) => handleStrategyChange('name', e.target.value)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography variant="h5" component="h1" gutterBottom>
                {strategy.name}
              </Typography>
            )}
            
            {editingStrategy ? (
              <TextField
                fullWidth
                label="Description"
                value={strategy.description || ''}
                onChange={(e) => handleStrategyChange('description', e.target.value)}
                multiline
                rows={2}
              />
            ) : (
              strategy.description && (
                <Typography variant="body1" color="text.secondary">
                  {strategy.description}
                </Typography>
              )
            )}
          </Box>
          
          <Box>
            {!readOnly && (
              editingStrategy ? (
                <Button
                  variant="outlined"
                  startIcon={<CheckIcon />}
                  onClick={() => setEditingStrategy(false)}
                  sx={{ mr: 1 }}
                >
                  Done
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditingStrategy(true)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
              )
            )}
            
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={() => setCodeView(!codeView)}
            >
              {codeView ? 'Visual Editor' : 'Code View'}
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Timeframe
            </Typography>
            {editingStrategy ? (
              <FormControl fullWidth margin="dense">
                <Select
                  value={strategy.timeframe}
                  onChange={handleTimeframeChange}
                  size="small"
                >
                  <MenuItem value="1m">1 Minute</MenuItem>
                  <MenuItem value="5m">5 Minutes</MenuItem>
                  <MenuItem value="15m">15 Minutes</MenuItem>
                  <MenuItem value="30m">30 Minutes</MenuItem>
                  <MenuItem value="1h">1 Hour</MenuItem>
                  <MenuItem value="4h">4 Hours</MenuItem>
                  <MenuItem value="1d">Daily</MenuItem>
                  <MenuItem value="1w">Weekly</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body1">
                {strategy.timeframe === '1m' ? '1 Minute' :
                 strategy.timeframe === '5m' ? '5 Minutes' :
                 strategy.timeframe === '15m' ? '15 Minutes' :
                 strategy.timeframe === '30m' ? '30 Minutes' :
                 strategy.timeframe === '1h' ? '1 Hour' :
                 strategy.timeframe === '4h' ? '4 Hours' :
                 strategy.timeframe === '1d' ? 'Daily' : 'Weekly'}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Indicators
            </Typography>
            <Typography variant="body1">
              {strategy.indicators.length}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Entry Rules
            </Typography>
            <Typography variant="body1">
              {strategy.entryRules.length} ({strategy.entryRules.filter(r => r.enabled).length} enabled)
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Exit Rules
            </Typography>
            <Typography variant="body1">
              {strategy.exitRules.length} ({strategy.exitRules.filter(r => r.enabled).length} enabled)
            </Typography>
          </Grid>
        </Grid>
        
        {validationErrors.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 1 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}
        
        {!readOnly && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Strategy
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RunIcon />}
              onClick={handleRun}
            >
              Run Backtest
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleTest}
            >
              Test Strategy
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Strategy Content */}
      {codeView ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Strategy Code
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#1E1E1E' : '#F5F5F5',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              maxHeight: 600,
            }}
          >
            {strategyCode}
          </Box>
        </Paper>
      ) : (
        <Box>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="strategy tabs">
            <Tab label="Indicators" />
            <Tab label="Entry Rules" />
            <Tab label="Exit Rules" />
            <Tab label="Risk Management" />
          </Tabs>
          
          <Box sx={{ mt: 3 }}>
            {/* Indicators Tab */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Indicators
                  </Typography>
                  {!readOnly && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddIndicator}
                    >
                      Add Indicator
                    </Button>
                  )}
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {strategy.indicators.length === 0 ? (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No indicators added yet. Add indicators to build your strategy.
                  </Typography>
                ) : (
                  <Grid container spacing={3}>
                    {strategy.indicators.map((indicator) => (
                      <Grid item xs={12} sm={6} md={4} key={indicator.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            height: '100%',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {indicator.name}
                            </Typography>
                            
                            {!readOnly && (
                              <Box>
                                <IconButton size="small" onClick={() => handleEditIndicator(indicator)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDeleteIndicator(indicator.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                          
                          <Chip
                            label={indicator.type}
                            size="small"
                            sx={{ mt: 1, mb: 2 }}
                          />
                          
                          {indicator.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {indicator.description}
                            </Typography>
                          )}
                          
                          {indicator.params.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Parameters:
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {indicator.params.map((param, index) => (
                                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {param.name}:
                                    </Typography>
                                    <Typography variant="body2">
                                      {param.value}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
            
            {/* Entry Rules Tab */}
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Entry Rules
                  </Typography>
                  {!readOnly && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddRule(true)}
                    >
                      Add Entry Rule
                    </Button>
                  )}
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {strategy.entryRules.length === 0 ? (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No entry rules added yet. Add rules to define when to enter positions.
                  </Typography>
                ) : (
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, true)}>
                    <Droppable droppableId="entry-rules">
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {strategy.entryRules.map((rule, index) => (
                            <Draggable
                              key={rule.id}
                              draggableId={rule.id}
                              index={index}
                              isDragDisabled={readOnly}
                            >
                              {(provided) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  sx={{ mb: 2 }}
                                >
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 1,
                                      opacity: rule.enabled ? 1 : 0.6,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: rule.enabled ? `1px solid ${theme.palette.divider}` : 'none',
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {!readOnly && (
                                          <Box
                                            {...provided.dragHandleProps}
                                            sx={{ mr: 1, cursor: 'grab' }}
                                          >
                                            <DragIndicatorIcon color="action" />
                                          </Box>
                                        )}
                                        
                                        <Typography variant="subtitle1" fontWeight="medium">
                                          {rule.name}
                                        </Typography>
                                        
                                        {!rule.enabled && (
                                          <Chip
                                            label="Disabled"
                                            size="small"
                                            color="default"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
                                      
                                      <Box>
                                        {!readOnly && (
                                          <>
                                            <IconButton
                                              size="small"
                                              onClick={() => handleToggleRule(rule.id, true)}
                                              sx={{ mr: 1 }}
                                            >
                                              {rule.enabled ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                                            </IconButton>
                                            
                                            <IconButton
                                              size="small"
                                              onClick={() => handleEditRule(rule, true)}
                                              sx={{ mr: 1 }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                            
                                            <IconButton
                                              size="small"
                                              onClick={() => handleDeleteRule(rule.id, true)}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                    
                                    {rule.enabled && (
                                      <Box sx={{ p: 2 }}>
                                        {rule.description && (
                                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {rule.description}
                                          </Typography>
                                        )}
                                        
                                        <Box sx={{ mb: 2 }}>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Conditions:
                                          </Typography>
                                          
                                          {rule.conditions.map((condition, condIndex) => (
                                            <Box
                                              key={condition.id}
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                mb: 1,
                                              }}
                                            >
                                              {condIndex > 0 && (
                                                <Chip
                                                  label="AND"
                                                  size="small"
                                                  color="default"
                                                  variant="outlined"
                                                />
                                              )}
                                              
                                              <Chip
                                                label={condition.leftOperand.type === 'indicator' 
                                                  ? strategy.indicators.find(ind => ind.id === condition.leftOperand.indicatorId)?.name || condition.leftOperand.value
                                                  : condition.leftOperand.type === 'price'
                                                    ? `Price.${condition.leftOperand.field}`
                                                    : condition.leftOperand.value
                                                }
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                              />
                                              
                                              <Chip
                                                label={condition.operator === 'crosses_above' 
                                                  ? 'Crosses Above' 
                                                  : condition.operator === 'crosses_below'
                                                    ? 'Crosses Below'
                                                    : condition.operator
                                                }
                                                size="small"
                                                color="secondary"
                                              />
                                              
                                              <Chip
                                                label={condition.rightOperand.type === 'indicator' 
                                                  ? strategy.indicators.find(ind => ind.id === condition.rightOperand.indicatorId)?.name || condition.rightOperand.value
                                                  : condition.rightOperand.type === 'price'
                                                    ? `Price.${condition.rightOperand.field}`
                                                    : condition.rightOperand.value
                                                }
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                              />
                                            </Box>
                                          ))}
                                        </Box>
                                        
                                        <Box>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Actions:
                                          </Typography>
                                          
                                          {rule.actions.map((action) => (
                                            <Box
                                              key={action.id}
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                mb: 1,
                                              }}
                                            >
                                              <Chip
                                                label={action.type.toUpperCase()}
                                                size="small"
                                                color="success"
                                              />
                                              
                                              {action.type !== 'exit' && (
                                                <Chip
                                                  label={action.params.size === 'all' 
                                                    ? 'All Available' 
                                                    : action.params.size === 'percent'
                                                      ? `${action.params.value}%`
                                                      : action.params.size === 'fixed'
                                                        ? `${action.params.value} shares`
                                                        : `Risk ${action.params.value}%`
                                                  }
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                              
                                              {action.params.limit && (
                                                <Chip
                                                  label={`Limit: ${action.params.limit}`}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                              
                                              {action.params.stop && (
                                                <Chip
                                                  label={`Stop: ${action.params.stop}`}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                            </Box>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                  </Paper>
                                </Box>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Box>
            )}
            
            {/* Exit Rules Tab */}
            {activeTab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Exit Rules
                  </Typography>
                  {!readOnly && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddRule(false)}
                    >
                      Add Exit Rule
                    </Button>
                  )}
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {strategy.exitRules.length === 0 ? (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No exit rules added yet. Add rules to define when to exit positions.
                  </Typography>
                ) : (
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, false)}>
                    <Droppable droppableId="exit-rules">
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {strategy.exitRules.map((rule, index) => (
                            <Draggable
                              key={rule.id}
                              draggableId={rule.id}
                              index={index}
                              isDragDisabled={readOnly}
                            >
                              {(provided) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  sx={{ mb: 2 }}
                                >
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 1,
                                      opacity: rule.enabled ? 1 : 0.6,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: rule.enabled ? `1px solid ${theme.palette.divider}` : 'none',
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {!readOnly && (
                                          <Box
                                            {...provided.dragHandleProps}
                                            sx={{ mr: 1, cursor: 'grab' }}
                                          >
                                            <DragIndicatorIcon color="action" />
                                          </Box>
                                        )}
                                        
                                        <Typography variant="subtitle1" fontWeight="medium">
                                          {rule.name}
                                        </Typography>
                                        
                                        {!rule.enabled && (
                                          <Chip
                                            label="Disabled"
                                            size="small"
                                            color="default"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
                                      
                                      <Box>
                                        {!readOnly && (
                                          <>
                                            <IconButton
                                              size="small"
                                              onClick={() => handleToggleRule(rule.id, false)}
                                              sx={{ mr: 1 }}
                                            >
                                              {rule.enabled ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                                            </IconButton>
                                            
                                            <IconButton
                                              size="small"
                                              onClick={() => handleEditRule(rule, false)}
                                              sx={{ mr: 1 }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                            
                                            <IconButton
                                              size="small"
                                              onClick={() => handleDeleteRule(rule.id, false)}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                    
                                    {rule.enabled && (
                                      <Box sx={{ p: 2 }}>
                                        {rule.description && (
                                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {rule.description}
                                          </Typography>
                                        )}
                                        
                                        <Box sx={{ mb: 2 }}>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Conditions:
                                          </Typography>
                                          
                                          {rule.conditions.map((condition, condIndex) => (
                                            <Box
                                              key={condition.id}
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                mb: 1,
                                              }}
                                            >
                                              {condIndex > 0 && (
                                                <Chip
                                                  label="AND"
                                                  size="small"
                                                  color="default"
                                                  variant="outlined"
                                                />
                                              )}
                                              
                                              <Chip
                                                label={condition.leftOperand.type === 'indicator' 
                                                  ? strategy.indicators.find(ind => ind.id === condition.leftOperand.indicatorId)?.name || condition.leftOperand.value
                                                  : condition.leftOperand.type === 'price'
                                                    ? `Price.${condition.leftOperand.field}`
                                                    : condition.leftOperand.value
                                                }
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                              />
                                              
                                              <Chip
                                                label={condition.operator === 'crosses_above' 
                                                  ? 'Crosses Above' 
                                                  : condition.operator === 'crosses_below'
                                                    ? 'Crosses Below'
                                                    : condition.operator
                                                }
                                                size="small"
                                                color="secondary"
                                              />
                                              
                                              <Chip
                                                label={condition.rightOperand.type === 'indicator' 
                                                  ? strategy.indicators.find(ind => ind.id === condition.rightOperand.indicatorId)?.name || condition.rightOperand.value
                                                  : condition.rightOperand.type === 'price'
                                                    ? `Price.${condition.rightOperand.field}`
                                                    : condition.rightOperand.value
                                                }
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                              />
                                            </Box>
                                          ))}
                                        </Box>
                                        
                                        <Box>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Actions:
                                          </Typography>
                                          
                                          {rule.actions.map((action) => (
                                            <Box
                                              key={action.id}
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                mb: 1,
                                              }}
                                            >
                                              <Chip
                                                label={action.type.toUpperCase()}
                                                size="small"
                                                color="error"
                                              />
                                              
                                              {action.type !== 'exit' && (
                                                <Chip
                                                  label={action.params.size === 'all' 
                                                    ? 'All Available' 
                                                    : action.params.size === 'percent'
                                                      ? `${action.params.value}%`
                                                      : `${action.params.value} shares`
                                                  }
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                              
                                              {action.params.limit && (
                                                <Chip
                                                  label={`Limit: ${action.params.limit}`}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                              
                                              {action.params.stop && (
                                                <Chip
                                                  label={`Stop: ${action.params.stop}`}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                            </Box>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                  </Paper>
                                </Box>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Box>
            )}
            
            {/* Risk Management Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Risk Management
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        Position Sizing
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Maximum Position Size (% of account)
                        </Typography>
                        
                        {editingStrategy && !readOnly ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {strategy.riskManagement.maxPositionSize}%
                            </Typography>
                            <Slider
                              value={strategy.riskManagement.maxPositionSize}
                              onChange={(e, value) => handleRiskManagementChange('maxPositionSize', value)}
                              min={1}
                              max={100}
                              step={1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value}%`}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body1">
                            {strategy.riskManagement.maxPositionSize}%
                          </Typography>
                        )}
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Maximum Drawdown (% of account)
                        </Typography>
                        
                        {editingStrategy && !readOnly ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {strategy.riskManagement.maxDrawdown}%
                            </Typography>
                            <Slider
                              value={strategy.riskManagement.maxDrawdown}
                              onChange={(e, value) => handleRiskManagementChange('maxDrawdown', value)}
                              min={1}
                              max={50}
                              step={1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value}%`}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body1">
                            {strategy.riskManagement.maxDrawdown}%
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        Exit Parameters
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Stop Loss (% from entry)
                        </Typography>
                        
                        {editingStrategy && !readOnly ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {strategy.riskManagement.stopLoss || 0}%
                            </Typography>
                            <Slider
                              value={strategy.riskManagement.stopLoss || 0}
                              onChange={(e, value) => handleRiskManagementChange('stopLoss', value)}
                              min={0}
                              max={20}
                              step={0.5}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => value === 0 ? 'None' : `${value}%`}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body1">
                            {strategy.riskManagement.stopLoss ? `${strategy.riskManagement.stopLoss}%` : 'None'}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Take Profit (% from entry)
                        </Typography>
                        
                        {editingStrategy && !readOnly ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {strategy.riskManagement.takeProfit || 0}%
                            </Typography>
                            <Slider
                              value={strategy.riskManagement.takeProfit || 0}
                              onChange={(e, value) => handleRiskManagementChange('takeProfit', value)}
                              min={0}
                              max={50}
                              step={1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => value === 0 ? 'None' : `${value}%`}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body1">
                            {strategy.riskManagement.takeProfit ? `${strategy.riskManagement.takeProfit}%` : 'None'}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Trailing Stop (% from highest/lowest)
                        </Typography>
                        
                        {editingStrategy && !readOnly ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {strategy.riskManagement.trailingStop || 0}%
                            </Typography>
                            <Slider
                              value={strategy.riskManagement.trailingStop || 0}
                              onChange={(e, value) => handleRiskManagementChange('trailingStop', value)}
                              min={0}
                              max={20}
                              step={0.5}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => value === 0 ? 'None' : `${value}%`}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body1">
                            {strategy.riskManagement.trailingStop ? `${strategy.riskManagement.trailingStop}%` : 'None'}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Box>
      )}
      
      {/* Dialogs */}
      {showIndicatorDialog && renderIndicatorDialog()}
      {showRuleDialog && renderRuleDialog()}
    </Box>
  );
};

export default StrategyBuilder;