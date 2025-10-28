import React, { useState, useEffect } from 'react';
import { useAccount } from '../../../hooks/useAccount';

interface AccountsCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface CreateAccountData {
  user_id: string;
  password: string;
  role: 'STUDENT' | 'LECTURER' | 'PARENT';
  status: 'ACTIVE';
  email: string;
  phone_number: string;
}

interface UserDetailInfo {
  student_id?: string;
  lecturer_id?: string;
  parent_id?: string;
  name: string;
  phone: string;
  email: string;
  [key: string]: any;
}

const AccountsCreateModal: React.FC<AccountsCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createAccount, getDetailInfoByID } = useAccount();
  
  const [formData, setFormData] = useState<CreateAccountData>({
    user_id: '',
    password: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    email: '',
    phone_number: ''
  });

  const [searchUserId, setSearchUserId] = useState('');
  const [userInfo, setUserInfo] = useState<UserDetailInfo | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showUserIdWarning, setShowUserIdWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Check if user_id is required based on role
  useEffect(() => {
    setShowUserIdWarning(!formData.user_id);
  }, [formData.role, formData.user_id]);

  const resetForm = () => {
    setFormData({
      user_id: '',
      password: '',
      role: 'STUDENT',
      status: 'ACTIVE',
      email: '',
      phone_number: ''
    });
    setSearchUserId('');
    setUserInfo(null);
    setShowUserIdWarning(false);
    setSearchAttempted(false);
    setSearchNotFound(false);
    setServerError(null);
  };

  const handleSearchUser = async () => {
    if (!searchUserId.trim()) return;

    setSearchLoading(true);
    setSearchAttempted(true);
    setSearchNotFound(false);
    
    try {
      const data = await getDetailInfoByID(searchUserId.trim());
      if (data) {
        setUserInfo(data);
        setSearchNotFound(false);
        
        // Auto-set role based on user ID prefix
        let role: 'STUDENT' | 'LECTURER' | 'PARENT' = 'STUDENT';
        if (searchUserId.startsWith('SV')) role = 'STUDENT';
        else if (searchUserId.startsWith('LE')) role = 'LECTURER';
        else if (searchUserId.startsWith('PA')) role = 'PARENT';

        // Update form with fetched data
        setFormData(prev => ({
          ...prev,
          user_id: searchUserId.trim(),
          role,
          email: data.email || '',
          phone_number: data.phone || ''
        }));
      } else {
        setUserInfo(null);
        setSearchNotFound(true);
      }
    } catch (error) {
      console.error('Search user error:', error);
      setUserInfo(null);
      setSearchNotFound(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyUserInfo = () => {
    if (userInfo) {
      setFormData(prev => ({
        ...prev,
        email: userInfo.email || '',
        phone_number: userInfo.phone || ''
      }));
    }
  };

  // Hàm validate mật khẩu mạnh
  const validatePassword = (password: string): string | null => {
    if (!password) return null; // Cho phép để trống
    
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

  const validateForm = () => {
    // Check required fields
    if (!formData.user_id) return false;
    
    // Validate password if provided
    if (formData.password && validatePassword(formData.password)) return false;
    
    // Email is optional, but if provided must be valid format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    
    // Phone is optional, but if provided must be 10 digits
    if (formData.phone_number && formData.phone_number.length !== 10) return false;
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);
    try {
      await createAccount(formData as any);
      onSuccess(`Đã tạo tài khoản ${formData.user_id} thành công!`);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Create account error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi server không xác định';
      setServerError(`Lỗi tạo tài khoản: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: 'STUDENT' | 'LECTURER' | 'PARENT') => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Tạo tài khoản mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-account-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="STUDENT">Sinh Viên</option>
              <option value="LECTURER">Giảng Viên</option>
              <option value="PARENT">Phụ Huynh</option>
            </select>
            {showUserIdWarning && (
              <p className="text-red-500 text-xs mt-1">Chưa rõ ID người dùng</p>
            )}
          </div>

          {/* User ID Search (only for non-ADMIN roles) */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm {formData.role}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchUserId}
                  onChange={(e) => {
                    setSearchUserId(e.target.value);
                    setSearchAttempted(false);
                    setSearchNotFound(false);
                    setUserInfo(null);
                  }}
                  placeholder="Tìm kiếm bằng ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={handleSearchUser}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchLoading ? 'Tìm...' : 'Tìm'}
                </button>
              </div>
              
              {userInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Tìm thấy: {userInfo.name}
                  </p>
                  <p className="text-xs text-green-600">
                    Email: {userInfo.email} | SĐT: {userInfo.phone}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyUserInfo}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Copy thông tin vào form
                  </button>
                </div>
              )}

              {searchNotFound && searchAttempted && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    Không tìm thấy {formData.role} với ID: {searchUserId}
                  </p>
                  <p className="text-xs text-red-600">
                    Vui lòng kiểm tra lại ID hoặc nhập thông tin thủ công
                  </p>
                </div>
              )}
          </div>

          {/* User ID (Read-only when found) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={formData.user_id}
              readOnly
              onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
              placeholder="Sẽ được điền sau khi tìm kiếm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Có thể để trống để hệ thống tự tạo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {formData.password && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium mb-1">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1 text-xs">
                  <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{formData.password.length >= 8 ? '✓' : '•'}</span>
                    Tối thiểu 8 ký tự
                  </li>
                  <li className={`flex items-center ${/[a-zA-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[a-zA-Z]/.test(formData.password) ? '✓' : '•'}</span>
                    Ít nhất 1 chữ cái
                  </li>
                  <li className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/\d/.test(formData.password) ? '✓' : '•'}</span>
                    Ít nhất 1 chữ số
                  </li>
                  <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '•'}</span>
                    Ít nhất 1 ký tự đặc biệt
                  </li>
                </ul>
              </div>
            )}
            {formData.password && validatePassword(formData.password) && (
              <p className="text-red-500 text-xs mt-1">{validatePassword(formData.password)}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Nhập email (để trống nếu không có)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              pattern="[0-9]{10}"
              maxLength={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Server Error Display */}
          {serverError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">{serverError}</p>
            </div>
          )}

          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="create-account-form"
            disabled={!validateForm() || isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountsCreateModal;
