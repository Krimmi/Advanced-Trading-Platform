# Custom Hooks

This directory contains custom React hooks that provide reusable functionality across the application.

## Available Hooks

### useWebSocket

A hook for managing WebSocket connections with automatic reconnection.

```tsx
import { useWebSocket } from '../hooks';

function MyComponent() {
  const { 
    sendMessage, 
    lastMessage, 
    status, 
    connectionAttempts, 
    disconnect, 
    reconnect 
  } = useWebSocket('wss://example.com/socket', {
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    onOpen: (event) => console.log('Connected'),
    onClose: (event) => console.log('Disconnected'),
    onError: (event) => console.error('Error')
  });

  // Send a message
  const handleSendClick = () => {
    sendMessage(JSON.stringify({ type: 'message', content: 'Hello' }));
  };

  return (
    <div>
      <p>Status: {status}</p>
      {lastMessage && <p>Last message: {lastMessage.data}</p>}
      <button onClick={handleSendClick}>Send Message</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

### useLocalStorage

A hook for persisting state in localStorage with type safety.

```tsx
import { useLocalStorage } from '../hooks';

function MyComponent() {
  // Similar to useState, but persists to localStorage
  const [user, setUser] = useLocalStorage('user', { name: '', age: 0 });

  const handleNameChange = (e) => {
    setUser({ ...user, name: e.target.value });
  };

  const handleAgeChange = (e) => {
    setUser({ ...user, age: parseInt(e.target.value) || 0 });
  };

  return (
    <div>
      <input 
        type="text" 
        value={user.name} 
        onChange={handleNameChange} 
        placeholder="Name" 
      />
      <input 
        type="number" 
        value={user.age} 
        onChange={handleAgeChange} 
        placeholder="Age" 
      />
    </div>
  );
}
```

### useDebounce

A hook for debouncing values, useful for search inputs or form fields that trigger expensive operations.

```tsx
import { useDebounce } from '../hooks';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  // Value will only update after 500ms of no changes
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Effect only runs when debouncedSearchTerm changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### useIntersectionObserver

A hook for detecting when an element is visible in the viewport, useful for lazy loading, infinite scrolling, or animations.

```tsx
import { useIntersectionObserver } from '../hooks';

function LazyLoadedImage({ src, alt }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

  // Load image when it comes into view
  useEffect(() => {
    if (isIntersecting && !isLoaded) {
      setIsLoaded(true);
    }
  }, [isIntersecting, isLoaded]);

  return (
    <div ref={ref}>
      {isLoaded ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="placeholder">Loading...</div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Memoize expensive calculations**: Use `useMemo` inside custom hooks to avoid recalculating values on every render.

2. **Clean up resources**: Always clean up subscriptions, timers, and event listeners in the `useEffect` cleanup function.

3. **Type safety**: Use TypeScript generics to make hooks type-safe and provide better developer experience.

4. **Consistent naming**: Follow the `use` prefix convention for all hooks.

5. **Single responsibility**: Each hook should focus on a single concern.