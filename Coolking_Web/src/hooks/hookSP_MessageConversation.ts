import { useState, useEffect, useRef, useCallback } from 'react';
import { useMessage, type Message } from './useMessage';
import type { ChatMember } from './useChat';

interface ReplyState {
    isReplying: boolean;
    message: Message | null;
}

interface ContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    message: Message | null;
}

interface FileWithPreview {
    file: File;
    preview?: string;
    id: string;
}

export const useMessageConversation = (selectedChatId?: string, currentUserId?: string, onLastMessageUpdate?: (chatId: string, lastMessage: any) => void) => {
    // States
    const [messageText, setMessageText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [replyState, setReplyState] = useState<ReplyState>({ isReplying: false, message: null });
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, x: 0, y: 0, message: null });
    const [showImageZoom, setShowImageZoom] = useState<{ show: boolean; src: string }>({ show: false, src: '' });
    const [showPinnedModal, setShowPinnedModal] = useState(false);
    const [messagesPage, setMessagesPage] = useState(1);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [isAutoLoading, setIsAutoLoading] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hook
    const {
        loading,
        messages,
        linkPrev,
        pinnedMessages,
        getLatestMessagesInChat,
        getMessagesByLinkPrev,
        clearMessages,
        updateLinkPrev,
        sendTextMessage,
        sendImageMessage,
        sendFileMessage,
        sendReplyTextMessage,
        sendReplyImageMessage,
        sendReplyFileMessage,
        getPinnedMessagesInChat,
        pinMessage,
        unpinMessage,
        deleteMessage,
        updateLastReadMessage
    } = useMessage();

    // Load messages when chat changes
    useEffect(() => {
        if (selectedChatId) {
            // Clear previous chat data immediately
            clearMessages(); // Clear data in useMessage hook
            setAllMessages([]);
            setMessagesPage(1);
            setIsAutoLoading(false); // Reset auto loading flag
            loadInitialMessages();
            loadPinnedMessages();
        }
    }, [selectedChatId, clearMessages]);

    // Update allMessages when new messages arrive  
    useEffect(() => {
        if (messages.length > 0) {
            if (messagesPage === 1) {
                // First load: set messages directly
                setAllMessages(messages);
            } else {
                // For subsequent loads from linkPrev, we handle in loadMoreMessages directly
                // But we still need to check if there are new messages to append
                const existingIds = new Set(allMessages.map(msg => msg._id));
                const newMessages = messages.filter(msg => !existingIds.has(msg._id));
                if (newMessages.length > 0) {
                    // Append new messages to the end (they are newer)
                    setAllMessages(prev => [...prev, ...newMessages]);
                }
            }
        }
    }, [messages, messagesPage]);

    // Auto scroll to bottom for new messages
    useEffect(() => {
        // Always scroll to bottom when allMessages changes and we're on page 1
        // or when new messages are added (not from pagination)
        if (allMessages.length > 0 && messagesPage === 1) {
            scrollToBottom(true); // Use smooth scroll for auto updates
        }
    }, [allMessages, messagesPage]);

    // Auto load more messages when scrolling to top
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop } = container;
            // Khi scroll lên gần đầu (trong vòng 100px từ top) và còn linkPrev
            if (scrollTop <= 100 && linkPrev && !loading && !isAutoLoading) {
                setIsAutoLoading(true);
                loadMoreMessages().finally(() => {
                    // Reset flag sau khi load xong (sau 1 giây để tránh spam)
                    setTimeout(() => setIsAutoLoading(false), 1000);
                });
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [linkPrev, loading, isAutoLoading]); // Re-attach khi linkPrev, loading hoặc isAutoLoading thay đổi

    const loadInitialMessages = async () => {
        if (!selectedChatId) return;
        try {
            await getLatestMessagesInChat(selectedChatId);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const loadPinnedMessages = async () => {
        if (!selectedChatId) return;
        try {
            await getPinnedMessagesInChat(selectedChatId);
        } catch (error) {
            console.error('Error loading pinned messages:', error);
        }
    };

    const loadMoreMessages = async () => {
        if (!linkPrev || loading) return;
        
        const currentScrollTop = messagesContainerRef.current?.scrollTop || 0;
        const currentScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
        
        try {
            // Extract page from linkPrev for tracking
            const url = new URL(linkPrev, window.location.origin);
            const page = parseInt(url.searchParams.get('page') || '1');
            setMessagesPage(page);
            
            // Use messageServices instead of direct fetch
            const data = await getMessagesByLinkPrev(linkPrev);
            
            if (data.messages) {
                // Prepend older messages to the beginning of allMessages
                // data.messages chứa tin nhắn cũ hơn, cần thêm vào đầu array
                setAllMessages(prev => {
                    // Check for duplicates to avoid duplicate messages
                    const existingIds = new Set(prev.map(msg => msg._id));
                    const newMessages = data.messages.filter((msg: any) => !existingIds.has(msg._id));
                    return [...newMessages, ...prev];
                });
                
                // Update linkPrev for next load
                updateLinkPrev(data.linkPrev);
            }
            
            // Maintain scroll position
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    const newScrollHeight = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight + currentScrollTop;
                }
            }, 100);
        } catch (error) {
            console.error('Error loading more messages:', error);
        }
    };

    const scrollToBottom = (smooth: boolean = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    };

    const scrollToMessage = (messageId: string) => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight message briefly
            messageElement.classList.add('bg-yellow-50');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-50');
            }, 2000);
        }
    };

    // File handling
    const handleFileSelect = useCallback((multiple: boolean = false, accept: string = '*/*') => {
        if (!fileInputRef.current) return;
        
        fileInputRef.current.accept = accept;
        fileInputRef.current.multiple = multiple;
        fileInputRef.current.onchange = handleFileInputChange;
        fileInputRef.current.click();
    }, []);

    const handleFileInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        addFiles(files);
    };

    const addFiles = (files: File[]) => {
        if (selectedFiles.length + files.length > 10) {
            showToast('Tối đa 10 file', 'error');
            return;
        }

        const newFiles: FileWithPreview[] = files.map(file => {
            // Check file size (25MB)
            if (file.size > 25 * 1024 * 1024) {
                showToast(`File ${file.name} quá lớn (>25MB)`, 'error');
                return null;
            }

            const fileWithPreview: FileWithPreview = {
                file,
                id: Date.now().toString() + Math.random().toString()
            };

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileWithPreview.preview = e.target?.result as string;
                    setSelectedFiles(prev => 
                        prev.map(f => f.id === fileWithPreview.id ? fileWithPreview : f)
                    );
                };
                reader.readAsDataURL(file);
            }

            return fileWithPreview;
        }).filter(Boolean) as FileWithPreview[];

        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    // Paste handling
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);
        const files = items
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile())
            .filter(Boolean) as File[];

        if (files.length > 0) {
            e.preventDefault();
            addFiles(files);
        }
    };

    const removeFile = (id: string) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    };

    // Message sending
    const handleSendMessage = async () => {
        if (!selectedChatId || (!messageText.trim() && selectedFiles.length === 0)) return;

        try {
            const replyTo = replyState.isReplying && replyState.message ? {
                messageID: replyState.message._id,
                senderID: replyState.message.senderInfo?.userID || replyState.message.senderID || '',
                type: replyState.message.type,
                content: replyState.message.content
            } : undefined;

            if (selectedFiles.length > 0) {
                const imageFiles = selectedFiles.filter(f => f.file.type.startsWith('image/')).map(f => f.file);
                const otherFiles = selectedFiles.filter(f => !f.file.type.startsWith('image/')).map(f => f.file);

                if (replyTo) {
                    if (imageFiles.length > 0) {
                        await sendReplyImageMessage(selectedChatId, imageFiles, replyTo);
                    }
                    if (otherFiles.length > 0) {
                        await sendReplyFileMessage(selectedChatId, otherFiles, replyTo);
                    }
                } else {
                    if (imageFiles.length > 0) {
                        await sendImageMessage(selectedChatId, imageFiles);
                    }
                    if (otherFiles.length > 0) {
                        await sendFileMessage(selectedChatId, otherFiles);
                    }
                }
            }

            if (messageText.trim()) {
                if (replyTo) {
                    await sendReplyTextMessage(selectedChatId, messageText, replyTo);
                } else {
                    await sendTextMessage(selectedChatId, messageText);
                }
            }

            // Clear inputs
            setMessageText('');
            setSelectedFiles([]);
            clearReply();
            
            // Update last read message
            await updateLastReadMessage(selectedChatId);
            
            // Refresh messages after sending
            await getLatestMessagesInChat(selectedChatId);
            
            // Scroll to bottom immediately after sending message
            setTimeout(() => {
                scrollToBottom(false); // Scroll without animation for immediate response
            }, 100);
            
            // Then scroll smoothly after a brief delay for better UX
            setTimeout(() => {
                scrollToBottom(true);
            }, 300);
            
            // Update lastMessage in ChatList after successful send
            if (onLastMessageUpdate) {
                const originalMessageText = messageText;
                const originalSelectedFiles = [...selectedFiles];
                
                // Wait a bit for the message to be processed
                setTimeout(() => {
                    let content = originalMessageText;
                    
                    // Format content based on message type
                    if (originalSelectedFiles.length > 0) {
                        const imageFiles = originalSelectedFiles.filter(f => f.file.type.startsWith('image/'));
                        const otherFiles = originalSelectedFiles.filter(f => !f.file.type.startsWith('image/'));
                        
                        if (imageFiles.length > 0) {
                            content = imageFiles.length > 1 ? `🖼️ ${imageFiles.length} hình ảnh` : '🖼️ Hình ảnh';
                        } else if (otherFiles.length > 0) {
                            content = otherFiles.length > 1 ? `📁 ${otherFiles.length} files` : '📁 File';
                        }
                    }
                    
                    onLastMessageUpdate(selectedChatId, {
                        content,
                        createdAt: new Date().toLocaleString(),
                        unread: false
                    });
                }, 500);
            }
            
            // Không hiển thị thông báo thành công
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Lỗi khi gửi tin nhắn', 'error');
        }
    };

    // Reply handling
    const startReply = (message: Message) => {
        setReplyState({ isReplying: true, message });
        setContextMenu({ isOpen: false, x: 0, y: 0, message: null });
    };

    const clearReply = () => {
        setReplyState({ isReplying: false, message: null });
    };

    // Context menu
    const handleContextMenu = (e: React.MouseEvent, message: Message) => {
        e.preventDefault();
        setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            message
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ isOpen: false, x: 0, y: 0, message: null });
    };

    // Message actions
    const handlePinMessage = async (message: Message) => {
        if (!currentUserId) return;
        try {
            await pinMessage(message._id, currentUserId);
            // Fetch lại danh sách pinned messages
            await loadPinnedMessages();
            // Không hiển thị thông báo thành công
            closeContextMenu();
        } catch (error) {
            console.error('Error pinning message:', error);
            showToast('Lỗi khi ghim tin nhắn', 'error');
        }
    };

    const handleUnpinMessage = async (messageId: string) => {
        try {
            await unpinMessage(messageId);
            // Fetch lại danh sách pinned messages
            await loadPinnedMessages();
            // Không hiển thị thông báo thành công
        } catch (error) {
            console.error('Error unpinning message:', error);
            showToast('Lỗi khi gỡ ghim tin nhắn', 'error');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            // Kiểm tra pinned messages có tồn tại message này không, nếu có thì xóa và cập nhật lại
            const isPinned = pinnedMessages.some(msg => msg._id === messageId);
            if (isPinned) {
                await handleUnpinMessage(messageId);
            }

            // Không hiển thị thông báo thành công
            closeContextMenu();
            // Refresh messages
            loadInitialMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
            showToast('Lỗi khi thu hồi tin nhắn', 'error');
        }
    };

    // Utility functions
    const showToast = (message: string, type: 'success' | 'error') => {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    };

    const getSenderName = (message: Message, members?: ChatMember[]) => {
        // Ưu tiên senderInfo từ message
        if (message.senderInfo?.name) {
            return message.senderInfo.name;
        }
        
        // Fallback to members list
        const senderID = message.senderInfo?.userID || message.senderID;
        if (senderID && members) {
            const member = members.find(m => m.userID === senderID);
            return member ? member.userName : senderID;
        }
        
        return senderID || 'Unknown User';
    };

    // Get latest pinned message
    const latestPinnedMessage = pinnedMessages[0] || null;

    return {
        // States
        messageText,
        setMessageText,
        selectedFiles,
        replyState,
        contextMenu,
        showImageZoom,
        setShowImageZoom,
        showPinnedModal,
        setShowPinnedModal,
        allMessages,
        loading,
        latestPinnedMessage,
        pinnedMessages,

        // Refs
        messagesEndRef,
        messagesContainerRef,
        fileInputRef,

        // Functions
        handleFileSelect,
        handlePaste,
        removeFile,
        handleSendMessage,
        startReply,
        clearReply,
        handleContextMenu,
        closeContextMenu,
        handlePinMessage,
        handleUnpinMessage,
        handleDeleteMessage,
        scrollToMessage,
        loadMoreMessages,
        getSenderName,
        showToast,
        loadPinnedMessages,

        // Computed
        canLoadMore: !!linkPrev,
        hasSelectedFiles: selectedFiles.length > 0,
        isAutoLoading
    };
};