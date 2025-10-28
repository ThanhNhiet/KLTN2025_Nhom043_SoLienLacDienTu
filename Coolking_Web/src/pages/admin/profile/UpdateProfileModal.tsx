import React, { useState, useEffect, useRef } from 'react';
import { useStaff } from '../../../hooks/useStaff';
import type { Staff } from '../../../hooks/useStaff';

interface UpdateProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    onUpdate: () => void;
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({ isOpen, onClose, staff, onUpdate }) => {
    const { updateStaffInfo, updateStaffAvatar, loading } = useStaff();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        gender: true, // true = Nam, false = Nữ
        phone: '',
        email: '',
        address: ''
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [originalData, setOriginalData] = useState({
        name: '',
        dob: '',
        gender: true,
        phone: '',
        email: '',
        address: ''
    });

    // Hàm chuyển đổi ngày từ DD-MM-YYYY sang DD/MM/YYYY
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        // Nếu đã ở định dạng DD/MM/YYYY
        if (dateString.includes('/')) {
            return dateString;
        }
        // Chuyển từ DD-MM-YYYY sang DD/MM/YYYY
        return dateString.replace(/-/g, '/');
    };

    // Hàm chuyển đổi ngày từ DD/MM/YYYY sang DD-MM-YYYY
    // const formatDateForAPI = (dateString: string): string => {
    //     if (!dateString) return '';
    //     // Chuyển từ DD/MM/YYYY sang DD-MM-YYYY
    //     return dateString.replace(/\//g, '-');
    // };

    // Chuyển đổi từ dd/MM/yyyy sang yyyy-MM-dd (cho HTML date input)
    const convertToDateInput = (dateString: string): string => {
        if (!dateString) return '';
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return '';
    };

    // Chuyển đổi từ yyyy-MM-dd sang dd/MM/yyyy
    // const convertFromDateInput = (dateString: string): string => {
    //     if (!dateString) return '';
    //     const parts = dateString.split('-');
    //     if (parts.length === 3) {
    //         const [year, month, day] = parts;
    //         return `${day}/${month}/${year}`;
    //     }
    //     return '';
    // };

    // Xử lý thay đổi date picker
    // const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const { value } = e.target;
    //     const formattedDate = convertFromDateInput(value);
    //     setFormData(prev => ({
    //         ...prev,
    //         dob: formattedDate
    //     }));
    //     setError('');
    // };

    // Hàm validate ngày
    const isValidDate = (dateString: string): boolean => {
        if (!dateString) return true; // Cho phép để trống

        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(dateString)) return false;

        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            year >= 1900 && year <= new Date().getFullYear();
    };

    // Load dữ liệu khi mở modal
    useEffect(() => {
        if (isOpen && staff) {
            const data = {
                name: staff.name || '',
                dob: formatDateForDisplay(staff.dob || ''),
                gender: staff.gender === 'Nam',
                phone: staff.phone || '',
                email: staff.email || '',
                address: staff.address || ''
            };
            setFormData(data);
            setOriginalData(data);
            setAvatarPreview(staff.avatar || '');
            setAvatarFile(null);
            setError('');
        }
    }, [isOpen, staff]);

    // Hàm so sánh dữ liệu form với trimming
    const isDataChanged = (): boolean => {
        const trimmedFormData = {
            name: formData.name.trim(),
            dob: formData.dob.trim(),
            gender: formData.gender,
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            address: formData.address.trim()
        };

        const trimmedOriginalData = {
            name: originalData.name.trim(),
            dob: originalData.dob.trim(),
            gender: originalData.gender,
            phone: originalData.phone.trim(),
            email: originalData.email.trim(),
            address: originalData.address.trim()
        };

        return JSON.stringify(trimmedFormData) !== JSON.stringify(trimmedOriginalData);
    };

    // Hàm kiểm tra các trường bắt buộc
    const isRequiredFieldsFilled = (): boolean => {
        return formData.name.trim() !== '' &&
            formData.email.trim() !== '' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    };

    // Hàm kiểm tra có thể submit form
    const canSubmitForm = (): boolean => {
        const requiredFieldsFilled = isRequiredFieldsFilled();
        const dataChanged = isDataChanged();
        const avatarChanged = avatarFile !== null;
        const hasValidDate = !formData.dob || isValidDate(formData.dob);

        return requiredFieldsFilled && (dataChanged || avatarChanged) && hasValidDate;
    };



    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'gender' ? value === 'true' : value
        }));
        setError('');
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Kiểm tra định dạng file
            if (!file.type.startsWith('image/')) {
                setError('Vui lòng chọn file hình ảnh');
                return;
            }

            // Kiểm tra kích thước file (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Kích thước file không được vượt quá 5MB');
                return;
            }

            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('Vui lòng nhập họ tên');
            return;
        }

        if (!formData.email.trim()) {
            setError('Vui lòng nhập email');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Email không hợp lệ');
            return;
        }

        if (formData.phone.trim()) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(formData.phone)) {
                setError('Số điện thoại không hợp lệ');
                return;
            }
        }

        try {
            let success = false;
            let admin_avatar_url = localStorage.getItem('admin_avatar_url') || '';
            let admin_name = localStorage.getItem('admin_name') || '';

            // Cập nhật thông tin cơ bản nếu có thay đổi
            const dataChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
            if (dataChanged) {
                const response = await updateStaffInfo(
                    formData.phone,
                    formData.email,
                    formData.address
                );
                success = response?.success || false;
                admin_name = response?.name || admin_name;
            }

            // Cập nhật avatar nếu có thay đổi
            if (avatarFile) {
                const avatarResponse = await updateStaffAvatar(avatarFile);
                success = avatarResponse?.success || false;
                admin_avatar_url = avatarResponse?.avatar || admin_avatar_url;
            }

            if (success || (!dataChanged && !avatarFile)) {
                localStorage.setItem('admin_avatar_url', admin_avatar_url);
                localStorage.setItem('admin_name', admin_name);
                onUpdate(); // Reload dữ liệu and show success notification
                onClose(); // Close modal immediately
            }
        } catch (err: any) {
            setError(err.message || 'Cập nhật thông tin thất bại');
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Cập nhật thông tin</h2>
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
                <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <div className="mb-6 text-center">
                            <div className="relative inline-block">
                                <div
                                    onClick={handleAvatarClick}
                                    className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Nhấp để thay đổi ảnh đại diện</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    // onChange={handleInputChange}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                <div className="relative">
                                    {/* Hidden date input for picker */}
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        value={convertToDateInput(formData.dob)}
                                        // onChange={handleDatePickerChange}
                                        readOnly
                                        className="absolute inset-0 w-full h-full opacity-0 z-10"
                                    />
                                    {/* Visible input showing dd/MM/yyyy */}
                                    <input
                                        type="text"
                                        value={formData.dob}
                                        placeholder="dd/MM/yyyy"
                                        readOnly
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
                                    />
                                    {/* Calendar icon */}
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 cursor-pointer z-10" onClick={() => dateInputRef.current?.showPicker()}>
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008ZM15 12.75h.008v.008H15v-.008Zm0 2.25h.008v.008H15V15Zm0 2.25h.008v.008H15v-.008ZM16.5 12.75h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                                        </svg>
                                    </div>
                                </div>
                                {formData.dob && !isValidDate(formData.dob) && (
                                    <p className="text-red-500 text-sm mt-1">Định dạng ngày không hợp lệ (Ngày/Tháng/Năm)</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                                {/* <select
                                    name="gender"
                                    value={formData.gender.toString()}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="true">Nam</option>
                                    <option value="false">Nữ</option>
                                </select> */}
                                <input
                                    type="text"
                                    name="gender"
                                    value={formData.gender ? 'Nam' : 'Nữ'}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
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
                                disabled={loading || !canSubmitForm()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfileModal;
