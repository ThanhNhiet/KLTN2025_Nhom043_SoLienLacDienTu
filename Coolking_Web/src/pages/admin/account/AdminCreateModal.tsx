import React, { useState, useEffect } from 'react';
import { useAccount } from '../../../hooks/useAccount';

interface AdminCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface CreateAdminData {
  user_id: string; // This will be staff_id
  password: string;
  role: 'ADMIN';
  status: 'ACTIVE';
  email: string;
  phone_number: string;
  position: string;
}

interface StaffDetailInfo {
  staff_id: string;
  admin_id: string | null;
  name: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  [key: string]: any;
}

const AdminCreateModal: React.FC<AdminCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createAccount, getStaff4Admin } = useAccount();
  
  const [formData, setFormData] = useState<CreateAdminData>({
    user_id: '',
    password: '',
    role: 'ADMIN',
    status: 'ACTIVE',
    email: '',
    phone_number: '',
    position: ''
  });

  const [searchStaffId, setSearchStaffId] = useState('');
  const [staffInfo, setStaffInfo] = useState<StaffDetailInfo | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      user_id: '',
      password: '',
      role: 'ADMIN',
      status: 'ACTIVE',
      email: '',
      phone_number: '',
      position: ''
    });
    setSearchStaffId('');
    setStaffInfo(null);
    setSearchAttempted(false);
    setSearchNotFound(false);
    setServerError(null);
  };

  const handleSearchStaff = async () => {
    if (!searchStaffId.trim()) return;

    setSearchLoading(true);
    setSearchAttempted(true);
    setSearchNotFound(false);
    setStaffInfo(null);
    
    try {
      const data = await getStaff4Admin(searchStaffId.trim());
      if (data) {
        setStaffInfo(data);
        setSearchNotFound(false);
        
        setFormData(prev => ({
          ...prev,
          user_id: data.staff_id,
          email: data.email || '',
          phone_number: data.phone || '',
          position: data.position || ''
        }));
      } else {
        setStaffInfo(null);
        setSearchNotFound(true);
      }
    } catch (error) {
      console.error('Search staff error:', error);
      setStaffInfo(null);
      setSearchNotFound(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return null;
    if (password.length < 8) return 'Mật khẩu phải có tối thiểu 8 ký tự';
    if (!/[a-zA-Z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ cái';
    if (!/\d/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
    return null;
  };

  const validateForm = () => {
    if (!formData.user_id) return false;
    if (formData.password && validatePassword(formData.password)) return false;
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
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
      onSuccess(`Đã tạo tài khoản ADMIN cho nhân viên ${formData.user_id} thành công!`);
      onClose();
    } catch (error: any) {
      console.error('Create admin account error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi server không xác định';
      setServerError(`Lỗi tạo tài khoản: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo tài khoản Quản trị viên</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-admin-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm Nhân viên</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchStaffId}
                  onChange={(e) => {
                    setSearchStaffId(e.target.value);
                    setSearchAttempted(false);
                    setSearchNotFound(false);
                    setStaffInfo(null);
                  }}
                  placeholder="Tìm kiếm bằng Mã nhân viên"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={handleSearchStaff} disabled={searchLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {searchLoading ? 'Tìm...' : 'Tìm'}
                </button>
              </div>
              
              {staffInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Tìm thấy: {staffInfo.name}</p>
                  <p className="text-xs text-green-600">Email: {staffInfo.email} | SĐT: {staffInfo.phone}</p>
                </div>
              )}

              {searchNotFound && searchAttempted && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Không tìm thấy nhân viên với mã: {searchStaffId}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã nhân viên (User ID)</label>
              <input type="text" value={formData.user_id} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Để trống để hệ thống tự tạo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.password && validatePassword(formData.password) && (
                <p className="text-red-500 text-xs mt-1">{validatePassword(formData.password)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <input type="tel" value={formData.phone_number} onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))} maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chức vụ</label>
              <input type="text" value={formData.position} onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            {serverError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">{serverError}</p>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Hủy</button>
          <button type="submit" form="create-admin-form" disabled={!validateForm() || isSubmitting} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateModal;