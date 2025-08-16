import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: WebSocketEventMap['open']) => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
}

interface UseWebSocketReturn {
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  lastMessage: MessageEvent | null;
  status: WebSocketStatus;
  connectionAttempts: number;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Custom hook for WebSocket connections with automatic reconnection
 * @param url - WebSocket URL to connect to
 * @param options - Configuration options for the WebSocket connection
 * @returns WebSocket control methods and state
 */
const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError,
  } = options;

  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to create a new WebSocket connection
  const connect = useCallback(() => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Create new WebSocket connection
    try {
      setStatus('connecting');
      webSocketRef.current = new WebSocket(url);

      // Set up event handlers
      webSocketRef.current.onopen = (event) => {
        setStatus('open');
        setConnectionAttempts(0);
        if (onOpen) onOpen(event);
      };

      webSocketRef.current.onclose = (event) => {
        setStatus('closed');
        if (onClose) onClose(event);

        // Attempt to reconnect if not manually closed
        if (connectionAttempts < reconnectAttempts) {
          setConnectionAttempts((prev) => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      webSocketRef.current.onerror = (event) => {
        setStatus('error');
        if (onError) onError(event);
      };

      webSocketRef.current.onmessage = (event) => {
        setLastMessage(event);
      };
    } catch (error) {
      setStatus('error');
      console.error('WebSocket connection error:', error);
      
      // Attempt to reconnect on error
      if (connectionAttempts < reconnectAttempts) {
        setConnectionAttempts((prev) => prev + 1);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    }
  }, [url, connectionAttempts, reconnectAttempts, reconnectInterval, onOpen, onClose, onError]);

  // Function to send a message through the WebSocket
  const sendMessage = useCallback(
    (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(data);
        return true;
      }
      return false;
    },
    []
  );

  // Function to manually disconnect the WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (webSocketRef.current) {
      setStatus('closing');
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
  }, []);

  // Function to manually reconnect the WebSocket
  const reconnect = useCallback(() => {
    disconnect();
    setConnectionAttempts(0);
    connect();
  }, [connect, disconnect]);

  // Connect when the component mounts
  useEffect(() => {
    connect();

    // Clean up when the component unmounts
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    sendMessage,
    lastMessage,
    status,
    connectionAttempts,
    disconnect,
    reconnect,
  };
};

export default useWebSocket;