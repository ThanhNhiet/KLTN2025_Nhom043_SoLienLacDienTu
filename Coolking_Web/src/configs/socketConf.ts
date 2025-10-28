export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SOCKET_OPTIONS = {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    timeout: 30000,
};