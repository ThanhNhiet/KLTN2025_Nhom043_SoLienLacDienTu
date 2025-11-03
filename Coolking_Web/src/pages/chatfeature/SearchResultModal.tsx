import React, { useEffect } from 'react';
import type { ChatMember } from '../../hooks/useChat';

interface SearchMessage {
    _id: string;
    chatID: string;
    senderID: string;
    type: string;
    content: string;
    filename: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SearchResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchResults: SearchMessage[];
    searchKeyword: string;
    members?: ChatMember[];
}

const SearchResultModal: React.FC<SearchResultModalProps> = ({ 
    isOpen, 
    onClose, 
    searchResults, 
    searchKeyword,
    members = []
}) => {
    // Handle ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Hàm tìm tên người gửi từ userID
    const getSenderName = (senderID: string) => {
        const member = members.find(m => m.userID === senderID);
        return member ? member.userName : senderID; // Fallback về senderID nếu không tìm thấy
    };

    // Hàm lấy thông tin đầy đủ người gửi
    const getSenderInfo = (senderID: string) => {
        const member = members.find(m => m.userID === senderID);
        return member;
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'text':
                return '💬';
            case 'image':
                return '🖼️';
            case 'file':
                return '📁';
            case 'link':
                return '🔗';
            default:
                return '📝';
        }
    };

    const formatMessageContent = (message: SearchMessage) => {
        switch (message.type.toLowerCase()) {
            case 'image':
                return 'Hình ảnh';
            case 'file':
                return message.filename || 'File';
            case 'link':
                return message.content;
            default:
                return message.content;
        }
    };

    const highlightSearchKeyword = (text: string, keyword: string) => {
        if (!keyword || !text) return text;
        
        const regex = new RegExp(`(${keyword})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <mark key={index} className="bg-yellow-200 px-1 rounded">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
                onClose();
            }}
        >
            <div 
                className="bg-white rounded-lg w-full max-w-3xl h-4/5 flex flex-col"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Kết quả tìm kiếm</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {searchResults.length > 0 
                                ? `Tìm thấy ${searchResults.length} kết quả cho "${searchKeyword}"` 
                                : `Không tìm thấy kết quả nào cho "${searchKeyword}"`
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-lg mb-2">Không tìm thấy kết quả</p>
                            <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                    ) : (
                        <div className="p-4 h-full overflow-y-auto">
                            <div className="space-y-3">
                                {searchResults.map((message) => (
                                    <div
                                        key={message._id}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="text-2xl mt-1">
                                                {getMessageTypeIcon(message.type)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase font-mono">
                                                            {message.type}
                                                        </span>
                                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                            <span>Người gửi: {getSenderName(message.senderID)}</span>
                                                            {getSenderInfo(message.senderID)?.role === 'admin' || getSenderInfo(message.senderID)?.role === 'lecturer' && (
                                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                                                    Giảng viên
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                                        {message.createdAt}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    {message.type.toLowerCase() === 'text' ? (
                                                        <p className="text-gray-800 break-words">
                                                            {highlightSearchKeyword(message.content, searchKeyword)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-gray-800 break-words">
                                                            {formatMessageContent(message)}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Additional info for non-text messages */}
                                                {message.type.toLowerCase() !== 'text' && (
                                                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 break-all">
                                                        {message.content}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-2">
                                                    {(message.type.toLowerCase() === 'link' || message.type.toLowerCase() === 'file') && (
                                                        <button
                                                            onClick={() => window.open(message.content, '_blank')}
                                                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center"
                                                        >
                                                            <span className="mr-1">
                                                                {message.type.toLowerCase() === 'link' ? 'Mở link' : 'Mở file'}
                                                            </span>
                                                            <span>↗</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            Kết quả được sắp xếp theo thời gian gần nhất
                        </p>
                        <button
                            onClick={() => {
                                onClose();
                            }}
                            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchResultModal;
