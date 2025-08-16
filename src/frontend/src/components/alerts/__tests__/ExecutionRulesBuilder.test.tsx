import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExecutionRulesBuilder from '../ExecutionRulesBuilder';
import alertsServiceExtensions from '../../../services/alertsServiceExtensions';

// Mock the alertsServiceExtensions
jest.mock('../../../services/alertsServiceExtensions', () => ({
  getExecutionConditionTypes: jest.fn(),
  getExecutionActionTypes: jest.fn(),
  testExecutionStrategy: jest.fn(),
}));

describe('ExecutionRulesBuilder', () => {
  const mockStrategy = {
    id: '1',
    name: 'Test Strategy',
    description: 'Test Description',
    conditions: [
      {
        type: 'price',
        symbol: 'AAPL',
        operator: 'greater_than',
        value: 150,
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
    isActive: false,
  };

  const mockConditionTypes = [
    {
      type: 'price',
      name: 'Price',
      description: 'Price conditions',
      operators: [
        { id: 'greater_than', name: 'Greater Than', description: 'Price is greater than value' },
        { id: 'less_than', name: 'Less Than', description: 'Price is less than value' },
      ],
    },
    {
      type: 'technical',
      name: 'Technical',
      description: 'Technical indicator conditions',
      operators: [
        { id: 'crosses_above', name: 'Crosses Above', description: 'Indicator crosses above value' },
        { id: 'crosses_below', name: 'Crosses Below', description: 'Indicator crosses below value' },
      ],
    },
  ];

  const mockActionTypes = [
    {
      type: 'market_order',
      name: 'Market Order',
      description: 'Place a market order',
      parameters: [
        { id: 'symbol', name: 'Symbol', type: 'string', required: true, description: 'Stock symbol' },
        { id: 'side', name: 'Side', type: 'string', required: true, description: 'Buy or sell' },
        { id: 'quantity', name: 'Quantity', type: 'number', required: true, description: 'Number of shares' },
      ],
    },
    {
      type: 'limit_order',
      name: 'Limit Order',
      description: 'Place a limit order',
      parameters: [
        { id: 'symbol', name: 'Symbol', type: 'string', required: true, description: 'Stock symbol' },
        { id: 'side', name: 'Side', type: 'string', required: true, description: 'Buy or sell' },
        { id: 'quantity', name: 'Quantity', type: 'number', required: true, description: 'Number of shares' },
        { id: 'price', name: 'Price', type: 'number', required: true, description: 'Limit price' },
      ],
    },
  ];

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (alertsServiceExtensions.getExecutionConditionTypes as jest.Mock).mockResolvedValue(mockConditionTypes);
    (alertsServiceExtensions.getExecutionActionTypes as jest.Mock).mockResolvedValue(mockActionTypes);
    (alertsServiceExtensions.testExecutionStrategy as jest.Mock).mockResolvedValue({
      valid: true,
      message: 'Strategy is valid',
      simulatedActions: [
        {
          type: 'market_order',
          status: 'executed',
          details: {
            symbol: 'AAPL',
            side: 'buy',
            quantity: 10,
            price: 155.75,
          },
        },
      ],
    });
  });

  test('renders the component with empty strategy', () => {
    render(
      <ExecutionRulesBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Create Execution Strategy')).toBeInTheDocument();
    expect(screen.getByLabelText('Strategy Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  test('renders the component with existing strategy', () => {
    render(
      <ExecutionRulesBuilder
        strategy={mockStrategy}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Edit Execution Strategy')).toBeInTheDocument();
    expect(screen.getByLabelText('Strategy Name')).toHaveValue('Test Strategy');
    expect(screen.getByLabelText('Description')).toHaveValue('Test Description');
  });

  test('adds and removes conditions', async () => {
    render(
      <ExecutionRulesBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    // Initially there should be one condition
    expect(screen.getByText('Condition 1')).toBeInTheDocument();
    
    // Add a new condition
    fireEvent.click(screen.getByText('Add Condition'));
    
    // Now there should be two conditions
    expect(screen.getByText('Condition 1')).toBeInTheDocument();
    expect(screen.getByText('Condition 2')).toBeInTheDocument();
    
    // Find all delete buttons for conditions
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    
    // Remove the second condition
    fireEvent.click(deleteButtons[1]); // The second delete button
    
    // Now there should be only one condition again
    expect(screen.getByText('Condition 1')).toBeInTheDocument();
    expect(screen.queryByText('Condition 2')).not.toBeInTheDocument();
  });

  test('adds and removes actions', async () => {
    render(
      <ExecutionRulesBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    // Initially there should be one action
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    
    // Add a new action
    fireEvent.click(screen.getByText('Add Action'));
    
    // Now there should be two actions
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    
    // Find all delete buttons for actions
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    
    // Remove the second action
    // We need to find the delete button that's within the Actions section
    const actionDeleteButtons = Array.from(deleteButtons).filter(button => {
      const parent = button.closest('div');
      return parent && parent.textContent?.includes('Action 2');
    });
    
    fireEvent.click(actionDeleteButtons[0]);
    
    // Now there should be only one action again
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.queryByText('Action 2')).not.toBeInTheDocument();
  });

  test('validates and saves the strategy', async () => {
    render(
      <ExecutionRulesBuilder
        strategy={mockStrategy}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    // Update the strategy name
    fireEvent.change(screen.getByLabelText('Strategy Name'), {
      target: { value: 'Updated Strategy Name' },
    });
    
    // Save the strategy
    fireEvent.click(screen.getByText('Save Strategy'));
    
    // Check if onSave was called with the updated strategy
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      name: 'Updated Strategy Name',
      description: 'Test Description',
    }));
  });

  test('tests the strategy', async () => {
    render(
      <ExecutionRulesBuilder
        strategy={mockStrategy}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    // Test the strategy
    fireEvent.click(screen.getByText('Test Strategy'));
    
    // Check if testExecutionStrategy was called
    await waitFor(() => {
      expect(alertsServiceExtensions.testExecutionStrategy).toHaveBeenCalled();
    });
  });

  test('cancels editing', () => {
    render(
      <ExecutionRulesBuilder
        strategy={mockStrategy}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });
});