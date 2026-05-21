import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    let activeSocket = null;

    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      // Initialize Socket connection with JWT token handshake
      activeSocket = io(socketUrl, {
        auth: {
          token: getAccessToken()
        },
        transports: ['websocket', 'polling']
      });

      activeSocket.on('connect', () => {
        console.log('Duplex WebSocket connection successfully established');
      });

      // Maintain list of online partners dynamically based on status events
      activeSocket.on('partner_status_change', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (isOnline) {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      });

      setSocket(activeSocket);
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
