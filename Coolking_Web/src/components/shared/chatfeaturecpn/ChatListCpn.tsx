import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useChat } from '../../../hooks/useChat';
import UserSearchResultModal from '../../../pages/chatfeature/UserSearchResultModal';
import { useSocket } from '../../../contexts/SocketContext';

interface ChatListCpnProps {
    onChatSelect: (chatId: string) => void;
    selectedChatId?: string;
    onLastMessageUpdate?: (chatId: string, lastMessage: any) => void;
}

const ChatListCpn = forwardRef<any, ChatListCpnProps>(({ onChatSelect, selectedChatId, onLastMessageUpdate }, ref) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [localChatItems, setLocalChatItems] = useState<any[]>([]);
    const { loading, error, currentPage, pages, chatItems,
        getChats4AllUser, searchChats4AllUser, searchUser, createPrivateChat } = useChat();
    const [showUserSearchModal, setShowUserSearchModal] = useState(false);
    const { socket } = useSocket();

    const handleSearchUser = async (keyword: string) => {
        return await searchUser(keyword);
    };

    const handleSelectUser = async (result: any) => {
        try {
            const targetId = result.student_id || result.lecturer_id;
            if (!targetId) return;
            await createPrivateChat(targetId);
            await getChats4AllUser(1, 10);
            setShowUserSearchModal(false);
        } catch (err) {
            console.error('Error creating private chat:', err);
        }
    };

    // Update local chat items when chatItems changes
    useEffect(() => {
        if (Array.isArray(chatItems)) {
            setLocalChatItems(chatItems);
        }
    }, [chatItems]);

    // Handle last message update
    useEffect(() => {
        if (onLastMessageUpdate) {
            // This effect will be triggered by parent component
        }
    }, [onLastMessageUpdate]);

    const updateChatLastMessage = (chatId: string, lastMessage: any) => {
        // Tạo một bản sao của tin nhắn để sửa đổi an toàn
        const messageToUpdate = { ...lastMessage };

        // Xử lý content cho type 'image' và 'file' ngay tại đây
        if (messageToUpdate.type === 'image') {
            messageToUpdate.content = 'Hình ảnh';
        } else if (messageToUpdate.type === 'file') {
            messageToUpdate.content = 'File';
        }

        setLocalChatItems(prevItems => {
            const chatIndex = prevItems.findIndex(chat => chat._id === chatId);

            // Nếu không tìm thấy chat, không làm gì cả
            if (chatIndex === -1) {
                return prevItems;
            }

            // Lấy chat cần cập nhật
            const updatedChat = {
                ...prevItems[chatIndex],
                lastMessage: messageToUpdate,
                // Đánh dấu là chưa đọc nếu người dùng không ở trong chat này
                unread: chatId !== selectedChatId
            };

            // Xóa chat cũ khỏi danh sách và đưa chat đã cập nhật lên đầu
            const newChatItems = prevItems.filter(chat => chat._id !== chatId);
            return [updatedChat, ...newChatItems];
        });
    };

    // Lắng nghe sự kiện socket cho ChatList
    useEffect(() => {
        if (socket) {
            // Nhận tin nhắn mới và cập nhật last message
            const handleReceiveMessage = ({ chat_id, newMessage }: { chat_id: string, newMessage: any }) => {
                updateChatLastMessage(chat_id, newMessage);
            };

            // Cập nhật last message khi tin nhắn bị xóa
            const handleRenderMessage = ({ chat_id, message_id }: { chat_id: string, message_id: string }) => {
                setLocalChatItems(prev =>
                    prev.map(chat => {
                        // Nếu tin nhắn bị xóa là tin nhắn cuối cùng của đoạn chat
                        if (chat._id === chat_id && chat.lastMessage?._id === message_id) {
                            return {
                                ...chat,
                                lastMessage: {
                                    ...chat.lastMessage,
                                    content: "[Tin nhắn đã bị thu hồi]",
                                    isDeleted: true
                                }
                            };
                        }
                        return chat;
                    })
                );
            };

            socket.on('receive_message', handleReceiveMessage);
            socket.on('render_message', handleRenderMessage);

            return () => {
                socket.off('receive_message', handleReceiveMessage);
                socket.off('render_message', handleRenderMessage);
            };
        }
        // Thêm selectedChatId vào dependency array để cập nhật 'unread' status chính xác
    }, [socket, selectedChatId]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        updateChatLastMessage
    }));

    // Load danh sách chat khi component mount
    useEffect(() => {
        getChats4AllUser(1, 10);
    }, [getChats4AllUser]);

    const handleSearch = async () => {
        if (searchKeyword.trim()) {
            setIsSearching(true);
            await searchChats4AllUser(searchKeyword.trim(), 1, 10);
        } else {
            setIsSearching(false);
            await getChats4AllUser(1, 10);
        }
    };

    const handlePageChange = async (page: number) => {
        if (isSearching && searchKeyword.trim()) {
            await searchChats4AllUser(searchKeyword.trim(), page, 10);
        } else {
            await getChats4AllUser(page, 10);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header với thanh search */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Tên đoạn chat, SĐT, email"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-2 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                        >
                            Tìm
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowUserSearchModal(true)}
                            disabled={loading}
                            className="w-full p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                        >
                            Tìm người dùng
                        </button>
                    </div>
                </div>
            </div>

            {/* Reload button */}
            <div className="p-2 border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={() => {
                        setSearchKeyword('');
                        setIsSearching(false);
                        getChats4AllUser(1, 10);
                    }}
                    disabled={loading}
                    className="w-full p-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
                >
                    {loading ? 'Đang tải...' : 'Tải lại danh sách'}
                </button>
            </div>
            <UserSearchResultModal
                isOpen={showUserSearchModal}
                onClose={() => setShowUserSearchModal(false)}
                onSearch={handleSearchUser}
                onSelect={handleSelectUser}
            />

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">Đang tải...</span>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="p-4 text-red-500 text-center">
                    {error}
                </div>
            )}

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(!localChatItems || localChatItems.length === 0) && !loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">💬</div>
                        <p>Không có cuộc trò chuyện nào</p>
                        {isSearching && (
                            <button
                                onClick={() => {
                                    setSearchKeyword('');
                                    setIsSearching(false);
                                    getChats4AllUser(1, 10);
                                }}
                                className="mt-2 text-blue-500 hover:text-blue-600"
                            >
                                Xem tất cả
                            </button>
                        )}
                    </div>
                ) : (
                    localChatItems.map((chat: any) => (
                        <div
                            key={chat._id}
                            onClick={() => {
                                if (selectedChatId === chat._id) return;

                                onChatSelect(chat._id);
                                // Đánh dấu đã đọc nếu có tin nhắn chưa đọc
                                if (chat.unread) {
                                    // Cập nhật local state ngay lập tức
                                    updateChatLastMessage(chat._id, { ...chat.lastMessage });
                                    setLocalChatItems(prev =>
                                        prev.map(c =>
                                            c._id === chat._id ? { ...c, unread: false } : c
                                        )
                                    );
                                }
                            }}
                            className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${selectedChatId === chat._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                        >
                            {/* Avatar */}
                            <div className="relative">
                                <img
                                    src={chat.avatar || ''}
                                    alt={chat.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1760607108/no-image_z1mtgf.jpg';
                                    }}
                                />
                                {/* Type indicator */}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs">
                                    {chat.type === 'group' && (
                                        <span className="text-white text-xs">👥</span>
                                    )}
                                    {chat.type === 'private' && (
                                        <span className="text-white text-xs">👤</span>
                                    )}
                                </div>
                            </div>

                            {/* Chat Info */}
                            <div className="flex-1 ml-3 min-w-0">
                                {/* Name */}
                                <h3 className="font-semibold text-gray-900 truncate text-sm">
                                    {chat.name}
                                </h3>

                                {/* Time */}
                                {chat.lastMessage && (
                                    <p className="text-xs text-gray-500 mt-0.5">{chat.lastMessage.createdAt}</p>
                                )}

                                {/* Last message */}
                                <div className="flex items-center justify-between mt-1">
                                    {!chat.lastMessage ? (
                                        <p className="text-xs text-gray-500 italic">Bắt đầu cuộc trò chuyện</p>
                                    ) : chat.unread ? (
                                        <p className="text-xs text-gray-800 font-semibold truncate">{chat.lastMessage.content}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500 font-normal truncate">{chat.lastMessage.content}</p>
                                    )}

                                    {chat.unread && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full ml-2 flex-shrink-0"></div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pages && pages.length > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-center flex-shrink-0">
                    <nav className="flex items-center space-x-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &lt;
                        </button>

                        {pages.map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-2 py-1 text-sm rounded-md transition-colors ${page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pages[pages.length - 1]}
                            className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &gt;
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
});

export default ChatListCpn;
