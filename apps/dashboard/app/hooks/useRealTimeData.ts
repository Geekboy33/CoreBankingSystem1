'use client';

import { useEffect, useRef, useState } from 'react';

interface RealTimeData {
  type: string;
  timestamp: string;
  data?: any;
}

export function useRealTimeData() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealTimeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data: RealTimeData = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      setError('Error de conexión WebSocket');
      console.error('WebSocket error:', event);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconectar después de 5 segundos
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          wsRef.current = new WebSocket(wsUrl);
        }
      }, 5000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage: (message: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    }
  };
}
