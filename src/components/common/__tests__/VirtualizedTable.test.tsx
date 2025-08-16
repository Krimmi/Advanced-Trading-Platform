import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VirtualizedTable from '../VirtualizedTable';

// Mock the useIntersectionObserver hook
jest.mock('../../../hooks/useIntersectionObserver', () => {
  return jest.fn().mockImplementation(() => {
    const ref = React.useRef(null);
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    
    // Expose a function to simulate intersection
    (window as any).simulateIntersection = (intersecting: boolean) => {
      setIsIntersecting(intersecting);
    };
    
    return [ref, isIntersecting];
  });
});

// Mock data for testing
const mockColumns = [
  { id: 'id', label: 'ID', minWidth: 50 },
  { id: 'name', label: 'Name', minWidth: 100 },
  { id: 'age', label: 'Age', minWidth: 50, align: 'right' as const },
  { 
    id: 'status', 
    label: 'Status', 
    minWidth: 80,
    format: (value: string) => (
      <span data-testid={`status-${value}`}>
        {value === 'active' ? '✅ Active' : '❌ Inactive'}
      </span>
    )
  }
];

const mockData = Array(100).fill(null).map((_, index) => ({
  id: index + 1,
  name: `Person ${index + 1}`,
  age: 20 + (index % 50),
  status: index % 3 === 0 ? 'active' : 'inactive'
}));

describe('VirtualizedTable', () => {
  beforeEach(() => {
    // Reset the simulateIntersection function
    (window as any).simulateIntersection = undefined;
  });

  test('renders table headers correctly', () => {
    render(
      <VirtualizedTable
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );

    // Check if all column headers are rendered
    mockColumns.forEach(column => {
      expect(screen.getByText(column.label)).toBeInTheDocument();
    });
  });

  test('renders initial rows correctly', () => {
    render(
      <VirtualizedTable
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        initialRowsToRender={10}
      />
    );

    // Check if the first 10 rows are rendered
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`Person ${i + 1}`)).toBeInTheDocument();
    }

    // Check if the 11th row is not rendered
    expect(screen.queryByText('Person 11')).not.toBeInTheDocument();
  });

  test('loads more rows when intersection is detected', async () => {
    render(
      <VirtualizedTable
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        initialRowsToRender={10}
        rowsPerPage={5}
      />
    );

    // Initially, only the first 10 rows should be visible
    expect(screen.getByText('Person 10')).toBeInTheDocument();
    expect(screen.queryByText('Person 15')).not.toBeInTheDocument();

    // Simulate intersection
    (window as any).simulateIntersection(true);

    // Wait for the next batch of rows to be rendered
    await waitFor(() => {
      expect(screen.getByText('Person 15')).toBeInTheDocument();
    });
  });

  test('formats cell values using the format function', () => {
    render(
      <VirtualizedTable
        columns={mockColumns}
        data={mockData.slice(0, 5)}
        keyExtractor={(item) => item.id}
      />
    );

    // Check if the status cells are formatted correctly
    expect(screen.getByTestId('status-active')).toHaveTextContent('✅ Active');
    expect(screen.getByTestId('status-inactive')).toHaveTextContent('❌ Inactive');
  });

  test('applies custom row styles', () => {
    const rowStyle = jest.fn().mockImplementation((item) => ({
      backgroundColor: item.id % 2 === 0 ? 'lightblue' : 'white'
    }));

    render(
      <VirtualizedTable
        columns={mockColumns}
        data={mockData.slice(0, 5)}
        keyExtractor={(item) => item.id}
        rowStyle={rowStyle}
      />
    );

    // Check if rowStyle was called for each row
    expect(rowStyle).toHaveBeenCalledTimes(5);
  });

  test('handles row click events', () => {
    const onRowClick = jest.fn();

    render(
      <VirtualizedTable
        columns={mockColumns}
        data={mockData.slice(0, 5)}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
      />
    );

    // Click on the first row
    fireEvent.click(screen.getByText('Person 1'));

    // Check if onRowClick was called with the correct item
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  test('displays loading state correctly', () => {
    render(
      <VirtualizedTable
        columns={mockColumns}
        data={[]}
        keyExtractor={(item) => item.id}
        loading={true}
      />
    );

    // Check if loading indicator is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays empty message when no data', () => {
    const emptyMessage = 'No data available for testing';
    
    render(
      <VirtualizedTable
        columns={mockColumns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage={emptyMessage}
      />
    );

    // Check if empty message is displayed
    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });
});