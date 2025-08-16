import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomIndicatorBuilder from '../CustomIndicatorBuilder';
import { technicalServiceExtensions } from '../../../services';

// Mock the services
jest.mock('../../../services', () => ({
  technicalService: {
    getAvailableIndicators: jest.fn(),
  },
  technicalServiceExtensions: {
    createCustomIndicator: jest.fn(),
    updateCustomIndicator: jest.fn(),
    deleteCustomIndicator: jest.fn(),
  },
}));

describe('CustomIndicatorBuilder', () => {
  const mockCustomIndicators = [
    {
      id: '1',
      name: 'Custom RSI',
      description: 'Modified RSI indicator',
      formula: 'rsi(close, 14) * 1.5',
      parameters: [
        {
          name: 'period',
          type: 'number',
          defaultValue: 14,
          min: 2,
          max: 50,
        },
        {
          name: 'multiplier',
          type: 'number',
          defaultValue: 1.5,
          min: 0.1,
          max: 5,
        },
      ],
      isPublic: true,
      userId: 'user1',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  ];

  const mockProps = {
    onIndicatorCreated: jest.fn(),
    onIndicatorUpdated: jest.fn(),
    onIndicatorDeleted: jest.fn(),
    customIndicators: mockCustomIndicators,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with tabs', () => {
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    expect(screen.getByText('Create/Edit Indicator')).toBeInTheDocument();
    expect(screen.getByText('My Indicators')).toBeInTheDocument();
  });

  test('displays the create indicator form', () => {
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    expect(screen.getByText('Create New Indicator')).toBeInTheDocument();
    expect(screen.getByLabelText('Indicator Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Formula')).toBeInTheDocument();
    expect(screen.getByText('Make Public')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Add Parameter')).toBeInTheDocument();
  });

  test('allows adding parameters', async () => {
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    // Click the Add Parameter button
    fireEvent.click(screen.getByText('Add Parameter'));
    
    // Check if parameter form appears
    await waitFor(() => {
      expect(screen.getByText('Parameter 1')).toBeInTheDocument();
    });
    
    // Check if parameter fields are rendered
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  test('switches to My Indicators tab and displays indicators', () => {
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    // Click on the My Indicators tab
    fireEvent.click(screen.getByText('My Indicators'));
    
    // Check if the indicator is displayed
    expect(screen.getByText('Custom RSI')).toBeInTheDocument();
    expect(screen.getByText('Modified RSI indicator')).toBeInTheDocument();
    expect(screen.getByText('Formula:')).toBeInTheDocument();
    expect(screen.getByText('rsi(close, 14) * 1.5')).toBeInTheDocument();
    expect(screen.getByText('Parameters:')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('handles creating a new indicator', async () => {
    const mockCreatedIndicator = {
      id: '2',
      name: 'New Indicator',
      description: 'Test description',
      formula: 'sma(close, 20)',
      parameters: [],
      isPublic: false,
      userId: 'user1',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    };
    
    (technicalServiceExtensions.createCustomIndicator as jest.Mock).mockResolvedValue(mockCreatedIndicator);
    
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Indicator Name'), {
      target: { value: 'New Indicator' },
    });
    
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    });
    
    fireEvent.change(screen.getByLabelText('Formula'), {
      target: { value: 'sma(close, 20)' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(technicalServiceExtensions.createCustomIndicator).toHaveBeenCalledWith({
        name: 'New Indicator',
        description: 'Test description',
        formula: 'sma(close, 20)',
        parameters: [],
        isPublic: false,
      });
    });
    
    expect(mockProps.onIndicatorCreated).toHaveBeenCalledWith(mockCreatedIndicator);
  });

  test('handles editing an existing indicator', async () => {
    const mockUpdatedIndicator = {
      ...mockCustomIndicators[0],
      name: 'Updated RSI',
      description: 'Updated description',
    };
    
    (technicalServiceExtensions.updateCustomIndicator as jest.Mock).mockResolvedValue(mockUpdatedIndicator);
    
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    // Go to My Indicators tab
    fireEvent.click(screen.getByText('My Indicators'));
    
    // Click Edit button
    fireEvent.click(screen.getByText('Edit'));
    
    // Check if form is filled with indicator data
    expect(screen.getByLabelText('Indicator Name')).toHaveValue('Custom RSI');
    expect(screen.getByLabelText('Description')).toHaveValue('Modified RSI indicator');
    expect(screen.getByLabelText('Formula')).toHaveValue('rsi(close, 14) * 1.5');
    
    // Update the name
    fireEvent.change(screen.getByLabelText('Indicator Name'), {
      target: { value: 'Updated RSI' },
    });
    
    // Update the description
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Updated description' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Update'));
    
    await waitFor(() => {
      expect(technicalServiceExtensions.updateCustomIndicator).toHaveBeenCalledWith('1', {
        name: 'Updated RSI',
        description: 'Updated description',
        formula: 'rsi(close, 14) * 1.5',
        parameters: mockCustomIndicators[0].parameters,
        isPublic: true,
      });
    });
    
    expect(mockProps.onIndicatorUpdated).toHaveBeenCalledWith(mockUpdatedIndicator);
  });

  test('handles deleting an indicator', async () => {
    (technicalServiceExtensions.deleteCustomIndicator as jest.Mock).mockResolvedValue(true);
    
    render(<CustomIndicatorBuilder {...mockProps} />);
    
    // Go to My Indicators tab
    fireEvent.click(screen.getByText('My Indicators'));
    
    // Click Delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Confirm deletion in dialog
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Delete', { selector: 'button' }));
    
    await waitFor(() => {
      expect(technicalServiceExtensions.deleteCustomIndicator).toHaveBeenCalledWith('1');
    });
    
    expect(mockProps.onIndicatorDeleted).toHaveBeenCalledWith('1');
  });
});