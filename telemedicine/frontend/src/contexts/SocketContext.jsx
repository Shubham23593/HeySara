import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated && token) {
      const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      s.on('connect', () => {
        if (user) s.emit('join-room', { userId: user._id || user.id, role: user.role })
      })
      socketRef.current = s
      setSocket(s)
      return () => {
        s.disconnect()
        socketRef.current = null
        setSocket(null)
      }
    }
  }, [isAuthenticated, token, user])

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
