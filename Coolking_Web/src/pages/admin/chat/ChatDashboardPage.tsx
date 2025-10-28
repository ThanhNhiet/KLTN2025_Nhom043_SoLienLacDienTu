import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat, type Chat } from '../../../hooks/useChat';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';
import CleanUpChatModal from './CleanUpChatModal';
import UpdateGrchatModal from './UpdateGrchatModal';
import ChatDetailInfoModal from './ChatDetailInfoModal';
import CreateHomeroomGrModal from './CreateHomeroomGrModal';
import CleanUpGrchatOfCSCompleteModal from './CleanUpGrchatOfCSCompleteModal';

const ChatDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { chats, loading, error, currentPage, pageSize, pages, getChats, searchChats, deleteChat} = useChat();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete', chatId: string } | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCleanUpModal, setShowCleanUpModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingChat, setUpdatingChat] = useState<Chat | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showCreateHomeroomModal, setShowCreateHomeroomModal] = useState(false);
  const [showCleanUpCompleteModal, setShowCleanUpCompleteModal] = useState(false);

  useEffect(() => {
    getChats(1, 10);
  }, [getChats]);

  const handleSearch = async () => {
    if (searchKeyword.trim()) {
      await searchChats(searchKeyword, 1, pageSize);
    } else {
      getChats(1, pageSize);
    }
  };

  const handlePageChange = (page: number) => {
    if (searchKeyword.trim()) {
      searchChats(searchKeyword, page, pageSize);
    } else {
      getChats(page, pageSize);
    }
  };

  const handleActionClick = (chatId: string) => {
    setShowActionMenu(showActionMenu === chatId ? null : chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setConfirmAction({ type: 'delete', chatId });
    setShowConfirmModal(true);
    setShowActionMenu(null);
  };

  const handleUpdateChat = (chatId: string) => {
    const chat = chats.find(c => c._id === chatId);
    if (chat) {
      setUpdatingChat(chat);
      setShowUpdateModal(true);
    }
    setShowActionMenu(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'delete') {
        const result = await deleteChat(confirmAction.chatId);
        if (result) {
          setSuccessMessage('Đã xóa chat thành công!');
          setShowSuccessNotification(true);
          // Refresh the chats list
          if (searchKeyword.trim()) {
            await searchChats(searchKeyword, currentPage, pageSize);
          } else {
            await getChats(currentPage, pageSize);
          }
        }
      }
      
      setShowConfirmModal(false);
      setConfirmAction(null);
      
      // Auto hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCleanUpSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessNotification(true);
    
    // Refresh the chats list
    if (searchKeyword.trim()) {
      searchChats(searchKeyword, currentPage, pageSize);
    } else {
      getChats(currentPage, pageSize);
    }
    
    // Auto hide success notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const handleUpdateSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessNotification(true);
    
    // Refresh the chats list
    if (searchKeyword.trim()) {
      searchChats(searchKeyword, currentPage, pageSize);
    } else {
      getChats(currentPage, pageSize);
    }
    
    // Auto hide success notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const handleRowClick = (chat: Chat) => {
    setSelectedChat(chat);
    setShowDetailModal(true);
  };

  const getChatTypeBadge = (type: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    if (type === 'group') {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    } else {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdCpn />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Quản lý Chat</h1>
            
            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Tìm kiếm chat theo tên..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={() => navigate('/admin/chat/course-sections')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Lớp học phần chưa có chat</span>
                </button>

                <button 
                  onClick={() => setShowCreateHomeroomModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Tạo nhóm chat chủ nhiệm</span>
                </button>
                
                <button 
                  onClick={() => setShowCleanUpModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Dọn dẹp chat riêng không hoạt động</span>
                </button>

                <button 
                  onClick={() => setShowCleanUpCompleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                  <span>Dọn dẹp nhóm chat đã hoàn thành</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto pr-4">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại chat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã lớp học phần</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày cập nhật</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng thành viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-red-500">
                      Lỗi: {error}
                    </td>
                  </tr>
                ) : chats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  chats.map((chat, index) => (
                    <tr 
                      key={chat._id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors duration-200 select-none`}
                      onClick={(e) => {
                        // Only trigger detail if not clicking on action buttons and no text is selected
                        const selection = window.getSelection();
                        if (!e.defaultPrevented && (!selection || selection.toString().length === 0)) {
                          handleRowClick(chat);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getChatTypeBadge(chat.type)}>
                          {chat.type === 'group' ? 'Nhóm' : 'Cá nhân'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {chat.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {chat.course_section_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chat.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chat.updatedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chat.memberCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                        <button
                          data-chat-id={chat._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(chat._id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {showActionMenu === chat._id && (
                          <div className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-48" 
                               style={{
                                 top: `${(document.querySelector(`[data-chat-id="${chat._id}"]`) as HTMLElement)?.getBoundingClientRect()?.bottom + 5 || 0}px`,
                                 right: `${window.innerWidth - (document.querySelector(`[data-chat-id="${chat._id}"]`) as HTMLElement)?.getBoundingClientRect()?.right || 0}px`
                               }}>
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateChat(chat._id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-blue-500">✏️</span>
                                <span>Cập nhật</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChat(chat._id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-gray-700 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-red-500">🗑️</span>
                                <span>Xóa</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &lt;
                </button>
                
                {pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                      page === currentPage
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
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &gt;
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      <FooterAdCpn />

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded shadow-md flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="ml-2 hover:bg-green-600 rounded p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận xóa chat
            </h3>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa chat này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelAction}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowActionMenu(null)}
        />
      )}

      {/* Clean Up Chat Modal */}
      <CleanUpChatModal
        isOpen={showCleanUpModal}
        onClose={() => setShowCleanUpModal(false)}
        onSuccess={handleCleanUpSuccess}
      />

      {/* Update Group Chat Modal */}
      <UpdateGrchatModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSuccess={handleUpdateSuccess}
        chat={updatingChat}
      />

      {/* Chat Detail Info Modal */}
      <ChatDetailInfoModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        chat={selectedChat}
      />

      {/* Create Homeroom Group Chat Modal */}
      <CreateHomeroomGrModal
        isOpen={showCreateHomeroomModal}
        onClose={() => setShowCreateHomeroomModal(false)}
        onSuccess={handleCleanUpSuccess}
      />

      {/* Clean Up Group Chats of Completed Course Sections Modal */}
      <CleanUpGrchatOfCSCompleteModal
        isOpen={showCleanUpCompleteModal}
        onClose={() => setShowCleanUpCompleteModal(false)}
        onSuccess={handleCleanUpSuccess}
      />
    </div>
  );
};

export default ChatDashboardPage;
