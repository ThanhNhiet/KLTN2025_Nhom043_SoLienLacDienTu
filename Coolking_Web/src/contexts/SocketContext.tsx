import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import authService from '../services/authService';
import { SOCKET_URL, SOCKET_OPTIONS } from '../configs/socketConf';

interface ISocketContext {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<ISocketContext>({
    socket: null,
    isConnected: false,
    connect: () => {},
    disconnect: () => {},
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

    const connect = () => {
        // Nếu đã có socket connected, không tạo lại
        if (socket && socket.connected) {
            console.log('🔌 Socket already connected');
            return;
        }

        // Disconnect socket cũ nếu có
        if (socket) {
            console.log('🔌 Disconnecting old socket...');
            socket.disconnect();
            socket.close();
        }

        console.log('🔌 Creating new socket connection...');
        const newSocket = io(SOCKET_URL, SOCKET_OPTIONS);

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected:', newSocket.id);
            setIsConnected(true);

            // Đăng ký user với socket server sau khi kết nối
            try {
                const tokenData = authService.parseToken();
                if (tokenData && tokenData.user_id) {
                    console.log('🔌 Registering user:', tokenData.user_id);
                    newSocket.emit('register', tokenData.user_id);
                } else {
                    console.warn('🔌 No valid token found for registration');
                }
            } catch (err) {
                console.error('🔌 Error parsing token for socket registration:', err);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected!');
            setIsConnected(false);
        });

        setSocket(newSocket);
    };

    const disconnect = () => {
        if (socket) {
            console.log('🔌 Disconnecting socket...');
            socket.disconnect();
            socket.close();
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
            {children}
        </SocketContext.Provider>
    );
};