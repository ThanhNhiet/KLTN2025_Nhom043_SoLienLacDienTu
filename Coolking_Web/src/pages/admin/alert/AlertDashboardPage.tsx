import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert, type Alert } from '../../../hooks/useAlertAD';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';
import SendFormModal from './SendFormModal';
import SendWarning4LeReqModal from './SendWarning4LeReqModal';
import AlertDetailModal from './AlertDetailModal';
import EditFormModal from './EditFormModal';

const AlertDashboardPage: React.FC = () => {
  const { alerts, loading, error, currentPage, pages, getAlerts, searchAlerts, deleteAlert } = useAlert();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showSendWarningModal, setShowSendWarningModal] = useState(false);
  const [alertToSendWarning, setAlertToSendWarning] = useState<Alert | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAlerts(1, 10);
  }, [getAlerts]);

  const handleSearch = async () => {
    if (searchKeyword.trim()) {
      await searchAlerts(searchKeyword, 1, 10);
    } else {
      getAlerts(1, 10);
    }
  };

  const handlePageChange = (page: number) => {
    getAlerts(page, 10);
  };

  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const handleActionClick = (alertId: string) => {
    setShowActionMenu(showActionMenu === alertId ? null : alertId);
  };

  const handleSendWarningClick = (alert: Alert) => {
    setAlertToSendWarning(alert);
    setShowSendWarningModal(true);
    setShowActionMenu(null);
  };

  const handleEditClick = (alert: Alert) => {
    setEditingAlert(alert);
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const handleDeleteClick = (alert: Alert) => {
    setAlertToDelete(alert);
    setShowConfirmModal(true);
    setShowActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!alertToDelete) return;

    try {
      // Xác định loại xóa dựa trên phạm vi
      if (alertToDelete.targetScope === 'all') {
        // Xóa thông báo hệ thống: chỉ cần alertID
        await deleteAlert(alertToDelete._id, '', '');
      } else {
        // Xóa thông báo person: cần createdAt và senderID
        await deleteAlert('', alertToDelete.createdAt, alertToDelete.senderID);
      }
      
      setSuccessMessage('Đã xóa thông báo thành công!');
      setShowSuccessNotification(true);
      setShowConfirmModal(false);
      setAlertToDelete(null);
      
      // Refresh data
      await getAlerts(currentPage, 10);
      
      // Auto hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
    } catch (error) {
      console.error('Delete alert error:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setAlertToDelete(null);
  };

  const handleSendSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessNotification(true);
    // Refresh data
    getAlerts(currentPage, 10);
    
    // Auto hide success notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const getScopeBadge = (scope: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    if (scope === 'all') {
      return `${baseClasses} bg-purple-100 text-purple-800`;
    } else {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdCpn />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-lg shadow-sm border relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Quản lý Thông Báo</h1>
            
            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo..."
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
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Tạo thông báo hệ thống</span>
                </button>
                <button
                  onClick={() => navigate('/admin/alerts/warning-students')}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13V6a2 2 0 00-2-2H8a2 2 0 00-2 2v7M6 13h12" />
                  </svg>
                  <span>Danh sách sinh viên cần cảnh cáo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người nhận</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phạm vi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày gửi</th>
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
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert, index) => (
                    <tr 
                      key={alert._id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors duration-200 select-none`}
                      onClick={(e) => {
                        // Only trigger detail if not clicking on action buttons and no text is selected
                        const selection = window.getSelection();
                        if (!e.defaultPrevented && (!selection || selection.toString().length === 0)) {
                          handleRowClick(alert);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {alert._id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {alert.header}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.senderID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.receiverID === 'All' ? 'Tất cả' : alert.receiverID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getScopeBadge(alert.targetScope)}>
                          {alert.targetScope === 'all' ? 'Hệ thống' : 'Cá nhân'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                        <button
                          data-alert-id={alert._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(alert._id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {showActionMenu === alert._id && (
                          <div className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-48" 
                               style={{
                                 top: `${(document.querySelector(`[data-alert-id="${alert._id}"]`) as HTMLElement)?.getBoundingClientRect()?.bottom + 5 || 0}px`,
                                 right: `${window.innerWidth - (document.querySelector(`[data-alert-id="${alert._id}"]`) as HTMLElement)?.getBoundingClientRect()?.right || 0}px`
                               }}>
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(alert);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-blue-500">✏️</span>
                                <span>Chỉnh sửa</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(alert);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-gray-700 transition-colors duration-200 flex items-center gap-2"
                              >
                                <span className="text-red-500">🗑️</span>
                                <span>Xóa</span>
                              </button>
                              {alert.isWarningYet !== null && alert.isWarningYet !== false && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendWarningClick(alert);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-sm text-gray-700 transition-colors duration-200 flex items-center gap-2"
                                >
                                  <span className="text-yellow-500">⚠️</span>
                                  <span>Gửi cảnh báo học vụ</span>
                                </button>
                              )}
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
      {showConfirmModal && alertToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận xóa thông báo
            </h3>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa thông báo{' '}
              <span className="font-semibold">"{alertToDelete.header}"</span> không?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
              >
                Xác nhận xóa
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

      {/* Send Alert Modal */}
      <SendFormModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSuccess={handleSendSuccess}
      />

      {/* Send Warning Modal */}
      <SendWarning4LeReqModal
        isOpen={showSendWarningModal}
        onClose={() => setShowSendWarningModal(false)}
        onSuccess={handleSendSuccess}
        alert={alertToSendWarning}
      />

      {/* Alert Detail Modal */}
      <AlertDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        alert={selectedAlert}
      />

      {/* Edit Alert Modal */}
      <EditFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleSendSuccess}
        alert={editingAlert}
      />
    </div>
  );
};

export default AlertDashboardPage;
