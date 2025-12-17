import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../hooks/useAlert';
import { useMessageNotification } from '../../hooks/hookMessageNotification';
import type { Alert } from '../../hooks/useAlert';
import AlertDetailModal from './AlertDetailModal';
import logoImg from '../../assets/img/logo.png';
import noImage from '../../assets/img/no-image.jpg';

const HeaderLECpn: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { newMessNav } = useMessageNotification();
    const { 
        getMyAlerts, 
        alerts, 
        loading, 
        unreadCount, 
        pages, 
        currentPage,
        markSystemAlertAsRead,
        deleteSystemAlert,
        deleteAllReadSystemAlerts,
        markPersonalAlertAsRead,
        deleteAlertPersonal4ReceiverLe,
        deleteAllPersonalAlerts4ReceiverLe
    } = useAlert();

    const [showAlertBox, setShowAlertBox] = useState(false);
    const [alertPage, setAlertPage] = useState(1);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'person'>('all');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({
        show: false,
        message: '',
        type: 'success'
    });

    //Tách ref thành 2 cái riêng biệt cho mobile và desktop
    const mobileAlertBoxRef = useRef<HTMLDivElement>(null);
    const desktopAlertBoxRef = useRef<HTMLDivElement>(null);

    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Lấy thông tin lecturer từ localStorage
    const lecturerName = localStorage.getItem('lecturer_name') || '';
    const lecturerAvatar = localStorage.getItem('lecturer_avatar_url') || '';

    // Load alerts khi mở alert box hoặc thay đổi trang
    useEffect(() => {
        if (showAlertBox) {
            getMyAlerts(alertPage, 10);
        }
    }, [showAlertBox, alertPage, getMyAlerts]);

    // Load unread count khi component mount
    useEffect(() => {
        getMyAlerts(1, 10);
    }, [getMyAlerts]);

    // Auto refresh alerts every minute, pause when modal is open
    useEffect(() => {
        const interval = setInterval(() => {
            if (!showDetailModal) {
                getMyAlerts(1, 10);
            }
        }, 60000); // 1 phút = 60000ms

        return () => clearInterval(interval);
    }, [showDetailModal, getMyAlerts]);

    // Đóng alert box và mobile menu khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Kiểm tra click outside cho Alert Box
            // Logic: Nếu click không nằm trong Desktop Ref VÀ không nằm trong Mobile Ref thì mới đóng
            const clickedInsideDesktop = desktopAlertBoxRef.current && desktopAlertBoxRef.current.contains(event.target as Node);
            const clickedInsideMobile = mobileAlertBoxRef.current && mobileAlertBoxRef.current.contains(event.target as Node);

            if (showAlertBox && !clickedInsideDesktop && !clickedInsideMobile) {
                setShowAlertBox(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setShowMobileMenu(false);
            }
        };

        if (showAlertBox || showMobileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAlertBox, showMobileMenu]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleBellClick = () => {
        setShowAlertBox(!showAlertBox);
        if (!showAlertBox) {
            setAlertPage(1);
        }
    };

    const handlePageChange = (page: number) => {
        setAlertPage(page);
    };

    const handleTabChange = (tab: 'all' | 'person') => {
        setActiveTab(tab);
        setAlertPage(1); // Reset to first page when switching tabs
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const handleAlertClick = async (alert: Alert) => {
        setSelectedAlert(alert);
        setShowDetailModal(true);
        setShowAlertBox(false);

        // Đánh dấu đã đọc nếu là thông báo hệ thống và chưa đọc
        if (alert.targetScope === 'all' && !alert.isRead) {
            try {
                const response = await markSystemAlertAsRead(alert._id);
                if (response?.success) {
                    // Reload alerts để cập nhật trạng thái
                    getMyAlerts(alertPage, 10);
                }
            } catch (error) {
                console.error('Error marking alert as read:', error);
            }
        }
        if (alert.targetScope === 'person' && !alert.isRead) {
            try {
                const response = await markPersonalAlertAsRead(alert._id);
                if (response?.success) {
                    // Reload alerts để cập nhật trạng thái
                    getMyAlerts(alertPage, 10);
                }
            } catch (error) {
                console.error('Error marking alert as read:', error);
            }
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedAlert(null);
    };

    const handleDeleteAlert = async (alertId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn không cho click event lan truyền đến parent
        try {
            const response = await deleteSystemAlert(alertId);
            if (response?.success) {
                showToast('Xóa thông báo thành công', 'success');
                getMyAlerts(alertPage, 10); // Reload alerts
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi xóa thông báo', 'error');
        }
    };

    const handleDeletePersonalAlert = async (alertId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn không cho click event lan truyền đến parent
        try {
            const response = await deleteAlertPersonal4ReceiverLe(alertId);
            if (response?.success) {
                showToast('Xóa thông báo cá nhân thành công', 'success');
                getMyAlerts(alertPage, 10); // Reload alerts
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi xóa thông báo cá nhân', 'error');
        }
    };

    const handleDeleteAllReadPersonalAlerts = async () => {
        try {
            await deleteAllPersonalAlerts4ReceiverLe();
            showToast('Xóa tất cả thông báo cá nhân đã đọc thành công', 'success');
            getMyAlerts(alertPage, 10); // Reload alerts
        } catch (error) {
            showToast('Có lỗi xảy ra khi xóa tất cả thông báo cá nhân đã đọc', 'error');
        }
    };

    const handleDeleteAllReadAlerts = async () => {
        try {
            await deleteAllReadSystemAlerts();
            showToast('Xóa tất cả thông báo đã đọc thành công', 'success');
            getMyAlerts(alertPage, 10); // Reload alerts
        } catch (error) {
            showToast('Có lỗi xảy ra khi xóa thông báo', 'error');
        }
    };

    const formatTargetScope = (targetScope: string) => {
        return targetScope === 'all' ? 'Toàn trường' : 'Cá nhân';
    };

    const handleMobileMenuToggle = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    const closeMobileMenu = () => {
        setShowMobileMenu(false);
    };

    // Xử lý navigation để tránh reload trang
    const handleNavigation = (url: string) => {
        closeMobileMenu();
        navigate(url);
    };

    // Filter alerts based on active tab
    const filteredAlerts = alerts.filter(alert => alert.targetScope === activeTab);
    
    // Kiểm tra xem có thể xóa tất cả thông báo không (tất cả đều đã đọc)
    const canDeleteAll = filteredAlerts.length > 0 && filteredAlerts.every(alert => alert.isRead);
    
    // Handle delete all based on active tab
    const handleDeleteAllByTab = () => {
        if (activeTab === 'all') {
            handleDeleteAllReadAlerts();
        } else {
            handleDeleteAllReadPersonalAlerts();
        }
    };

    return (
        <header className="bg-white shadow-md border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Logo and Hamburger */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <img src={logoImg} alt="CoolKing Logo" className="h-8 sm:h-10 w-8 sm:w-10 object-contain" />
                            <span className="text-lg sm:text-xl font-bold text-blue-600">CoolKing</span>
                        </div>

                        {/* Hamburger Button - Mobile */}
                        <button
                            onClick={handleMobileMenuToggle}
                            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Menu</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Mobile Alert Bell */}
                        <div className="md:hidden relative" ref={mobileAlertBoxRef}>
                            <button
                                onClick={handleBellClick}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none relative"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.002 2.002 0 0018 14V10a6 6 0 00-12 0v4a2.002 2.002 0 00-.595 1.595L4 17h5m6 0a3 3 0 01-6 0" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Alert Box */}
                            {showAlertBox && (
                                <div className="absolute right-1/2 translate-x-1/3 top-12 w-[90vw] bg-white rounded-lg shadow-xl border z-50">
                                    <div className="p-4 border-b bg-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-semibold text-gray-800">Thông báo</h3>
                                            {canDeleteAll && (
                                                <button
                                                    onClick={handleDeleteAllByTab}
                                                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                                                    title={`Xóa tất cả thông báo ${activeTab === 'all' ? 'toàn trường' : 'cá nhân'} đã đọc`}
                                                >
                                                    Xóa tất cả
                                                </button>
                                            )}
                                        </div>
                                        {/* Tabs */}
                                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => handleTabChange('all')}
                                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                                                    activeTab === 'all'
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                            >
                                                Toàn trường
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('person')}
                                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                                                    activeTab === 'person'
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                            >
                                                Cá nhân
                                            </button>
                                        </div>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto">
                                        {loading ? (
                                            <div className="p-4 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="mt-2 text-gray-600">Đang tải...</p>
                                            </div>
                                        ) : filteredAlerts.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Không có thông báo nào
                                            </div>
                                        ) : (
                                            filteredAlerts.map((alert) => (
                                                <div
                                                    key={alert._id}
                                                    onClick={() => handleAlertClick(alert)}
                                                    className="p-4 border-b hover:bg-gray-50 cursor-pointer relative group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium text-gray-800 text-sm overflow-hidden pr-8" style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical'
                                                        }}>
                                                            {alert.header}
                                                        </h4>
                                                        <div className="flex items-center space-x-2">
                                                            {alert.isRead && alert.targetScope === 'all' && (
                                                                <button
                                                                    onClick={(e) => handleDeleteAlert(alert._id, e)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                                                                    title="Xóa thông báo"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {alert.isRead && alert.targetScope === 'person' && (
                                                                <button
                                                                    onClick={(e) => handleDeletePersonalAlert(alert._id, e)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                                                                    title="Xóa thông báo cá nhân"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {!alert.isRead && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 text-xs mb-2 overflow-hidden" style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical'
                                                    }}>
                                                        {alert.body}
                                                    </p>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Từ: {alert.senderID}</span>
                                                        <span>{formatTargetScope(alert.targetScope)}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {alert.createdAt}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    <div className="p-3 border-t bg-gray-50 sticky bottom-0">
                                        <div className="flex justify-center space-x-1">
                                            {pages.map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-1 text-sm rounded ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-3 items-center">
                            <a
                                href="/lecturer/schedule"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                                Lịch dạy/gác thi
                            </a>
                            <a
                                href="/lecturer/clazz"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                                Lớp học
                            </a>
                            <a
                                href="/lecturer/homeroom"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                                Lớp chủ nhiệm
                            </a>
                            <a
                                href="/lecturer/alerts"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                                Thông báo đã gửi
                            </a>
                            <a
                                href="/lecturer/chat"
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50 relative"
                            >
                                {newMessNav && (
                                    <span className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                                Nhắn tin
                            </a>
                            
                            {/* Alert bell icon - Desktop */}
                            <div className="relative ml-4" ref={desktopAlertBoxRef}>
                                <button
                                    onClick={handleBellClick}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none relative"
                                >
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.002 2.002 0 0018 14V10a6 6 0 00-12 0v4a2.002 2.002 0 00-.595 1.595L4 17h5m6 0a3 3 0 01-6 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Alert Box */}
                                {showAlertBox && (
                                    <div
                                        className="absolute left-0 top-12 w-[90vw] sm:w-96 bg-white rounded-lg shadow-xl border z-50"
                                    >
                                        <div className="p-4 border-b bg-gray-50">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="font-semibold text-gray-800">Thông báo</h3>
                                                {canDeleteAll && (
                                                    <button
                                                        onClick={handleDeleteAllByTab}
                                                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                                                        title={`Xóa tất cả thông báo ${activeTab === 'all' ? 'toàn trường' : 'cá nhân'} đã đọc`}
                                                    >
                                                        Xóa tất cả
                                                    </button>
                                                )}
                                            </div>
                                            {/* Tabs */}
                                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => handleTabChange('all')}
                                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                                        activeTab === 'all'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-800'
                                                    }`}
                                                >
                                                    Toàn trường
                                                </button>
                                                <button
                                                    onClick={() => handleTabChange('person')}
                                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                                        activeTab === 'person'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-800'
                                                    }`}
                                                >
                                                    Cá nhân
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                            {loading ? (
                                                <div className="p-4 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                    <p className="mt-2 text-gray-600">Đang tải...</p>
                                                </div>
                                            ) : filteredAlerts.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    Không có thông báo nào
                                                </div>
                                            ) : (
                                                filteredAlerts.map((alert) => (
                                                    <div
                                                        key={alert._id}
                                                        onClick={() => handleAlertClick(alert)}
                                                        className="p-4 border-b hover:bg-gray-50 cursor-pointer relative group"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-gray-800 text-sm overflow-hidden pr-8" style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {alert.header}
                                                            </h4>
                                                            <div className="flex items-center space-x-2">
                                                                {alert.isRead && alert.targetScope === 'all' && (
                                                                    <button
                                                                        onClick={(e) => handleDeleteAlert(alert._id, e)}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                                                                        title="Xóa thông báo"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                {alert.isRead && alert.targetScope === 'person' && (
                                                                    <button
                                                                        onClick={(e) => handleDeletePersonalAlert(alert._id, e)}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                                                                        title="Xóa thông báo cá nhân"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                {!alert.isRead && (
                                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-600 text-xs mb-2 overflow-hidden" style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical'
                                                        }}>
                                                            {alert.body}
                                                        </p>
                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <span>Từ: {alert.senderID}</span>
                                                            <span>{formatTargetScope(alert.targetScope)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {alert.createdAt}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Pagination */}
                                        <div className="p-3 border-t bg-gray-50 sticky bottom-0">
                                            <div className="flex justify-center space-x-1">
                                                {pages.map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-3 py-1 text-sm rounded ${currentPage === page
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>

                    {/* Right side - User info and logout */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* User info - Hidden on small screens */}
                        <a
                            href="/lecturer/profile"
                            className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group cursor-pointer"
                        >
                            {lecturerAvatar && (
                                <img
                                    src={lecturerAvatar}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = noImage;
                                    }}
                                />
                            )}
                            <span className="text-gray-700 text-sm font-medium group-hover:text-blue-600 transition-colors duration-200">
                               GV {lecturerName || 'Giảng viên'}
                            </span>
                        </a>


                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-1 sm:space-x-2 bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Đăng xuất</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {showMobileMenu && (
                    <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200 bg-white relative z-40">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {/* User info on mobile */}
                            <button 
                                onClick={() => handleNavigation("/lecturer/profile")}
                                className="flex items-center space-x-3 px-3 py-2 border-b border-gray-100 mb-2 hover:bg-gray-50 rounded-md transition-colors duration-200 w-full"
                            >
                                {lecturerAvatar && (
                                    <img
                                        src={lecturerAvatar}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = noImage;
                                        }}
                                    />
                                )}
                                <span className="text-gray-700 text-sm font-medium hover:text-blue-600">
                                    GV {lecturerName || 'Giảng viên'}
                                </span>
                            </button>

                            {/* Navigation links */}
                            <button
                                onClick={() => handleNavigation("/lecturer/schedule")}
                                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-medium"
                            >
                                Lịch dạy/gác thi
                            </button>
                            <button
                                onClick={() => handleNavigation("/lecturer/clazz")}
                                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-medium"
                            >
                                Lớp học
                            </button>
                            <button
                                onClick={() => handleNavigation("/lecturer/homeroom")}
                                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-medium"
                            >
                                Lớp chủ nhiệm
                            </button>
                            <button
                                onClick={() => handleNavigation("/lecturer/alerts")}
                                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-medium"
                            >
                                Thông báo
                            </button>
                            <button
                                onClick={() => handleNavigation('/lecturer/chat')}
                                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md font-medium relative"
                            >
                                {newMessNav && (
                                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                                <span className={newMessNav ? "ml-3" : ""}>Nhắn tin</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Alert Detail Modal */}
            <AlertDetailModal
                alert={selectedAlert}
                isOpen={showDetailModal}
                onClose={closeDetailModal}
            />

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
                    toast.type === 'success' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    <div className="flex items-center">
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
        </header>
    );
};

export default HeaderLECpn;
