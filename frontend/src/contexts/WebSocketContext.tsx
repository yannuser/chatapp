import React from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { WebSocketContext } from '../hooks/useWs'

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ws = useWebSocket()

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  )
}
