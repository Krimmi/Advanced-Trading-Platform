import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelPerformancePanel from '../ModelPerformancePanel';
import { MLService } from '../../../services';
import { MLModel, ModelType, ModelStatus } from '../../../types/ml';

// Mock the MLService
jest.mock('../../../services', () => ({
  MLService: jest.fn().mockImplementation(() => ({
    getModels: jest.fn().mockResolvedValue([
      {
        id: 'model-1',
        name: 'Test Model',
        description: 'A test model for unit tests',
        type: 'CLASSIFICATION',
        status: 'DEPLOYED',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        isProduction: true,
        metrics: {
          accuracy: 0.87,
          f1Score: 0.85,
          precision: 0.83,
          recall: 0.88,
          lastUpdated: '2023-01-02T00:00:00Z'
        }
      }
    ])
  }))
}));

describe('ModelPerformancePanel Component', () => {
  const mockModel: MLModel = {
    id: 'model-1',
    name: 'Test Model',
    description: 'A test model for unit tests',
    type: ModelType.CLASSIFICATION,
    status: ModelStatus.DEPLOYED,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    isProduction: true,
    metrics: {
      accuracy: 0.87,
      f1Score: 0.85,
      precision: 0.83,
      recall: 0.88,
      lastUpdated: '2023-01-02T00:00:00Z'
    }
  };

  const mockOnModelSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ModelPerformancePanel />);
    expect(screen.getByText('Model Performance Tracking')).toBeInTheDocument();
  });

  test('renders with selected model', async () => {
    render(<ModelPerformancePanel selectedModel={mockModel} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Model')).toBeInTheDocument();
      expect(screen.getByText('CLASSIFICATION')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  test('displays performance metrics', async () => {
    render(<ModelPerformancePanel selectedModel={mockModel} />);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Over Time')).toBeInTheDocument();
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    });
  });

  test('handles tab changes', async () => {
    render(<ModelPerformancePanel selectedModel={mockModel} />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
    
    // Click on Comparison tab
    fireEvent.click(screen.getByText('Comparison'));
    
    await waitFor(() => {
      expect(screen.getByText('Model Comparison')).toBeInTheDocument();
      expect(screen.getByText('Performance Comparison')).toBeInTheDocument();
    });
    
    // Click on Detailed Metrics tab
    fireEvent.click(screen.getByText('Detailed Metrics'));
    
    await waitFor(() => {
      expect(screen.getByText('Detailed Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Performance Distribution')).toBeInTheDocument();
    });
  });

  test('calls onModelSelect when a model is selected', async () => {
    // Mock the MLService to return multiple models
    jest.spyOn(MLService.prototype, 'getModels').mockResolvedValue([
      mockModel,
      {
        ...mockModel,
        id: 'model-2',
        name: 'Another Model'
      }
    ]);

    render(
      <ModelPerformancePanel 
        onModelSelect={mockOnModelSelect} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText('Select Model')).toBeInTheDocument();
    });
    
    // Open the dropdown
    fireEvent.mouseDown(screen.getByLabelText('Select Model'));
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Model (CLASSIFICATION)')).toBeInTheDocument();
    });
    
    // Select a model
    fireEvent.click(screen.getByText('Test Model (CLASSIFICATION)'));
    
    expect(mockOnModelSelect).toHaveBeenCalled();
  });

  test('handles time range filter changes', async () => {
    render(<ModelPerformancePanel selectedModel={mockModel} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Time Range')).toBeInTheDocument();
    });
    
    // Open the dropdown
    fireEvent.mouseDown(screen.getByLabelText('Time Range'));
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Last Week')).toBeInTheDocument();
    });
    
    // Select a time range
    fireEvent.click(screen.getByText('Last Week'));
    
    // The component should update with the new time range
    // This is mostly a UI state change, so we're just checking that it doesn't crash
    expect(screen.getByLabelText('Time Range')).toBeInTheDocument();
  });
});