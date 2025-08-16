# Personalized Dashboard Feature

## Overview

The Personalized Dashboard is a flexible, customizable dashboard system that allows users to create their own dashboards with various widgets. Users can add, remove, resize, and rearrange widgets to create a personalized view of the information that matters most to them.

## Key Features

- **Multiple Dashboards**: Users can create and manage multiple dashboards for different purposes
- **Customizable Layouts**: Drag-and-drop interface for arranging widgets
- **Resizable Widgets**: Widgets can be resized to show more or less information
- **Widget Settings**: Each widget has customizable settings
- **Real-time Updates**: Data refreshes automatically based on configurable intervals
- **Persistence**: Dashboard configurations are saved and restored between sessions

## Architecture

The dashboard system is built with a modular architecture:

### Core Components

1. **PersonalizedDashboard**: The main component that renders the dashboard with widgets
2. **WidgetContainer**: A container component for individual widgets that provides common functionality
3. **DashboardPreferenceService**: Manages user preferences for dashboards and widgets
4. **DashboardStateService**: Manages the runtime state of dashboards, including data loading and refresh cycles
5. **WidgetRegistry**: Registers and manages available widget types

### Widget System

Widgets are self-contained components that can be added to dashboards. Each widget:

- Has a unique type identifier
- Provides its own UI and settings
- Can fetch and display data
- Can be customized by the user

### Data Flow

1. User preferences are stored in `DashboardPreferenceService`
2. Widget layouts and configurations are managed by `PersonalizedDashboard`
3. Data for widgets is fetched and managed by `DashboardStateService`
4. Widget rendering and interaction is handled by `WidgetContainer`

## Available Widgets

The dashboard currently includes the following widgets:

1. **Market Overview**: Displays key market indices, sectors, and market breadth
2. **Portfolio Summary**: Shows portfolio value, allocation, and performance
3. **Watchlist**: Tracks securities with customizable columns and real-time updates
4. **News Feed**: Displays financial news from various sources

## Usage

### Adding to a Page

```tsx
import { PersonalizedDashboard } from './components/dashboard';

const MyPage = () => {
  return (
    <div style={{ height: '100vh' }}>
      <PersonalizedDashboard />
    </div>
  );
};
```

### Creating a New Widget

1. Create a new widget component that accepts `WidgetProps`
2. Register the widget with the `WidgetRegistry`
3. Implement a data provider for the widget

Example:

```tsx
// 1. Create widget component
const MyCustomWidget: React.FC<WidgetProps> = ({ 
  id, 
  settings, 
  isEditing, 
  onSettingsChange 
}) => {
  // Widget implementation
};

// 2. Register widget
WidgetRegistry.getInstance().registerWidget({
  type: 'my-custom-widget',
  name: 'My Custom Widget',
  description: 'Description of my custom widget',
  icon: 'CustomIcon',
  component: MyCustomWidget,
  defaultSettings: {
    // Default settings
  },
  defaultSize: {
    width: 6,
    height: 4
  },
  category: 'custom',
  tags: ['custom', 'example']
});

// 3. Implement data provider
DashboardStateService.getInstance().registerDataProvider(
  'my-custom-widget', 
  async (widgetConfig) => {
    // Fetch and return data
  }
);
```

## Future Enhancements

1. **Widget Marketplace**: Allow users to discover and install new widgets
2. **Dashboard Sharing**: Enable sharing dashboards between users
3. **Advanced Layouts**: Support more complex layout options like tabs within widgets
4. **Data Source Management**: Allow users to connect to custom data sources
5. **Dashboard Templates**: Provide pre-configured dashboard templates for common use cases