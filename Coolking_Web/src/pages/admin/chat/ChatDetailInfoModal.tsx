import React, { useState, useEffect } from 'react';
import { chatServices } from '../../../services/chatServices';

interface Member {
  userID: string;
  userName: string;
  role: string;
  joinedAt: string;
  muted: boolean;
  lastReadAt?: string;
}

interface ChatDetailInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: {
    _id: string;
    type: string;
    name: string;
    course_section_id?: string;
  } | null;
}

const ChatDetailInfoModal: React.FC<ChatDetailInfoModalProps> = ({
  isOpen,
  onClose,
  chat
}) => {
  interface ChatDetailType {
    _id: string;
    name?: string;
    type: 'group' | 'private';
    course_section_id?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    members: Member[];
  }

  const [chatDetail, setChatDetail] = useState<ChatDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMember, setSearchMember] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;

  useEffect(() => {
    if (isOpen && chat?._id) {
      fetchChatDetail();
    }
  }, [isOpen, chat]);

  const fetchChatDetail = async () => {
    if (!chat?._id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await chatServices.getChatInfoByID4Admin(chat._id);
      
      if (response.success && response.chat) {
        setChatDetail(response.chat);
      } else {
        setError(response.message || 'Không thể lấy thông tin chi tiết chat');
      }
    } catch (err) {
      setError('Lỗi khi tải thông tin chat');
      console.error('Error fetching chat detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setChatDetail(null);
    setError(null);
    setSearchMember('');
    setCurrentPage(1);
    onClose();
  };

  if (!isOpen) return null;

  // Filter members based on search
  const filteredMembers = chatDetail?.members?.filter(member =>
    member.userName.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.userID.toLowerCase().includes(searchMember.toLowerCase())
  ) || [];

  // Pagination for members
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + membersPerPage);

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (role === 'admin') {
      return `${baseClasses} bg-red-100 text-red-800`;
    } else {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'group') {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(chat?.type || '')}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chi tiết Chat</h2>
                <p className="text-sm text-gray-600">
                  {chat?.type === 'group' ? 'Nhóm chat' : 'Chat cá nhân'} - {chat?.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-700">Đang tải thông tin chi tiết...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          ) : chatDetail ? (
            <div className="p-6">
              {/* Chat Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chung</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {chatDetail.type === 'group' ? 'Tên nhóm' : 'Tên chat'}
                      </label>
                      <p className="text-gray-900 font-medium">
                        {chatDetail.name || (chatDetail.type === 'private' ? 'Chat riêng tư' : 'Không có tên')}
                      </p>
                    </div>
                    {chatDetail.course_section_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Mã lớp học phần</label>
                        <p className="text-gray-900 font-mono text-sm">{chatDetail.course_section_id}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Loại chat</label>
                      <p className="text-gray-900">
                        {chatDetail.type === 'group' ? 'Nhóm chat' : 'Chat riêng tư'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ngày tạo</label>
                      <p className="text-gray-900">{chatDetail.createdAt}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cập nhật lần cuối</label>
                      <p className="text-gray-900">{chatDetail.updatedAt}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tạo bởi</label>
                      <p className="text-gray-900">{chatDetail.createdBy}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tổng thành viên</label>
                      <p className="text-gray-900 font-bold">{chatDetail.members.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thành viên ({filteredMembers.length})
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Tìm kiếm thành viên..."
                      value={searchMember}
                      onChange={(e) => {
                        setSearchMember(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {currentMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Không tìm thấy thành viên nào</p>
                  </div>
                ) : (
                  <>
                    {/* Members Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mã số
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tên
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vai trò
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ngày tham gia
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentMembers.map((member, index) => (
                            <tr key={member.userID} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                                {member.userID}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {member.userName}
                                {member.muted && (
                                  <span className="ml-2 text-xs text-red-500">(Tắt tiếng)</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={getRoleBadge(member.role)}>
                                  {member.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {member.joinedAt}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-center">
                        <nav className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            &lt;
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
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
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            &gt;
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailInfoModal;
