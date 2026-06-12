import { createContext, useContext } from 'react'

interface WebSocketContextType {
  send: (payload: object) => void
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const useWs = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWs must be used within a WebSocketProvider')
  }
  return context
}
