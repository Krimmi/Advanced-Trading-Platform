import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScreenerCriteriaBuilder from '../ScreenerCriteriaBuilder';
import screenerService from '../../../services/screenerService';

// Mock the screenerService
jest.mock('../../../services/screenerService', () => ({
  getOperatorsForFieldType: jest.fn(),
  getOperatorDisplayText: jest.fn(),
  getPredefinedFilters: jest.fn(),
}));

describe('ScreenerCriteriaBuilder', () => {
  const mockFilters = [
    {
      metric: 'pe',
      operator: 'less_than',
      value: 20,
      category: 'Valuation',
    },
  ];

  const mockAvailableMetrics = [
    {
      category: 'Price & Volume',
      metrics: [
        { id: 'price', name: 'Price', description: 'Current stock price' },
        { id: 'volume', name: 'Volume', description: 'Trading volume' },
      ],
    },
    {
      category: 'Fundamentals',
      metrics: [
        { id: 'pe', name: 'P/E Ratio', description: 'Price to earnings ratio' },
        { id: 'eps', name: 'EPS', description: 'Earnings per share' },
      ],
    },
  ];

  const mockProps = {
    filters: mockFilters,
    onFiltersChange: jest.fn(),
    availableMetrics: mockAvailableMetrics,
    screenName: 'Test Screen',
    onScreenNameChange: jest.fn(),
    screenDescription: 'Test Description',
    onScreenDescriptionChange: jest.fn(),
    sortBy: 'marketCap',
    sortDirection: 'desc' as 'asc' | 'desc',
    onSortChange: jest.fn(),
    onRunScreener: jest.fn(),
    onSaveScreen: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (screenerService.getOperatorsForFieldType as jest.Mock).mockReturnValue([
      'equals', 'not_equals', 'greater_than', 'less_than', 'between',
    ]);
    (screenerService.getOperatorDisplayText as jest.Mock).mockImplementation((op) => {
      const map: Record<string, string> = {
        'equals': 'equals',
        'not_equals': 'not equals',
        'greater_than': 'greater than',
        'less_than': 'less than',
        'between': 'between',
      };
      return map[op] || op;
    });
    (screenerService.getPredefinedFilters as jest.Mock).mockImplementation((strategy) => {
      if (strategy === 'value') {
        return [
          {
            metric: 'pe',
            operator: 'less_than',
            value: 15,
            category: 'Valuation',
          },
          {
            metric: 'priceToBook',
            operator: 'less_than',
            value: 1.5,
            category: 'Valuation',
          },
        ];
      }
      return [];
    });
  });

  test('renders the component with initial filters', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    // Check if screen configuration is rendered
    expect(screen.getByText('Screen Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('Screen Name')).toHaveValue('Test Screen');
    expect(screen.getByLabelText('Description (Optional)')).toHaveValue('Test Description');
    
    // Check if predefined strategies section is rendered
    expect(screen.getByText('Predefined Strategies')).toBeInTheDocument();
    expect(screen.getByText('Value Investing')).toBeInTheDocument();
    expect(screen.getByText('Growth Investing')).toBeInTheDocument();
    expect(screen.getByText('Momentum Strategy')).toBeInTheDocument();
    
    // Check if filter criteria section is rendered
    expect(screen.getByText('Filter Criteria')).toBeInTheDocument();
    expect(screen.getByText('Applied Filters (1)')).toBeInTheDocument();
    expect(screen.getByText(/P\/E Ratio/)).toBeInTheDocument();
    expect(screen.getByText(/less than/)).toBeInTheDocument();
    expect(screen.getByText('Valuation')).toBeInTheDocument();
    
    // Check if sort results section is rendered
    expect(screen.getByText('Sort Results')).toBeInTheDocument();
    
    // Check if buttons are rendered
    expect(screen.getByText('Save Screen')).toBeInTheDocument();
    expect(screen.getByText('Run Screen')).toBeInTheDocument();
  });

  test('handles screen name and description changes', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    const nameInput = screen.getByLabelText('Screen Name');
    fireEvent.change(nameInput, { target: { value: 'New Screen Name' } });
    expect(mockProps.onScreenNameChange).toHaveBeenCalledWith('New Screen Name');
    
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    expect(mockProps.onScreenDescriptionChange).toHaveBeenCalledWith('New Description');
  });

  test('handles loading predefined filters', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    const valueButton = screen.getByText('Value Investing');
    fireEvent.click(valueButton);
    
    expect(screenerService.getPredefinedFilters).toHaveBeenCalledWith('value');
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith([
      {
        metric: 'pe',
        operator: 'less_than',
        value: 15,
        category: 'Valuation',
      },
      {
        metric: 'priceToBook',
        operator: 'less_than',
        value: 1.5,
        category: 'Valuation',
      },
    ]);
    expect(mockProps.onScreenNameChange).toHaveBeenCalledWith('Value Strategy');
  });

  test('handles removing a filter', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    // Find and click the delete button for the filter
    const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith([]);
  });

  test('handles clearing all filters', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith([]);
  });

  test('handles sort changes', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    // Change sort by
    const sortBySelect = screen.getByLabelText('Sort By');
    fireEvent.mouseDown(sortBySelect);
    const priceOption = screen.getByText('Price');
    fireEvent.click(priceOption);
    
    expect(mockProps.onSortChange).toHaveBeenCalledWith('price', 'desc');
    
    // Change sort direction
    const directionSelect = screen.getByLabelText('Direction');
    fireEvent.mouseDown(directionSelect);
    const ascOption = screen.getByText('Ascending');
    fireEvent.click(ascOption);
    
    expect(mockProps.onSortChange).toHaveBeenCalledWith('marketCap', 'asc');
  });

  test('handles adding a new filter', async () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    // Select category
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    const priceCategory = screen.getByText('Price & Volume');
    fireEvent.click(priceCategory);
    
    // Select metric
    const metricSelect = screen.getByLabelText('Metric');
    fireEvent.mouseDown(metricSelect);
    const priceMetric = screen.getByText('Price');
    fireEvent.click(priceMetric);
    
    // Select operator
    const operatorSelect = screen.getByLabelText('Operator');
    fireEvent.mouseDown(operatorSelect);
    const greaterThanOp = screen.getByText('greater than');
    fireEvent.click(greaterThanOp);
    
    // Enter value
    const valueInput = screen.getByLabelText('Value');
    fireEvent.change(valueInput, { target: { value: '100' } });
    
    // Click add button
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith([
      ...mockFilters,
      {
        metric: 'price',
        operator: 'greater_than',
        value: '100',
        category: 'Price & Volume',
      },
    ]);
  });

  test('handles run and save actions', () => {
    render(<ScreenerCriteriaBuilder {...mockProps} />);
    
    const runButton = screen.getByText('Run Screen');
    fireEvent.click(runButton);
    expect(mockProps.onRunScreener).toHaveBeenCalled();
    
    const saveButton = screen.getByText('Save Screen');
    fireEvent.click(saveButton);
    expect(mockProps.onSaveScreen).toHaveBeenCalled();
  });

  test('disables buttons when loading', () => {
    render(<ScreenerCriteriaBuilder {...mockProps, loading: true} />);
    
    const runButton = screen.getByText('Run Screen');
    const saveButton = screen.getByText('Save Screen');
    
    expect(runButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });
});