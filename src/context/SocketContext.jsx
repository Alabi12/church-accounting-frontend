// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Conditional import for socket.io-client
let io;
if (typeof window !== 'undefined') {
  try {
    // Dynamically import socket.io-client only when needed
    import('socket.io-client').then(module => {
      io = module.default;
    }).catch(() => {
      console.log('⚠️ socket.io-client not installed, WebSocket features disabled');
    });
  } catch (error) {
    console.log('⚠️ socket.io-client not available, WebSocket features disabled');
  }
}

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Mock socket for when real socket is not available
class MockSocket {
  constructor() {
    this.connected = false;
    this.listeners = {};
  }
  
  on(event, callback) {
    this.listeners[event] = callback;
    return this;
  }
  
  off(event) {
    delete this.listeners[event];
    return this;
  }
  
  emit(event, data) {
    console.log(`📡 Mock socket emit: ${event}`, data);
    return this;
  }
  
  close() {
    console.log('🔌 Mock socket closed');
    return this;
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isSocketEnabled, setIsSocketEnabled] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if Socket.IO should be enabled
    const shouldEnableSocket = process.env.NODE_ENV === 'production' || 
                               import.meta.env?.VITE_ENABLE_SOCKET === 'true';
    
    if (!shouldEnableSocket) {
      console.log('ℹ️ Socket.IO disabled (development mode)');
      setIsSocketEnabled(false);
      // Use mock socket
      const mockSocket = new MockSocket();
      setSocket(mockSocket);
      setConnected(true);
      return;
    }

    // Check if socket.io-client is available
    if (!io && typeof window !== 'undefined') {
      console.log('⚠️ socket.io-client not loaded, using mock socket');
      const mockSocket = new MockSocket();
      setSocket(mockSocket);
      setConnected(true);
      setIsSocketEnabled(false);
      return;
    }

    if (!isAuthenticated || !user) {
      return;
    }

    // Determine WebSocket URL based on environment
    let wsUrl;
    if (process.env.NODE_ENV === 'production') {
      wsUrl = import.meta.env?.VITE_WS_URL || window.location.origin;
    } else {
      wsUrl = import.meta.env?.VITE_WS_URL || 'http://localhost:5000';
    }

    console.log(`🔌 Connecting to Socket.IO at: ${wsUrl}`);

    try {
      // Create socket connection
      const newSocket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        query: { userId: user.id },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnected(false);
      });

      newSocket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 Socket reconnection attempt ${attempt}`);
      });

      newSocket.on('reconnect', () => {
        console.log('✅ Socket reconnected');
        setConnected(true);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.close();
        }
      };
    } catch (error) {
      console.error('Error creating socket connection:', error);
      // Fallback to mock socket
      const mockSocket = new MockSocket();
      setSocket(mockSocket);
      setConnected(true);
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    connected,
    isSocketEnabled,
    emit: (event, data) => {
      if (socket && connected) {
        socket.emit(event, data);
      } else if (!connected) {
        console.log(`📡 Socket not connected, cannot emit: ${event}`, data);
      }
    },
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};