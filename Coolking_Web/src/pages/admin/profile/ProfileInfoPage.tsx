import React, { useState, useEffect } from 'react';
import HeaderAdminCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdminCpn from '../../../components/admin/FooterAdCpn';
import { useStaff } from '../../../hooks/useStaff';
import ChangePasswordModal from './ChangePasswordModal';
import UpdateProfileModal from './UpdateProfileModal';

const ProfileInfoPage: React.FC = () => {
    const { staff, loading, getStaffInfo } = useStaff();
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        getStaffInfo();
    }, [getStaffInfo]);

    const handleSuccess = (message: string) => {
        setSuccessMessage(message);
        setShowSuccessNotification(true);
        
        // Auto hide success notification after 3 seconds
        setTimeout(() => {
            setShowSuccessNotification(false);
        }, 3000);
    };

    const formatGender = (gender: string) => {
        return gender === 'Nam' ? 'Nam' : 'Nữ';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <HeaderAdminCpn />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </main>
                <FooterAdminCpn />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderAdminCpn />

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
                <div className="bg-white rounded-lg shadow-md">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-semibold text-gray-900">Thông tin cá nhân</h1>
                        <p className="mt-1 text-sm text-gray-600">Quản lý thông tin tài khoản và bảo mật của bạn</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {staff && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Avatar Section */}
                                <div className="lg:col-span-1">
                                    <div className="text-center">
                                        <div className="mx-auto h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                                            {staff.avatar ? (
                                                <img
                                                    src={staff.avatar}
                                                    alt="Avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="lg:col-span-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Mã nhân viên</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.staff_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Mã quản trị viên</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.admin_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Họ và tên</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Ngày sinh</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.dob}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Giới tính</label>
                                            <p className="mt-1 text-sm text-gray-900">{formatGender(staff.gender)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.phone}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Email</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.email}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.address}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Phòng ban</label>
                                            <p className="mt-1 text-sm text-gray-900">{staff.department}</p>
                                        </div>
                                        {staff.position && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Chức vụ</label>
                                                <p className="mt-1 text-sm text-gray-900">{staff.position}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowUpdateProfileModal(true)}
                                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Cập nhật thông tin
                            </button>
                            <button
                                onClick={() => setShowChangePasswordModal(true)}
                                className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <FooterAdminCpn />

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

            {/* Modals */}
            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
                onSuccess={handleSuccess}
            />
            <UpdateProfileModal
                isOpen={showUpdateProfileModal}
                onClose={() => setShowUpdateProfileModal(false)}
                staff={staff}
                onUpdate={() => {
                    getStaffInfo();
                    handleSuccess('Cập nhật thông tin thành công!');
                }}
            />
        </div>
    );
};

export default ProfileInfoPage;
