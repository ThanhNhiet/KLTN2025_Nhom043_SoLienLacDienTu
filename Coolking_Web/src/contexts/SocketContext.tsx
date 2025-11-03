import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // useEffect để duy trì socket connection xuyên suốt app lifecycle
    useEffect(() => {
        // Kiểm tra xem có token hợp lệ không
        if (authService.isValidToken()) {
            connectInternal();
        } else {
            console.log('useEffect: No valid token, skipping socket creation');
        }

        // Cleanup khi unmount
        return () => {
            if (socket) {
                socket.disconnect();
                socket.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount

    const connectInternal = () => {
        // Nếu đã có socket connected, không tạo lại
        if (socket && socket.connected) {
            return;
        }

        // Disconnect socket cũ nếu có
        if (socket) {
            socket.disconnect();
            socket.close();
            setSocket(null);
            setIsConnected(false);
        }
        const newSocket = io(SOCKET_URL, SOCKET_OPTIONS);

        newSocket.on('connect', () => {
            setIsConnected(true);

            // Đăng ký user với socket server sau khi kết nối
            try {
                const tokenData = authService.parseToken();
                if (tokenData && tokenData.user_id) {
                    newSocket.emit('register', tokenData.user_id);
                } else {
                    console.warn('No valid token found for registration');
                }
            } catch (err) {
                console.error('🔌 Error parsing token for socket registration:', err);
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        setSocket(newSocket);
    };

    const connect = () => {
        // Kiểm tra token hợp lệ trước khi kết nối  
        const hasToken = authService.isValidToken();
        
        if (!hasToken) {
            return;
        }

        // Gọi connect internal để tạo socket
        connectInternal();
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket.close();
            setSocket(null);
            setIsConnected(false);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
            {children}
        </SocketContext.Provider>
    );
};