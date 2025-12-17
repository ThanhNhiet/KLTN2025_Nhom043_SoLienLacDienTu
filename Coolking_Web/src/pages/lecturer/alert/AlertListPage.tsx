import React, { useState, useEffect } from 'react';
import { useAlert, type Alert } from '../../../hooks/useAlert';
import AlertDetailModal from './AlertDetailModal';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';

const AlertListPage: React.FC = () => {
    const { alerts, loading, error, currentPage, pages, getAlertsForLecturer, deleteLecturerAlert, searchAlertsByKeyword } = useAlert();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({
        show: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        getAlertsForLecturer(1, 10);
    }, [getAlertsForLecturer]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const handleSearch = async () => {
        if (searchKeyword.trim()) {
            setIsSearching(true);
            await searchAlertsByKeyword(searchKeyword.trim(), 1, 10);
        } else {
            setIsSearching(false);
            await getAlertsForLecturer(1, 10);
        }
    };

    const handlePageChange = async (page: number) => {
        if (isSearching && searchKeyword.trim()) {
            await searchAlertsByKeyword(searchKeyword.trim(), page, 10);
        } else {
            await getAlertsForLecturer(page, 10);
        }
    };

    const handleRowClick = (alert: Alert) => {
        setSelectedAlert(alert);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedAlert(null);
    };

    const handleDeleteClick = (alert: Alert, e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn không cho click event lan truyền đến row
        setAlertToDelete(alert);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!alertToDelete) return;

        try {
            const response = await deleteLecturerAlert(alertToDelete.createdAt);
            if (response?.success) {
                showToast('Xóa thông báo thành công!', 'success');
                setShowConfirmModal(false);
                setAlertToDelete(null);
                // Refresh data
                await getAlertsForLecturer(currentPage, 10);
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi xóa thông báo', 'error');
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmModal(false);
        setAlertToDelete(null);
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
            <HeaderLeCpn />
            <div className="px-3 md:px-6 py-4 border-b border-gray-200">
                <div className="bg-white rounded-lg shadow-sm border">
                    {/* Header */}
                    <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">Thông Báo đã gửi</h1>

                        {/* Search and Actions */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 md:max-w-md">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm thông báo..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200"
                                >
                                    <svg className="w-4 md:w-5 h-4 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setSearchKeyword('');
                                        setIsSearching(false);
                                        getAlertsForLecturer(1, 10);
                                    }}
                                    className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200 font-medium text-gray-700 text-sm md:text-base"
                                >
                                    Làm mới
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Người nhận</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Phạm vi</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Trạng thái</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày gửi</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
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
                                            onClick={() => handleRowClick(alert)}
                                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200 cursor-pointer`}
                                        >
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-mono text-gray-900">
                                                <span className="hidden sm:inline">{alert._id.substring(0, 8)}...</span>
                                                <span className="sm:hidden">{alert._id.substring(0, 6)}...</span>
                                            </td>
                                            <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900">
                                                <div className="max-w-[120px] md:max-w-xs truncate" title={alert.header}>
                                                    {alert.header}
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                                                <div className="max-w-[100px] md:max-w-none truncate" title={alert.receiverID}>
                                                    {alert.receiverID}
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-3 md:px-6 py-4 whitespace-nowrap">
                                                <span className={getScopeBadge(alert.targetScope)}>
                                                    {alert.targetScope === 'all' ? 'Hệ thống' : 'Cá nhân'}
                                                </span>
                                            </td>
                                            <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${alert.isRead
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {alert.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                                </span>
                                            </td>
                                            <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                                                {alert.createdAt}
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                                                <button
                                                    onClick={(e) => handleDeleteClick(alert, e)}
                                                    className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 md:p-2 hover:bg-red-50 rounded"
                                                    title="Xóa thông báo"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pages.length > 0 && (
                        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-center">
                            <nav className="flex items-center space-x-1 md:space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    &lt;
                                </button>

                                {pages.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md transition-colors duration-200 ${page === currentPage
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
                                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    &gt;
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-[60] p-3 md:p-4 rounded-lg shadow-lg transform transition-all duration-300 ${toast.type === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    <div className="flex items-center text-sm md:text-base">
                        {toast.type === 'success' ? (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && alertToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                            Xác nhận xóa thông báo
                        </h3>
                        <p className="text-sm md:text-base text-gray-700 mb-6">
                            Xóa tất cả những thông báo có tiêu đề và nội dung liên quan?
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 mb-4">
                            Tiêu đề: <span className="font-semibold">"{alertToDelete.header}"</span>
                        </p>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:gap-0">
                            <button
                                onClick={handleCancelDelete}
                                className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-3 md:px-4 py-2 text-sm md:text-base text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Detail Modal */}
            <AlertDetailModal
                isOpen={showDetailModal}
                onClose={handleCloseDetailModal}
                alert={selectedAlert}
            />

            <FooterLeCpn />
        </div>
    );
};

export default AlertListPage;
