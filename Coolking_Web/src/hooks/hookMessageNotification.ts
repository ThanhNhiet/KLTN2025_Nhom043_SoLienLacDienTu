import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from './useChat';
import authService from '../services/authService';
import messSound from '../assets/sound/mess-sound-effect.mp3';

interface MessageNotificationHook {
    newMessNav: boolean;
    markAsRead: () => void | Promise<void>;
}

export const useMessageNotification = (): MessageNotificationHook => {
    // Khởi tạo state từ sessionStorage để persist qua các lần re-render
    const [newMessNav, setNewMessNav] = useState(() => {
        return sessionStorage.getItem('new-message-notification') === 'true';
    });
    // Sử dụng sessionStorage để persist flag qua các lần chuyển trang
    const [hasCheckedInitial, setHasCheckedInitial] = useState(() => {
        return sessionStorage.getItem('message-notification-checked') === 'true';
    });
    const { socket } = useSocket();
    const { getChats4AllUser, chatItems } = useChat();
    const location = useLocation();

    // Sync state với sessionStorage khi component mount hoặc sessionStorage thay đổi
    useEffect(() => {
        const handleStorageChange = () => {
            const storedValue = sessionStorage.getItem('new-message-notification') === 'true';
            if (storedValue !== newMessNav) {
                setNewMessNav(storedValue);
            }
        };

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [newMessNav]);

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
            sessionStorage.removeItem('new-message-notification');
            setHasCheckedInitial(false);
            setNewMessNav(false);
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
            
            // console.log('🔔 ChatItems changed, hasUnread:', hasUnread);
            
            if (hasUnread) {
                // console.log('🔔 Setting notification to true from chatItems');
                setNewMessNav(true);
                sessionStorage.setItem('new-message-notification', 'true');
            }
        }
    }, [chatItems]); // Bỏ newMessNav khỏi dependency

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = ({ newMessage }: { chat_id: string, newMessage: any }) => {
            // Lấy thông tin user hiện tại
            const tokenData = authService.parseToken();
            const currentUserId = tokenData?.user_id;
            
            // Chỉ hiển thị notification nếu tin nhắn không phải từ chính user hiện tại
            const senderId = newMessage.senderInfo?.userID || newMessage.senderID;
            // console.log('🔔 Received message from:', senderId, 'current user:', currentUserId);
            // console.log('🔔 Received new message:', newMessage);
            
            if (senderId !== currentUserId) {
                // console.log('🔔 Setting notification to true');
                setNewMessNav(true);
                sessionStorage.setItem('new-message-notification', 'true');
                
                // Phát âm thanh thông báo
                try {
                    const audio = new Audio(messSound);
                    audio.volume = 0.5; // Đặt âm lượng 50%
                    audio.play().catch(error => {
                        console.warn('🔔 Could not play notification sound:', error);
                    });
                } catch (error) {
                    console.warn('🔔 Error creating audio:', error);
                }
            }
        };

        // Lắng nghe sự kiện receive_message từ socket
        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket]);

    // Theo dõi route và tự động clear notification khi vào chat route
    useEffect(() => {
        const currentPath = location.pathname;
        // console.log('🔔 Current path:', currentPath, 'newMessNav:', newMessNav);
        
        if (currentPath === '/lecturer/chat' || currentPath === '/admin/chat') {
            if (newMessNav) {
                // console.log('🔔 Clearing notification because on chat route');
                setNewMessNav(false);
                sessionStorage.setItem('new-message-notification', 'false');
            }
        }
    }, [location.pathname, newMessNav]);

    // Quản lý tiêu đề tab
    useEffect(() => {
        const originalTitle = 'Coolking E-Contact';
        const newMessageTitle = 'Coolking E-Contact - Có tin nhắn mới';
        
        if (newMessNav) {
            document.title = newMessageTitle;
        } else {
            document.title = originalTitle;
        }

        // Lắng nghe sự kiện khi user focus vào tab (quay lại tab)
        const handleVisibilityChange = () => {
            if (!document.hidden && newMessNav) {
                // Khi user quay lại tab và có tin nhắn mới, đổi về tiêu đề gốc
                document.title = originalTitle;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Reset về tiêu đề gốc khi component unmount
            document.title = originalTitle;
        };
    }, [newMessNav]);

    const markAsRead = async () => {
        setNewMessNav(false);
        sessionStorage.setItem('new-message-notification', 'false');
        // Đặt lại tiêu đề về gốc
        document.title = 'Coolking E-Contact';
    };

    return {
        newMessNav,
        markAsRead
    };
};
