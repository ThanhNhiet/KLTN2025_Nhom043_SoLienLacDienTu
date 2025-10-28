import React, { useState } from 'react';
import { useStaff } from '../../../hooks/useStaff';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (message: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { changePassword, loading } = useStaff();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');


    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    // Hàm validate mật khẩu mạnh
    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Mật khẩu phải có tối thiểu 8 ký tự';
        }
        
        if (!/[a-zA-Z]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất 1 chữ cái';
        }
        
        if (!/\d/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất 1 chữ số';
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
        }
        
        return null;
    };

    // Kiểm tra form có hợp lệ để enable nút submit
    const isFormValid = () => {
        // Kiểm tra tất cả trường đã điền
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            return false;
        }
        
        // Kiểm tra mật khẩu mới có đạt yêu cầu
        if (validatePassword(formData.newPassword) !== null) {
            return false;
        }
        
        // Kiểm tra mật khẩu xác nhận khớp
        if (formData.newPassword !== formData.confirmPassword) {
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu mới không khớp');
            return;
        }

        // Validate mật khẩu mạnh
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        try {
            const response = await changePassword(formData.currentPassword, formData.newPassword);
            if (response?.success) {
                // Clear form and close modal
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setError('');
                onClose();
                
                // Call success callback to show notification on parent page
                if (onSuccess) {
                    onSuccess('Đổi mật khẩu thành công!');
                }
            } else {
                setError(response?.message || 'Đổi mật khẩu thất bại');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại');
        }
    };

    const handleClose = () => {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                placeholder="Nhập mật khẩu hiện tại"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="Nhập mật khẩu mới"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <div className="mt-2 text-sm text-gray-600">
                                <p className="font-medium mb-1">Yêu cầu mật khẩu:</p>
                                <ul className="space-y-1 text-xs">
                                    <li className={`flex items-center ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className="mr-2">{formData.newPassword.length >= 8 ? '✓' : '•'}</span>
                                        Tối thiểu 8 ký tự
                                    </li>
                                    <li className={`flex items-center ${/[a-zA-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className="mr-2">{/[a-zA-Z]/.test(formData.newPassword) ? '✓' : '•'}</span>
                                        Ít nhất 1 chữ cái
                                    </li>
                                    <li className={`flex items-center ${/\d/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className="mr-2">{/\d/.test(formData.newPassword) ? '✓' : '•'}</span>
                                        Ít nhất 1 chữ số
                                    </li>
                                    <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? '✓' : '•'}</span>
                                        Ít nhất 1 ký tự đặc biệt
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {formData.confirmPassword && formData.newPassword && formData.newPassword !== formData.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">Mật khẩu xác nhận không khớp</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !isFormValid()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>


        </div>
    );
};

export default ChangePasswordModal;
