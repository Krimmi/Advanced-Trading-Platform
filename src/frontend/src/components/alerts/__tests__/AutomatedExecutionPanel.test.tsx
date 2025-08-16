import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutomatedExecutionPanel from '../AutomatedExecutionPanel';
import alertsServiceExtensions from '../../../services/alertsServiceExtensions';

// Mock the alertsServiceExtensions
jest.mock('../../../services/alertsServiceExtensions', () => ({
  getExecutionStrategies: jest.fn(),
  createExecutionStrategy: jest.fn(),
  updateExecutionStrategy: jest.fn(),
  deleteExecutionStrategy: jest.fn(),
  activateExecutionStrategy: jest.fn(),
  deactivateExecutionStrategy: jest.fn(),
}));

// Mock the ExecutionRulesBuilder component
jest.mock('../ExecutionRulesBuilder', () => {
  return function MockExecutionRulesBuilder({ strategy, onSave, onCancel }) {
    return (
      <div data-testid="execution-rules-builder">
        <button onClick={() => onSave(strategy || { name: 'New Strategy', conditions: [], actions: [] })}>
          Save Strategy
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

describe('AutomatedExecutionPanel', () => {
  const mockStrategies = [
    {
      id: '1',
      name: 'Buy on RSI Oversold',
      description: 'Buy when RSI goes below 30',
      conditions: [
        {
          type: 'technical',
          symbol: 'AAPL',
          indicator: 'rsi',
          operator: 'less_than',
          value: 30,
        },
      ],
      actions: [
        {
          type: 'market_order',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
        },
      ],
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Sell on Price Target',
      description: 'Sell when price reaches target',
      conditions: [
        {
          type: 'price',
          symbol: 'MSFT',
          operator: 'greater_than',
          value: 300,
        },
      ],
      actions: [
        {
          type: 'market_order',
          symbol: 'MSFT',
          side: 'sell',
          quantity: 5,
        },
      ],
      isActive: false,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (alertsServiceExtensions.getExecutionStrategies as jest.Mock).mockResolvedValue(mockStrategies);
    (alertsServiceExtensions.createExecutionStrategy as jest.Mock).mockImplementation(
      (strategy) => Promise.resolve({ ...strategy, id: '3' })
    );
    (alertsServiceExtensions.updateExecutionStrategy as jest.Mock).mockImplementation(
      (id, strategy) => Promise.resolve({ ...strategy, id })
    );
  });

  test('renders the component with loading state', () => {
    render(<AutomatedExecutionPanel />);
    expect(screen.getByText('Automated Execution Strategies')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays strategies after loading', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(alertsServiceExtensions.getExecutionStrategies).toHaveBeenCalled();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if strategies are displayed
    expect(screen.getByText('Buy on RSI Oversold')).toBeInTheDocument();
    expect(screen.getByText('Sell on Price Target')).toBeInTheDocument();
    expect(screen.getByText('Buy when RSI goes below 30')).toBeInTheDocument();
    expect(screen.getByText('Sell when price reaches target')).toBeInTheDocument();
    
    // Check if status chips are displayed
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('opens create strategy dialog', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on New Strategy button
    fireEvent.click(screen.getByText('New Strategy'));
    
    // Check if the dialog is opened
    expect(screen.getByTestId('execution-rules-builder')).toBeInTheDocument();
  });

  test('creates a new strategy', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on New Strategy button
    fireEvent.click(screen.getByText('New Strategy'));
    
    // Click on Save Strategy button in the dialog
    fireEvent.click(screen.getByText('Save Strategy'));
    
    // Check if createExecutionStrategy was called
    await waitFor(() => {
      expect(alertsServiceExtensions.createExecutionStrategy).toHaveBeenCalled();
    });
  });

  test('opens edit strategy dialog', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the edit button for the first strategy
    const editButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="EditIcon"]')
    );
    fireEvent.click(editButtons[0]);
    
    // Check if the dialog is opened
    expect(screen.getByTestId('execution-rules-builder')).toBeInTheDocument();
  });

  test('updates an existing strategy', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the edit button for the first strategy
    const editButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="EditIcon"]')
    );
    fireEvent.click(editButtons[0]);
    
    // Click on Save Strategy button in the dialog
    fireEvent.click(screen.getByText('Save Strategy'));
    
    // Check if updateExecutionStrategy was called
    await waitFor(() => {
      expect(alertsServiceExtensions.updateExecutionStrategy).toHaveBeenCalled();
    });
  });

  test('toggles strategy activation status', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find the toggle buttons
    const toggleButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => 
        button.querySelector('svg[data-testid="StopIcon"]') || 
        button.querySelector('svg[data-testid="PlayArrowIcon"]')
    );
    
    // Toggle the active strategy (first one)
    fireEvent.click(toggleButtons[0]);
    
    // Check if deactivateExecutionStrategy was called
    await waitFor(() => {
      expect(alertsServiceExtensions.deactivateExecutionStrategy).toHaveBeenCalledWith('1');
    });
    
    // Toggle the inactive strategy (second one)
    fireEvent.click(toggleButtons[1]);
    
    // Check if activateExecutionStrategy was called
    await waitFor(() => {
      expect(alertsServiceExtensions.activateExecutionStrategy).toHaveBeenCalledWith('2');
    });
  });

  test('opens delete confirmation dialog', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the delete button for the first strategy
    const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="DeleteIcon"]')
    );
    fireEvent.click(deleteButtons[0]);
    
    // Check if the confirmation dialog is opened
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this execution strategy? This action cannot be undone.')).toBeInTheDocument();
  });

  test('deletes a strategy', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the delete button for the first strategy
    const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="DeleteIcon"]')
    );
    fireEvent.click(deleteButtons[0]);
    
    // Click on Delete button in the confirmation dialog
    fireEvent.click(screen.getByText('Delete'));
    
    // Check if deleteExecutionStrategy was called
    await waitFor(() => {
      expect(alertsServiceExtensions.deleteExecutionStrategy).toHaveBeenCalledWith('1');
    });
  });

  test('cancels strategy deletion', async () => {
    render(<AutomatedExecutionPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the delete button for the first strategy
    const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="DeleteIcon"]')
    );
    fireEvent.click(deleteButtons[0]);
    
    // Click on Cancel button in the confirmation dialog
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check if the dialog is closed
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    
    // Check that deleteExecutionStrategy was not called
    expect(alertsServiceExtensions.deleteExecutionStrategy).not.toHaveBeenCalled();
  });
});