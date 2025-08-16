import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizationConstraintBuilder from '../OptimizationConstraintBuilder';
import portfolioOptimizationService from '../../../frontend/src/services/portfolioOptimizationService';

// Mock the portfolio optimization service
jest.mock('../../../frontend/src/services/portfolioOptimizationService', () => ({
  getConstraintTemplates: jest.fn(),
}));

describe('OptimizationConstraintBuilder', () => {
  const mockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
  const mockSectorData = {
    'Technology': ['AAPL', 'MSFT', 'GOOGL'],
    'Consumer Discretionary': ['AMZN'],
    'Communication Services': ['META']
  };
  const mockAssetClassData = {
    'Equity': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
    'Fixed Income': [],
    'Cash': []
  };
  const mockOnConstraintsChange = jest.fn();
  const mockInitialConstraints = [
    { type: 'min_weight', parameters: { min_weight: 0.01 } },
    { type: 'max_weight', parameters: { max_weight: 0.3 } }
  ];
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders the component title', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} />);
    expect(screen.getByText('Portfolio Optimization Constraints')).toBeInTheDocument();
  });

  test('displays initial constraints if provided', () => {
    render(
      <OptimizationConstraintBuilder 
        symbols={mockSymbols} 
        initialConstraints={mockInitialConstraints}
      />
    );
    
    // Check if initial constraints are displayed
    expect(screen.getByText('Minimum Weight: 0.01')).toBeInTheDocument();
    expect(screen.getByText('Maximum Weight: 0.3')).toBeInTheDocument();
  });

  test('allows adding a minimum weight constraint', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} onConstraintsChange={mockOnConstraintsChange} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const minWeightOption = screen.getByText('Minimum Weight');
    fireEvent.click(minWeightOption);
    
    // Set minimum weight value
    const minWeightInput = screen.getByLabelText('Minimum Weight');
    fireEvent.change(minWeightInput, { target: { value: '0.05' } });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if constraint was added
    expect(screen.getByText('Minimum Weight: 0.05')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { type: 'min_weight', parameters: { min_weight: 0.05 } }
    ]);
  });

  test('allows adding a maximum weight constraint', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} onConstraintsChange={mockOnConstraintsChange} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const maxWeightOption = screen.getByText('Maximum Weight');
    fireEvent.click(maxWeightOption);
    
    // Set maximum weight value
    const maxWeightInput = screen.getByLabelText('Maximum Weight');
    fireEvent.change(maxWeightInput, { target: { value: '0.25' } });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if constraint was added
    expect(screen.getByText('Maximum Weight: 0.25')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { type: 'max_weight', parameters: { max_weight: 0.25 } }
    ]);
  });

  test('allows adding a symbol weight constraint', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} onConstraintsChange={mockOnConstraintsChange} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const symbolWeightOption = screen.getByText('Symbol Weight');
    fireEvent.click(symbolWeightOption);
    
    // Select symbol
    const symbolInput = screen.getByLabelText('Symbol');
    fireEvent.mouseDown(symbolInput);
    const appleOption = screen.getByText('AAPL');
    fireEvent.click(appleOption);
    
    // Set min and max weight values
    const minWeightInput = screen.getByLabelText('Minimum Weight');
    fireEvent.change(minWeightInput, { target: { value: '0.1' } });
    
    const maxWeightInput = screen.getByLabelText('Maximum Weight');
    fireEvent.change(maxWeightInput, { target: { value: '0.2' } });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if constraint was added
    expect(screen.getByText('Symbol AAPL: Min=0.1, Max=0.2')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { 
        type: 'symbol_weight', 
        parameters: { 
          symbol: 'AAPL', 
          min_weight: 0.1, 
          max_weight: 0.2 
        } 
      }
    ]);
  });

  test('allows adding a sector weight constraint', () => {
    render(
      <OptimizationConstraintBuilder 
        symbols={mockSymbols} 
        sectorData={mockSectorData}
        onConstraintsChange={mockOnConstraintsChange} 
      />
    );
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const sectorWeightOption = screen.getByText('Sector Weight');
    fireEvent.click(sectorWeightOption);
    
    // Select sector
    const sectorSelect = screen.getByLabelText('Sector');
    fireEvent.mouseDown(sectorSelect);
    const technologyOption = screen.getByText('Technology');
    fireEvent.click(technologyOption);
    
    // Set min and max weight values
    const minWeightInput = screen.getByLabelText('Minimum Weight');
    fireEvent.change(minWeightInput, { target: { value: '0.2' } });
    
    const maxWeightInput = screen.getByLabelText('Maximum Weight');
    fireEvent.change(maxWeightInput, { target: { value: '0.5' } });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if constraint was added
    expect(screen.getByText('Sector Technology: Min=0.2, Max=0.5')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { 
        type: 'sector_weight', 
        parameters: { 
          sector: 'Technology', 
          min_weight: 0.2, 
          max_weight: 0.5 
        } 
      }
    ]);
  });

  test('allows adding a factor exposure constraint', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} onConstraintsChange={mockOnConstraintsChange} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const factorExposureOption = screen.getByText('Factor Exposure');
    fireEvent.click(factorExposureOption);
    
    // Select factor
    const factorSelect = screen.getByLabelText('Factor');
    fireEvent.mouseDown(factorSelect);
    const valueOption = screen.getByText('value');
    fireEvent.click(valueOption);
    
    // Set min and max exposure values
    const minExposureInput = screen.getByLabelText('Minimum Exposure');
    fireEvent.change(minExposureInput, { target: { value: '0.2' } });
    
    const maxExposureInput = screen.getByLabelText('Maximum Exposure');
    fireEvent.change(maxExposureInput, { target: { value: '0.8' } });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if constraint was added
    expect(screen.getByText('Factor value: Min=0.2 Max=0.8')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { 
        type: 'factor_exposure', 
        parameters: { 
          factor: 'value', 
          min_exposure: 0.2, 
          max_exposure: 0.8 
        } 
      }
    ]);
  });

  test('allows adding a custom constraint', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} onConstraintsChange={mockOnConstraintsChange} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const customOption = screen.getByText('Custom Constraint');
    fireEvent.click(customOption);
    
    // Set custom constraint JSON
    const customJsonInput = screen.getByLabelText('Custom Constraint JSON');
    fireEvent.change(customJsonInput, { 
      target: { 
        value: '{\n  "type": "custom",\n  "parameters": {\n    "custom_param": 0.5\n  }\n}' 
      } 
    });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if constraint was added
    expect(screen.getByText('Custom: {"custom_param":0.5}')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { 
        type: 'custom', 
        parameters: { 
          custom_param: 0.5
        } 
      }
    ]);
  });

  test('allows removing a constraint', () => {
    render(
      <OptimizationConstraintBuilder 
        symbols={mockSymbols} 
        initialConstraints={mockInitialConstraints}
        onConstraintsChange={mockOnConstraintsChange} 
      />
    );
    
    // Find and click the delete button for the first constraint
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Check if constraint was removed
    expect(screen.queryByText('Minimum Weight: 0.01')).not.toBeInTheDocument();
    expect(screen.getByText('Maximum Weight: 0.3')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { type: 'max_weight', parameters: { max_weight: 0.3 } }
    ]);
  });

  test('allows editing a constraint', () => {
    render(
      <OptimizationConstraintBuilder 
        symbols={mockSymbols} 
        initialConstraints={mockInitialConstraints}
        onConstraintsChange={mockOnConstraintsChange} 
      />
    );
    
    // Click on the first constraint to edit it
    const minWeightConstraint = screen.getByText('Minimum Weight: 0.01');
    fireEvent.click(minWeightConstraint);
    
    // Change the minimum weight value
    const minWeightInput = screen.getByLabelText('Minimum Weight');
    fireEvent.change(minWeightInput, { target: { value: '0.02' } });
    
    // Click Update button
    const updateButton = screen.getByText('Update Constraint');
    fireEvent.click(updateButton);
    
    // Check if constraint was updated
    expect(screen.getByText('Minimum Weight: 0.02')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { type: 'min_weight', parameters: { min_weight: 0.02 } },
      { type: 'max_weight', parameters: { max_weight: 0.3 } }
    ]);
  });

  test('allows duplicating a constraint', () => {
    render(
      <OptimizationConstraintBuilder 
        symbols={mockSymbols} 
        initialConstraints={mockInitialConstraints}
        onConstraintsChange={mockOnConstraintsChange} 
      />
    );
    
    // Find and click the duplicate button for the first constraint
    const duplicateButtons = screen.getAllByRole('button', { name: /duplicate/i });
    fireEvent.click(duplicateButtons[0]);
    
    // Check if constraint was duplicated
    const minWeightConstraints = screen.getAllByText('Minimum Weight: 0.01');
    expect(minWeightConstraints).toHaveLength(2);
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { type: 'min_weight', parameters: { min_weight: 0.01 } },
      { type: 'max_weight', parameters: { max_weight: 0.3 } },
      { type: 'min_weight', parameters: { min_weight: 0.01 } }
    ]);
  });

  test('displays constraint templates', async () => {
    // Mock constraint templates
    const mockTemplates = {
      'no_short': {
        name: 'No Short Selling',
        description: 'Ensures all weights are non-negative',
        constraint: { type: 'min_weight', parameters: { min_weight: 0 } }
      },
      'max_exposure': {
        name: 'Maximum Single Stock Exposure',
        description: 'Limits exposure to any single stock',
        constraint: { type: 'max_weight', parameters: { max_weight: 0.2 } }
      }
    };
    
    (portfolioOptimizationService.getConstraintTemplates as jest.Mock).mockResolvedValue(mockTemplates);
    
    render(<OptimizationConstraintBuilder symbols={mockSymbols} />);
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('No Short Selling')).toBeInTheDocument();
      expect(screen.getByText('Maximum Single Stock Exposure')).toBeInTheDocument();
    });
  });

  test('allows applying a constraint template', async () => {
    // Mock constraint templates
    const mockTemplates = {
      'no_short': {
        name: 'No Short Selling',
        description: 'Ensures all weights are non-negative',
        constraint: { type: 'min_weight', parameters: { min_weight: 0 } }
      }
    };
    
    (portfolioOptimizationService.getConstraintTemplates as jest.Mock).mockResolvedValue(mockTemplates);
    
    render(<OptimizationConstraintBuilder symbols={mockSymbols} onConstraintsChange={mockOnConstraintsChange} />);
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('No Short Selling')).toBeInTheDocument();
    });
    
    // Click on the template to apply it
    const templateChip = screen.getByText('No Short Selling');
    fireEvent.click(templateChip);
    
    // Check if constraint was added
    expect(screen.getByText('Minimum Weight: 0')).toBeInTheDocument();
    
    // Check if onConstraintsChange callback was called
    expect(mockOnConstraintsChange).toHaveBeenCalledWith([
      { type: 'min_weight', parameters: { min_weight: 0 } }
    ]);
  });

  test('allows saving a constraint as template', async () => {
    render(
      <OptimizationConstraintBuilder 
        symbols={mockSymbols} 
        initialConstraints={mockInitialConstraints}
        onConstraintsChange={mockOnConstraintsChange} 
      />
    );
    
    // Click on the first constraint to select it
    const minWeightConstraint = screen.getByText('Minimum Weight: 0.01');
    fireEvent.click(minWeightConstraint);
    
    // Click Save as Template button
    const saveButton = screen.getByText('Save as Template');
    fireEvent.click(saveButton);
    
    // Fill in template name and description
    const nameInput = screen.getByLabelText('Template Name');
    fireEvent.change(nameInput, { target: { value: 'My Template' } });
    
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'My custom template' } });
    
    // Click Save button in dialog
    const dialogSaveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(dialogSaveButton);
    
    // Check if template was added
    await waitFor(() => {
      expect(screen.getByText('My Template')).toBeInTheDocument();
    });
  });

  test('validates custom constraint JSON', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const customOption = screen.getByText('Custom Constraint');
    fireEvent.click(customOption);
    
    // Set invalid JSON
    const customJsonInput = screen.getByLabelText('Custom Constraint JSON');
    fireEvent.change(customJsonInput, { 
      target: { 
        value: '{ invalid json }' 
      } 
    });
    
    // Click Add Constraint button
    const addButton = screen.getByText('Add Constraint');
    fireEvent.click(addButton);
    
    // Check if error message is displayed
    expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
  });

  test('resets form when Reset button is clicked', () => {
    render(<OptimizationConstraintBuilder symbols={mockSymbols} />);
    
    // Select constraint type
    const constraintTypeSelect = screen.getByLabelText('Constraint Type');
    fireEvent.mouseDown(constraintTypeSelect);
    const maxWeightOption = screen.getByText('Maximum Weight');
    fireEvent.click(maxWeightOption);
    
    // Set maximum weight value
    const maxWeightInput = screen.getByLabelText('Maximum Weight');
    fireEvent.change(maxWeightInput, { target: { value: '0.25' } });
    
    // Click Reset button
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // Check if form was reset
    expect(constraintTypeSelect).toHaveValue('min_weight');
  });
});