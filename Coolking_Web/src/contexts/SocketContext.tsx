import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import authService from '../services/authService';
import { SOCKET_URL, SOCKET_OPTIONS } from '../configs/socketConf';

interface ISocketContext {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<ISocketContext>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, SOCKET_OPTIONS); 

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);

            // Đăng ký user với socket server sau khi kết nối
            try {
                const tokenData = authService.parseToken();
                if (tokenData && tokenData.user_id) {
                    newSocket.emit('register', tokenData.user_id);
                }
            } catch (err) {
                console.error('Error parsing token for socket registration:', err);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected!');
            setIsConnected(false);
        });

        setSocket(newSocket);

        // Cleanup khi unmount
        return () => {
            newSocket.disconnect();
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};