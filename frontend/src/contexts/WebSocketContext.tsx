import React, { createContext, useContext } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketContextType {
  send: (payload: object) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ws = useWebSocket();

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWs = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWs must be used within a WebSocketProvider');
  }
  return context;
};
