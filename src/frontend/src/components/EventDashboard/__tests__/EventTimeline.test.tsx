import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventTimeline from '../EventTimeline';

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
  },
  {
    id: 'event3',
    event_type: 'product_launch',
    date: '2023-03-08',
    symbol: 'AAPL',
    description: 'New Product Announcement',
    source: 'Press Release',
    impact_score: 0.6,
    metadata: { product: 'iPhone SE 3' }
  },
  {
    id: 'event4',
    event_type: 'analyst_rating',
    date: '2023-04-05',
    symbol: 'AAPL',
    description: 'Analyst Upgrade',
    source: 'Morgan Stanley',
    impact_score: 0.4,
    metadata: { old_rating: 'Hold', new_rating: 'Buy', target_price: 180 }
  }
];

describe('EventTimeline Component', () => {
  test('renders timeline with events', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={mockEvents} onEventSelect={handleEventSelect} />);
    
    // Check that the component renders
    expect(screen.getByText('Event Timeline')).toBeInTheDocument();
    
    // Check that all events are rendered
    expect(screen.getByText('Q1 2023 Earnings')).toBeInTheDocument();
    expect(screen.getByText('Quarterly Dividend')).toBeInTheDocument();
    expect(screen.getByText('New Product Announcement')).toBeInTheDocument();
    expect(screen.getByText('Analyst Upgrade')).toBeInTheDocument();
    
    // Check that dates are formatted correctly
    expect(screen.getByText('Jan 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('Feb 10, 2023')).toBeInTheDocument();
    expect(screen.getByText('Mar 8, 2023')).toBeInTheDocument();
    expect(screen.getByText('Apr 5, 2023')).toBeInTheDocument();
  });

  test('calls onEventSelect when an event is clicked', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={mockEvents} onEventSelect={handleEventSelect} />);
    
    // Click on an event
    fireEvent.click(screen.getByText('Q1 2023 Earnings'));
    
    // Check that the handler was called with the correct event
    expect(handleEventSelect).toHaveBeenCalledWith(mockEvents[0]);
  });

  test('displays event types with appropriate icons', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={mockEvents} onEventSelect={handleEventSelect} />);
    
    // Check that event type indicators are rendered
    const eventTypeElements = screen.getAllByTestId('event-type-indicator');
    expect(eventTypeElements.length).toBe(4);
    
    // Check that event types are displayed
    expect(screen.getByText('Earnings')).toBeInTheDocument();
    expect(screen.getByText('Dividend')).toBeInTheDocument();
    expect(screen.getByText('Product Launch')).toBeInTheDocument();
    expect(screen.getByText('Analyst Rating')).toBeInTheDocument();
  });

  test('displays impact scores with appropriate colors', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={mockEvents} onEventSelect={handleEventSelect} />);
    
    // Check that impact score indicators are rendered
    const impactScoreElements = screen.getAllByTestId('impact-score');
    expect(impactScoreElements.length).toBe(4);
    
    // Check that impact scores are displayed
    expect(screen.getByText('High Impact')).toBeInTheDocument(); // For 0.75
    expect(screen.getByText('Low Impact')).toBeInTheDocument(); // For 0.3
    expect(screen.getByText('Medium Impact')).toBeInTheDocument(); // For 0.6 and 0.4
  });

  test('renders empty state when no events are provided', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={[]} onEventSelect={handleEventSelect} />);
    
    // Check that empty state message is displayed
    expect(screen.getByText('No events found for the selected filters')).toBeInTheDocument();
  });

  test('sorts events by date in descending order', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={mockEvents} onEventSelect={handleEventSelect} />);
    
    // Get all date elements
    const dateElements = screen.getAllByTestId('event-date');
    
    // Check that dates are in descending order (most recent first)
    expect(dateElements[0].textContent).toBe('Apr 5, 2023');
    expect(dateElements[1].textContent).toBe('Mar 8, 2023');
    expect(dateElements[2].textContent).toBe('Feb 10, 2023');
    expect(dateElements[3].textContent).toBe('Jan 15, 2023');
  });

  test('displays event metadata', () => {
    const handleEventSelect = jest.fn();
    render(<EventTimeline events={mockEvents} onEventSelect={handleEventSelect} />);
    
    // Check that metadata is displayed for earnings event
    expect(screen.getByText('EPS: 1.52')).toBeInTheDocument();
    expect(screen.getByText('Est: 1.43')).toBeInTheDocument();
    
    // Check that metadata is displayed for dividend event
    expect(screen.getByText('Dividend: $0.23')).toBeInTheDocument();
    
    // Check that metadata is displayed for analyst rating event
    expect(screen.getByText('Hold → Buy')).toBeInTheDocument();
    expect(screen.getByText('Target: $180')).toBeInTheDocument();
  });
});