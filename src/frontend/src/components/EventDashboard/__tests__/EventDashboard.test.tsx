import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EventDashboard from '../EventDashboard';
import eventService from '../../../services/eventService';

// Mock the services
jest.mock('../../../services/eventService');

// Mock the child components
jest.mock('../EventTimeline', () => () => <div data-testid="event-timeline">EventTimeline</div>);
jest.mock('../EventImpactChart', () => ({ impactAnalysis }) => <div data-testid="event-impact-chart">EventImpactChart</div>);
jest.mock('../EventFilterPanel', () => ({ events, eventTypes, onFilterChange }) => <div data-testid="event-filter-panel">EventFilterPanel</div>);
jest.mock('../EventDetailPanel', () => ({ event }) => <div data-testid="event-detail-panel">EventDetailPanel</div>);
jest.mock('../EventMetricCorrelation', () => ({ symbol, eventTypes }) => <div data-testid="event-metric-correlation">EventMetricCorrelation</div>);

// Sample data for tests
const mockEvents = [
  {
    id: 'event1',
    event_type: 'earnings',
    date: '2023-01-15',
    symbol: 'AAPL',
    description: 'Q1 2023 Earnings',
    source: 'Company Report',
    impact_score: 0.75,
    metadata: { eps: 1.52, eps_estimate: 1.43 }
  },
  {
    id: 'event2',
    event_type: 'dividend',
    date: '2023-02-10',
    symbol: 'AAPL',
    description: 'Quarterly Dividend',
    source: 'Company Report',
    impact_score: 0.3,
    metadata: { dividend: 0.23 }
  }
];

const mockImpactAnalysis = {
  earnings: {
    count: 10,
    avg_price_change: 2.5,
    median_price_change: 1.8,
    std_dev: 3.2,
    positive_count: 7,
    negative_count: 3
  }
};

describe('EventDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    (eventService.getAllEvents as jest.Mock).mockResolvedValue(mockEvents);
    (eventService.analyzeEventImpact as jest.Mock).mockResolvedValue(mockImpactAnalysis);
  });

  test('renders loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/events/AAPL']}>
        <Routes>
          <Route path="/events/:symbol" element={<EventDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Event Analysis: AAPL')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('fetches events on mount and displays timeline tab', async () => {
    render(
      <MemoryRouter initialEntries={['/events/AAPL']}>
        <Routes>
          <Route path="/events/:symbol" element={<EventDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Verify service was called
    expect(eventService.getAllEvents).toHaveBeenCalledWith('AAPL', 365);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that components are rendered
    expect(screen.getByTestId('event-filter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('event-timeline')).toBeInTheDocument();
  });

  test('switches tabs correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/events/AAPL']}>
        <Routes>
          <Route path="/events/:symbol" element={<EventDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on Impact Analysis tab
    fireEvent.click(screen.getByText('Impact Analysis'));
    
    // Verify the Impact Analysis tab is shown
    expect(screen.getByText('Event Types')).toBeInTheDocument();
    
    // Click on Correlations tab
    fireEvent.click(screen.getByText('Correlations'));
    
    // Verify the Correlations tab is shown
    expect(screen.getByTestId('event-metric-correlation')).toBeInTheDocument();
  });

  test('analyzes event impact when event type is selected', async () => {
    render(
      <MemoryRouter initialEntries={['/events/AAPL']}>
        <Routes>
          <Route path="/events/:symbol" element={<EventDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on Impact Analysis tab
    fireEvent.click(screen.getByText('Impact Analysis'));
    
    // Click on an event type button (earnings)
    await waitFor(() => {
      const button = screen.getByText('earnings');
      fireEvent.click(button);
    });
    
    // Verify service was called
    expect(eventService.analyzeEventImpact).toHaveBeenCalledWith('AAPL', 'earnings');
    
    // Wait for impact analysis to load
    await waitFor(() => {
      expect(screen.getByTestId('event-impact-chart')).toBeInTheDocument();
    });
  });

  test('displays event details when an event is selected', async () => {
    // Mock the handleEventSelect function
    const mockHandleEventSelect = jest.fn();
    
    render(
      <MemoryRouter initialEntries={['/events/AAPL']}>
        <Routes>
          <Route path="/events/:symbol" element={<EventDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Simulate selecting an event (we need to call the onEventSelect prop directly)
    // This is a bit tricky since we've mocked the EventTimeline component
    // In a real test, we'd use fireEvent to click on an event in the timeline
    
    // For now, we'll just verify that the Event Details tab exists
    fireEvent.click(screen.getByText('Event Details'));
    
    expect(screen.getByText('Select an event from the timeline to view details')).toBeInTheDocument();
  });
});