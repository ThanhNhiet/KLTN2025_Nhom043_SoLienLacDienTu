import React, { useState, useEffect } from 'react';
import { useChat, type ChatDetail, type ChatMember } from '../../../hooks/useChat';
import backupIMG from '../../../assets/img/no-image.jpg';

interface ChatInfoCpnProps {
    selectedChatId?: string;
    onShowImages: () => void;
    onShowFiles: () => void;
    onShowLinks: () => void;
    onMembersUpdate?: (members: ChatMember[]) => void;
}

const ChatInfoCpn: React.FC<ChatInfoCpnProps> = ({
    selectedChatId,
    onShowImages,
    onShowFiles,
    onShowLinks,
    onMembersUpdate
}) => {
    const [isNotificationMuted, setIsNotificationMuted] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [memberSearchKeyword, setMemberSearchKeyword] = useState('');
    const { getChatById4AllUser, muteChat4AllUser, loading, error, chats } = useChat();

    // Default fallback images
    const DEFAULT_AVATAR = 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1760607108/no-image_z1mtgf.jpg';
    const BACKUP_AVATAR = backupIMG;

    // Hàm xử lý lỗi ảnh với fallback chain
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        // Kiểm tra xem có phải đang sử dụng backup image không
        const isUsingBackup = img.src.includes('no-image') || img.src === BACKUP_AVATAR;
        
        if (!img.src.includes(DEFAULT_AVATAR.split('/').pop() || '') && !isUsingBackup) {
            // Thử fallback đầu tiên (Cloudinary)
            img.src = DEFAULT_AVATAR;
        } else if (img.src.includes(DEFAULT_AVATAR.split('/').pop() || '')) {
            // Nếu Cloudinary cũng lỗi, dùng local backup
            img.src = BACKUP_AVATAR;
        }
    };

    // Hàm tạo URL ảnh an toàn
    const getSafeImageUrl = (originalUrl: string | null | undefined): string => {
        if (!originalUrl || originalUrl.trim() === '') {
            return BACKUP_AVATAR; // Ưu tiên local image trước
        }
        
        // Kiểm tra xem URL có hợp lệ không
        try {
            new URL(originalUrl);
            return originalUrl;
        } catch {
            return BACKUP_AVATAR; // Fallback về local image khi URL không hợp lệ
        }
    };

    useEffect(() => {
        if (selectedChatId) {
            loadChatDetail();
        }
    }, [selectedChatId]);

    const loadChatDetail = async () => {
        if (!selectedChatId) return;

        try {
            // Sử dụng hook getChatById4AllUser - data sẽ được lưu trong chats state
            await getChatById4AllUser(selectedChatId);
        } catch (error) {
            console.error('Error loading chat detail:', error);
        }
    };

    // Lấy chat detail từ chats state - cast sang ChatDetail vì response API có members
    const chatDetail = chats && chats.length > 0 ? (chats[0] as any as ChatDetail) : null;

    // Lọc thành viên theo từ khóa tìm kiếm
    const filteredMembers = chatDetail?.members?.filter((member: ChatMember) =>
        member.userName.toLowerCase().includes(memberSearchKeyword.toLowerCase())
    ) || [];

    // Cập nhật muted status khi có chatDetail
    useEffect(() => {
        if (chatDetail && chatDetail.members) {
            const currentUser = chatDetail.members.find((member: ChatMember) =>
                member.userID === 'CURRENT_USER_ID' // TODO: Thay thế bằng ID user từ auth context
            );
            setIsNotificationMuted(currentUser?.muted || false);
            
            // Truyền members về parent component
            if (onMembersUpdate) {
                onMembersUpdate(chatDetail.members);
            }
        }
    }, [chatDetail, onMembersUpdate]);

    const handleMuteToggle = async () => {
        if (!selectedChatId) return;

        try {
            const response = await muteChat4AllUser(selectedChatId);
            if (response?.success) {
                setIsNotificationMuted(!isNotificationMuted);
                // Hiển thị toast success
                showToast(response.message || 'Cập nhật thông báo thành công', 'success');
            }
        } catch (error) {
            console.error('Error toggling mute:', error);
            showToast('Lỗi khi cập nhật thông báo', 'error');
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        // Tạo toast notification ở góc phải màn hình
        const toast = document.createElement('div');
        toast.className = `fixed top-14 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    };

    if (!selectedChatId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2">Chọn một cuộc trò chuyện</h3>
                <p className="text-sm">Chọn một cuộc trò chuyện để xem thông tin chi tiết</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500">Đang tải...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
                <div className="text-4xl mb-2">⚠️</div>
                <p>Có lỗi xảy ra khi tải thông tin</p>
            </div>
        );
    }

    if (!chatDetail) {
        return (
            <div className="flex flex-col pl-2 items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">❓</div>
                <p>Không tìm thấy thông tin cuộc trò chuyện</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200">
            {/* Header cố định */}
            <div className="flex flex-col items-center p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
                <img
                    src={getSafeImageUrl(chatDetail.avatar)}
                    alt={chatDetail.name}
                    className="w-20 h-20 rounded-full object-cover mb-3"
                    onError={handleImageError}
                    loading="lazy"
                />
                <h2 className="text-base font-semibold text-gray-900 text-center mb-1">
                    {chatDetail.name}
                </h2>
                <span
                    className={`px-2 py-1 text-xs rounded-full ${chatDetail.type === 'group'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                >
                    {chatDetail.type === 'group' ? 'Nhóm' : 'Riêng tư'}
                </span>
            </div>

            {/* Nội dung cuộn riêng */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* Notification Toggle */}
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={handleMuteToggle}
                        className="flex items-center justify-between w-full rounded-lg"
                    >
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🔔</span>
                            <span className="text-gray-700">
                                {isNotificationMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                            </span>
                        </div>
                        <div
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${isNotificationMuted ? 'bg-gray-300' : 'bg-blue-500'
                                }`}
                        >
                            <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${isNotificationMuted ? 'translate-x-0' : 'translate-x-6'
                                    }`}
                            ></div>
                        </div>
                    </button>
                </div>

                {/* Media Actions */}
                <div className="p-4 space-y-2 border-b border-gray-100">
                    <button
                        onClick={onShowImages}
                        className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-2xl mr-3">🖼️</span>
                        <span className="text-gray-700">Ảnh</span>
                        <span className="ml-auto text-gray-400">›</span>
                    </button>

                    <button
                        onClick={onShowFiles}
                        className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-2xl mr-3">📁</span>
                        <span className="text-gray-700">File</span>
                        <span className="ml-auto text-gray-400">›</span>
                    </button>

                    <button
                        onClick={onShowLinks}
                        className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-2xl mr-3">🔗</span>
                        <span className="text-gray-700">Link</span>
                        <span className="ml-auto text-gray-400">›</span>
                    </button>
                </div>

                {/* Members */}
                {chatDetail.type === 'group' && (
                    <div className="p-4">
                        <button
                            onClick={() => setShowMembers(!showMembers)}
                            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">👥</span>
                                <span className="text-gray-700">
                                    Thành viên ({chatDetail.members.length})
                                </span>
                            </div>
                            <span
                                className={`text-gray-400 transition-transform ${showMembers ? 'rotate-90' : ''
                                    }`}
                            >
                                ›
                            </span>
                        </button>

                        {showMembers && (
                            <div className="mt-2">
                                {/* Search bar cho thành viên */}
                                <div className="mb-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm thành viên..."
                                            value={memberSearchKeyword}
                                            onChange={(e) => setMemberSearchKeyword(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            🔍
                                        </span>
                                        {memberSearchKeyword && (
                                            <button
                                                onClick={() => setMemberSearchKeyword('')}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Danh sách thành viên */}
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {filteredMembers.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">
                                            <div className="text-2xl mb-2">👤</div>
                                            <p className="text-sm">
                                                {memberSearchKeyword ? 'Không tìm thấy thành viên' : 'Không có thành viên nào'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredMembers.map((member: ChatMember) => (
                                            <div
                                                key={member.userID}
                                                className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <img
                                                    src={getSafeImageUrl(member.avatar)}
                                                    onError={handleImageError}
                                                    alt={member.userName}
                                                    className="w-8 h-8 rounded-full object-cover mr-3"
                                                    loading="lazy"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {member.userName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {member.role === 'admin' || member.role === 'lecturer'
                                                            ? 'Giảng viên'
                                                            : 'Sinh viên'}
                                                    </p>
                                                </div>
                                                {member.role === 'admin' || member.role === 'lecturer' && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                        Giảng viên
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInfoCpn;
