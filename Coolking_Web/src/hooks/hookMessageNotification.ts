import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from './useChat';
import authService from '../services/authService';

interface MessageNotificationHook {
    newMessNav: boolean;
    markAsRead: () => void | Promise<void>;
}

export const useMessageNotification = (): MessageNotificationHook => {
    const [newMessNav, setNewMessNav] = useState(false);
    // Sử dụng sessionStorage để persist flag qua các lần chuyển trang
    const [hasCheckedInitial, setHasCheckedInitial] = useState(() => {
        return sessionStorage.getItem('message-notification-checked') === 'true';
    });
    const { socket } = useSocket();
    const { getChats4AllUser, chatItems } = useChat();

    // Kiểm tra tin nhắn chưa đọc khi khởi tạo - CHỈ 1 LẦN DUY NHẤT
    useEffect(() => {
        const checkUnreadMessages = async () => {
            try {
                // Kiểm tra đã check chưa để tránh gọi lại
                if (hasCheckedInitial) {
                    return;
                }
                await getChats4AllUser(1, 1);
                setHasCheckedInitial(true); // Đánh dấu đã check
                sessionStorage.setItem('message-notification-checked', 'true'); // Lưu vào session
                
                // Logic check sẽ được thực hiện trong useEffect khác để lắng nghe chatItems
            } catch (error) {
                console.error('🔔 Error checking unread messages:', error);
            }
        };

        // Chỉ check khi có token hợp lệ và chưa check lần nào
        if (authService.isValidToken() && !hasCheckedInitial) {
            checkUnreadMessages();
        }
    }, [hasCheckedInitial, getChats4AllUser]); // Dependency để check flag

    // Clear flag khi user logout (token không hợp lệ)
    useEffect(() => {
        if (!authService.isValidToken()) {
            sessionStorage.removeItem('message-notification-checked');
            setHasCheckedInitial(false);
        }
    }, []); // Chỉ check 1 lần khi mount

    // Lắng nghe chatItems để check unread messages
    useEffect(() => {
        if (chatItems) {
            // Kiểm tra xem có chat nào có unread = true không
            let hasUnread = false;
            
            if (Array.isArray(chatItems)) {
                // Nếu chatItems là array
                hasUnread = chatItems.some(chat => chat.unread === true);
            } else if (chatItems && typeof chatItems === 'object' && 'unread' in chatItems) {
                // Nếu chatItems là single object
                hasUnread = chatItems.unread === true;
            }
            
            if (hasUnread && !newMessNav) {
                setNewMessNav(true);
            }
        }
    }, [chatItems, newMessNav]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = ({ newMessage }: { chat_id: string, newMessage: any }) => {
            // Lấy thông tin user hiện tại
            const tokenData = authService.parseToken();
            const currentUserId = tokenData?.user_id;
            
            // Chỉ hiển thị notification nếu tin nhắn không phải từ chính user hiện tại
            const senderId = newMessage.senderInfo?.userID || newMessage.senderID;
            if (senderId !== currentUserId) {
                setNewMessNav(true);
            }
        };

        // Lắng nghe sự kiện receive_message từ socket
        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket]);

    const markAsRead = async () => {
        setNewMessNav(false);
    };

    return {
        newMessNav,
        markAsRead
    };
};
