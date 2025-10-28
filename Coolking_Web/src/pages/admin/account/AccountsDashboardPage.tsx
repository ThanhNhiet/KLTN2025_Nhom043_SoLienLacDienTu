import React, { useState, useEffect } from 'react';
import { useAccount, type Account } from '../../../hooks/useAccount';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';
import AccountsCreateModal from './AccountsCreateModal';
import AdminCreateModal from './AdminCreateModal';
import AccountsEditModal from './AccountsEditModal';

const AccountsDashboardPage: React.FC = () => {
  const { accounts, loading, error, currentPage, pageSize, pages, getAccounts, searchAccounts, disableAccount, resetPassword, refreshAccounts } = useAccount();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'disable' | 'reset', userId: string } | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminCreateModal, setShowAdminCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    getAccounts(1, 10);
  }, [getAccounts]);

  const handleSearch = async () => {
    if (searchKeyword.trim()) {
      await searchAccounts(searchKeyword, 1, pageSize);
    } else {
      getAccounts(1, pageSize);
    }
  };

  const handlePageChange = (page: number) => {
    getAccounts(page, pageSize);
  };

  const handleActionClick = (userId: string) => {
    setShowActionMenu(showActionMenu === userId ? null : userId);
  };

  const handleDisableAccount = (userId: string) => {
    setConfirmAction({ type: 'disable', userId });
    setShowConfirmModal(true);
    setShowActionMenu(null);
  };

  const handleResetPassword = (userId: string) => {
    setConfirmAction({ type: 'reset', userId });
    setShowConfirmModal(true);
    setShowActionMenu(null);
  };

  const handleEditAccount = (userId: string) => {
    const account = accounts.find(acc => acc.user_id === userId);
    if (account) {
      setEditingAccount(account);
      setShowEditModal(true);
    }
    setShowActionMenu(null);
  };

  const handleCreateAccount = () => {
    setShowCreateModal(true);
  };

  const handleAdminCreateAccount = () => {
    setShowAdminCreateModal(true);
  };

  const handleModalSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessNotification(true);
    refreshAccounts();
    
    // Auto hide success notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'disable') {
        await disableAccount(confirmAction.userId);
        setSuccessMessage(`Đã vô hiệu hóa tài khoản ${confirmAction.userId} thành công!`);
      } else if (confirmAction.type === 'reset') {
        await resetPassword(confirmAction.userId);
        setSuccessMessage(`Đã reset mật khẩu cho tài khoản ${confirmAction.userId} thành công!`);
      }
      
      // Show success notification
      setShowSuccessNotification(true);
      
      // Refresh the accounts list
      refreshAccounts();
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

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    if (status === 'ACTIVE') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    const colors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'LECTURER': 'bg-blue-100 text-blue-800',
      'STUDENT': 'bg-yellow-100 text-yellow-800',
      'PARENT': 'bg-gray-100 text-gray-800'
    };
    return `${baseClasses} ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdCpn />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Quản lý Tài Khoản</h1>
            
            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo ID, Email hoặc SĐT"
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
              
              <div className="flex gap-3">
                <button 
                  onClick={handleCreateAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Tạo mới</span>
                </button>
                <button 
                  onClick={handleAdminCreateAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                  <span>Thêm quản trị viên</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày cập nhật</th>
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
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  accounts.map((account, index) => (
                    <tr key={account.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {account.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.phone_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRoleBadge(account.role)}>
                          {account.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(account.status)}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.updatedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                        <button
                          data-account-id={account.user_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(account.user_id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {showActionMenu === account.user_id && (
                          <div className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-48" 
                               style={{
                                 top: `${(document.querySelector(`[data-account-id="${account.user_id}"]`) as HTMLElement)?.getBoundingClientRect()?.bottom + 5 || 0}px`,
                                 right: `${window.innerWidth - (document.querySelector(`[data-account-id="${account.user_id}"]`) as HTMLElement)?.getBoundingClientRect()?.right || 0}px`
                               }}>
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAccount(account.user_id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-blue-500">✏️</span>
                                <span>Chỉnh sửa</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDisableAccount(account.user_id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-gray-700 border-b border-gray-100 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-red-500">🚫</span>
                                <span>Vô hiệu hóa</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetPassword(account.user_id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-blue-500">🔐</span>
                                <span>Reset mật khẩu</span>
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
              Xác nhận hành động
            </h3>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn {confirmAction.type === 'disable' ? 'vô hiệu hóa' : 'reset mật khẩu cho'} tài khoản{' '}
              <span className="font-semibold">{confirmAction.userId}</span> không?
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
                Xác nhận
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

      {/* Create Account Modal */}
      <AccountsCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Create Admin Account Modal */}
      <AdminCreateModal
        isOpen={showAdminCreateModal}
        onClose={() => setShowAdminCreateModal(false)}
        onSuccess={handleModalSuccess}
      />
      {/* Edit Account Modal */}
      <AccountsEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        account={editingAccount}
      />
    </div>
  );
};

export default AccountsDashboardPage;
