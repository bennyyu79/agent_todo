import { useState, useEffect, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);

      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        console.log('WebSocket message received:', message.type, message.payload);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    setWs(socket);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, [ws]);

  return { ws, connected, lastMessage, sendMessage };
}
